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
package de.intranda.digiverso.presentation.model.viewer.object;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * @author Florian Alpers
 *
 */
public class Object {
 
    
    private ObjectFormat type;
    private URI uri;
    private Point3D center = new Point3D(0, 0, 0);
    private Point3D rotation = new Point3D(0, 0, 0);
    private double distance = 0;
    
    public Object(URI uri) {
        this.uri = uri;
        this.type = ObjectFormat.getByFileExtension(uri.toString().substring(uri.toString().lastIndexOf("/")));
        
    }
    
    /**
     * @param objectURI
     * @throws URISyntaxException 
     */
    public Object(String uri) throws URISyntaxException {
        this.uri = new URI(uri);
        this.type = ObjectFormat.getByFileExtension(uri.toString().substring(uri.toString().lastIndexOf("/")));

    }

    /**
     * @return the type
     */
    public ObjectFormat getType() {
        return type;
    }
    /**
     * @param type the type to set
     */
    public void setType(ObjectFormat type) {
        this.type = type;
    }
    /**
     * @return the uri
     */
    public URI getUri() {
        return uri;
    }
    /**
     * @param uri the uri to set
     */
    public void setUri(URI uri) {
        this.uri = uri;
    }
    /**
     * @return the center
     */
    public Point3D getCenter() {
        return center;
    }
    /**
     * @param center the center to set
     */
    public void setCenter(Point3D center) {
        this.center = center;
    }
    /**
     * @return the rotation
     */
    public Point3D getRotation() {
        return rotation;
    }
    /**
     * @param rotation the rotation to set
     */
    public void setRotation(Point3D rotation) {
        this.rotation = rotation;
    }
    
    
    

}
