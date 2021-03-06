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
package de.intranda.digiverso.presentation.model.viewer;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * @author Florian Alpers
 *
 */
public class CompoundLabeledLink extends LabeledLink {

    protected final List<String> subItems;

    /**
     * 
     */
    private static final long serialVersionUID = 2336154265426936610L;

    /**
     * @param name
     * @param url
     * @param weight
     */
    public CompoundLabeledLink(String name, String url, int weight) {
        super(name, url, weight);
        this.subItems = Collections.emptyList();
    }

    public CompoundLabeledLink(String name, String url, List<String> subItems, int weight) {
        super(name, url, weight);
        this.subItems = subItems;
    }

    public List<LabeledLink> getSubLinks() {
        List<LabeledLink> links = new ArrayList<>();
        for (String string : subItems) {
            // TODO write correct url
            LabeledLink link = new LabeledLink(string, url.replace("{value}", string), 0);
            links.add(link);
        }
        return links;
    }

}
