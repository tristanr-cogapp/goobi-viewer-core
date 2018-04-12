/**
 * This file is part of the Goobi viewer - a content presentation and management application for digitized objects.
 *
 * Visit these websites for more information.
 *          - http://www.intranda.com
 *          - http://digiverso.com
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
package de.intranda.digiverso.presentation.servlets.rest.collections;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.commons.lang3.StringUtils;
import org.apache.solr.client.solrj.SolrServerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.presentation.controller.DataManager;
import de.intranda.digiverso.presentation.controller.imaging.IIIFUrlHandler;
import de.intranda.digiverso.presentation.exceptions.IndexUnreachableException;
import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.intranda.digiverso.presentation.model.iiif.presentation.Collection;
import de.intranda.digiverso.presentation.model.iiif.presentation.content.ImageContent;
import de.intranda.digiverso.presentation.model.iiif.presentation.content.LinkingContent;
import de.intranda.digiverso.presentation.model.iiif.presentation.enums.ViewingHint;
import de.intranda.digiverso.presentation.model.metadata.multilanguage.IMetadataValue;
import de.intranda.digiverso.presentation.model.metadata.multilanguage.Metadata;
import de.intranda.digiverso.presentation.model.metadata.multilanguage.SimpleMetadataValue;
import de.intranda.digiverso.presentation.model.search.SearchHelper;
import de.intranda.digiverso.presentation.model.viewer.CollectionView;
import de.intranda.digiverso.presentation.model.viewer.HierarchicalBrowseDcElement;
import de.intranda.digiverso.presentation.servlets.rest.ViewerRestServiceBinding;
import de.intranda.digiverso.presentation.servlets.rest.iiif.presentation.IIIFPresentationBinding;
import de.intranda.digiverso.presentation.servlets.utils.ServletUtils;
import de.unigoettingen.sub.commons.contentlib.exceptions.ContentLibException;
import de.unigoettingen.sub.commons.contentlib.servlet.model.iiif.ImageInformation;

/**
 * IIIF REST resource providing a collection object as defined in the IIIF presentation api
 * 
 * @author Florian Alpers
 *
 */

@Path("/collections2")
@ViewerRestServiceBinding
@IIIFPresentationBinding
public class CollectionResource2 {

    private static final Logger logger = LoggerFactory.getLogger(CollectionResource2.class);

    private static Map<String, String> facetFieldMap = new HashMap<>();
    private static Map<String, CollectionView> collectionViewMap = new HashMap<>();

    private String ATTRIBUTION = "Provided by intranda GmbH";
    public final static String NUM_MANIFESTS_LABEL = "volumes";
    public final static String NUM_SUBCOLLECTIONS_LABEL = "subCollections";
    public final static String RSS_FEED_LABEL = "Rss feed";
    public final static String RSS_FEED_FORMAT = "Rss feed";

    @Context
    private HttpServletRequest servletRequest;
    @Context
    private HttpServletResponse servletResponse;

    /**
     * Returns a iiif collection of all collections from the given solr-field The response includes the metadata and subcollections of the topmost
     * collections. Child collections may be accessed following the links in the @id properties in the member-collections Requires passing a language
     * to set the language for all metadata values
     * 
     * @param language
     * @param collectionField
     * @return
     * @throws PresentationException
     * @throws IndexUnreachableException
     * @throws MalformedURLException
     * @throws URISyntaxException
     */
    @GET
    @Path("/{collectionField}")
    @Produces({ MediaType.APPLICATION_JSON })
    public Collection getCollections(@PathParam("collectionField") String collectionField)
            throws PresentationException, IndexUnreachableException, URISyntaxException {

        Collection collection = generateCollection(collectionField, null, getBaseUrl(), getFacetField(collectionField));

        servletResponse.addHeader("Access-Control-Allow-Origin", "*");

        return collection;

    }

