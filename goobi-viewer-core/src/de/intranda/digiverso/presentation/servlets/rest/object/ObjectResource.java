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
 * You should have received a copy of the GNU General Public License along with this program; if not, write to the Free Software Foundation, Inc., 59
 * Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */
package de.intranda.digiverso.presentation.servlets.rest.object;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.StreamingOutput;

import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.lf5.util.StreamUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.intranda.digiverso.presentation.controller.DataManager;
import de.intranda.digiverso.presentation.exceptions.DAOException;
import de.intranda.digiverso.presentation.exceptions.PresentationException;
import de.intranda.digiverso.presentation.model.viewer.object.ObjectInfo;


/**
 * @author Florian Alpers
 *
 */

@Path("/view/object")
public class ObjectResource {

    private static final Logger logger = LoggerFactory.getLogger(ObjectResource.class);

    @GET
    @Path("/{pi}/{filename}/info.json")
    @Produces({ MediaType.APPLICATION_JSON })
    public ObjectInfo getInfo(@Context HttpServletRequest request, @Context HttpServletResponse response, @PathParam("pi") String pi, @PathParam("filename") String filename) throws PresentationException {

        response.addHeader("Access-Control-Allow-Origin", "*");

        String objectURI = request.getRequestURL().toString().replace("/info.json", "");
        String baseURI = objectURI.replace(filename, "");
        String baseFilename = FilenameUtils.getBaseName(filename);
        java.nio.file.Path mediaDirectory = Paths.get(DataManager.getInstance().getConfiguration().getViewerHome(), DataManager.getInstance().getConfiguration().getMediaFolder(), pi);


        try {
            List<URI> resourceURIs = getResources(mediaDirectory.toString(), baseFilename, baseURI);
            ObjectInfo info = new ObjectInfo(objectURI);
            info.setResources(resourceURIs);
            return info;
        } catch (IOException | URISyntaxException | InterruptedException e) {
            throw new PresentationException(e.getMessage(), e);
        }

    }

    /**
     * @param foldername
     * @param baseFilename
     * @param baseURI
     * @param process
     * @return 
     * @throws IOException
     * @throws InterruptedException
     * @throws SwapException
     * @throws DAOException
     * @throws URISyntaxException
     */
    private List<URI> getResources(String baseFolder, String baseFilename, String baseURI) throws IOException, InterruptedException,
            URISyntaxException {
        List<URI> resourceURIs = new ArrayList<>();

        java.nio.file.Path mtlFilePath = Paths.get(baseFolder, baseFilename + ".mtl");
        if(mtlFilePath.toFile().isFile()) {
            resourceURIs.add(new URI(baseURI + Paths.get(baseFolder).relativize(mtlFilePath)));
        }
        
        java.nio.file.Path resourceFolderPath = Paths.get(baseFolder, baseFilename);
        if (resourceFolderPath.toFile().isDirectory()) {
            try (DirectoryStream<java.nio.file.Path> directoryStream = Files.newDirectoryStream(resourceFolderPath)) {
                for (java.nio.file.Path path : directoryStream) {
                    resourceURIs.add(new URI(baseURI + resourceFolderPath.getParent().relativize(path)));
                }
            }
        }
        Collections.sort(resourceURIs);
        return resourceURIs;
    }

    @GET
    @Path("/{pi}/{filename}")
    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public StreamingOutput getObject(@Context HttpServletRequest request, @Context HttpServletResponse response,
            @PathParam("pi") String pi, @PathParam("filename") final String filename)
            throws IOException, InterruptedException {

        //        response.addHeader("Access-Control-Allow-Origin", "*");

        java.nio.file.Path mediaDirectory = Paths.get(DataManager.getInstance().getConfiguration().getViewerHome(), DataManager.getInstance().getConfiguration().getMediaFolder(), pi);
        java.nio.file.Path objectPath = mediaDirectory.resolve(filename);
        if (!objectPath.toFile().isFile()) {
            //try subfolders
            DirectoryStream.Filter<? super java.nio.file.Path> filter = new DirectoryStream.Filter<java.nio.file.Path>() {

                @Override
                public boolean accept(java.nio.file.Path entry) throws IOException {
                    return entry.endsWith(FilenameUtils.getBaseName(filename));
                }
                
            };
            
            try (DirectoryStream<java.nio.file.Path> folders = Files.newDirectoryStream(mediaDirectory, filter)) {
                for (java.nio.file.Path folder : folders) {
                    java.nio.file.Path filePath = folder.resolve(filename);
                    if(Files.isRegularFile(filePath)) {
                        return new ObjectStreamingOutput(filePath);
                    }
                }
            }
            
            throw new FileNotFoundException("File " + objectPath + " not found in file system");
        } else {
            return new ObjectStreamingOutput(objectPath);
        }
    }

    @GET
    @Path("/{pi}/{subfolder}/{filename}")
    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public StreamingOutput getObjectResource(@Context HttpServletRequest request, @Context HttpServletResponse response,
            @PathParam("pi") String pi, @PathParam("subfolder") String subfolder,
            @PathParam("filename") final String filename) throws IOException, InterruptedException {

        //        response.addHeader("Access-Control-Allow-Origin", "*");

        java.nio.file.Path mediaDirectory = Paths.get(DataManager.getInstance().getConfiguration().getViewerHome(), DataManager.getInstance().getConfiguration().getMediaFolder(), pi);
        java.nio.file.Path objectPath = mediaDirectory.resolve(subfolder).resolve(filename);
        if (!objectPath.toFile().isFile()) {
            throw new FileNotFoundException("File " + objectPath + " not found in file system");
        } else {
            return new ObjectStreamingOutput(objectPath);
        }
    }
    
    @GET
    @Path("/{pi}/{subfolder1}/{subfolder2}/{filename}")
    @Produces({ MediaType.APPLICATION_OCTET_STREAM })
    public StreamingOutput getObjectResource(@Context HttpServletRequest request, @Context HttpServletResponse response,
            @PathParam("pi") String pi, @PathParam("subfolder1") String subfolder1, @PathParam("subfolder2") String subfolder2,
            @PathParam("filename") String filename) throws IOException, InterruptedException {

        //        response.addHeader("Access-Control-Allow-Origin", "*");

        java.nio.file.Path mediaDirectory = Paths.get(DataManager.getInstance().getConfiguration().getViewerHome(), DataManager.getInstance().getConfiguration().getMediaFolder(), pi);
        java.nio.file.Path objectPath = mediaDirectory.resolve(subfolder1).resolve(subfolder2).resolve(filename);
        if (!objectPath.toFile().isFile()) {
            throw new FileNotFoundException("File " + objectPath + " not found in file system");
        } else {
            return new ObjectStreamingOutput(objectPath);
        }
    }

    public static class ObjectStreamingOutput implements StreamingOutput {

        private java.nio.file.Path filePath;

        public ObjectStreamingOutput(java.nio.file.Path filePath) {
            this.filePath = filePath;
        }

        @Override
        public void write(OutputStream output) throws IOException, WebApplicationException {
            try {
                try (InputStream inputStream = new java.io.FileInputStream(this.filePath.toString())) {
                    StreamUtils.copy(inputStream, output);
                    return;
                }
                //            } catch (LostConnectionException e) {
                //                logger.trace("aborted writing 3d object from  " + this.filePath);
            } catch (Throwable e) {
                throw new WebApplicationException(e);
            }

        }
    }
}
