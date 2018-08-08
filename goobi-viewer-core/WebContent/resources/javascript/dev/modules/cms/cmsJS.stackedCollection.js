/**
 * This file is part of the Goobi viewer - a content presentation and management
 * application for digitized objects.
 * 
 * Visit these websites for more information. - http://www.intranda.com -
 * http://digiverso.com
 * 
 * This program is free software; you can redistribute it and/or modify it under the terms
 * of the GNU General Public License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this
 * program. If not, see <http://www.gnu.org/licenses/>.
 * 
 * Module which renders collections as an accordion view.
 * 
 * @version 3.2.0
 * @module cmsJS.stackedCollection
 * @requires jQuery
 */
var cmsJS = ( function( cms ) {
    'use strict';
    
    // variables
    var _debug = true;
    var _toggleAttr = false;
    var _defaults = {
        collectionsSelector: '.tpl-stacked-collection__collections',
        collectionDefaultThumb: '',
        displayLanguage: 'de',
        msg: {
            noSubCollectionText: ''
        }
    };
    
    cms.stackedCollection = {
        /**
         * Method which initializes the RSS Feed.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {Object} data An data object which contains the images sources for the
         * grid.
         */
        init: function( config, data ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.stackedCollections.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.stackedCollections.init: config - ', config );
                console.log( 'cmsJS.stackedCollections.init: data - ', data );
            }
            
            $.extend( true, _defaults, config );
            
            // render RSS Feed
            _renderCollections( data );
        },
    
        readIIIFPresentationStringValue: function(element, locale) {
            return _getValue(element, locale);
        }
    };
    
    /**
     * Method which renders the collection accordion.
     * 
     * @method _renderCollections
     * @param {Object} data The RSS information data object.
     */
    function _renderCollections( data ) {
        if ( _debug ) {
            console.log( '---------- _renderCollections() ----------' );
            console.log( '_renderCollections: data = ', data );
        }
        
        var counter = 0;
        
        // DOM elements
        var panelGroup = $( '<div />' ).attr( 'id', 'stackedCollections' ).attr( 'role', 'tablist' ).addClass( 'panel-group' );
        var panel = null;
        var panelHeading = null;
        var panelThumbnail = null;
        var panelThumbnailImage = null;
        var panelTitle = null;
        var panelTitleLink = null;
        var panelRSS = null;
        var panelRSSLink = null;
        var panelCollapse = null;
        var panelBody = null;
        
        // create members
        data.members.forEach( function( member ) {
            if(_debug) {                
                console.log("creationg collection ", member);
            }
            // increase counter
            counter++;
            // create panels
            panel = $( '<div />' ).addClass( 'panel' );

            // create panel title
            panelHeading = $( '<div />' ).addClass( 'panel-heading' );
            panelTitle = $( '<h4 />' ).addClass( 'panel-title' );
            panelTitleLink = $( '<a />' ).text( _getValue(member.label, _defaults.displayLanguage) + ' (' + _getContainedWorks( member) + ')' );
            // check if subcollections exist
            if ( _getChildCollections( member) > 0 ) {
                panelTitleLink.attr( 'href', '#collapse-' + counter ).attr( 'role', 'button' ).attr( 'data-toggle', 'collapse' ).attr( 'data-parent', '#stackedCollections' )
                        .attr( 'aria-expanded', 'false' );
            }
            else {
                var viewerLink = _getRendering(member, "goobi viewer");
                if(viewerLink) {                    
                    panelTitleLink.attr( 'href', viewerLink[ '@id' ] );
                }
            }
            panelTitle.append( panelTitleLink );
            // create RSS link
            var rss = _getRelated(member, "Rss feed");
            if(rss) {                
                panelRSS = $( '<div />' ).addClass( 'panel-rss' );
                panelRSSLink = $( '<a />' ).attr( 'href', rss[ '@id' ] ).attr( 'target', '_blank' ).html( '<i class="fa fa-rss" aria-hidden="true"></i>' );
                panelRSS.append( panelRSSLink );
            }
            // create panel thumbnail if exist
            panelThumbnail = $( '<div />' ).addClass( 'panel-thumbnail' );
            if ( member.thumbnail ) {
                panelThumbnailImage = $( '<img />' ).attr( 'src', member.thumbnail['@id'] ).addClass( 'img-responsive' );
                panelThumbnail.append( panelThumbnailImage );
            }
            else {
                panelThumbnailImage = $( '<img />' ).attr( 'src', _defaults.collectionDefaultThumb ).addClass( 'img-responsive' );
                panelThumbnail.append( panelThumbnailImage );
            }
            // build title
            panelHeading.append( panelThumbnail ).append( panelTitle ).append( panelRSS );
            // create collapse
            panelCollapse = $( '<div />' ).attr( 'id', 'collapse-' + counter ).attr( 'role', 'tabpanel' ).attr( 'aria-expanded', 'false' ).addClass( 'panel-collapse collapse' );
            // create panel body
            panelBody = $( '<div />' ).addClass( 'panel-body' ).append( _renderSubCollections( member[ "@id" ] ) );
            // build collapse
            panelCollapse.append( panelBody );
            // build panel
            panel.append( panelHeading ).append( panelCollapse );
            // build panel group
            panelGroup.append( panel );
            
            $( _defaults.collectionsSelector ).append( panelGroup );
        } );
    }
    
    /**
     * Returns the collection's rendering element with the given label
     * 
     * @param collection
     * @param label
     * @returns the collection's rendering element with the given label
     */
    function _getRendering(collection, label) {
        if(collection.rendering) {
            if(Array.isArray(collection.rendering)) {                
                for(var index in collection.rendering) {
                    var rendering = collection.rendering[index];
                    if(rendering.label == label) {
                        return rendering;
                    }
                }
            } else {
                return collection.rendering;
            }
        }
    }
    
    /**
     * Returns the collection's related element with the given label
     * 
     * @param collection
     * @param label
     * @returns the collection's related element with the given label
     */
    function _getRelated(collection, label) {
        if(collection.related) {
            if(Array.isArray(collection.related)) {                
                for(var index in collection.related) {
                    var related = collection.related[index];
                    if(related.label == label) {
                        return related;
                    }
                }
            } else {
                return collection.related;
            }
        }
    }
    
    /**
     * Returns the number of subcollections of a given iiif collection json element
     * The number is based in the service defined by '<rest-url>/api/collections/extent/context.json'
     * If no matching service is available, 0 is returned
     * 
     * @param collection
     * @returns the number of subcollections of a given iiif collection json element
     */
    function _getChildCollections(collection) {
        if(collection.service && collection.service['@context'].endsWith('api/collections/extent/context.json')) {
             return collection.service.children;
        } else {
            return 0;
        }
    }
    
    /**
     * Returns the number of contained works of a given iiif collection json element
     * The number is based in the service defined by '<rest-url>/api/collections/extent/context.json'
     * If no matching service is available, 0 is returned
     *
     * @param collection
     * @returns the number of contained works of a given iiif collection json element
     */
    function _getContainedWorks(collection) {
        if(collection.service && collection.service['@context'].endsWith('api/collections/extent/context.json')) {
            return collection.service.containedWorks;
        } else {
            return 0;
        }
    }
    
    
    
    /**
     * parses the given element to return the appropriate String value for the given language.
     * If the given element is a String itself, that String is returned, if it is a single object, the property @value 
     * is returned, if it is an array of Strings, the first String is returned, if it is an array of objects,
     * the @value property of the first object with an @language property equals to the given language is returned
     *  
     * @param element   The js property value to parse, either a String, an object with properties @value and @language or an array of either of those
     * @param language  The preferred language String as a two digit code
     * @returns         The most appropriate String value found
     */
    function _getValue(element, locale) {
        if(element) {
            if(typeof element === 'string') {
                return element;
            } else if (Array.isArray(element)) {
               var fallback;
                for (var index in element) {
                   var item = element[index];
                   if(typeof item === 'string') {
                       return item;
                   } else {
                       var value = item['@value'];
                       var language = item['@language'];
                       if(locale == language) {
                           return value;
                       } else if(!fallback || language == 'en') {
                           fallback = value;
                       }
                   }
               }
                return fallback;
            } else {
                return element['@value'];                
            }
        }
    }
    
    /**
     * Method to retrieve metadata value of the metadata object with the given label and
     * within the given collection object.
     * 
     * @param collection {Object} The iiif-presentation collection object cotaining the
     * metadata.
     * @param label {String} The label property value of the metadata to return.
     * @returns {String} The count of works in the collection.
     */
    function _getMetadataValue( collection, label) {
        if ( _debug ) {
            console.log( '---------- _getMetadataValue() ----------' );
            console.log( '_getMetadataValue: collection = ', collection );
            console.log( '_getMetadataValue: label = ', label );
        }
        
        var value = '';
        
        collection.metadata.forEach( function( metadata ) {
            if ( _getValue(metadata.label, _defaults.displayLanguage) == label ) {
                value = _getValue(metadata.value, _defaults.displayLanguage);
            }
        } );
        
        return value;
    }
    
    function _isCollection(element) {
        var type = element['@type'];
        var viewingHint = element.viewingHint;
        if(type == 'sc:Collection' && viewingHint != 'multi-part') {
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * Method which renders the subcollections.
     * 
     * @method _renderSubCollections
     * @param {String} url The URL to the API which fetches the subcollection data.
     * @returns {String} The HTML string of the subcollections.
     */
    function _renderSubCollections( url ) {
        if ( _debug ) {
            console.log( '---------- _renderSubCollections() ----------' );
            console.log( '_renderSubCollections: url = ', url );
        }
        
        // DOM elements
        var subCollections = $( '<ul />' ).addClass( 'list' );
        var subCollectionItem = null;
        var subCollectionItemLink = null;
        var subCollectionItemRSSLink = null;
        
        // get subcollection data
        $.ajax( {
            url: url,
            type: 'GET',
            datatype: 'JSON'
        } ).then( function( data ) {
            subCollectionItem = $( '<li />' );
            
            
            var members = [];
            if(data.members) {                
                for ( var index in data.members ) {
                    var member = data.members[index];
                    if(_isCollection(member)) {
                        members.push(member);
                    }
                }
            }
            
            if ( !$.isEmptyObject( members ) ) {
                // add subcollection items
                members.forEach( function( member ) {
                    subCollectionItemLink = $( '<a />' ).attr( 'href', _getRendering(member, "goobi viewer")[ '@id' ] ).addClass( 'panel-body__collection' ).text( _getValue(member.label, _defaults.displayLanguage) + ' ('
                            + _getContainedWorks( member) + ')' );
                    subCollectionItemRSSLink = $( '<a />' ).attr( 'href', _getRelated(member, "Rss feed")[ '@id' ] ).attr( 'target', '_blank' ).addClass( 'panel-body__rss' )
                            .html( '<i class="fa fa-rss" aria-hidden="true"></i>' );
                    // build subcollection item
                    subCollectionItem.append( subCollectionItemLink ).append( subCollectionItemRSSLink );
                    subCollections.append( subCollectionItem );
                } );
            }
            else {
//                console.log("rendering ", _getRendering(data, "goobi viewer"));
                // create empty item link
                subCollectionItemLink = $( '<a />' ).attr( 'href', _getRendering(data, "goobi viewer")[ '@id' ] ).text( _defaults.msg.noSubCollectionText + '.' );
                // build empty item
                subCollectionItem.append( subCollectionItemLink );
                subCollections.append( subCollectionItem );
            }
        } );
        
        return subCollections;
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
