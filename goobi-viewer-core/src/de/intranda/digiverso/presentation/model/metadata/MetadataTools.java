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
package de.intranda.digiverso.presentation.model.metadata;

import java.util.List;

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.presentation.controller.DataManager;
import de.intranda.digiverso.presentation.controller.SolrConstants;
import de.intranda.digiverso.presentation.controller.language.Language;
import de.intranda.digiverso.presentation.exceptions.IndexUnreachableException;
import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.intranda.digiverso.presentation.exceptions.ViewerConfigurationException;
import de.intranda.digiverso.presentation.model.viewer.PhysicalElement;
import de.intranda.digiverso.presentation.model.viewer.StructElement;

public class MetadataTools {

    /** Logger for this class. */
    private static final Logger logger = LoggerFactory.getLogger(MetadataTools.class);

    /**
     * 
     * @param structElement
     * @return String containing meta tags
     */
    public static String generateDublinCoreMetaTags(StructElement structElement) {
        if (structElement == null) {
            return "";
        }

        StringBuilder result = new StringBuilder(100);

        String title = "-";
        String creators = "-";
        String publisher = "-";
        String yearpublish = "-";
        String placepublish = "-";
        String date = null;
        String identifier = null;
        String rights = null;

        // schema
        result.append("\r\n<link rel=\"schema.DCTERMS\" href=\"http://purl.org/dc/terms/\" />");
        result.append("\r\n<link rel=\"schema.DC\" href=\"http://purl.org/dc/elements/1.1/\" />");

        if (structElement.getMetadataValue("MD_TITLE") != null) {
            title = structElement.getMetadataValues("MD_TITLE").iterator().next();
            result.append("\r\n<meta name=\"DC.title\" content=\"").append(title).append("\" />");
        }

        if (structElement.getMetadataValue("MD_CREATOR") != null) {
            for (Object fieldValue : structElement.getMetadataValues("MD_CREATOR")) {
                String value = (String) fieldValue;
                if (StringUtils.isEmpty(creators)) {
                    creators = value;
                } else {
                    creators = new StringBuilder(creators).append(", ").append(value).toString();
                }
            }
            result.append("\r\n<meta name=\"DC.creator\" content=\"").append(creators).append("\" />");
        }

        if (structElement.getMetadataValue("MD_PUBLISHER") != null) {
            publisher = structElement.getMetadataValue("MD_PUBLISHER");
            result.append("\r\n<meta name=\"DC.publisher\" content=\"").append(publisher).append("\" />");
        }

        if (structElement.getMetadataValue("MD_YEARPUBLISH") != null) {
            date = structElement.getMetadataValue("MD_YEARPUBLISH");
            result.append("\r\n<meta name=\"DC.date\" content=\"").append(date).append("\" />");
        }

        // DC.language
        if (structElement.getMetadataValue("MD_LANGUAGE") != null) {
            String value = structElement.getMetadataValue("MD_LANGUAGE");
            String isoValue = convertLanguageToIso2(value);
            if (value.length() != 2) {
                // non-iso2
                result.append("\r\n<meta name=\"DC.language\" content=\"").append(value).append('"');
                if (isoValue.length() == 2) {
                    result.append(" xml:lang=\"").append(isoValue).append('"');
                }
                result.append(" />");
            }
            if (isoValue.length() == 2) {
                // iso2
                result.append("\r\n<meta name=\"DC.language\" content=\"").append(isoValue).append("\" xml:lang=\"").append(isoValue).append(
                        "\" scheme=\"DCTERMS.RFC1766\" />");
            }

        }

        if (structElement.getMetadataValue(SolrConstants.URN) != null) {
            identifier = structElement.getMetadataValue(SolrConstants.URN);
            result.append("\r\n<meta name=\"DC.identifier\" content=\"").append(identifier).append("\" />");
        }

        String sourceString = new StringBuilder(creators).append(": ")
                .append(title)
                .append(", ")
                .append(placepublish)
                .append(": ")
                .append(publisher)
                .append(' ')
                .append(yearpublish)
                .append('.')
                .toString();

        result.append("\r\n<meta name=\"DC.source\" content=\"").append(sourceString).append("\">");

        if (structElement.getMetadataValue(SolrConstants.ACCESSCONDITION) != null) {
            rights = structElement.getMetadataValue(SolrConstants.ACCESSCONDITION);
            if (!SolrConstants.OPEN_ACCESS_VALUE.equals(rights)) {
                result.append("\r\n<meta name=\"DC.rights\" content=\"").append(rights).append("\">");
            }
        }

        return result.toString();
    }

