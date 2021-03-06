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
package de.intranda.digiverso.presentation.servlets;

import java.io.IOException;
import java.net.URLDecoder;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.presentation.controller.DataManager;
import de.intranda.digiverso.presentation.controller.Helper;
import de.intranda.digiverso.presentation.controller.SolrConstants;
import de.intranda.digiverso.presentation.controller.SolrConstants.DocType;
import de.intranda.digiverso.presentation.exceptions.DAOException;
import de.intranda.digiverso.presentation.exceptions.IndexUnreachableException;
import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.intranda.digiverso.presentation.faces.validators.PIValidator;
import de.intranda.digiverso.presentation.managedbeans.NavigationHelper;
import de.intranda.digiverso.presentation.managedbeans.SearchBean;
import de.intranda.digiverso.presentation.model.overviewpage.OverviewPage;
import de.intranda.digiverso.presentation.model.search.SearchHelper;
import de.intranda.digiverso.presentation.model.security.AccessConditionUtils;
import de.intranda.digiverso.presentation.model.security.IPrivilegeHolder;
import de.intranda.digiverso.presentation.model.viewer.PageType;

/**
 * This Servlet maps a given lucene field value to a url and then either redirects there or forwards there, depending on the config.
 */
public class IdentifierResolver extends HttpServlet {

    /** Loggers for this class. */
    private static final Logger logger = LoggerFactory.getLogger(IdentifierResolver.class);

    private static final long serialVersionUID = 1L;

    private static final String CUSTOM_IDENTIFIER_PARAMETER = "identifier";
    private static final String CUSTOM_FIELD_PARAMETER = "field";
    private static final String PAGE_PARAMETER = "page";

    // error messages
    //    private static final String ERRTXT_QUERY_PARSE = "Query string could not be parsed, check your input value. ";
    //    private static final String ERRTXT_DOC_NOT_FOUND = "No matching document could be found. ";
    private static final String ERRTXT_TARGET_FIELD_NOT_FOUND =
            "A document was found but it did not contain the specified target field name required for the mapping. Target field name is: ";
    private static final String ERRTXT_NO_ARGUMENT =
            "You didnt not specify a source field value for the mapping. Append the value to the URL as a request parameter; expected param name is :";
    private static final String ERRTXT_ILLEGAL_IDENTIFIER = "Illegal identifier";
    //    private static final String ERRTXT_MULTIMATCH = "Multiple documents matched the search query. No unambiguous mapping possible.";
    //    private static final String ERRTXT_NOCFG = "The configuration file lucene_url_mapper_config.xml could not be loaded. ";