    /**
     * Returns a iiif collection of the given topCollection for the give collection field The response includes the metadata and subcollections of the
     * direct child collections. Collections further down the hierarchy may be accessed following the links in the @id properties in the
     * member-collections Requires passing a language to set the language for all metadata values
     * 
     * @throws URISyntaxException
     * 
     */
    @GET
    @Path("/{collectionField}/{topElement}")
    @Produces({ MediaType.APPLICATION_JSON })
    public Collection getCollection(@PathParam("collectionField") String collectionField, @PathParam("topElement") final String topElement)
            throws IndexUnreachableException, URISyntaxException {

        Collection collection = generateCollection(collectionField, topElement, getBaseUrl(), getFacetField(collectionField));

        servletResponse.addHeader("Access-Control-Allow-Origin", "*");

        return collection;

    }

    /**
     * @param collectionField
     * @param topElement
     * @param url
     * @param locale
     * @param facetField
     * @return
     * @throws IndexUnreachableException
     * @throws MalformedURLException
     * @throws URISyntaxException
     */
    public Collection generateCollection(String collectionField, final String topElement, String baseUrl, String facetField)
            throws IndexUnreachableException, URISyntaxException {

        CollectionView collectionView = getCollectionView(collectionField, facetField);

        if (StringUtils.isNotBlank(topElement) && !"-".equals(topElement)) {
            collectionView.setTopVisibleElement(topElement);
            collectionView.setDisplayParentCollections(false);
        }
        collectionView.calculateVisibleDcElements(true);

        HierarchicalBrowseDcElement baseElement = null;
        if (StringUtils.isNotBlank(collectionView.getTopVisibleElement())) {
            baseElement = collectionView.getCompleteList()
                    .stream()
                    .filter(element -> topElement.startsWith(element.getName()))
                    .flatMap(element -> element.getAllDescendents(true).stream())
                    .filter(element -> topElement.equals(element.getName()))
                    .findFirst()
                    .orElse(null);

        }

        Collection collection;
        if (baseElement != null) {
            collection = createCollection(baseElement, getCollectionUrl(baseUrl, collectionField, baseElement.getName()));
            
            String parentName = null;
            if (baseElement.getParent() != null) {
                parentName = baseElement.getParent().getName();
            }
            Collection parent =
                    createCollection(baseElement.getParent(), getCollectionUrl(baseUrl, collectionField, parentName));
            collection.addWithin(parent);

            for (HierarchicalBrowseDcElement childElement : baseElement.getChildren()) {
                Collection child = createCollection(childElement, getCollectionUrl(baseUrl, collectionField, childElement.getName()));
                collection.addCollection(child);
            }
        } else {
            collection = createCollection(null, getCollectionUrl(baseUrl, collectionField, null));

            for (HierarchicalBrowseDcElement childElement : collectionView.getVisibleDcElements()) {
                Collection child = createCollection(childElement, getCollectionUrl(baseUrl, collectionField, childElement.getName()));
                collection.addCollection(child);
            }
        }

        //        Collection collection = new BaseCollection(collectionView, locale, url, baseElement, collectionField, facetField, getServletPath());
        return collection;
    }

