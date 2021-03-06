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
package de.intranda.digiverso.presentation.servlets.rest;

import java.util.Collections;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.unigoettingen.sub.commons.contentlib.exceptions.ContentLibException;
import de.unigoettingen.sub.commons.contentlib.servlet.rest.ContentExceptionMapper;
import de.unigoettingen.sub.commons.contentlib.servlet.rest.ContentExceptionMapper.ErrorMessage;

/**
 * Catches general exceptions encountered during rest-api calls and creates an error response
 * 
 * @author Florian Alpers
 *
 */
@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {

    private static final Logger logger = LoggerFactory.getLogger(WebApplicationExceptionMapper.class);

    @Context
    HttpServletResponse response;
    @Context
    HttpServletRequest request;

    @Override
    public Response toResponse(WebApplicationException eParent) {
        Response.Status status = Status.INTERNAL_SERVER_ERROR;
        Throwable e = eParent.getCause();
        if(e == null) {
            e = eParent;
        }
        if (e instanceof NotFoundException) {
            status = Status.NOT_FOUND;
        } else if (e instanceof ContentLibException) {
            return new ContentExceptionMapper(request, response).toResponse((ContentLibException) e);
        } else if(e instanceof RuntimeException) {
            status = Status.INTERNAL_SERVER_ERROR;
            logger.error("Error on request {};\t ERROR MESSAGE: {}", request.getRequestURL() , e.getMessage());
        } else if(e instanceof PresentationException) {
            status = Status.INTERNAL_SERVER_ERROR;
            logger.error("Error on request {};\t ERROR MESSAGE: {}", request.getRequestURL() , e.getMessage());
        } else {
           //unknown error. Probably request error
           status = Status.BAD_REQUEST;
        }

        String mediaType = MediaType.APPLICATION_JSON;
        return Response.status(status).type(mediaType).entity(new ErrorMessage(status, e, true)).build();
    }

    /**
     * @return
     */
    public String getRequestHeaders() {
        String headers = Collections.list(request.getHeaderNames()).stream()
        .collect(Collectors.toMap(headerName -> headerName, headerName -> request.getHeader(headerName)))
        .entrySet().stream()
        .map(entry -> entry.getKey() + ": " + entry.getValue())
        .collect(Collectors.joining("; "));
        return headers;
    }

}