    /**
     * For a given lucene field name parameter, this method either forwards or redirects to the target URL. The target URL is generated by inserting
     * the target lucene field into the target work url, if a document could be identified by the source field. Otherwise, a document is searched for
     * using the page field; if a document is found in this alternative way, target field and page field of the document are inserted into the target
     * page url. NOTE: If you forward, the target URL must be on the same server and must be below the context root of this servlet, e.g. this servlet
     * can not forward to a target above '/'. A redirect changes the URL displayed in the browser, a forward does not.
     *
     * @should return 400 if record identifier missing
     * @should return 404 if record not found
     * @should return 500 if record field name bad
     * @should return 500 if record field value bad
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

        // Override config settings if "id" and "field" parameters have been passed
        boolean customMode = false;
        if (request.getParameter(CUSTOM_IDENTIFIER_PARAMETER) != null && request.getParameter(CUSTOM_FIELD_PARAMETER) != null) {
            customMode = true;
        }

        String fieldName = SolrConstants.URN;
        String fieldValue = request.getParameter("urn");
        if (customMode) {
            fieldName = request.getParameter(CUSTOM_FIELD_PARAMETER);
            fieldValue = request.getParameter(CUSTOM_IDENTIFIER_PARAMETER);
        }
        if (StringUtils.isEmpty(fieldValue)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, ERRTXT_NO_ARGUMENT + "urn");
            return;
        }

        fieldValue = URLDecoder.decode(fieldValue, SearchBean.URL_ENCODING);

        if (SolrConstants.PI.contentEquals(fieldName) && !PIValidator.validatePi(fieldValue)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, ERRTXT_ILLEGAL_IDENTIFIER + ": " + fieldValue);
            return;
        }

        if (customMode) {
            // fieldValue = fieldValue.toLowerCase();
        }

        StringBuilder sbQuery = new StringBuilder(fieldName.toUpperCase());
        try {
            sbQuery.append(':').append('"').append(ClientUtils.escapeQueryChars(fieldValue)).append('"').append(
                    SearchHelper.getAllSuffixes(request, false, false));
        } catch (IndexUnreachableException e) {
            logger.debug("IndexUnreachableException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        }
        try {
            // 3. evaluate the search
            SolrDocumentList hits = DataManager.getInstance().getSearchIndex().search(sbQuery.toString());
            if (hits.getNumFound() == 0) {
                // 3.1 start the alternative page field search
                if (!customMode) {
                    doPageSearch(fieldValue, request, response);
                } else {
                    redirectToError(HttpServletResponse.SC_NOT_FOUND, fieldValue, request, response);
                    return;
                }
                return;
            } else if (hits.getNumFound() > 1) {
                // 3.2 show multiple match, that indicates corrupted index
                redirectToError(HttpServletResponse.SC_CONFLICT, fieldValue, request, response);
                return;
            }

            // 4. extract the target field value of the single found document
            SolrDocument targetDoc = hits.get(0);

            // Check against the collection blacklist
            // List<SolrDocument> filteredDocs = SearchHelper.applyCollectionBlacklistFilter(hits);
            // if (filteredDocs.isEmpty()) {
            // if (!customMode) {
            // doPageSearch(fieldValue, request, response);
            // } else {
            // response.sendError(HttpServletResponse.SC_NOT_FOUND, ERRTXT_DOC_NOT_FOUND);
            // }
            // return;
            // }

            String pi = (String) targetDoc.getFieldValue(SolrConstants.PI_TOPSTRUCT);
            int page = 1;

            // Deleted record check
            if (targetDoc.getFieldValue(SolrConstants.DATEDELETED) != null) {
                logger.debug("Record '{}' has been deleted, trace document found.", pi);
                redirectToError(HttpServletResponse.SC_GONE, fieldValue, request, response);
                return;
            }

            // If this is not the top level docstruct, retrieve the correct page number
            if ((targetDoc.getFieldValue(SolrConstants.ISWORK) == null || !((Boolean) targetDoc.getFieldValue(SolrConstants.ISWORK)))
                    && (targetDoc.getFieldValue(SolrConstants.ISANCHOR) == null || !((Boolean) targetDoc.getFieldValue(SolrConstants.ISANCHOR)))) {
                if (pi == null && targetDoc.getFieldValue(SolrConstants.PI_TOPSTRUCT) != null) {
                    pi = (String) targetDoc.getFieldValue(SolrConstants.PI_TOPSTRUCT);
                }
                if (targetDoc.getFieldValue(SolrConstants.THUMBPAGENO) != null) {
                    page = (Integer) targetDoc.getFieldValue(SolrConstants.THUMBPAGENO);
                }
            }

            if (pi == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, ERRTXT_TARGET_FIELD_NOT_FOUND + SolrConstants.PI);
                return;
            }

            // Custom page, if parameter given
            if (request.getParameter(PAGE_PARAMETER) != null) {
                page = Integer.valueOf(request.getParameter(PAGE_PARAMETER));
            }

            // If the user has no listing privilege for this record, act as if it does not exist
            boolean access = AccessConditionUtils.checkAccessPermissionByIdentifierAndLogId(pi, null, IPrivilegeHolder.PRIV_LIST, request);
            if (!access) {
                logger.debug("User may not list record '{}'.", pi);
                redirectToError(HttpServletResponse.SC_NOT_FOUND, fieldValue, request, response);
                return;
            }

            String result = constructUrl(targetDoc, false, DataManager.getInstance().getConfiguration().isSidebarOverviewLinkVisible());
            logger.trace("URL: {}", result);

            // 5. redirect or forward using the target field value
            if (DataManager.getInstance().getConfiguration().isUrnDoRedirect()) {
                // response.sendRedirect(TARGET_WORK_URL.replaceAll("\\(0\\)", outputPart));
                response.sendRedirect(result);
            } else {
                // getServletContext().getRequestDispatcher(TARGET_WORK_URL.replaceAll("\\(0\\)", outputPart)).forward(request, response);
                getServletContext().getRequestDispatcher(result).forward(request, response);
            }
        } catch (PresentationException e) {
            logger.debug("PresentationException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        } catch (IndexUnreachableException e) {
            logger.debug("IndexUnreachableException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        } catch (DAOException e) {
            logger.debug("DAOException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        }
    }

    /**
     * This private method is responsible for the alternative page field search; it is called by doGet(), if no document could be found using the
     * standard source field search.
     *
     * @param fieldValue the request param, which is the value to be searched
     * @param request simple forward
     * @param response simple forward
     * @throws IOException
     * @throws ServletException
     */
    private void doPageSearch(String fieldValue, HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        logger.trace("doPageSearch {}", fieldValue);
        // A.1 Search for documents, that contain the request param in their page field
        String query2 = SolrConstants.IMAGEURN + ":" + ClientUtils.escapeQueryChars(fieldValue);

        // A.2 Evaluate the search
        SolrDocumentList hits;
        try {
            hits = DataManager.getInstance().getSearchIndex().search(query2);
        } catch (PresentationException e) {
            logger.debug("PresentationException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        } catch (IndexUnreachableException e) {
            logger.debug("IndexUnreachableException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        }
        if (hits.getNumFound() == 0) {
            // A2.1 show, that no document was found at all
            redirectToError(HttpServletResponse.SC_NOT_FOUND, fieldValue, request, response);
            return;
        } else if (hits.getNumFound() > 1) {
            // A2.2 show multiple match, that indicates inconsistencies within the index
            redirectToError(HttpServletResponse.SC_CONFLICT, fieldValue, request, response);
            return;
        }

        // A.3 Extract the page field value of the single found document
        // Document targetDoc = getSearcher().doc(hits.scoreDocs[0].doc);
        // String pagesString = targetDoc.get(PAGE_FIELD_NAME);
        // pagesString = pagesStsring.replaceAll("\\\\", "");
        // if (pagesString == null) {
        // response.sendError(HttpServletResponse.SC_NOT_FOUND, ERRTXT_TARGET_FIELD_NOT_FOUND + PAGE_FIELD_NAME);
        // return;
        // }
        //
        // // A.4 Determine, at what position inside the page field the request param resides
        // String[] pages = pagesString.split("[ ]");
        // int i;
        // for (i = 0; i < pages.length; i++) {
        // if (pages[i].equals(fieldValue))
        // break;
        // }
        // ++i;

        // Retrieve the corresponding page document from the index, then extract the main document's PI and the current page number
        SolrDocument targetDoc = hits.get(0);
        String pi = (String) targetDoc.getFieldValue(SolrConstants.PI_TOPSTRUCT);

        // If the user has no listing privilege for this record, act as if it does not exist
        boolean access;
        try {
            access = AccessConditionUtils.checkAccessPermissionByIdentifierAndLogId(pi, null, IPrivilegeHolder.PRIV_LIST, request);
        } catch (IndexUnreachableException e) {
            logger.debug("IndexUnreachableException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        } catch (DAOException e) {
            logger.debug("DAOException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        }
        if (!access) {
            logger.debug("User may not list {}", pi);
            redirectToError(HttpServletResponse.SC_NOT_FOUND, fieldValue, request, response);
            return;
        }

        // A.5 Form a result url by inserting the target field of the document and the in A.4 determined value into the target page url
        try {
            String result = constructUrl(targetDoc, true, DataManager.getInstance().getConfiguration().isSidebarOverviewLinkVisible());
            logger.debug("URL: {}", result);
            // A.6 redirect or forward to this newly created url
            if (DataManager.getInstance().getConfiguration().isUrnDoRedirect()) {
                response.sendRedirect(result);
            } else {
                getServletContext().getRequestDispatcher(result).forward(request, response);
            }
        } catch (DAOException e) {
            logger.debug("DAOException thrown here: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
            return;
        }
    }

    /**
     *
     * @param code
     * @param identifier
     * @param request
     * @param response
     * @throws IOException
     * @throws ServletException
     */
    private static void redirectToError(int code, String identifier, HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String url = "/error/";
        //        FacesContext.getCurrentInstance().getExternalContext().getFlash();
        switch (code) {
            case HttpServletResponse.SC_NOT_FOUND:
                request.setAttribute("type", "recordNotFound");
                request.setAttribute("errMsg", Helper.getTranslation("errRecordNotFoundMsg", null).replace("{0}", identifier));
                break;
            case HttpServletResponse.SC_GONE:
                request.setAttribute("type", "recordDeleted");
                request.setAttribute("errMsg", Helper.getTranslation("errRecordDeletedMsg", null).replace("{0}", identifier));
                break;
            case HttpServletResponse.SC_CONFLICT:
                request.setAttribute("type", "general");
                request.setAttribute("errMsg", Helper.getTranslation("errMultiMatch", null).replace("{0}", identifier));
                break;
        }
        request.setAttribute("sourceUrl", NavigationHelper.getFullRequestUrl(request, null));
        request.getRequestDispatcher(url).forward(request, response);
        return;

        //        response.sendError(code, msg);
        //        return;
    }

    /**
     *
     * @param targetDoc
     * @param pageResolverUrl
     * @param allowOverviewPage
     * @return
     * @should construct url correctly
     * @should construct anchor url correctly
     * @should construct group url correctly
     * @should construct page url correctly
     * @should construct overview page url correctly
     * @should construct preferred view url correctly
     * @should construct application mime type url correctly
     */
    static String constructUrl(SolrDocument targetDoc, boolean pageResolverUrl, boolean allowOverviewPage) throws DAOException {
        StringBuilder sb = new StringBuilder("/");
        String docStructType = (String) targetDoc.getFieldValue(SolrConstants.DOCSTRCT);
        String mimeType = (String) targetDoc.getFieldValue(SolrConstants.MIMETYPE);
        String topstructPi = (String) targetDoc.getFieldValue(SolrConstants.PI_TOPSTRUCT);
        boolean anchorOrGroup = (targetDoc.containsKey(SolrConstants.ISANCHOR) && (Boolean) targetDoc.getFieldValue(SolrConstants.ISANCHOR))
                || DocType.GROUP.toString().equals(targetDoc.getFieldValue(SolrConstants.DOCTYPE));
        boolean hasImages = targetDoc.containsKey(SolrConstants.ORDER) || (targetDoc.containsKey(SolrConstants.THUMBNAIL)
                && !StringUtils.isEmpty((String) targetDoc.getFieldValue(SolrConstants.THUMBNAIL)));
        boolean overviewPageFound = false;
        if (!pageResolverUrl && allowOverviewPage) {
            OverviewPage overviewPage = DataManager.getInstance().getDao().getOverviewPageForRecord(topstructPi, null, null);
            if (overviewPage != null) {
                overviewPageFound = true;
            }
        }

        PageType pageType = PageType.determinePageType(docStructType, mimeType, anchorOrGroup, hasImages, overviewPageFound, pageResolverUrl);
        sb.append(pageType.getName()).append('/').append(topstructPi).append('/');
        if (targetDoc.containsKey(SolrConstants.THUMBPAGENO) && (Integer) targetDoc.getFieldValue(SolrConstants.THUMBPAGENO) > 1) {
            sb.append(String.valueOf(targetDoc.getFieldValue(SolrConstants.THUMBPAGENO))).append('/');
        } else if (targetDoc.containsKey(SolrConstants.ORDER)) {
            sb.append(String.valueOf(targetDoc.getFieldValue(SolrConstants.ORDER))).append('/');
        } else {
            sb.append("1/");
        }
        if (targetDoc.containsKey(SolrConstants.LOGID)) {
            sb.append(targetDoc.getFieldValue(SolrConstants.LOGID)).append('/');
        }

        logger.trace("Resolved to: {}", sb.toString());
        return sb.toString();
    }
}
