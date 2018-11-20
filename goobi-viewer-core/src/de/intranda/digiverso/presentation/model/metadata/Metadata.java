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

import java.io.Serializable;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.faces.context.FacesContext;

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.normdataimporter.NormDataImporter;
import de.intranda.digiverso.presentation.controller.DataManager;
import de.intranda.digiverso.presentation.controller.Helper;
import de.intranda.digiverso.presentation.controller.SolrConstants;
import de.intranda.digiverso.presentation.controller.SolrConstants.DocType;
import de.intranda.digiverso.presentation.exceptions.IndexUnreachableException;
import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.intranda.digiverso.presentation.managedbeans.NavigationHelper;
import de.intranda.digiverso.presentation.managedbeans.utils.BeanUtils;
import de.intranda.digiverso.presentation.messages.ViewerResourceBundle;
import de.intranda.digiverso.presentation.model.metadata.MetadataParameter.MetadataParameterType;
import de.intranda.digiverso.presentation.model.search.SearchHelper;
import de.intranda.digiverso.presentation.model.viewer.PageType;

/**
 * Metadata field configuration.
 */
public class Metadata implements Serializable {

    private static final long serialVersionUID = 5671775647919258310L;

    private static final Logger logger = LoggerFactory.getLogger(Metadata.class);

    /** Label from messages.properties. */
    private final String label;
    /** Value from messages.properties (with placeholders) */
    private final String masterValue;
    private final int type;
    private final int number;
    private final List<MetadataValue> values = new ArrayList<>();
    private final List<MetadataParameter> params = new ArrayList<>();
    private final boolean group;

    public Metadata() {
        this.label = "";
        this.masterValue = "";
        this.type = 0;
        this.number = -1;
        this.group = false;
    }

    /**
     * 
     * @param label
     * @param masterValue
     * @param paramValue
     */
    public Metadata(String label, String masterValue, String paramValue) {
        this.label = label;
        this.masterValue = masterValue;
        values.add(new MetadataValue(masterValue));
        if (paramValue != null) {
            values.get(0).getParamValues().add(new ArrayList<>());
            values.get(0).getParamValues().get(0).add(paramValue);
        }
        this.type = 0;
        this.number = -1;
        this.group = false;
    }

    /**
     * 
     * @param label
     * @param masterValue
     * @param param
     * @param paramValue
     */
    public Metadata(String label, String masterValue, MetadataParameter param, String paramValue) {
        this.label = label;
        this.masterValue = masterValue;
        params.add(param);
        values.add(new MetadataValue(masterValue));
        if (paramValue != null) {
            values.get(0).getParamValues().add(new ArrayList<>());
            values.get(0).getParamValues().get(0).add(paramValue);
        }
        this.type = 0;
        this.number = -1;
        this.group = false;
    }

    /**
     * 
     * @param label
     * @param masterValue
     * @param type
     * @param params
     * @param group
     */
    public Metadata(String label, String masterValue, int type, List<MetadataParameter> params, boolean group) {
        this.label = label;
        this.masterValue = masterValue;
        this.type = type;
        this.params.addAll(params);
        this.group = group;
        this.number = -1;
    }

    /**
     * 
     * @param label
     * @param masterValue
     * @param type
     * @param params
     * @param group
     * @param number
     */
    public Metadata(String label, String masterValue, int type, List<MetadataParameter> params, boolean group, int number) {
        this.label = label;
        this.masterValue = masterValue;
        this.type = type;
        this.params.addAll(params);
        this.group = group;
        this.number = number;
    }