    /**
     * 
     * @param structElement
     * @param pages
     * @return String containing meta tags
     * @throws IndexUnreachableException
     * @throws ViewerConfigurationException
     * @throws PresentationException
     */
    public static String generateHighwirePressMetaTags(StructElement structElement, List<PhysicalElement> pages)
            throws IndexUnreachableException, ViewerConfigurationException, PresentationException {
        if (structElement == null) {
            return "";
        }

        StructElement anchorElement = structElement.getParent();
        StringBuilder result = new StringBuilder(100);

        // citation_title
        String title = "";
        if (anchorElement != null && anchorElement.getMetadataValue("MD_TITLE") != null) {
            title = StringEscapeUtils.escapeHtml(anchorElement.getMetadataValue("MD_TITLE")) + ": ";
        }
        if (structElement.getMetadataValue("MD_TITLE") != null) {
            title += StringEscapeUtils.escapeHtml(structElement.getMetadataValue("MD_TITLE"));
        }
        result.append("\r\n<meta name=\"citation_title\" content=\"").append(title).append("\" />");

        // citation_author
        if (structElement.getMetadataValue("MD_CREATOR") != null) {
            for (Object fieldValue : structElement.getMetadataValues("MD_CREATOR")) {
                String value = StringEscapeUtils.escapeHtml((String) fieldValue);
                result.append("\r\n<meta name=\"citation_author\" content=\"").append(value).append("\" />");
            }
        }
        // citation_publication_date
        if (structElement.getMetadataValue(SolrConstants.YEARPUBLISH) != null) {
            String value = structElement.getMetadataValue(SolrConstants.YEARPUBLISH);
            List<String> normalizedValues = structElement.getMetadataValues(SolrConstants._CALENDAR_YEAR);
            if (normalizedValues != null && !normalizedValues.isEmpty()) {
                for (String normalizedValue : normalizedValues) {
                    if (value.contains(normalizedValue)) {
                        result.append("\r\n<meta name=\"citation_publication_date\" content=\"").append(normalizedValue).append("\" />");
                        break;
                    }
                }
            }
        }
        // citation_isbn
        if (structElement.getMetadataValue("MD_ISBN") != null) {
            String value = StringEscapeUtils.escapeHtml(structElement.getMetadataValue("MD_ISBN"));
            result.append("\r\n<meta name=\"citation_isbn\" content=\"").append(value).append("\" />");
        }
        // citation_issn
        if (structElement.getMetadataValue("MD_ISSN") != null) {
            String value = StringEscapeUtils.escapeHtml(structElement.getMetadataValue("MD_ISSN"));
            result.append("\r\n<meta name=\"citation_issn\" content=\"").append(value).append("\" />");
        }
        // citation_volume
        if (structElement.getMetadataValue(SolrConstants.CURRENTNO) != null) {
            String value = StringEscapeUtils.escapeHtml(structElement.getMetadataValue(SolrConstants.CURRENTNO));
            result.append("\r\n<meta name=\"citation_volume\" content=\"").append(value).append("\" /");
        }
        // citation_language
        if (structElement.getMetadataValue("MD_LANGUAGE") != null) {
            String value = StringEscapeUtils.escapeHtml(structElement.getMetadataValue("MD_LANGUAGE"));
            value = convertLanguageToIso2(value);
            result.append("\r\n<meta name=\"citation_language\" content=\"").append(value).append("\" />");
        }
        //  citation_pdf_url
        if (pages != null && !pages.isEmpty()) {
            for (PhysicalElement page : pages) {
                if (page == null) {
                    continue;
                }
                String value = StringEscapeUtils.escapeHtml(page.getUrl());
                result.append("\r\n<meta name=\"citation_pdf_url\" content=\"").append(value).append("\" />");
            }
        }

        // abstract 
        if (structElement.getMetadataValue("MD_INFORMATION") != null) {
            // citation_abstract_html_url
            result.append("\r\n<meta name=\"citation_abstract_html_url\" content=\"").append(structElement.getMetadataUrl()).append("\" />");

            // description (non-highwire)
            String value = StringEscapeUtils.escapeHtml(structElement.getMetadataValue("MD_INFORMATION"));
            result.append("\r\n<meta name=\"description\" content=\"").append(value).append("\" />");
        }

        return result.toString();
    }

    /**
     * Converts given language name or ISO-3 code to ISO-2, if possible.
     * 
     * @param language
     * @return ISO-2 representation; original string if none found
     */
    public static String convertLanguageToIso2(String language) {
        if (language == null) {
            return null;
        }

        if (language.length() == 3) {
            Language lang = DataManager.getInstance().getLanguageHelper().getLanguage(language);
            if (lang != null) {
                return lang.getIsoCodeOld();
            }
        }

        // dirty ISO-2 conversion
        switch (language.toLowerCase()) {
            case "english":
                return "en";
            case "deutsch":
            case "deu":
            case "ger":
                return "de";
            case "französisch":
            case "franz.":
            case "fra":
            case "fre":
                return "fr";
        }

        return language;
    }
}