    /**
     * @param url
     * @param baseElement
     * @return
     * @throws URISyntaxException
     * @throws ContentLibException
     */
    public Collection createCollection(HierarchicalBrowseDcElement baseElement, URI uri) throws URISyntaxException {
        Collection collection = null;
        try {
            collection = new Collection(uri);
            collection.setAttribution(new SimpleMetadataValue(ATTRIBUTION));

            if (baseElement != null) {
                collection.setLabel(IMetadataValue.getTranslations(baseElement.getName()));

                URI thumbURI = absolutize(baseElement.getInfo().getIconURI());
                ImageContent thumb = new ImageContent(thumbURI);
                if (IIIFUrlHandler.isIIIFImageUrl(thumbURI.toString())) {
                    URI imageInfoURI = new URI(IIIFUrlHandler.getIIIFImageBaseUrl(thumbURI.toString()));
                    ImageInformation info = new ImageInformation(imageInfoURI.toString());
                    thumb.setService(info);
                }
                collection.setThumbnail(thumb);

                long volumes = baseElement.getNumberOfVolumes();
                collection.addMetadata(new Metadata(NUM_MANIFESTS_LABEL, Long.toString(volumes)));

                int subCollections = baseElement.getChildren().size();
                collection.addMetadata(new Metadata(NUM_SUBCOLLECTIONS_LABEL, Integer.toString(subCollections)));

                LinkingContent rss = new LinkingContent(new URI(baseElement.getRssUrl()), new SimpleMetadataValue(RSS_FEED_LABEL));
                collection.setRelated(rss);

                LinkingContent viewer =
                        new LinkingContent(baseElement.getInfo().getLinkURI(servletRequest), new SimpleMetadataValue(baseElement.getName()));
                collection.setRendering(viewer);

            } else {
                collection.setViewingHint(ViewingHint.top);
            }

        } catch (URISyntaxException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return collection;
    }

    /**
     * @param collectionField
     * @param facetField
     * @return
     * @throws IndexUnreachableException
     */
    public CollectionView getCollectionView(String collectionField, final String facetField) throws IndexUnreachableException {

        synchronized (collectionViewMap) {
            if (collectionViewMap.containsKey(collectionField)) {
                return new CollectionView(collectionViewMap.get(collectionField));
            }
        }

        CollectionView view = new CollectionView(collectionField,
                () -> SearchHelper.findAllCollectionsFromField(collectionField, facetField, true, true, true, true));
        view.populateCollectionList();

        synchronized (collectionViewMap) {
            if (collectionViewMap.containsKey(collectionField)) {
                return new CollectionView(collectionViewMap.get(collectionField));
            }
            collectionViewMap.put(collectionField, view);
            return view;
        }
    }

    /**
     * @param language
     * @return
     */
    public Locale getLocale(String language) {
        Locale locale = Locale.forLanguageTag(language);
        if (locale == null) {
            locale = Locale.ENGLISH;
        }
        return locale;
    }

    public String getServletURI() {
        return ServletUtils.getServletPathWithHostAsUrlFromRequest(servletRequest);
        //        return servletRequest.getContextPath();
    }

    public URI absolutize(URI uri) throws URISyntaxException {
        if (uri.isAbsolute()) {
            return uri;
        } else {
            return new URI(getServletURI() + uri.toString());
        }
    }

    /**
     * @return
     */
    public String getBaseUrl() {
        String url = servletRequest.getRequestURL().toString();
        url = url.substring(0, url.indexOf("/collections2") + "/collections2".length());
        return url;
    }

    /**
     * @param collectionField
     * @return
     */
    public String getFacetField(String collectionField) {

        synchronized (facetFieldMap) {
            if (facetFieldMap.containsKey(collectionField)) {
                return facetFieldMap.get(collectionField);
            }
            String facetField = collectionField;
            if (collectionField.startsWith("MD_")) {
                facetField = collectionField.replace("MD_", "FACET_");
            } else {
                facetField = "MD_" + collectionField;
            }
            try {
                if (!DataManager.getInstance().getSearchIndex().getAllFieldNames().contains(facetField)) {
                    facetField = collectionField;
                }
            } catch (SolrServerException | IOException e) {
                logger.warn("Unable to query for facet field", e);
                facetField = collectionField;
            }
            facetFieldMap.put(collectionField, facetField);
            return facetField;
        }

    }

    public URI getCollectionUrl(String baseUrl, String collectionField, String baseCollectionName) throws URISyntaxException {
        StringBuilder sb = new StringBuilder(baseUrl).append("/").append(collectionField).append("/");
        if (StringUtils.isNotBlank(baseCollectionName)) {
            sb.append(baseCollectionName).append("/");
        }
        return new URI(sb.toString());
    }
}