    /* (non-Javadoc)
     * @see java.lang.Object#hashCode()
     */
    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((label == null) ? 0 : label.hashCode());
        result = prime * result + ((masterValue == null) ? 0 : masterValue.hashCode());
        result = prime * result + type;
        return result;
    }

    /* (non-Javadoc)
     * @see java.lang.Object#equals(java.lang.Object)
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        Metadata other = (Metadata) obj;
        if (label == null) {
            if (other.label != null) {
                return false;
            }
        } else if (!label.equals(other.label)) {
            return false;
        }
        if (masterValue == null) {
            if (other.masterValue != null) {
                return false;
            }
        } else if (!masterValue.equals(other.masterValue)) {
            return false;
        }
        if (type != other.type) {
            return false;
        }
        return true;
    }

    public boolean isHasLabel() {
        return StringUtils.isNotBlank(label);
    }

    /**
     * @return the label
     */
    public String getLabel() {
        return label;
    }

    public String getMasterValue() {
        if (StringUtils.isEmpty(masterValue)) {
            return "{0}";
        }

        return masterValue;
    }

    /**
     * @return the type
     */
    public int getType() {
        return type;
    }

    /**
     * @return the values
     */
    public List<MetadataValue> getValues() {
        return values;
    }

    /**
     * 
     * @param valueIndex
     * @param paramIndex
     * @param inValues List with values
     * @param label
     * @param url
     * @param normDataUrl
     * @param groupType value of METADATATYPE, if available
     * @param locale
     * @should add multivalued param values correctly
     * @should set group type correctly
     */
    public void setParamValue(int valueIndex, int paramIndex, List<String> inValues, String label, String url, Map<String, String> normDataUrl,
            String groupType, Locale locale) {
        if (inValues == null) {
            throw new IllegalArgumentException("inValues may not be null");
        }

        // Adopt indexes to list sizes, if necessary
        while (values.size() - 1 < valueIndex) {
            values.add(new MetadataValue(masterValue));
        }
        MetadataValue mdValue = values.get(valueIndex);
        mdValue.setGroupType(groupType);
        int origParamIndex = paramIndex;
        while (mdValue.getParamValues().size() < paramIndex) {
            paramIndex--;
        }

        if (paramIndex >= params.size()) {
            logger.warn("No params defined");
            return;
        }

        if (!inValues.isEmpty()) {
            for (String value : inValues) {
                value = value.trim();
                if (params.get(paramIndex).getType() != null) {
                    switch (params.get(paramIndex).getType()) {
                        case WIKIFIELD:
                        case WIKIPERSONFIELD:
                            if (value.contains(",")) {
                                // Find and remove additional information in a person's name
                                Pattern p = Pattern.compile(Helper.REGEX_PARENTHESES);
                                Matcher m = p.matcher(value);
                                while (m.find()) {
                                    String cut = value.substring(m.start(), m.end());
                                    value = value.replace(cut, "");
                                    m = p.matcher(value);
                                }
                                // Revert the name around the comma (persons only)
                                if (params.get(paramIndex).getType().equals(MetadataParameterType.WIKIPERSONFIELD)) {
                                    String[] valueSplit = value.split("[,]");
                                    if (valueSplit.length > 1) {
                                        value = valueSplit[1].trim() + "_" + valueSplit[0].trim();
                                    }
                                }
                            }
                            value = value.trim();
                            value = value.replace("<", "");
                            value = value.replace(">", "");
                            value = value.replace(" ", "_");
                            // logger.debug("WIKIPEDIA: " + value + " paramIndex: " + paramIndex);
                            break;
                        case PPNFIELD:
                            if (value.toUpperCase().startsWith("PPN")) {
                                value = value.substring(3);
                            }
                            break;
                        case MESSAGES_KEY:
                            //                    case THEME:
                            // do nothing
                            break;
                        case TRANSLATEDFIELD:
                            // Values that are message keys
                            value = Helper.getTranslation(value, locale);
                            value = StringEscapeUtils.escapeHtml(value);
                            // convert line breaks back to HTML
                            value = value.replace("&lt;br /&gt;", "<br />");
                            break;
                        case UNESCAPEDFIELD:
                            // convert line breaks back to HTML
                            value = value.replace("&lt;br /&gt;", "<br />");
                            break;
                        case URLESCAPEDFIELD:
                            // escape reserved URL characters
                            value = BeanUtils.escapeCriticalUrlChracters(value);
                            break;
                        case HIERARCHICALFIELD:
                        // create a link for reach hierarchy level
                        {
                            NavigationHelper nh = BeanUtils.getNavigationHelper();
                            value = buildHierarchicalValue(label, value, locale, nh != null ? nh.getApplicationUrl() : null);
                        }
                            break;
                        case NORMDATAURI:
                            if (StringUtils.isNotEmpty(value)) {
                                NavigationHelper nh = BeanUtils.getNavigationHelper();
                                String html = ViewerResourceBundle.getTranslation("NORMDATA_BUTTON", locale)
                                        .replace("{0}", nh.getApplicationUrl())
                                        .replace("{1}", BeanUtils.escapeCriticalUrlChracters(value))
                                        .replace("{2}", groupType)
                                        .replace("{3}", nh.getLocaleString())
                                        .replace("{4}", ViewerResourceBundle.getTranslation("normdataExpand", locale))
                                        .replace("{5}", ViewerResourceBundle.getTranslation("normdataPopoverCloseAll", locale));
                                value = html;
                            }
                            break;
                        default:
                            // Values containing random HTML-like elements (e.g. 'V<a>e') will break the table, therefore escape the string
                            value = StringEscapeUtils.escapeHtml(value);
                            // convert line breaks back to HTML
                            value = value.replace("&lt;br /&gt;", "<br />");
                    }
                    value = value.replace("'", "&#39;");
                    value = SearchHelper.replaceHighlightingPlaceholders(value);
                }

                if (paramIndex >= 0) {
                    MetadataParameter origParam = params.get(origParamIndex);
                    mdValue.getParamLabels().add(paramIndex, label);
                    if (mdValue.getParamValues().size() <= paramIndex) {
                        mdValue.getParamValues().add(paramIndex, new ArrayList<>());
                    }
                    mdValue.getParamValues().get(paramIndex).add(Helper.intern(value));
                    mdValue.getParamPrefixes().add(paramIndex, origParam.getPrefix());
                    mdValue.getParamSuffixes().add(paramIndex, origParam.getSuffix());
                    mdValue.getParamUrls().add(paramIndex, url);
                    if (normDataUrl != null) {
                        mdValue.getNormDataUrls().putAll(normDataUrl);
                        // logger.trace("added norm data url: {}", normDataUrl.toString());
                    }
                    // Replace master value with override value from the parameter
                    if (StringUtils.isNotEmpty(origParam.getOverrideMasterValue()) && StringUtils.isNotEmpty(value)) {
                        mdValue.setMasterValue(origParam.getOverrideMasterValue());
                    }
                }
            }
        }
    }

    /**
     * 
     * @param field Index field
     * @param value Field value
     * @param locale Optional locale for value translation
     * @param applicationUrl Application root URL for hyperlinks; only the values will be included if url is null
     * @return
     * @should build value correctly
     */
    static String buildHierarchicalValue(String field, String value, Locale locale, String applicationUrl) {
        String[] valueSplit = value.split("[.]");
        StringBuilder sbFullValue = new StringBuilder();
        StringBuilder sbHierarchy = new StringBuilder();
        for (String s : valueSplit) {
            if (sbFullValue.length() > 0) {
                sbFullValue.append(" > ");
            }
            if (sbHierarchy.length() > 0) {
                sbHierarchy.append('.');
            }
            sbHierarchy.append(s);
            String displayValue = Helper.getTranslation(sbHierarchy.toString(), locale);
            // Values containing random HTML-like elements (e.g. 'V<a>e') will break the table, therefore escape the string
            displayValue = StringEscapeUtils.escapeHtml(displayValue);
            if (applicationUrl != null) {
                sbFullValue.append("<a href=\"").append(applicationUrl).append(PageType.browse.getName()).append("/-/1/-/");
                if (field != null) {
                    sbFullValue.append(field).append(':');
                }
                sbFullValue.append(sbHierarchy.toString()).append("/\">").append(displayValue).append("</a>");
            } else {
                sbFullValue.append(displayValue);
            }
        }

        return sbFullValue.toString();
    }

    /**
     * @return the params
     */
    public List<MetadataParameter> getParams() {
        return params;
    }

    public boolean hasParam(String paramName) {
        if (params != null) {
            for (MetadataParameter param : params) {
                if (param.getKey().equals(paramName)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Checks whether any parameter values are set. 'empty' seems to be a reserved word in JSF, so use 'blank'.
     *
     * @return true if all paramValues are empty or blank; false otherwise.
     * @should return true if all paramValues are empty
     * @should return false if at least one paramValue is not empty
     */
    public boolean isBlank() {
        if (values != null) {
            for (MetadataValue value : values) {
                if (value.getParamValues().isEmpty()) {
                    return true;
                }
                for (List<String> paramValues : value.getParamValues())
                    for (String paramValue : paramValues) {
                        if (StringUtils.isNotBlank(paramValue)) {
                            return false;
                        }
                    }
            }
        }

        return true;
    }

    /**
     * Populates the parameters of the given metadata with values from the given StructElement.
     *
     * @param metadataMap
     * @param locale
     * @return
     * @throws IndexUnreachableException
     */
    @SuppressWarnings("unchecked")
    public boolean populate(Map<String, List<String>> metadataMap, Locale locale) throws IndexUnreachableException {
        if (metadataMap == null) {
            return false;
        }
        boolean found = false;

        if (group) {
            // Metadata grouped in an own Solr document
            if (metadataMap.get(label) == null) {
                // If there is no plain value in the docstruct doc, then there shouldn't be a metadata Solr doc. In this case save time by skipping this field.
                return false;
            }
            if (metadataMap.get(SolrConstants.IDDOC) != null && !metadataMap.get(SolrConstants.IDDOC).isEmpty()) {
                String iddoc = metadataMap.get(SolrConstants.IDDOC).get(0);
                try {
                    StringBuilder sbQuery = new StringBuilder();
                    sbQuery.append(SolrConstants.LABEL)
                            .append(':')
                            .append(label)
                            .append(" AND ")
                            .append(SolrConstants.IDDOC_OWNER)
                            .append(':')
                            .append(iddoc)
                            .append(" AND ")
                            .append(SolrConstants.DOCTYPE)
                            .append(':')
                            .append(DocType.METADATA.name());
                    logger.trace("GROUP QUERY: {}", sbQuery.toString());
                    SolrDocumentList groupedMdList = DataManager.getInstance().getSearchIndex().search(sbQuery.toString());
                    int count = 0;
                    for (SolrDocument doc : groupedMdList) {
                        Map<String, List<String>> groupFieldMap = new HashMap<>();
                        // Collect values for all fields in this metadata doc
                        for (String fieldName : doc.getFieldNames()) {
                            List<String> values = groupFieldMap.get(fieldName);
                            if (values == null) {
                                values = new ArrayList<>();
                                groupFieldMap.put(fieldName, values);
                            }
                            // logger.trace(fieldName + ":" + doc.getFieldValue(fieldName).toString());
                            if (doc.getFieldValue(fieldName) instanceof String) {
                                String value = (String) doc.getFieldValue(fieldName);
                                values.add(value);
                            } else if (doc.getFieldValue(fieldName) instanceof Collection) {
                                values.addAll((List<String>) doc.getFieldValue(fieldName));
                            }
                        }
                        String groupType = null;
                        if (groupFieldMap.containsKey(SolrConstants.METADATATYPE) && !groupFieldMap.get(SolrConstants.METADATATYPE).isEmpty()) {
                            groupType = groupFieldMap.get(SolrConstants.METADATATYPE).get(0);
                        }
                        // Populate params for which metadata values have been found
                        for (int i = 0; i < params.size(); ++i) {
                            MetadataParameter param = params.get(i);
                            // logger.trace("param: {}", param.getKey());
                            if (groupFieldMap.get(param.getKey()) != null) {
                                found = true;
                                StringBuilder sbValue = new StringBuilder();
                                // TODO
                                List<String> values = new ArrayList<>(groupFieldMap.get(param.getKey()).size());
                                for (String mdValue : groupFieldMap.get(param.getKey())) {
                                    if (sbValue.length() == 0) {
                                        sbValue.append(mdValue);
                                    }
                                    values.add(mdValue);
                                }
                                String paramValue = sbValue.toString();
                                if (param.getKey().startsWith(NormDataImporter.FIELD_URI)) {
                                    Map<String, String> normDataUrl = new HashMap<>();
                                    normDataUrl.put(param.getKey(), paramValue);
                                    // logger.trace("found normdata uri: {}", normDataUrl.toString());
                                    //                                    setParamValue(count, i, values, null, null, normDataUrl, groupType, locale);
                                }
                                setParamValue(count, i, values, param.getKey(), null, null, groupType, locale);
                            } else if (param.getDefaultValue() != null) {
                                logger.debug("No value found for {}, using default value", param.getKey());
                                setParamValue(0, i, Collections.singletonList(param.getDefaultValue()), param.getKey(), null, null, groupType,
                                        locale);
                                found = true;
                            } else {
                                setParamValue(count, i, Collections.singletonList(""), null, null, null, groupType, locale);
                            }
                        }
                        count++;
                    }
                } catch (PresentationException e) {
                    logger.debug("PresentationException thrown here: {}", e.getMessage());
                }
            }
        } else {
            // Regular, atomic metadata
            for (MetadataParameter param : params) {
                int count = 0;
                int indexOfParam = params.indexOf(param);
                //            logger.debug(params.toString());
                if (metadataMap.get(param.getKey()) == null) {
                    continue;
                }
                for (String mdValue : metadataMap.get(param.getKey())) {
                    //                logger.debug(param.toString() + " (" + indexOfParam + ")");
                    if (count >= number && number != -1) {
                        break;
                    }
                    found = true;
                    if (param.getKey().equals(SolrConstants.DATECREATED)) {
                        DateFormat dateFormatMetadata = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT,
                                FacesContext.getCurrentInstance().getViewRoot().getLocale());
                        mdValue = dateFormatMetadata.format(new Date(Long.valueOf(mdValue)));
                    } else if (param.getKey().equals(SolrConstants.DATEUPDATED)) {
                        DateFormat dateFormatMetadata = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT,
                                FacesContext.getCurrentInstance().getViewRoot().getLocale());
                        mdValue = dateFormatMetadata.format(new Date(Long.valueOf(mdValue)));
                    }
                    setParamValue(count, indexOfParam, Collections.singletonList(mdValue), param.getKey(), null, null, null, locale);
                    count++;
                }
                if (!found && param.getDefaultValue() != null) {
                    logger.debug("No value found for {}, using default value", param.getKey());
                    setParamValue(0, indexOfParam, Collections.singletonList(param.getDefaultValue()), param.getKey(), null, null, null, locale);
                    found = true;
                    count++;
                }
                if (param.getType().equals(MetadataParameterType.LINK_MAPS) && found) {
                    for (MetadataValue mdValue : this.getValues()) {
                        if (mdValue.getParamValues().size() < 2) {
                            mdValue.getParamValues().add(new ArrayList<>());
                            mdValue.getParamValues().get(0).add("");
                            mdValue.getParamValues().add(2, new ArrayList<>());
                            mdValue.getParamValues().get(2).add(0, param.getKey());
                        } else {
                            mdValue.getParamValues().get(2).add(0, param.getKey());
                        }
                    }

                    // logger.debug("populate theme: type="+param.getType() + " key=" +param.getKey() + "  count="+count );
                    found = true;
                    // setParamValue(count, getParams().indexOf(param), param.getKey());
                    count++;
                }
            }
        }

        return found;
    }

    /**
     * Converts aggregated person/corporation metadata to just the displayable name.
     *
     * @param aggregatedMetadata
     * @return
     */
    public static String getPersonDisplayName(String aggregatedMetadata) {
        if (aggregatedMetadata.contains(";")) {
            StringBuilder sb = new StringBuilder();
            String[] split = aggregatedMetadata.split(";");
            if (split.length != 0) {
                sb.append(split[0]);
                if (split.length > 1 && StringUtils.isNotEmpty(split[1])) {
                    sb.append(", " + split[1]);
                }
            }
            return sb.toString();
        }

        return aggregatedMetadata;
    }

    public int getNumber() {
        return number;
    }

    /**
     * @return the group
     */
    public boolean isGroup() {
        return group;
    }

    /**
     * Returns a metadata list that contains the fields of the given metadata list minus any language-specific fields that do not match the given
     * language.
     * 
     * @param metadataList
     * @param recordLanguage
     * @return Metadata list without any fields with non-matching language; original list if no language is given
     * @should return language-specific version of a field
     * @should return generic version if no language specific version is found
     * @should preserve metadata field order
     */
    public static List<Metadata> filterMetadataByLanguage(List<Metadata> metadataList, String recordLanguage) {
        // logger.trace("filterMetadataByLanguage: {}", recordLanguage);
        if (recordLanguage == null || metadataList == null || metadataList.isEmpty()) {
            return metadataList;
        }

        List<Metadata> ret = new ArrayList<>(metadataList);
        Set<String> addedLanguageSpecificFields = new HashSet<>();
        Set<Metadata> toRemove = new HashSet<>();
        String languageCode = recordLanguage.toUpperCase();
        for (Metadata md : metadataList) {
            if (md.getLabel().contains(SolrConstants._LANG_)) {
                String lang = md.getLabel().substring(md.getLabel().length() - 2);
                String rawFieldName = md.getLabel().substring(0, md.getLabel().length() - 8);
                // logger.trace("{}, {}", md.getLabel(), lang);
                if (languageCode.equals(lang)) {
                    addedLanguageSpecificFields.add(rawFieldName);
                } else {
                    // Mark wrong language versions for removal
                    toRemove.add(md);
                }
            }
        }
        // Mark non-language versions for removal, if a language-specific version has been found
        for (Metadata md : ret) {
            if (addedLanguageSpecificFields.contains(md.getLabel())) {
                toRemove.add(md);
            }
        }
        ret.removeAll(toRemove);

        return ret;
    }

    @Override
    public String toString() {
        if (values != null) {
            return "Label: " + label + " MasterValue: " + masterValue + " paramValues: " + values.get(0).getParamValues() + " ### ";

        }
        return "Label: " + label + " MasterValue: " + masterValue + " ### ";
    }
}
