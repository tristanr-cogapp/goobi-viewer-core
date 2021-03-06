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
package de.intranda.digiverso.presentation.servlets.rest.iiif.pdf;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.Provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.presentation.controller.Helper;
import de.unigoettingen.sub.commons.contentlib.servlet.model.iiif.PdfInformation;
import de.unigoettingen.sub.commons.contentlib.servlet.rest.ContentServerPdfInfoBinding;

@Provider
@ContentServerPdfInfoBinding
public class PdfInformationFilter implements ContainerResponseFilter {

    @SuppressWarnings("unused")
    private static final Logger logger = LoggerFactory.getLogger(PdfInformationFilter.class);

    @Context
    private HttpServletRequest servletRequest;

    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) throws IOException {

        Object content = response.getEntity();

        if (content != null && content instanceof PdfInformation) {
            PdfInformation info = (PdfInformation) content;
            if (info.getDiv() != null) {
                info.setDiv(Helper.getTranslation(info.getDiv(), null));
            }
        }
    }

    
}
