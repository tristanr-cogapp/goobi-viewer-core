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
package de.intranda.digiverso.presentation.model.cms;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

import javax.persistence.CascadeType;
import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;

import org.apache.commons.collections.comparators.NullComparator;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.persistence.annotations.PrivateOwned;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.ocpsoft.pretty.faces.el.LazyBeanNameFinder;

import de.intranda.digiverso.presentation.controller.DataManager;
import de.intranda.digiverso.presentation.exceptions.CmsEditException;
import de.intranda.digiverso.presentation.exceptions.CmsElementNotFoundException;
import de.intranda.digiverso.presentation.exceptions.DAOException;
import de.intranda.digiverso.presentation.exceptions.IndexUnreachableException;
import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.intranda.digiverso.presentation.exceptions.ViewerConfigurationException;
import de.intranda.digiverso.presentation.managedbeans.CmsBean;
import de.intranda.digiverso.presentation.managedbeans.CmsMediaBean;
import de.intranda.digiverso.presentation.managedbeans.utils.BeanUtils;
import de.intranda.digiverso.presentation.messages.ViewerResourceBundle;
import de.intranda.digiverso.presentation.model.cms.CMSContentItem.CMSContentItemType;
import de.intranda.digiverso.presentation.model.cms.CMSPageLanguageVersion.CMSPageStatus;
import de.intranda.digiverso.presentation.model.cms.itemfunctionality.SearchFunctionality;
import de.intranda.digiverso.presentation.model.glossary.GlossaryManager;
import de.intranda.digiverso.presentation.model.viewer.CollectionView;
import de.intranda.digiverso.presentation.servlets.rest.cms.CMSContentResource;
import de.unigoettingen.sub.commons.contentlib.exceptions.ContentNotFoundException;
import de.unigoettingen.sub.commons.contentlib.exceptions.IllegalRequestException;

@Entity
@Table(name = "cms_pages")
public class CMSPage {

    /** Logger for this class. */
    private static final Logger logger = LoggerFactory.getLogger(CMSPage.class);
    public static final String GLOBAL_LANGUAGE = "global";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cms_page_id")
    private Long id;

    @Column(name = "template_id", nullable = false)
    private String templateId;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_created", nullable = false)
    private Date dateCreated;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date_updated")
    private Date dateUpdated;

    @Column(name = "published", nullable = false)
    private boolean published = false;

    @Column(name = "page_sorting", nullable = true)
    private Long pageSorting = null;

    @Column(name = "use_default_sidebar", nullable = false)
    private boolean useDefaultSidebar = false;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "owner_page_id")
    @PrivateOwned
    private List<CMSProperty> properties = new ArrayList<>();

    @Column(name = "persistent_url", nullable = true)
    private String persistentUrl;

    @Column(name = "related_pi", nullable = true)
    private String relatedPI;

    @Column(name = "subtheme_discriminator", nullable = true)
    private String subThemeDiscriminatorValue = null;

    @OneToMany(mappedBy = "ownerPage", fetch = FetchType.EAGER, cascade = { CascadeType.ALL })
    @OrderBy("order")
    @PrivateOwned
    private List<CMSSidebarElement> sidebarElements = new ArrayList<>();

    @Transient
    private List<CMSSidebarElement> unusedSidebarElements;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "cms_page_classifications", joinColumns = @JoinColumn(name = "page_id"))
    @Column(name = "classification")
    @PrivateOwned
    private List<String> classifications = new ArrayList<>();

    @OneToMany(mappedBy = "ownerPage", fetch = FetchType.EAGER, cascade = { CascadeType.ALL })
    @PrivateOwned
    private List<CMSPageLanguageVersion> languageVersions = new ArrayList<>();

    /**
     * The id of the parent page. This is usually the id (as String) of the parent cms page, or NULL if the parent page is the start page The system
     * could be extended to set any page type name as parent page (so this page is a breadcrumb-child of e.g. "image view")
     */
    @Column(name = "parent_page")
    private String parentPageId = null;

    /**
     * whether the url to this page may contain additional path parameters at its end while still pointing to this page Should be true if this is a
     * search page, because search parameters are introduced to the url for an actual search Should not be true if this overrides a default page, but
     * should only do so if no parameters are present (for example if parameters indicate a search on the default search page)
     * 
     */
    @Column(name = "may_contain_url_parameters")
    private boolean mayContainUrlParameters = true;

    @Transient
    private String sidebarElementString = null;

    @Transient
    PageValidityStatus validityStatus;

    @Transient
    private int listPage = 1;

    /**
     * @deprecated static pages are now stored in a separate table. This only remains for backwards compability
     */
    @Deprecated
    @Column(name = "static_page", nullable = true)
    private String staticPageName;

    public CMSPage() {
    }

    /**
     * creates a deep copy of the original CMSPage. Only copies persisted properties and performs initialization for them
     * 
     * @param original
     */
    public CMSPage(CMSPage original) {
        if (original.id != null) {
            this.id = new Long(original.id);
        }
        this.templateId = original.templateId;
        this.dateCreated = new Date(original.dateCreated.getTime());
        this.dateUpdated = new Date(original.dateUpdated.getTime());
        this.published = original.published;
        if (original.pageSorting != null) {
            this.pageSorting = new Long(original.pageSorting);
        }
        this.useDefaultSidebar = original.useDefaultSidebar;
        this.persistentUrl = original.persistentUrl;
        this.relatedPI = original.relatedPI;
        this.subThemeDiscriminatorValue = original.subThemeDiscriminatorValue;
        this.classifications = new ArrayList<>(original.classifications);
        this.parentPageId = original.parentPageId;
        this.mayContainUrlParameters = original.mayContainUrlParameters;

        if (original.properties != null) {
            this.properties = new ArrayList<>(original.properties.size());
            for (CMSProperty property : original.properties) {
                CMSProperty copy = new CMSProperty(property);
                this.properties.add(copy);
            }
        }

        if (original.sidebarElements != null) {
            this.sidebarElements = new ArrayList<>(original.sidebarElements.size());
            for (CMSSidebarElement sidebarElement : original.sidebarElements) {
                CMSSidebarElement copy = CMSSidebarElement.copy(sidebarElement, this);
                this.sidebarElements.add(copy);
            }
        }

        if (original.languageVersions != null) {
            this.languageVersions = new ArrayList<>(original.languageVersions.size());
            for (CMSPageLanguageVersion language : original.languageVersions) {
                CMSPageLanguageVersion copy = new CMSPageLanguageVersion(language, this);
                this.languageVersions.add(copy);
            }
        }

    }

    public boolean saveSidebarElements() {
        logger.trace("selected elements:{}\n", sidebarElementString);
        if (sidebarElementString != null) {
            List<CMSSidebarElement> selectedElements = new ArrayList<>();
            String[] ids = sidebarElementString.split("\\&?item=");
            for (int i = 0; i < ids.length; ++i) {
                if (StringUtils.isBlank(ids[i])) {
                    continue;
                }

                CMSSidebarElement element = getAvailableSidebarElement(ids[i]);
                if (element != null) {
                    // element.setType(ids[i]);
                    element.setValue("bds");
                    element.setOrder(i);
                    //		    element.setId(null);
                    element.setOwnerPage(this);
                    element.serialize();
                    selectedElements.add(element);
                }
            }
            setSidebarElements(selectedElements);
            return true;
        }

        return false;
    }

    public void resetItemData() {
        logger.trace("Resetting item data");
        for (CMSPageLanguageVersion lv : getLanguageVersions()) {
            for (CMSContentItem ci : lv.getContentItems()) {
                ci.resetData();
            }
        }
    }

    /**
     * @param string
     * @return
     */
    private CMSSidebarElement getAvailableSidebarElement(String id) {
        for (CMSSidebarElement visibleElement : getSidebarElements()) {
            if (Integer.toString(visibleElement.getSortingId()).equals(id)) {
                return visibleElement;
            }
        }
        for (CMSSidebarElement unusedElement : getUnusedSidebarElements()) {
            if (Integer.toString(unusedElement.getSortingId()).equals(id)) {
                return unusedElement;
            }
        }
        return null;
    }

    public List<CMSSidebarElement> getUnusedSidebarElements() {
        if (unusedSidebarElements == null) {
            createUnusedSidebarElementList();
        }
        return unusedSidebarElements;
    }

    /**
     *
     */
    private void createUnusedSidebarElementList() {
        unusedSidebarElements = CMSSidebarManager.getAvailableSidebarElements();
        Iterator<CMSSidebarElement> unusedIterator = unusedSidebarElements.iterator();

        while (unusedIterator.hasNext()) {
            CMSSidebarElement unusedElement = unusedIterator.next();
            for (CMSSidebarElement visibleElement : getSidebarElements()) {
                if (visibleElement.equals(unusedElement)) {
                    unusedIterator.remove();
                    break;
                }
            }
        }

    }

    public void addSidebarElement(CMSSidebarElement element) {
        if (element != null) {
            sidebarElements.add(element);
        }
    }

    /**
     * @return the id
     */
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the templateId
     */
    public String getTemplateId() {
        return templateId;
    }

    /**
     * @param templateId the templateId to set
     */
    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    /**
     * @return the dateCreated
     */
    public Date getDateCreated() {
        return dateCreated;
    }

    /**
     * @param dateCreated the dateCreated to set
     */
    public void setDateCreated(Date dateCreated) {
        this.dateCreated = dateCreated;
    }

    /**
     * @return the dateUpdated
     */
    public Date getDateUpdated() {
        return dateUpdated;
    }

    /**
     * @param dateUpdated the dateUpdated to set
     */
    public void setDateUpdated(Date dateUpdated) {
        this.dateUpdated = dateUpdated;
    }

    /**
     * @return the published
     */
    public boolean isPublished() {
        return published;
    }

    /**
     * @param published the published to set
     */
    public void setPublished(boolean published) {
        this.published = published;
    }

    /**
     * @return the useDefaultSidebar
     */
    public boolean isUseDefaultSidebar() {
        return useDefaultSidebar;
    }

    /**
     * @param useDefaultSidebar the useDefaultSidebar to set
     */
    public void setUseDefaultSidebar(boolean useDefaultSidebar) {
        this.useDefaultSidebar = useDefaultSidebar;
    }

    /**
     * @return the languageVersions
     */
    public List<CMSPageLanguageVersion> getLanguageVersions() {
        return languageVersions;
    }

    /**
     * @param languageVersions the languageVersions to set
     */
    public void setLanguageVersions(List<CMSPageLanguageVersion> languageVersions) {
        this.languageVersions = languageVersions;
    }

    /**
     * @return the sidebarElements
     */
    public List<CMSSidebarElement> getSidebarElements() {
        return sidebarElements;
    }

    /**
     * @param sidebarElements the sidebarElements to set
     */
    public void setSidebarElements(List<CMSSidebarElement> sidebarElements) {
        this.sidebarElements = sidebarElements;
        createUnusedSidebarElementList();

    }

    /**
     * @return the classifications
     */
    public List<String> getClassifications() {
        return classifications;
    }

    /**
     * @param classifications the classifications to set
     */
    public void setClassifications(List<String> classifications) {
        this.classifications = classifications;
    }

    public void addClassification(String classification) {
        if (StringUtils.isNotBlank(classification) && !classifications.contains(classification)) {
            classifications.add(classification);
        }
    }

    public void removeClassification(String classification) {
        classifications.remove(classification);
    }

    /**
     * @return the sidebarElementString
     */
    public String getSidebarElementString() {
        return sidebarElementString;
    }

    /**
     * @param sidebarElementString the sidebarElementString to set
     */
    public void setSidebarElementString(String sidebarElementString) {
        logger.trace("setSidebarElementString: {}", sidebarElementString);
        this.sidebarElementString = sidebarElementString;
    }

    public boolean isLanguageComplete(Locale locale) {
        for (CMSPageLanguageVersion version : getLanguageVersions()) {
            try {
                if (version.getLanguage().equals(locale.getLanguage())) {
                    return version.getStatus().equals(CMSPageStatus.FINISHED);
                }
            } catch (NullPointerException e) {
            }
        }
        return false;
    }

    /**
     * 
     * @param itemId
     * @param language
     * @return The item in the language version for the given language
     * @throws CmsElementNotFoundException if no version exists for the given language
     */
    public CMSContentItem getContentItem(String itemId, String language) throws CmsElementNotFoundException {
        CMSPageLanguageVersion version = getBestLanguage(Locale.forLanguageTag(language));
        return version.getContentItem(itemId);
    }

    public CMSPageLanguageVersion getDefaultLanguage() throws CmsElementNotFoundException {
        CMSPageLanguageVersion version = null;
        String language = ViewerResourceBundle.getDefaultLocale().getLanguage();
        version = getLanguageVersion(language);
        if (version == null) {
            version = new CMSPageLanguageVersion();
        }
        return version;
    }

    public CMSPageLanguageVersion getLanguageVersion(Locale locale) throws CmsElementNotFoundException {
        String language = locale.getLanguage();
        return getLanguageVersion(language);
    }

    public CMSPageLanguageVersion getLanguageVersion(String language) throws CmsElementNotFoundException {
        for (CMSPageLanguageVersion version : getLanguageVersions()) {
            if (version.getLanguage().equals(language)) {
                return version;
            }
        }
        throw new CmsElementNotFoundException("No language version for " + language);
        //        synchronized (languageVersions) {
        //            try {
        //                CMSPageLanguageVersion version = getTemplate().createNewLanguageVersion(this, language);
        //                this.languageVersions.add(version);
        //                return version;
        //            } catch (NullPointerException | IllegalStateException e) {
        //                return null;
        //            }
        //        }
    }

    public String getTitle() {
        String title;
        try {
            title = getBestLanguage().getTitle();
        } catch (CmsElementNotFoundException e) {
            try {
                title = getBestLanguageIncludeUnfinished().getTitle();
            } catch (CmsElementNotFoundException e1) {
                title = "";
            }
        }
        return title;
    }

    public String getTitle(Locale locale) {
        try {
            return getLanguageVersion(locale.getLanguage()).getTitle();
        } catch (CmsElementNotFoundException e) {
            return getTitle();
        }
    }

    public String getMenuTitle() {
        String title;
        try {
            title = getBestLanguage().getMenuTitle();
        } catch (CmsElementNotFoundException e) {
            try {
                title = getBestLanguageIncludeUnfinished().getMenuTitle();
            } catch (CmsElementNotFoundException e1) {
                title = "";
            }
        }
        return title;
    }

    public String getMenuTitle(Locale locale) {
        try {
            return getLanguageVersion(locale.getLanguage()).getMenuTitle();
        } catch (CmsElementNotFoundException e) {
            return getMenuTitle();
        }
    }

    public Long getPageSorting() {
        return pageSorting;
    }

    public void setPageSorting(Long pageSorting) {
        this.pageSorting = pageSorting;
    }

    /**
     * @return the subThemeDiscriminatorValue
     */
    public String getSubThemeDiscriminatorValue() {
        return subThemeDiscriminatorValue;
    }

    /**
     * @param subThemeDiscriminatorValue the subThemeDiscriminatorValue to set
     */
    public void setSubThemeDiscriminatorValue(String subThemeDiscriminatorValue) {
        this.subThemeDiscriminatorValue = subThemeDiscriminatorValue;
    }

    public String getMediaName(String contentId) {
        CMSMediaItemMetadata metadata = getMediaMetadata(contentId);
        return metadata == null ? "" : metadata.getName();
    }

    public String getMediaDescription(String contentId) {
        CMSMediaItemMetadata metadata = getMediaMetadata(contentId);
        return metadata == null ? "" : metadata.getDescription();
    }

    private CMSMediaItemMetadata getMediaMetadata(String itemId) {
        CMSContentItem item;
        try {
            item = getContentItem(itemId);
        } catch (CmsElementNotFoundException e1) {
            item = null;
        }
        if (item != null && item.getMediaItem() != null) {
            return item.getMediaItem().getCurrentLanguageMetadata();
        }
        return null;
    }

    public Optional<CMSContentItem> getContentItemIfExists(String itemId) {
        try {
            return Optional.of(getContentItem(itemId));
        } catch (CmsElementNotFoundException e) {
            return Optional.empty();
        }
    }

    /**
     * Return the content item of the given id for the most suitable language using {@link #getBestLanguage()} and - failing that
     * {@link #getBestLanguageIncludeUnfinished()}.
     * 
     * @param itemId
     * @return
     * @throws CmsElementNotFoundException If absolutely no matching element was found
     */
    public CMSContentItem getContentItem(String itemId) throws CmsElementNotFoundException {
        CMSPageLanguageVersion language;
        CMSContentItem item = null;
        try {
            item = getBestLanguage().getContentItem(itemId);
        } catch (CmsElementNotFoundException e) {
            try {
                item = getDefaultLanguage().getContentItem(itemId);
            } catch (CmsElementNotFoundException e1) {
                item = getBestLanguageIncludeUnfinished().getContentItem(itemId);
            }
        }

        return item;
    }

    /**
     * Tries to find the best fitting {@link CMSPageLanguageVersion LanguageVersion} for the current locale. Returns the LanguageVersion for the given
     * locale if it exists has {@link CMSPageStatus} Finished. Otherwise returns the LanguageVersion of the viewer's default language if it exists and
     * is Finished, or failing that the first available (non-global) finished language version
     * 
     * @return
     * @throws CmsElementNotFoundException
     */
    private CMSPageLanguageVersion getBestLanguage() throws CmsElementNotFoundException {
        Locale currentLocale = CmsBean.getCurrentLocale();
        return getBestLanguage(currentLocale);
    }

    /**
     * Tries to find the best fitting {@link CMSPageLanguageVersion LanguageVersion} for the given locale. Returns the LanguageVersion for the given
     * locale if it exists has {@link CMSPageStatus} Finished. Otherwise returns the LanguageVersion of the viewer's default language if it exists and
     * is Finished, or failing that the first available (non-global) finished language version
     * 
     * @param locale The
     * @return
     * @throws CmsElementNotFoundException
     */
    private CMSPageLanguageVersion getBestLanguage(Locale locale) throws CmsElementNotFoundException {
        // logger.trace("getBestLanguage");
        CMSPageLanguageVersion language = getLanguageVersions().stream()
                .filter(l -> l.getStatus().equals(CMSPageStatus.FINISHED))
                .filter(l -> !l.getLanguage().equals(GLOBAL_LANGUAGE))
                .sorted(new CMSPageLanguageVersionComparator(locale, ViewerResourceBundle.getDefaultLocale()))
                .findFirst()
                .orElseThrow(() -> new CmsElementNotFoundException("No finished language version exists for page " + this));
        return language;
    }

    /**
     * Tries to find the best fitting {@link CMSPageLanguageVersion LanguageVersion} for the given locale, including unfinished versions. Returns the
     * LanguageVersion for the given locale if it exists. Otherwise returns the LanguageVersion of the viewer's default language if it exists, or
     * failing that the first available (non-global) language version
     * 
     * @param locale The
     * @return
     * @throws CmsElementNotFoundException
     */
    private CMSPageLanguageVersion getBestLanguageIncludeUnfinished(Locale locale) throws CmsElementNotFoundException {
        CMSPageLanguageVersion language = getLanguageVersions().stream()
                .filter(l -> !l.getLanguage().equals(GLOBAL_LANGUAGE))
                .sorted(new CMSPageLanguageVersionComparator(locale, ViewerResourceBundle.getDefaultLocale()))
                .findFirst()
                .orElseThrow(() -> new CmsElementNotFoundException("No language version exists for page " + this.getId()));
        return language;
    }

    /**
     * Tries to find the best fitting {@link CMSPageLanguageVersion LanguageVersion} for the current locale, including unfinished versions. Returns
     * the LanguageVersion for the given locale if it exists. Otherwise returns the LanguageVersion of the viewer's default language if it exists, or
     * failing that the first available (non-global) language version
     * 
     * @return
     * @throws CmsElementNotFoundException
     */
    private CMSPageLanguageVersion getBestLanguageIncludeUnfinished() throws CmsElementNotFoundException {
        Locale currentLocale = CmsBean.getCurrentLocale();
        return getBestLanguageIncludeUnfinished(currentLocale);
    }

    /**
     * @return the pretty url to this page (using alternative url if set)
     */
    public String getPageUrl() {
        return BeanUtils.getCmsBean().getUrl(this);
    }

    /**
     * Like getPageUrl() but does not require CmsBean (which is unavailable in different threads).
     * 
     * @return URL to this page
     */
    public String getUrl() {
        return new StringBuilder(BeanUtils.getServletPathWithHostAsUrlFromJsfContext()).append("/").append(getRelativeUrlPath(true)).toString();
    }

    public boolean hasContent(String itemId) {
        CMSContentItem item;
        try {
            item = getContentItem(itemId);
        } catch (CmsElementNotFoundException e) {
            return false;
        }
        switch (item.getType()) {
            case TEXT:
            case HTML:
                return StringUtils.isNotBlank(item.getHtmlFragment());
            case MEDIA:
                return item.getMediaItem() != null && StringUtils.isNotBlank(item.getMediaItem().getFileName());
            case COMPONENT:
                return StringUtils.isNotBlank(item.getComponent());
            default:
                return false;
        }
    }

    public String getContent(String itemId) throws ViewerConfigurationException {
        return getContent(itemId, null, null);
    }

    public Optional<CMSMediaItem> getMediaItem(String itemId) {
        return getContentItemIfExists(itemId).map(content -> content.getMediaItem());
    }

    public Optional<CMSMediaItem> getMediaItem() {
        return getGlobalContentItems().stream()
                .filter(content -> CMSContentItemType.MEDIA.equals(content.getType()))
                .map(content -> content.getMediaItem())
                .filter(item -> item != null)
                .findFirst();
    }

    public String getContent(String itemId, String width, String height) throws ViewerConfigurationException {
        logger.trace("Getting content " + itemId + " from page " + getId());
        CMSContentItem item;
        try {
            item = getContentItem(itemId);
        } catch (CmsElementNotFoundException e1) {
            logger.error("No content item of id " + itemId + " found in page " + this.getId());
            return "";
        }
        String contentString = "";
        switch (item.getType()) {
            case TEXT:
                contentString = item.getHtmlFragment();
                break;
            case HTML:
                contentString = CMSContentResource.getContentUrl(item);
                break;
            case MEDIA:
                contentString = CmsMediaBean.getMediaUrl(item.getMediaItem(), width, height);
                break;
            case COMPONENT:
                contentString = item.getComponent();
                break;
            case GLOSSARY:
                try {
                    contentString = new GlossaryManager().getGlossaryAsJson(item.getGlossaryName());
                } catch (ContentNotFoundException | IOException e) {
                    logger.error("Failed to load glossary " + item.getGlossaryName(), e);
                }
                break;
            default:
                contentString = "";
        }
        logger.trace("Got content as string: " + contentString);
        return contentString;
    }

    public List<CMSContentItem> getGlobalContentItems() {
        CMSPageLanguageVersion defaultVersion;
        try {
            defaultVersion = getLanguageVersion(GLOBAL_LANGUAGE);
        } catch (CmsElementNotFoundException e) {
            return new ArrayList<>();
        }
        List<CMSContentItem> items = defaultVersion.getContentItems();
        return items;
    }

    public List<CMSContentItem> getContentItems() {
        CMSPageLanguageVersion defaultVersion;
        try {
            defaultVersion = getLanguageVersion(CmsBean.getCurrentLocale().getLanguage());
        } catch (CmsElementNotFoundException e) {
            return new ArrayList<>();
        }
        List<CMSContentItem> items = defaultVersion.getCompleteContentItemList();
        return items;
    }

    public List<CMSContentItem> getContentItems(Locale locale) {
        if (locale != null) {
            CMSPageLanguageVersion version;
            try {
                version = getLanguageVersion(locale.getLanguage());
            } catch (CmsElementNotFoundException e) {
                return new ArrayList<>();
            }
            List<CMSContentItem> items = version.getCompleteContentItemList();
            return items;
        }
        return null;
    }

    private static CMSPageTemplate getTemplateById(String id) {
        return CMSTemplateManager.getInstance().getTemplate(id);
    }

    public CMSPageTemplate getTemplate() {
        return getTemplateById(getTemplateId());
    }

    /**
     * Gets the pagination number for this page's main list if it contains one
     *
     * @return
     */
    public int getListPage() {
        return listPage;
    }

    /**
     * Sets the pagination number for this page's main list if it contains one
     *
     * @param listPage
     */
    public void setListPage(int listPage) {
        resetItemData();
        this.listPage = listPage;
        this.getContentItems().forEach(item -> item.getFunctionality().setPageNo(listPage));

    }

    /**
     * @return the persistentUrl
     */
    public String getPersistentUrl() {
        return persistentUrl;
    }

    /**
     * @param persistentUrl the persistentUrl to set
     */
    public void setPersistentUrl(String persistentUrl) {
        persistentUrl = StringUtils.removeStart(persistentUrl, "/");
        persistentUrl = StringUtils.removeEnd(persistentUrl, "/");
        this.persistentUrl = persistentUrl.trim();
    }

    /**
     *
     */
    public void resetEditorItemVisibility() {
        if (getGlobalContentItems() != null) {
            for (CMSContentItem item : getGlobalContentItems()) {
                item.setVisible(false);
            }
        }
    }


    public static class PageComparator implements Comparator<CMSPage> {
        //null values are high
        NullComparator nullComparator = new NullComparator(true);

        @Override
        public int compare(CMSPage page1, CMSPage page2) {
            int value = nullComparator.compare(page1.getPageSorting(), page2.getPageSorting());
            if (value == 0) {
                value = nullComparator.compare(page1.getId(), page2.getId());
            }
            return value;
        }

    }

    /**
     * @return the staticPageName
     */
    @Deprecated
    public String getStaticPageName() {
        return staticPageName;
    }

    /**
     * @param staticPageName the staticPageName to set
     */
    @Deprecated
    public void setStaticPageName(String staticPageName) {
        this.staticPageName = staticPageName;
    }

    public String getTileGridUrl(String itemId) throws IllegalRequestException {
        CMSContentItem item;
        try {
            item = getContentItem(itemId);
        } catch (CmsElementNotFoundException e) {
            item = null;
        }
        if (item != null && item.getType().equals(CMSContentItemType.TILEGRID)) {
            StringBuilder sb = new StringBuilder(BeanUtils.getServletPathWithHostAsUrlFromJsfContext());
            sb.append("/rest/tilegrid/")
                    .append(CmsBean.getCurrentLocale().getLanguage())
                    .append("/")
                    .append(item.getNumberOfTiles())
                    .append("/")
                    .append(item.getNumberOfImportantTiles())
                    .append("/")
                    .append(item.getAllowedTags())
                    .append("/");
            return sb.toString();
        }
        throw new IllegalRequestException("No tile grid item with id '" + itemId + "' found");
    }

    public String getRelativeUrlPath() {
        return getRelativeUrlPath(true);
    }

    /**
     * @return
     */
    public String getRelativeUrlPath(boolean pretty) {
        if (pretty && StringUtils.isNotBlank(getPersistentUrl())) {
            return getPersistentUrl() + "/";
        } else if (pretty) {
            try {
                Optional<CMSStaticPage> staticPage = DataManager.getInstance().getDao().getStaticPageForCMSPage(this).stream().findFirst();
                if (staticPage.isPresent()) {
                    return staticPage.get().getPageName() + "/";
                }
            } catch (DAOException e) {
                logger.error(e.toString(), e);
            }
        }
        return "cms/" + getId() + "/";
    }

    public void addContentItem(CMSContentItem item) {
        synchronized (languageVersions) {
            List<CMSPageLanguageVersion> languages = new ArrayList<>(getLanguageVersions());
            for (CMSPageLanguageVersion language : languages) {
                if (item.getType().equals(CMSContentItemType.HTML) || item.getType().equals(CMSContentItemType.TEXT)) {
                    if (!language.getLanguage().equals(CMSPage.GLOBAL_LANGUAGE)) {
                        language.addContentItem(item);
                    }
                } else {
                    if (language.getLanguage().equals(CMSPage.GLOBAL_LANGUAGE)) {
                        language.addContentItem(item);
                    }
                }
            }

            //                getLanguageVersions().stream().filter(lang -> !lang.getLanguage().equals(CMSPage.GLOBAL_LANGUAGE)).forEach(
            //                        lang -> lang.addContentItem(item));
            //            } else {
            //                getLanguageVersion(CMSPage.GLOBAL_LANGUAGE).addContentItem(item);
            //            }
        }
    }

    /**
     * @param itemId
     * @return
     */
    public boolean hasContentItem(final String itemId) {
        synchronized (languageVersions) {
            return languageVersions.stream()
                    .flatMap(lang -> lang.getContentItems().stream())
                    //                    .map(lang -> lang.getContentItem(itemId))
                    //                    .filter(item -> item != null)
                    .filter(item -> item.getItemId().equals(itemId))
                    .findAny()
                    .isPresent();
        }
    }

    /**
     * Returns the first found SearchFunctionality of any containted content items If no fitting item is found, a new default SearchFunctionality is
     * returned
     * 
     * @return SearchFunctionality, not null
     */
    public SearchFunctionality getSearch() {
        Optional<CMSContentItem> searchItem =
                getGlobalContentItems().stream().filter(item -> CMSContentItemType.SEARCH.equals(item.getType())).findFirst();
        if (searchItem.isPresent()) {
            return (SearchFunctionality) searchItem.get().getFunctionality();
        }
        logger.warn("Did not find search functionality in page " + this);
        return new SearchFunctionality("", getPageUrl());
    }

    public boolean isHasSidebarElements() {
        if (!isUseDefaultSidebar()) {
            return getSidebarElements() != null && !getSidebarElements().isEmpty();
        }
        return true;
    }

    public void addLanguageVersion(CMSPageLanguageVersion version) {
        this.languageVersions.add(version);
        version.setOwnerPage(this);
    }

    /**
     * @param parentPageId the parentPageId to set
     */
    public void setParentPageId(String parentPageId) {
        this.parentPageId = parentPageId;
    }

    /**
     * @return the parentPageId
     */
    public String getParentPageId() {
        return parentPageId;
    }

    /**
     * @return the validityStatus
     */
    public PageValidityStatus getValidityStatus() {
        return validityStatus;
    }

    /**
     * @param validityStatus the validityStatus to set
     */
    public void setValidityStatus(PageValidityStatus validityStatus) {
        this.validityStatus = validityStatus;
    }

    /**
     * @return the mayContainUrlParameters
     */
    public boolean isMayContainUrlParameters() {
        return mayContainUrlParameters;
    }

    /**
     * @param mayContainUrlParameters the mayContainUrlParameters to set
     */
    public void setMayContainUrlParameters(boolean mayContainUrlParameters) {
        this.mayContainUrlParameters = mayContainUrlParameters;
    }

    //    /**
    //     * @return true if this page's template is configured to follow urls which contain additional parameters (e.g. search parameters)
    //     */
    //    public boolean mayContainURLParameters() {
    //        try {
    //            if (getTemplate() != null) {
    //                return getTemplate().isAppliesToExpandedUrl();
    //            }
    //            return false;
    //        } catch (IllegalStateException e) {
    //            logger.warn("Unable to acquire template", e);
    //            return false;
    //        }
    //    }

    /**
     * @return the relatedPI
     */
    public String getRelatedPI() {
        return relatedPI;
    }

    /**
     * @param relatedPI the relatedPI to set
     */
    public void setRelatedPI(String relatedPI) {
        this.relatedPI = relatedPI;
    }

    public CollectionView getCollection() throws PresentationException, IndexUnreachableException {
        return BeanUtils.getCmsBean().getCollection(this);
    }

    /**
     * Returns the property with the given key or else creates a new one with that key and returns it
     * 
     * @param key
     * @throws ClassCastException if the returned property has the wrong generic type
     * @return the property with the given key or else creates a new one with that key and returns it
     */
    public CMSProperty getProperty(String key) throws ClassCastException {
        CMSProperty property = this.properties.stream().filter(prop -> key.equalsIgnoreCase(prop.getKey())).findFirst().orElseGet(() -> {
            CMSProperty prop = new CMSProperty(key);
            this.properties.add(prop);
            return prop;
        });
        return property;
    }

    /* (non-Javadoc)
     * @see java.lang.Object#toString()
     */
    @Override
    public String toString() {
        try {
            return getBestLanguageIncludeUnfinished(Locale.ENGLISH).getTitle();
        } catch (CmsElementNotFoundException e) {
            return "ID: " + this.getId() + " (no title)";
        }
    }

    /**
     * Remove any language versions without primary key (because h2 doesn't like that)
     */
    public void cleanup() {
        Iterator<CMSPageLanguageVersion> i = languageVersions.iterator();
        while (i.hasNext()) {
            CMSPageLanguageVersion langVersion = i.next();
            if (langVersion.getId() == null) {
                i.remove();
            }
        }

    }

    /**
     * Return true if the page has a {@link CMSPageLanguageVersion} for the given locale
     * 
     * @param locale
     * @return true if the page has a {@link CMSPageLanguageVersion} for the given locale, false otherwise
     */
    public boolean hasLanguageVersion(Locale locale) {
        return this.languageVersions.stream().anyMatch(l -> l.getLanguage().equals(locale.getLanguage()));
    }
    
    /**
     * Adds {@link CMSPageLanguageVersion}s for all given {@link Locale}s for which no 
     * language versions already exist
     * 
     * @param page
     * @param locales
     */
    public void createMissingLangaugeVersions( List<Locale> locales) {
        for (Locale locale : locales) {
            if(!hasLanguageVersion(locale)) {
                addLanguageVersion(new CMSPageLanguageVersion(locale.getLanguage()));
            }
        }
        
    }

}
