/*!
 * This file is part of the Goobi viewer - a content presentation and management application for digitized objects.
 *
 * Visit these websites for more information.
 * - http://www.intranda.com
 * - http://digiverso.com
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
 */var viewerJS = ( function() {
    'use strict';
    
    var _debug = false;
    var _defaults = {
        currentPage: '',
        browser: '',
        sidebarSelector: '#sidebar',
        contentSelector: '#main',
        equalHeightRSSInterval: 1000,
        equalHeightInterval: 500,
        messageBoxSelector: '.messages .alert',
        messageBoxInterval: 1000,
        messageBoxTimeout: 8000,
        pageScrollSelector: '.icon-totop',
        pageScrollAnchor: '#top',
        widgetNerSidebarRight: false
    };
    
    var viewer = {};
    
    viewer.init = function( config ) {
        if ( _debug ) {
            console.log( '##############################' );
            console.log( 'viewer.init' );
            console.log( '##############################' );
            console.log( 'viewer.init: config - ', config );
        }
        
        $.extend( true, _defaults, config );
        
        // detect current browser
        _defaults.browser = viewerJS.helper.getCurrentBrowser();
        
        console.info( 'Current Page = ', _defaults.currentPage );
        console.info( 'Current Browser = ', _defaults.browser );
        
        /*
         * ! IE10 viewport hack for Surface/desktop Windows 8 bug Copyright 2014-2015
         * Twitter, Inc. Licensed under MIT
         * (https://github.com/twbs/bootstrap/blob/master/LICENSE)
         */

        // See the Getting Started docs for more information:
        // http://getbootstrap.com/getting-started/#support-ie10-width
        ( function() {
            'use strict';
            
            if ( navigator.userAgent.match( /IEMobile\/10\.0/ ) ) {
                var msViewportStyle = document.createElement( 'style' )
                msViewportStyle.appendChild( document.createTextNode( '@-ms-viewport{width:auto!important}' ) )
                document.querySelector( 'head' ).appendChild( msViewportStyle )
            }
        } )();
        
        // enable BS tooltips
        $( '[data-toggle="tooltip"]' ).tooltip();
        
        // render warning if local storage is not useable
        if ( !viewer.localStoragePossible ) {
            var warningPopover = this.helper
                    .renderWarningPopover( 'Ihr Browser befindet sich im privaten Modus und unterstützt momentan nicht die Möglichkeit Daten lokal zu speichern. Aus diesem Grund sind nicht alle Funktionenn des viewers verfügbar. Bitte verlasen Sie den privaten Modus oder benutzen einen alternativen Browser. Vielen Dank.' );
            
            $( 'body' ).append( warningPopover );
            
            $( '[data-toggle="warning-popover"]' ).on( 'click', function() {
                $( '.warning-popover' ).fadeOut( 'fast', function() {
                    $( '.warning-popover' ).remove();
                } );
            } );
        }
        
        // off canvas
        $( '[data-toggle="offcanvas"]' ).click( function() {
            var icon = $( this ).children( '.glyphicon' );
            
            $( '.row-offcanvas' ).toggleClass( 'active' );
            $( this ).toggleClass( 'in' );
            
            if ( icon.hasClass( 'glyphicon-option-vertical' ) ) {
                icon.removeClass( 'glyphicon-option-vertical' ).addClass( 'glyphicon-option-horizontal' );
            }
            else {
                icon.removeClass( 'glyphicon-option-horizontal' ).addClass( 'glyphicon-option-vertical' );
            }
        } );
        
        // toggle mobile navigation
        $( '[data-toggle="mobilenav"]' ).on( 'click', function() {
            $( '.btn-toggle.search' ).removeClass( 'in' );
            $( '.header-actions__search' ).hide();
            $( '.btn-toggle.language' ).removeClass( 'in' );
            $( '#changeLocal' ).hide();
            $( '#mobileNav' ).slideToggle( 'fast' );
        } );
        
        // toggle language
        $( '[data-toggle="language"]' ).on( 'click', function() {
            $( '.btn-toggle.search' ).removeClass( 'in' );
            $( '.header-actions__search' ).hide();
            $( this ).toggleClass( 'in' );
            $( '#changeLocal' ).fadeToggle( 'fast' );
        } );
        
        // toggle search
        $( '[data-toggle="search"]' ).on( 'click', function() {
            $( '.btn-toggle.language' ).removeClass( 'in' );
            $( '#changeLocal' ).hide();
            $( this ).toggleClass( 'in' );
            $( '.header-actions__search' ).fadeToggle( 'fast' );
        } );
        
        // set content height to sidebar height
        if ( window.matchMedia( '(max-width: 768px)' ).matches ) {
            if ( $( '.rss_wrapp' ).length > 0 ) {
                setTimeout( function() {
                    viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                }, _defaults.equalHeightRSSInterval );
            }
            else {
                setTimeout( function() {
                    viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                }, _defaults.equalHeightInterval );
            }
            $( window ).on( "orientationchange", function() {
                viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
            } );
        }
        
        // fade out message box if it exists
        ( function() {
            var fadeoutScheduled = false;
            
            setInterval( function() {
                if ( $( _defaults.messageBoxSelector ).size() > 0 ) {
                    if ( !fadeoutScheduled ) {
                        fadeoutScheduled = true;
                        var messageTimer = setTimeout( function() {
                            $( _defaults.messageBoxSelector ).each( function() {
                                $( this ).fadeOut( 'slow', function() {
                                    $( this ).parent().remove();
                                } )
                            } );
                            
                            fadeoutScheduled = false;
                        }, _defaults.messageBoxTimeout );
                    }
                }
            }, _defaults.messageBoxInterval );
        } )();
        
        // add class on toggle sidebar widget (CMS individual sidebar widgets)
        $( '.collapse' ).on( 'show.bs.collapse', function() {
            $( this ).prev().find( '.glyphicon' ).removeClass( 'glyphicon-arrow-down' ).addClass( 'glyphicon-arrow-up' );
        } );
        
        $( '.collapse' ).on( 'hide.bs.collapse', function() {
            $( this ).prev().find( '.glyphicon' ).removeClass( 'glyphicon-arrow-up' ).addClass( 'glyphicon-arrow-down' );
        } );
        
        // scroll page animated
        this.pageScroll.init( _defaults.pageScrollSelector, _defaults.pageScrollAnchor );
        
        // check for sidebar toc and set viewport position
        if ( viewer.localStoragePossible ) {
            if ( $( '#image_container' ).length > 0 || currentPage === 'readingmode' ) {
                if ( localStorage.getItem( 'currIdDoc' ) === null ) {
                    localStorage.setItem( 'currIdDoc', 'false' );
                }
                
                this.helper.saveSidebarTocPosition();
            }
            else {
                localStorage.setItem( 'sidebarTocScrollPosition', 0 );
            }
        }
        
        // AJAX Loader Eventlistener
        if ( typeof jsf !== 'undefined' ) {
            jsf.ajax.addOnEvent( function( data ) {
                var ajaxstatus = data.status;
                var ajaxloader = document.getElementById( "AJAXLoader" );
                var ajaxloaderSidebarToc = document.getElementById( "AJAXLoaderSidebarToc" );
                
                if ( ajaxloaderSidebarToc && ajaxloader ) {
                    switch ( ajaxstatus ) {
                        case "begin":
                            ajaxloaderSidebarToc.style.display = 'block';
                            ajaxloader.style.display = 'none';
                            break;
                        
                        case "complete":
                            ajaxloaderSidebarToc.style.display = 'none';
                            ajaxloader.style.display = 'none';
                            break;
                        
                        case "success":
                            // enable BS tooltips
                            $( '[data-toggle="tooltip"]' ).tooltip();
                            
                            if ( viewer.localStoragePossible ) {
                                viewer.helper.saveSidebarTocPosition();
                                
                                $( '.widget-toc-elem-wrapp' ).scrollTop( localStorage.sidebarTocScrollPosition );
                            }
                            // set content height to sidebar height
                            if ( window.matchMedia( '(max-width: 768px)' ).matches ) {
                                viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                                
                                $( window ).off().on( "orientationchange", function() {
                                    viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                                } );
                            }
                            break;
                    }
                }
                else if ( ajaxloader ) {
                    switch ( ajaxstatus ) {
                        case "begin":
                            ajaxloader.style.display = 'block';
                            break;
                        
                        case "complete":
                            ajaxloader.style.display = 'none';
                            break;
                        
                        case "success":
                            // enable BS tooltips
                            $( '[data-toggle="tooltip"]' ).tooltip();
                            
                            // set content height to sidebar height
                            if ( window.matchMedia( '(max-width: 768px)' ).matches ) {
                                viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                                
                                $( window ).off().on( "orientationchange", function() {
                                    viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                                } );
                            }
                            break;
                    }
                }
                else {
                    switch ( ajaxstatus ) {
                        case "success":
                            // enable BS tooltips
                            $( '[data-toggle="tooltip"]' ).tooltip();
                            
                            // set content height to sidebar height
                            if ( window.matchMedia( '(max-width: 768px)' ).matches ) {
                                viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                                
                                $( window ).off().on( "orientationchange", function() {
                                    viewerJS.helper.equalHeight( _defaults.sidebarSelector, _defaults.contentSelector );
                                } );
                            }
                            break;
                    }
                }
            } );
        }
        
        // disable submit button on feedback
        if ( currentPage === 'feedback' ) {
            $( '#submitFeedbackBtn' ).attr( 'disabled', true );
        }
        
        // set sidebar position for NER-Widget
        if ( $( '#widgetNerFacetting' ).length > 0 ) {
            nerFacettingConfig.sidebarRight = _defaults.widgetNerSidebarRight;
            this.nerFacetting.init( nerFacettingConfig );
        }
        
        // make sure only integer values may be entered in input fields of class
        // 'input-integer'
        $( '.input-integer' ).on( "keypress", function( event ) {
            if ( event.which < 48 || event.which > 57 ) {
                return false;
            }
        } );
        
        // set tinymce language
        this.tinyConfig.language = currentLang;
        
        if ( currentPage === 'adminCmsCreatePage' ) {
            this.tinyConfig.setup = function( ed ) {
                // listen to changes on tinymce input fields
                ed.on( 'change input paste', function( e ) {
                    tinymce.triggerSave();
                    createPageConfig.prevBtn.attr( 'disabled', true );
                    createPageConfig.prevDescription.show();
                } );
            };
            // TODO: Für ZLB in der custom.js einbauen
            // viewerJS.tinyConfig.textcolor_map = [ "FFFFFF", "ZLB-Weiß", "333333",
            // "ZLB-Schwarz", "dedede", "ZLB-Hellgrau", "727c87", "ZLB-Mittelgrau",
            // "9a9a9a", "ZLB-Dunkelgrau",
            // "CD0000", "ZLB-Rot", "92406d", "ZLB-Lila", "6f2c40", "ZLB-Bordeaux",
            // "ffa100", "ZLB-Orange", "669933", "ZLB-Grün", "3e5d1e", "ZLB-Dunkelgrün",
            // "a9d0f5",
            // "ZLB-Hellblau", "28779f", "ZLB-Blau" ];
        }
        
        if ( currentPage === 'overview' ) {
            // activate menubar
            viewerJS.tinyConfig.menubar = true;
            viewerJS.tinyMce.overview();
        }
        
        // AJAX Loader Eventlistener for tinyMCE
        if ( typeof jsf !== 'undefined' ) {
            jsf.ajax.addOnEvent( function( data ) {
                var ajaxstatus = data.status;
                
                switch ( ajaxstatus ) {
                    case "success":
                        if ( currentPage === 'overview' ) {
                            viewerJS.tinyMce.overview();
                        }
                        
                        viewerJS.tinyMce.init( viewerJS.tinyConfig );
                        break;
                }
            } );
        }
        
        // init tinymce if it exists
        if ( $( '.tinyMCE' ).length > 0 ) {
            viewerJS.tinyMce.init( this.tinyConfig );
        }
        
        // handle browser bugs
        switch ( _defaults.browser ) {
            case 'Chrome':
                /* BROKEN IMAGES */
                $( 'img' ).error( function() {
                    $( this ).addClass( 'broken' );
                } );
                break;
            case 'Firefox':
                /* BROKEN IMAGES */
                $( "img" ).error( function() {
                    $( this ).hide();
                } );
                /* 1px BUG */
                if ( $( '.image-doublePageView' ).length > 0 ) {
                    $( '.image-doublePageView' ).addClass( 'oneUp' );
                }
                break;
            case 'IE':
                /* BROKEN IMAGES */
                $( "img" ).error( function() {
                    $( this ).hide();
                } );
                break;
            case 'Edge':
                /* BROKEN IMAGES */
                $( "img" ).error( function() {
                    $( this ).hide();
                } );
                break;
            case 'Safari':
                /* BROKEN IMAGES */
                $( "img" ).error( function() {
                    $( this ).hide();
                } );
                break;
        }
    };
    
    // global object for tinymce config
    viewer.tinyConfig = {};
    
    return viewer;
    
} )( jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _this = null;
    var _currApiCall = '';
    var _json = {};
    var _popoverConfig = {};
    var _popoverContent = null;
    var _defaults = {
        appUrl: '',
        calendarWrapperSelector: '.search-calendar__months',
        popoverTriggerSelector: '[data-popover-trigger="calendar-po-trigger"]',
        popoverTitle: 'Bitte übergeben Sie den Titel des Werks',
    };
    
    viewer.calendarPopover = {
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.calendarPopover.init' );
                console.log( '##############################' );
                console.log( 'viewer.calendarPopover.init: config - ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // TODO: Fehlermeldung in der Konsole beseitigen, wenn man auf den Tag ein
            // zweites Mal klickt.
            
            // show popover for current day
            $( _defaults.popoverTriggerSelector ).on( 'click', function() {
                _this = $( this );
                _currApiCall = encodeURI( _this.attr( 'data-api' ) );
                
                viewerJS.helper.getRemoteData( _currApiCall ).done( function( _json ) {
                    _popoverContent = _getPopoverContent( _json, _defaults );
                    _popoverConfig = {
                        placement: 'auto bottom',
                        title: _defaults.popoverTitle,
                        content: _popoverContent,
                        viewport: {
                            selector: _defaults.calendarWrapperSelector
                        },
                        html: true
                    };
                    
                    $( _defaults.popoverTriggerSelector ).popover( 'destroy' );
                    _this.popover( _popoverConfig );
                    _this.popover( 'show' );
                } );
            } );
            
            // remove all popovers by clicking on body
            $( 'body' ).on( 'click', function( event ) {
                if ( $( event.target ).closest( _defaults.popoverTriggerSelector ).length ) {
                    return;
                }
                else {
                    $( _defaults.popoverTriggerSelector ).popover( 'destroy' );
                }
            } );
        }
    };
    
    /**
     * Method to render the popover content.
     * 
     * @method _getPopoverContent
     * @param {Object} data A JSON-Object which contains the necessary data.
     * @param {Object} config The config object of the module.
     * @returns {String} The HTML-String of the popover content.
     */
    function _getPopoverContent( data, config ) {
        if ( _debug ) {
            console.log( '---------- _getPopoverContent() ----------' );
            console.log( '_getPopoverContent: data = ', data );
            console.log( '_getPopoverContent: config = ', config );
        }
        
        var workList = '';
        var workListLink = '';
        
        workList += '<ul class="list">';
        
        $.each( data, function( works, values ) {
            workListLink = config.appUrl + 'image/' + values.PI_TOPSTRUCT + '/' + values.THUMBPAGENO + '/' + values.LOGID + '/';
            
            workList += '<li>';
            workList += '<a href="' + workListLink + '">';
            workList += values.LABEL;
            workList += '</a>';
            workList += '</li>';
        } );
        
        workList += '</ul>';
        
        return workList;
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _parsedFontSize = 0;
    var _currFontSize = '';
    var _defaults = {
        fontDownBtn: '',
        fontUpBtn: '',
        maxFontSize: 18,
        minFontSize: 12,
        baseFontSize: '14px'
    };
    
    viewer.changeFontSize = {
        /**
         * Method which initializes the font size switcher.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.fontDownBtn The ID/Class of the font degrade button.
         * @param {String} config.fontUpBtn The ID/Class of the font upgrade button.
         * @param {String} config.maxFontSize The maximum font size the document should
         * scale up.
         * @param {String} config.minFontSize The minimum font size the document should
         * scale down.
         * @param {String} config.baseFontSize The base font size of the HTML-Element.
         * @example
         * 
         * <pre>
         * var changeFontSizeConfig = {
         *     fontDownBtn: '#fontSizeDown',
         *     fontUpBtn: '#fontSizeUp',
         *     maxFontSize: 18,
         *     minFontSize: 14
         * };
         * 
         * viewerJS.changeFontSize.init( changeFontSizeConfig );
         * </pre>
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.changeFontSize.init' );
                console.log( '##############################' );
                console.log( 'viewer.changeFontSize.init: config - ' );
                console.log( config );
            }
            
            $.extend( true, _defaults, config );
            
            if ( viewer.localStoragePossible ) {
                // set current font-size
                _setFontSize();
                
                // set button state
                _setButtonState();
                
                $( _defaults.fontDownBtn ).on( 'click', function() {
                    // set current font-size
                    _currFontSize = $( 'html' ).css( 'font-size' );
                    
                    // save font-size
                    _saveFontSize( _currFontSize );
                    
                    // parse number of font-size
                    _parsedFontSize = _parseFontSize( _currFontSize );
                    
                    // degrade font-size
                    _degradeFontSize( _parsedFontSize );
                } );
                
                $( _defaults.fontUpBtn ).on( 'click', function() {
                    // set current font-size
                    _currFontSize = $( 'html' ).css( 'font-size' );
                    
                    // save font-size
                    _saveFontSize( _currFontSize );
                    
                    // parse number of font-size
                    _parsedFontSize = _parseFontSize( _currFontSize );
                    
                    // raise font-size
                    _raiseFontSize( _parsedFontSize );
                } );
            }
        }
    };
    
    /**
     * Method to degrade the page font-size.
     * 
     * @method _degradeFontSize
     * @param {Number} current The current font-size of the HTML-Element.
     */
    function _degradeFontSize( current ) {
        if ( _debug ) {
            console.log( '---------- _degradeFontSize() ----------' );
            console.log( '_degradeFontSize: current = ', current );
        }
        
        var size = current;
        size--;
        
        if ( size >= _defaults.minFontSize ) {
            $( _defaults.fontDownBtn ).prop( 'disabled', false );
            $( _defaults.fontUpBtn ).prop( 'disabled', false );
            $( 'html' ).css( 'font-size', size + 'px' );
            
            // save font-size
            _saveFontSize( size + 'px' );
        }
        else {
            $( _defaults.fontDownBtn ).prop( 'disabled', true );
            $( _defaults.fontUpBtn ).prop( 'disabled', false );
        }
    }
    
    /**
     * Method to raise the page font-size.
     * 
     * @method _raiseFontSize
     * @param {Number} current The current font-size of the HTML-Element.
     */
    function _raiseFontSize( current ) {
        if ( _debug ) {
            console.log( '---------- _raiseFontSize() ----------' );
            console.log( '_raiseFontSize: current = ', current );
        }
        
        var size = current;
        size++;
        
        if ( size <= _defaults.maxFontSize ) {
            $( _defaults.fontDownBtn ).prop( 'disabled', false );
            $( _defaults.fontUpBtn ).prop( 'disabled', false );
            $( 'html' ).css( 'font-size', size + 'px' );
            
            // save font-size
            _saveFontSize( size + 'px' );
        }
        else {
            $( _defaults.fontDownBtn ).prop( 'disabled', false );
            $( _defaults.fontUpBtn ).prop( 'disabled', true );
        }
    }
    
    /**
     * Method which parses a given pixel value to a number and returns it.
     * 
     * @method _parseFontSize
     * @param {String} string The string to parse.
     */
    function _parseFontSize( string ) {
        if ( _debug ) {
            console.log( '---------- _parseFontSize() ----------' );
            console.log( '_parseFontSize: string = ', string );
        }
        
        return parseInt( string.replace( 'px' ) );
    }
    
    /**
     * Method to save the current font-size to local storage as a string.
     * 
     * @method _saveFontSize
     * @param {String} size The String to save in local storage.
     */
    function _saveFontSize( size ) {
        if ( _debug ) {
            console.log( '---------- _saveFontSize() ----------' );
            console.log( '_parseFontSize: size = ', size );
        }
        
        localStorage.setItem( 'currentFontSize', size );
    }
    
    /**
     * Method to set the current font-size from local storage to the HTML-Element.
     * 
     * @method _setFontSize
     */
    function _setFontSize() {
        if ( _debug ) {
            console.log( '---------- _setFontSize() ----------' );
        }
        var fontSize = localStorage.getItem( 'currentFontSize' );
        
        if ( fontSize === null || fontSize === '' ) {
            localStorage.setItem( 'currentFontSize', _defaults.baseFontSize );
        }
        else {
            $( 'html' ).css( 'font-size', fontSize );
        }
        
    }
    
    /**
     * Method to set the state of the font-size change buttons.
     * 
     * @method _setButtonState
     */
    function _setButtonState() {
        if ( _debug ) {
            console.log( '---------- _setButtonState() ----------' );
        }
        var fontSize = localStorage.getItem( 'currentFontSize' );
        var newFontSize = _parseFontSize( fontSize );
        
        if ( newFontSize === _defaults.minFontSize ) {
            $( _defaults.fontDownBtn ).prop( 'disabled', true );
        }
        
        if ( newFontSize === _defaults.maxFontSize ) {
            $( _defaults.fontUpBtn ).prop( 'disabled', true );
        }
        
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _dataTablePaginator = null;
    var _txtField1 = null;
    var _txtField2 = null;
    var _totalCount = null;
    var _reloadBtn = null;
    var _defaults = {
        dataTablePaginator: '',
        txtField1: '',
        txtField2: '',
        totalCount: '',
        reloadBtn: '',
    };
    
    viewer.dataTable = {
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.dataTable.init' );
                console.log( '##############################' );
                console.log( 'viewer.dataTable.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            viewer.dataTable.paginator.init();
            
            if ( $( '.column-filter-wrapper' ).length > 0 ) {
                viewer.dataTable.filter.init();
            }
        },
        /**
         * Pagination
         */
        paginator: {
            setupAjax: false,
            init: function() {
                if ( _debug ) {
                    console.log( '---------- dataTable.paginator.init() ----------' );
                }
                
                _dataTablePaginator = $( _defaults.dataTablePaginator );
                _txtField1 = $( _defaults.txtField1 );
                _txtField2 = $( _defaults.txtField2 );
                _totalCount = $( _defaults.totalCount );
                _reloadBtn = $( _defaults.reloadBtn );
                
                _txtField1.on( 'click', function() {
                    $( this ).hide();
                    viewer.dataTable.paginator.inputFieldHandler();
                } );
                
                _totalCount.on( 'click', function() {
                    _txtField1.hide();
                    viewer.dataTable.paginator.inputFieldHandler();
                } );
                
                /*
                 * AJAX Eventlistener
                 */
                if ( !this.setupAjax ) {
                    jsf.ajax.addOnEvent( function( data ) {
                        var ajaxstatus = data.status;
                        
                        if ( _defaults.dataTablePaginator.length > 0 ) {
                            switch ( ajaxstatus ) {
                                case "begin":
                                    if ( _txtField1 !== null && _txtField2 !== null ) {
                                        _txtField1.off();
                                        _txtField2.off();
                                    }
                                    break;
                                case "complete":
                                    break;
                                case "success":
                                    viewer.dataTable.paginator.init();
                                    break;
                            }
                        }
                    } );
                    this.setupAjax = true;
                }
            },
            inputFieldHandler: function() {
                if ( _debug ) {
                    console.log( '---------- dataTable.paginator.inputFieldHandler() ----------' );
                }
                
                _txtField2.show().find( 'input' ).focus().select();
                
                _txtField2.find( 'input' ).on( 'blur', function() {
                    $( this ).hide();
                    _txtField1.show();
                    _reloadBtn.click();
                } );
                
                _txtField2.find( 'input' ).on( 'keypress', function( event ) {
                    if ( event.keyCode == 13 ) {
                        _reloadBtn.click();
                    }
                    else {
                        return;
                    }
                } );
            },
        },
        /**
         * Filter
         */
        filter: {
            setupAjax: false,
            init: function() {
                if ( _debug ) {
                    console.log( '---------- dataTable.filter.init() ----------' );
                }
                
                $( '#adminAllUserForm' ).on( 'submit', function( event ) {
                    event.preventDefault();
                    
                    $( '.column-filter-wrapper' ).find( '.btn-filter' ).click();
                } );
                
                /*
                 * AJAX Eventlistener
                 */
                if ( !this.setupAjax ) {
                    jsf.ajax.addOnEvent( function( data ) {
                        var ajaxstatus = data.status;
                        
                        if ( _defaults.dataTablePaginator.length > 0 ) {
                            switch ( ajaxstatus ) {
                                case "begin":
                                    break;
                                case "complete":
                                    break;
                                case "success":
                                    viewer.dataTable.filter.init();
                                    break;
                            }
                        }
                    } );
                    this.setupAjax = true;
                }
            },
        },
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _promise = null;
    var _defaults = {
        path: null,
        dataSortOrder: null,
        dataCount: null,
        dataEncoding: null,
        feedBox: null,
        monthNames: [ '', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember' ]
    };
    
    viewer.dateSortedFeed = {
        /**
         * Method which initializes the date sorted RSS-Feed.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.path The rootpath of the application.
         * @param {Object} config.feedBox An jQuery object of the wrapper DIV.
         * @example
         * 
         * <pre>
         * var dateSortedFeedConfig = {
         *     path: '#{request.contextPath}',
         *     feedBox: $( '#dateSortedFeed' )
         * };
         * 
         * viewerJS.dateSortedFeed.setDataSortOrder( '#{cc.attrs.sorting}' );
         * viewerJS.dateSortedFeed.setDataCount( '#{cc.attrs.count}' );
         * viewerJS.dateSortedFeed.setDataEncoding( '#{cc.attrs.encoding}' );
         * viewerJS.dateSortedFeed.init( dateSortedFeedConfig );
         * </pre>
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.dateSortedFeed.init' );
                console.log( '##############################' );
                console.log( 'viewer.dateSortedFeed.init: feedBoxObj - ' + feedBoxObj );
                console.log( 'viewer.dateSortedFeed.init: path - ' + path );
            }
            
            $.extend( true, _defaults, config );
            
            var dataURL = _defaults.path;
            dataURL += '/api?action=query&q=PI:*&jsonFormat=datecentric&sortField=DATECREATED';
            dataURL += '&sortOrder=';
            dataURL += _defaults.dataSortOrder;
            dataURL += '&count=';
            dataURL += _defaults.dataCount;
            dataURL += '&encoding=';
            dataURL += _defaults.dataEncoding;
            
            if ( _debug ) {
                console.log( 'viewer.dateSortedFeed.init: dataURL - ' + dataURL );
            }
            
            // checking for feedbox element and render feed
            if ( _defaults.feedBox ) {
                _promise = viewer.helper.getRemoteData( dataURL );
                
                _promise.then( function( data ) {
                    _renderFeed( data );
                } ).then( null, function() {
                    console.error( 'ERROR: viewer.dateSortedFeed.init - ', error );
                } );
            }
            else {
                return;
            }
        },
        /**
         * Returns the sorting order of the feed.
         * 
         * @method getDataSortOrder
         * @returns {String} The sorting order.
         * 
         */
        getDataSortOrder: function() {
            return _defaults.dataSortOrder;
        },
        /**
         * Sets the sorting order of the feed.
         * 
         * @method getDataSortOrder
         * @param {String} str The sorting order (asc/desc)
         * 
         */
        setDataSortOrder: function( str ) {
            _defaults.dataSortOrder = str;
        },
        /**
         * Returns the number of entries from the feed.
         * 
         * @method getDataSortOrder
         * @returns {String} The number of entries.
         * 
         */
        getDataCount: function() {
            return _defaults.dataCount;
        },
        /**
         * Sets the number of entries from the feed.
         * 
         * @method setDataCount
         * @param {String} The number of entries.
         * 
         */
        setDataCount: function( num ) {
            _defaults.dataCount = num;
        },
        /**
         * Returns the type of encoding.
         * 
         * @method getDataEncoding
         * @returns {String} The type of encoding.
         * 
         */
        getDataEncoding: function() {
            return _defaults.dataEncoding;
        },
        /**
         * Sets the type of encoding.
         * 
         * @method setDataEncoding
         * @param {String} The type of encoding.
         * 
         */
        setDataEncoding: function( str ) {
            _defaults.dataEncoding = str;
        }
    };
    
    /**
     * Renders the feed and appends it to the wrapper.
     * 
     * @method _renderFeed
     * @param {Object} data An JSON object of the feed data.
     * 
     */
    function _renderFeed( data ) {
        var feed = '';
        $.each( data, function( i, j ) {
            feed += '<h4>' + _dateConverter( j.date ) + '</h4>';
            $.each( j, function( m, n ) {
                if ( n.title ) {
                    for ( var x = 0; x <= n.title.length; x++ ) {
                        if ( n.title[ x ] !== undefined ) {
                            feed += '<div class="sorted-feed-title"><a href="';
                            feed += n.url;
                            feed += '" title="';
                            feed += n.title[ x ];
                            feed += '">';
                            feed += n.title[ x ];
                            feed += '</a></div>';
                        }
                    }
                }
            } );
        } );
        
        _defaults.feedBox.append( feed );
    }
    
    /**
     * Converts a date to this form: 16. November 2015
     * 
     * @method _dateConverter
     * @param {String} str The date to convert.
     * @returns {String} The new formated date.
     * 
     */
    function _dateConverter( str ) {
        var strArr = str.split( '-' );
        var monthIdx = parseInt( strArr[ 1 ] );
        var newDate = strArr[ 2 ] + '. ' + _defaults.monthNames[ monthIdx ] + ' ' + strArr[ 0 ];
        
        return newDate;
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    // default variables
    var _debug = false;
    var _checkbox = null;
    var _downloadBtn = null;
    
    viewer.download = {
        /**
         * Method to initialize the download view.
         * 
         * @method init
         */
        init: function() {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.download.init' );
                console.log( '##############################' );
            }
            _checkbox = $( '#agreeLicense' );
            _downloadBtn = $( '#downloadBtn' );
            
            _downloadBtn.prop( 'disabled', true );
            
            _checkbox.on( 'click', function() {
                var currState = $( this ).prop( 'checked' );
                
                viewer.download.checkboxValidation( currState );
            } );
        },
        /**
         * Method which validates the checkstate of a checkbox and enables the download
         * button.
         * 
         * @method checkboxValidation
         * @param {String} state The current checkstate of the checkbox.
         */
        checkboxValidation: function( state ) {
            if ( _debug ) {
                console.log( '---------- viewer.download.checkboxValidation() ----------' );
                console.log( 'viewer.download.checkboxValidation: state = ', state );
            }
            
            if ( state ) {
                _downloadBtn.prop( 'disabled', false );
            }
            else {
                _downloadBtn.prop( 'disabled', true );
                return false;
            }
        },
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    // default variables
    var _debug = false;
    var _defaults = {
        dataType: null,
        dataTitle: null,
        dataId: null,
        dataPi: null,
        downloadBtn: null,
        reCaptchaSiteKey: '',
        useReCaptcha: true,
        path: '',
        iiifPath: '',
        apiUrl: '',
        userEmail: null,
        workInfo: {},
        modal: {
            id: '',
            label: '',
            string: {
                title: '',
                body: '',
                closeBtn: '',
                saveBtn: '',
            }
        },
        messages: {
            downloadInfo: {
                text: 'Informationen zum angeforderten Download',
                title: 'Werk',
                part: 'Teil',
                fileSize: 'Größe'
            },
            reCaptchaText: 'Um die Generierung von Dokumenten durch Suchmaschinen zu verhindern bestätigen Sie bitte das reCAPTCHA.',
            rcInvalid: 'Die Überprüfung war nicht erfolgreich. Bitte bestätigen Sie die reCAPTCHA Anfrage.',
            rcValid: 'Vielen Dank. Sie können nun ihre ausgewählte Datei generieren lassen.',
            eMailText: 'Um per E-Mail informiert zu werden sobald der Download zur Verfügung steht, können Sie hier optional Ihre E-Mail Adresse hinterlassen',
            eMailTextLoggedIn: 'Sie werden über Ihre registrierte E-Mail Adresse von uns über den Fortschritt des Downloads informiert.',
            eMail: ''
        }
    };
    var _loadingOverlay = null;
    
    viewer.downloadModal = {
        /**
         * Method to initialize the download modal mechanic.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.dataType The data type of the current file to download.
         * @param {String} config.dataTitle The title of the current file to download.
         * @param {String} config.dataId The LOG_ID of the current file to download.
         * @param {String} config.dataPi The PI of the current file to download.
         * @param {Object} config.downloadBtn A collection of all buttons with the class
         * attribute 'download-modal'.
         * @param {String} config.reCaptchaSiteKey The site key for the google reCAPTCHA,
         * fetched from the viewer config.
         * @param {String} config.path The current application path.
         * @param {String} config.apiUrl The URL to trigger the ITM download task.
         * @param {String} config.userEmail The current user email if the user is logged
         * in. Otherwise the one which the user enters or leaves blank.
         * @param {Object} config.modal A configuration object for the download modal.
         * @param {String} config.modal.id The ID of the modal.
         * @param {String} config.modal.label The label of the modal.
         * @param {Object} config.modal.string An object of strings for the modal content.
         * @param {String} config.modal.string.title The title of the modal.
         * @param {String} config.modal.string.body The content of the modal as HTML.
         * @param {String} config.modal.string.closeBtn Buttontext
         * @param {String} config.modal.string.saveBtn Buttontext
         * @param {Object} config.messages An object of strings for the used text
         * snippets.
         * @example
         * 
         * <pre>
         * var downloadModalConfig = {
         *     downloadBtn: $( '.download-modal' ),
         *     path: '#{navigationHelper.applicationUrl}',
         *     userEmail: $( '#userEmail' ).val(),
         *     messages: {
         *         reCaptchaText: '#{msg.downloadReCaptchaText}',
         *         rcInvalid: '#{msg.downloadRcInvalid}',
         *         rcValid: '#{msg.downloadRcValid}',
         *         eMailText: '#{msg.downloadEMailText}',
         *         eMailTextLoggedIn: '#{msg.downloadEMailTextLoggedIn}',
         *         eMail: '#{msg.downloadEmail}',
         *         closeBtn: '#{msg.downloadCloseModal}',
         *         saveBtn: '#{msg.downloadGenerateFile}',
         *     }
         * };
         * 
         * viewerJS.downloadModal.init( downloadModalConfig );
         * </pre>
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.downloadModal.init' );
                console.log( '##############################' );
                console.log( 'viewer.downloadModal.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // build loading overlay
            _loadingOverlay = $( '<div />' );
            _loadingOverlay.addClass( 'dl-modal__overlay' );
            $( 'body' ).append( _loadingOverlay );
            
            _defaults.downloadBtn.on( 'click', function() {
                // show loading overlay
                $( '.dl-modal__overlay' ).fadeIn( 'fast' );
                
                _defaults.dataType = $( this ).attr( 'data-type' );
                _defaults.dataTitle = $( this ).attr( 'data-title' );
                if ( $( this ).attr( 'data-id' ) !== '' ) {
                    _defaults.dataId = $( this ).attr( 'data-id' );
                }
                else {
                    _defaults.dataId = '-';
                }
                _defaults.dataPi = $( this ).attr( 'data-pi' );
                _getWorkInfo( _defaults.dataPi, _defaults.dataId ).done( function( info ) {
                    _defaults.workInfo = info;
                    
                    _defaults.modal = {
                        id: _defaults.dataPi + '-Modal',
                        label: _defaults.dataPi + '-Label',
                        string: {
                            title: _defaults.dataTitle,
                            body: viewer.downloadModal.renderModalBody( _defaults.dataType, _defaults.workInfo ),
                            closeBtn: _defaults.messages.closeBtn,
                            saveBtn: _defaults.messages.saveBtn,
                        }
                    };
                    
                    // hide loading overlay
                    $( '.dl-modal__overlay' ).fadeOut( 'fast' );
                    
                    // init modal
                    viewer.downloadModal.initModal( _defaults );
                } );
            } );
        },
        /**
         * Method which initializes the download modal and its content.
         * 
         * @method initModal
         * @param {Object} params An config object which overwrites the defaults.
         */
        initModal: function( params ) {
            if ( _debug ) {
                console.log( '---------- viewer.downloadModal.initModal() ----------' );
                console.log( 'viewer.downloadModal.initModal: params = ', params );
            }
            $( 'body' ).append( viewer.helper.renderModal( params.modal ) );
            
            // disable submit button
            $( '#submitModal' ).attr( 'disabled', 'disabled' );
            
            // show modal
            $( '#' + params.modal.id ).modal( 'show' );
            
            // render reCAPTCHA to modal
            $( '#' + params.modal.id ).on( 'shown.bs.modal', function( e ) {
                if ( _defaults.useReCaptcha ) {
                    var rcWidget = grecaptcha.render( 'reCaptchaWrapper', {
                        sitekey: _defaults.reCaptchaSiteKey,
                        callback: function() {
                            var rcWidgetResponse = viewer.downloadModal.validateReCaptcha( grecaptcha.getResponse( rcWidget ) );
                            
                            if ( rcWidgetResponse ) {
                                $( '#modalAlerts' ).append( viewer.helper.renderAlert( 'alert-success', _defaults.messages.rcValid, true ) );
                                
                                // enable submit button
                                $( '#submitModal' ).removeAttr( 'disabled' ).on( 'click', function() {
                                    _defaults.userEmail = $( '#recallEMail' ).val();
                                    
                                    _defaults.apiUrl = viewer.downloadModal
                                            .buildAPICall( _defaults.path, _defaults.dataType, _defaults.dataPi, _defaults.dataId, _defaults.userEmail );
                                    
                                    window.location.href = _defaults.apiUrl;
                                } );
                            }
                            else {
                                $( '#modalAlerts' ).append( viewer.helper.renderAlert( 'alert-danger', _defaults.messages.rcInvalid, true ) );
                            }
                        }
                    } );
                }
                else {
                    // hide paragraph
                    $( this ).find( '.modal-body h4' ).next( 'p' ).hide();
                    
                    // enable submit button
                    $( '#submitModal' ).removeAttr( 'disabled' ).on( 'click', function() {
                        _defaults.userEmail = $( '#recallEMail' ).val();
                        
                        _defaults.apiUrl = viewer.downloadModal.buildAPICall( _defaults.path, _defaults.dataType, _defaults.dataPi, _defaults.dataId, _defaults.userEmail );
                        
                        window.location.href = _defaults.apiUrl;
                    } );
                }
            } );
            
            // remove modal from DOM after closing
            $( '#' + params.modal.id ).on( 'hidden.bs.modal', function( e ) {
                $( this ).remove();
            } );
        },
        /**
         * Method which returns a HTML-String to render the download modal body.
         * 
         * @method renderModalBody
         * @param {String} type The current file type to download.
         * @param {String} title The title of the current download file.
         * @returns {String} The HTML-String to render the download modal body.
         */
        renderModalBody: function( type, infos ) {
            if ( _debug ) {
                console.log( '---------- viewer.downloadModal.renderModalBody() ----------' );
                console.log( 'viewer.downloadModal.renderModalBody: type = ', type );
                console.log( 'viewer.downloadModal.renderModalBody: infos = ', infos );
            }
            var rcResponse = null;
            var modalBody = '';
            
            modalBody += '';
            // alerts
            modalBody += '<div id="modalAlerts"></div>';
            // Title
            if ( type === 'pdf' ) {
                modalBody += '<h4>';
                modalBody += '<i class="fa fa-file-pdf-o" aria-hidden="true"></i> PDF-Download: ';
                modalBody += '</h4>';
            }
            else {
                modalBody += '<h4>';
                modalBody += '<i class="fa fa-file-text-o" aria-hidden="true"></i> ePub-Download: ';
                modalBody += '</h4>';
            }
            // Info
            modalBody += '<p>' + _defaults.messages.downloadInfo.text + ':</p>';
            modalBody += '<dl class="dl-horizontal">';
            modalBody += '<dt>' + _defaults.messages.downloadInfo.title + ':</dt>';
            modalBody += '<dd>' + infos.title + '</dd>';
            if ( infos.div !== null ) {
                modalBody += '<dt>' + _defaults.messages.downloadInfo.part + ':</dt>';
                modalBody += '<dd>' + infos.div + '</dd>';
            }
            modalBody += '<dt>' + _defaults.messages.downloadInfo.fileSize + ':</dt>';
            modalBody += '<dd>' + infos.size + '</dd>';
            modalBody += '</dl>';
            // reCAPTCHA
            if ( _defaults.useReCaptcha ) {
                modalBody += '<hr />';
                modalBody += '<p><strong>reCAPTCHA</strong></p>';
                modalBody += '<p>' + _defaults.messages.reCaptchaText + ':</p>';
                modalBody += '<div id="reCaptchaWrapper"></div>';
            }
            // E-Mail
            modalBody += '<hr />';
            modalBody += '<form class="email-form">';
            modalBody += '<div class="form-group">';
            modalBody += '<label for="recallEMail">' + _defaults.messages.eMail + '</label>';
            if ( _defaults.userEmail != undefined ) {
                modalBody += '<p class="help-block">' + _defaults.messages.eMailTextLoggedIn + '</p>';
                modalBody += '<input type="email" class="form-control" id="recallEMail" value="' + _defaults.userEmail + '" disabled="disabled" />';
            }
            else {
                modalBody += '<p class="help-block">' + _defaults.messages.eMailText + ':</p>';
                modalBody += '<input type="email" class="form-control" id="recallEMail" />';
            }
            modalBody += '</div>';
            modalBody += '</form>';
            
            return modalBody;
        },
        /**
         * Method which checks the reCAPTCHA response.
         * 
         * @method validateReCaptcha
         * @param {String} response The reCAPTCHA response.
         * @returns {Boolean} Returns true if the reCAPTCHA sent a response.
         */
        validateReCaptcha: function( response ) {
            if ( _debug ) {
                console.log( '---------- viewer.downloadModal.validateReCaptcha() ----------' );
                console.log( 'viewer.downloadModal.validateReCaptcha: response = ', response );
            }
            if ( response == 0 ) {
                return false;
            }
            else {
                return true;
            }
        },
        /**
         * Method which returns an URL to trigger the ITM download task.
         * 
         * @method buildAPICall
         * @param {String} path The current application path.
         * @param {String} type The current file type to download.
         * @param {String} pi The PI of the current work.
         * @param {String} logid The LOG_ID of the current work.
         * @param {String} email The current user email.
         * @returns {String} The URL to trigger the ITM download task.
         */
        buildAPICall: function( path, type, pi, logid, email ) {
            if ( _debug ) {
                console.log( '---------- viewer.downloadModal.buildAPICall() ----------' );
                console.log( 'viewer.downloadModal.buildAPICall: path = ', path );
                console.log( 'viewer.downloadModal.buildAPICall: type = ', type );
                console.log( 'viewer.downloadModal.buildAPICall: pi = ', pi );
                console.log( 'viewer.downloadModal.buildAPICall: logid = ', logid );
                console.log( 'viewer.downloadModal.buildAPICall: email = ', email );
            }
            var url = '';
            
            url += path + 'rest/download';
            
            if ( type == '' ) {
                url += '/-';
            }
            else {
                url += '/' + type;
            }
            if ( pi == '' ) {
                url += '/-';
            }
            else {
                url += '/' + pi;
            }
            if ( logid == '' ) {
                url += '/-';
            }
            else {
                url += '/' + logid;
            }
            if ( email == '' || email == undefined ) {
                url += '/-/';
            }
            else {
                url += '/' + email + '/';
            }
            
            return encodeURI( url );
        }
    };
    
    /**
     * Method which returns a promise if the work info has been reached.
     * 
     * @method getWorkInfo
     * @param {String} pi The PI of the work.
     * @param {String} logid The LOG_ID of the work.
     * @returns {Promise} A promise object if the info has been reached.
     */
    function _getWorkInfo( pi, logid ) {
        if ( _debug ) {
            console.log( '---------- _getWorkInfo() ----------' );
            console.log( '_getWorkInfo: pi = ', pi );
            console.log( '_getWorkInfo: logid = ', logid );
        }
        
        var restCall = '';
        var workInfo = {};
        
        if ( logid !== '' || logid !== undefined ) {
            restCall = _defaults.iiifPath + 'pdf/mets/' + pi + '/' + logid + '/';
            
            if ( _debug ) {
                console.log( 'if' );
                console.log( '_getWorkInfo: restCall = ', restCall );
            }
        }
        else {
            restCall = _defaults.iiifPath + 'pdf/mets/' + pi + '/-/';
            
            if ( _debug ) {
                console.log( 'else' );
                console.log( '_getWorkInfo: restCall = ', restCall );
            }
        }
        
        return viewerJS.helper.getRemoteData( restCall );
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _defaults = {
        commentCount: 0,
        editBtnCount: 0,
        deleteBtnCount: 0,
        deleteModalCount: 0,
        btnId: null,
        commentText: null
    };
    
    viewer.editComment = {
        /**
         * Method which initializes all required events to edit comments.
         * 
         * @method init
         * @example
         * 
         * <pre>
         * $( document ).ready( function() {
         *     viewerJS.editComment.init();
         * } );
         * </pre>
         */
        init: function() {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.editComment.init' );
                console.log( '##############################' );
            }
            
            // clear texarea for new comments
            if ( $( 'textarea[id*="newCommentInput"]' ).val() !== '' ) {
                $( 'textarea[id*="newCommentInput"]' ).focus().val( '' );
            }
            
            // eventlisteners
            $( '.comment-edit' ).on( 'click', function() {
                // hide add new comment field
                $( '#newCommentField' ).fadeOut();
                
                // get button id
                _defaults.btnId = $( this ).attr( 'id' ).replace( 'commentEditBtn-', '' );
                
                // show textfield to edit comment and hide comment
                $( '#addComment' ).hide();
                $( '#commentEditComment-' + _defaults.btnId ).prev().hide();
                $( '#commentEditComment-' + _defaults.btnId ).show();
                
                // hide edit button
                $( '.comment-edit' ).hide();
            } );
            
            $( '.comment-abort' ).on( 'click', function() {
                // show add new comment field
                $( '#newCommentField' ).fadeIn();
                
                // show edit button and comment
                $( '.comments-comment-text' ).show();
                $( '.comment-edit' ).show();
                $( '#addComment' ).show();
                
                // hide textfield to edit comment
                $( this ).parent().hide();
            } );
            
            // add counting ids to elements
            $( '.comment-edit' ).each( function() {
                $( this ).attr( 'id', 'commentEditBtn-' + _defaults.editBtnCount );
                _defaults.editBtnCount++;
            } );
            
            $( '.comments-comment-edit' ).each( function() {
                $( this ).attr( 'id', 'commentEditComment-' + _defaults.commentCount );
                _defaults.commentCount++;
            } );
            
            $.each( $( '.comments-delete-btn' ), function() {
                $( this ).attr( 'data-toggle', 'modal' ).attr( 'data-target', '#deleteCommentModal-' + _defaults.deleteBtnCount );
                _defaults.deleteBtnCount++;
            } );
            
            $.each( $( '.deleteCommentModal' ), function() {
                $( this ).attr( 'id', 'deleteCommentModal-' + _defaults.deleteModalCount );
                _defaults.deleteModalCount++;
            } );
        }
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    // default variables
    var _debug = false;
    
    viewer.helper = {
        /**
         * Method to truncate a string to a given length.
         * 
         * @method truncateString
         * @param {String} str The string to truncate.
         * @param {Number} size The number of characters after the string should be
         * croped.
         * @returns {String} The truncated string.
         * @example
         * 
         * <pre>
         * viewerJS.helper.truncateString( $( '.something' ).text(), 75 );
         * </pre>
         */
        truncateString: function( str, size ) {
            if ( _debug ) {
                console.log( '---------- viewer.helper.truncateString() ----------' );
                console.log( 'viewer.helper.truncateString: str = ', str );
                console.log( 'viewer.helper.truncateString: size = ', size );
            }
            
            var strSize = parseInt( str.length );
            
            if ( strSize > size ) {
                return str.substring( 0, size ) + '...';
            }
            else {
                return str;
            }
        },
        
        /**
         * Method to switch classnames of an object.
         * 
         * @deprecated use jQuery.toggleClass();
         * @method switchClass
         * @param {Object} $Obj The object which classname has to be switched.
         * @param {String} classname1 The classname of the first class.
         * @param {String} classname2 The classname of the second class.
         * @returns {String} The new classname.
         */
        switchClass: function( $Obj, classname1, classname2 ) {
            if ( _debug ) {
                console.log( '---------- viewer.helper.switchClass() ----------' );
                console.log( 'viewer.helper.switchClass: $Obj = ', $Obj );
                console.log( 'viewer.helper.switchClass: classname1 = ', classname1 );
                console.log( 'viewer.helper.switchClass: classname2 = ', classname2 );
            }
            
            $Obj.toggleClass( function() {
                if ( $Obj.hasClass( classname1 ) ) {
                    $Obj.removeClass( classname1 );
                    return classname2;
                }
                else {
                    $Obj.removeClass( classname2 );
                    return classname1;
                }
            } );
        },
        /**
         * Method which calculates the current position of the active element in sidebar
         * toc and the image container position and saves it to lacal storage.
         * 
         * @method saveSidebarTocPosition
         * @example
         * 
         * <pre>
         * viewerJS.helper.saveSidebarTocPosition();
         * </pre>
         */
        saveSidebarTocPosition: function() {
            if ( _debug ) {
                console.log( '---------- viewer.helper.saveSidebarTocPosition() ----------' );
            }
            
            var scrollSidebarTocPosition = null;
            var savedIdDoc = localStorage.getItem( 'currIdDoc' );
            var sidebarTocWrapper = '.widget-toc-elem-wrapp';
            var currElement = null;
            var currUrl = '';
            var parentLogId = '';
            
            if ( viewer.localStoragePossible ) {
                if ( savedIdDoc !== 'false' ) {
                    currElement = $( 'li[data-iddoc="' + savedIdDoc + '"]' );
                    
                    if ( currElement.length > 0 ) {
                        $( sidebarTocWrapper ).scrollTop( currElement.offset().top - $( sidebarTocWrapper ).offset().top + $( sidebarTocWrapper ).scrollTop() );
                        localStorage.setItem( 'currIdDoc', 'false' );
                    }
                    else {
                        localStorage.setItem( 'currIdDoc', 'false' );
                    }
                    
                    $( '.widget-toc-elem-link a' ).on( 'click', function() {
                        parentLogId = $( this ).parents( 'li' ).attr( 'data-iddoc' );
                        localStorage.setItem( 'currIdDoc', parentLogId );
                    } );
                }
                else {
                    localStorage.setItem( 'currIdDoc', 'false' );
                    
                    // expand click
                    $( '.widget-toc-elem-expand a' ).on( 'click', function() {
                        scrollSidebarTocPosition = $( sidebarTocWrapper ).scrollTop();
                        
                        localStorage.setItem( 'sidebarTocScrollPosition', scrollSidebarTocPosition );
                    } );
                    
                    // link click
                    $( '.widget-toc-elem-link a' ).on( 'click', function( event ) {
                        event.preventDefault();
                        
                        currUrl = $( this ).attr( 'href' );
                        scrollSidebarTocPosition = $( sidebarTocWrapper ).scrollTop();
                        localStorage.setItem( 'sidebarTocScrollPosition', scrollSidebarTocPosition );
                        location.href = currUrl;
                    } );
                    
                    // scroll to saved position
                    $( sidebarTocWrapper ).scrollTop( localStorage.getItem( 'sidebarTocScrollPosition' ) );
                }
            }
            else {
                return false;
            }
        },
        /**
         * Returns an JSON object from a API call.
         * 
         * @method getRemoteData
         * @param {String} url The API call URL.
         * @returns {Object} A promise object, which tells about the success of receiving
         * data.
         * @example
         * 
         * <pre>
         * viewerJS.helper.getRemoteData( dataURL );
         * </pre>
         */
        getRemoteData: function( url ) {
            if ( _debug ) {
                console.log( '---------- viewer.helper.getRemoteData() ----------' );
                console.log( 'viewer.helper.getRemoteData: url = ', url );
            }
            
            var promise = Q( $.ajax( {
                url: decodeURI( url ),
                type: "GET",
                dataType: "JSON",
                async: true
            } ) );
            
            return promise;
        },
        /**
         * Returns a BS Modal with dynamic content.
         * 
         * @method renderModal
         * @param {Object} config An config object which includes the content of the
         * modal.
         * @param {String} config.id The ID of the modal.
         * @param {String} config.label The label of the modal.
         * @param {Object} config.string An object of strings for the modal content.
         * @param {String} config.string.title The title of the modal.
         * @param {String} config.string.body The content of the modal as HTML.
         * @param {String} config.string.closeBtn Buttontext
         * @param {String} config.string.saveBtn Buttontext
         * @returns {String} A HTML-String which renders the modal.
         */
        renderModal: function( config ) {
            if ( _debug ) {
                console.log( '---------- viewer.helper.renderModal() ----------' );
                console.log( 'viewer.helper.renderModal: config = ', config );
            }
            var _defaults = {
                id: 'myModal',
                label: 'myModalLabel',
                closeId: 'closeModal',
                submitId: 'submitModal',
                string: {
                    title: 'Modal title',
                    body: '',
                    closeBtn: 'Close',
                    saveBtn: 'Save changes',
                }
            };
            
            $.extend( true, _defaults, config );
            
            var modal = '';
            
            modal += '<div class="modal fade" id="' + _defaults.id + '" tabindex="-1" role="dialog" aria-labelledby="' + _defaults.label + '">';
            modal += '<div class="modal-dialog" role="document">';
            modal += '<div class="modal-content">';
            modal += '<div class="modal-header">';
            modal += '<button type="button" class="close" data-dismiss="modal" aria-label="' + _defaults.string.closeBtn + '">';
            modal += '<span aria-hidden="true">&times;</span>';
            modal += '</button>';
            modal += '<h4 class="modal-title" id="' + _defaults.label + '">' + _defaults.string.title + '</h4>';
            modal += '</div>';
            modal += '<div class="modal-body">' + _defaults.string.body + '</div>';
            modal += '<div class="modal-footer">';
            modal += '<button type="button" id="' + _defaults.closeId + '"  class="btn" data-dismiss="modal">' + _defaults.string.closeBtn + '</button>';
            modal += '<button type="button" id="' + _defaults.submitId + '" class="btn">' + _defaults.string.saveBtn + '</button>';
            modal += '</div></div></div></div>';
            
            return modal;
        },
        /**
         * Returns a BS Alert with dynamic content.
         * 
         * @method renderAlert
         * @param {String} type The type of the alert.
         * @param {String} content The content of the alert.
         * @param {Boolean} dismissable Sets the option to make the alert dismissable,
         * true = dismissable.
         * @returns {String} A HTML-String which renders the alert.
         */
        renderAlert: function( type, content, dismissable ) {
            if ( _debug ) {
                console.log( '---------- viewer.helper.renderAlert() ----------' );
                console.log( 'viewer.helper.renderAlert: type = ', type );
                console.log( 'viewer.helper.renderAlert: content = ', content );
                console.log( 'viewer.helper.renderAlert: dismissable = ', dismissable );
            }
            var bsAlert = '';
            
            bsAlert += '<div role="alert" class="alert ' + type + ' alert-dismissible fade in">';
            if ( dismissable ) {
                bsAlert += '<button aria-label="Close" data-dismiss="alert" class="close" type="button"><span aria-hidden="true">×</span></button>';
            }
            bsAlert += content;
            bsAlert += '</div>';
            
            return bsAlert;
        },
        
        /**
         * Method to get the version number of the used MS Internet Explorer.
         * 
         * @method detectIEVersion
         * @returns {Number} The browser version.
         */
        detectIEVersion: function() {
            var ua = window.navigator.userAgent;
            
            // IE 10 and older
            var msie = ua.indexOf( 'MSIE ' );
            if ( msie > 0 ) {
                // IE 10 or older => return version number
                return parseInt( ua.substring( msie + 5, ua.indexOf( '.', msie ) ), 10 );
            }
            
            // IE 11
            var trident = ua.indexOf( 'Trident/' );
            if ( trident > 0 ) {
                // IE 11 => return version number
                var rv = ua.indexOf( 'rv:' );
                return parseInt( ua.substring( rv + 3, ua.indexOf( '.', rv ) ), 10 );
            }
            
            // IE 12+
            var edge = ua.indexOf( 'Edge/' );
            if ( edge > 0 ) {
                // Edge (IE 12+) => return version number
                return parseInt( ua.substring( edge + 5, ua.indexOf( '.', edge ) ), 10 );
            }
            
            // other browser
            return false;
        },
        
        /**
         * Method to check if it´s possible to write to local Storage
         * 
         * @method checkLocalStorage
         * @returns {Boolean} true or false
         */
        checkLocalStorage: function() {
            if ( typeof localStorage === 'object' ) {
                try {
                    localStorage.setItem( 'testLocalStorage', 1 );
                    localStorage.removeItem( 'testLocalStorage' );
                    
                    return true;
                }
                catch ( error ) {
                    console.error( 'Not possible to write in local Storage: ', error );
                    
                    return false;
                }
            }
        },
        
        /**
         * Method to render a warning popover.
         * 
         * @method renderWarningPopover
         * @param {String} msg The message to show in the popover.
         * @returns {Object} An jQuery Object to append to DOM.
         */
        renderWarningPopover: function( msg ) {
            var popover = $( '<div />' );
            var popoverText = $( '<p />' );
            var popoverButton = $( '<button />' );
            var popoverButtonIcon = $( '<i aria-hidden="true" />' );
            
            popover.addClass( 'warning-popover' );
            
            // build button
            popoverButton.addClass( 'btn-clean' );
            popoverButton.attr( 'data-toggle', 'warning-popover' );
            popoverButtonIcon.addClass( 'fa fa-times' );
            popoverButton.append( popoverButtonIcon );
            popover.append( popoverButton );
            
            // build text
            popoverText.html( msg );
            popover.append( popoverText );
            
            return popover;
        },
        
        /**
         * Method to equal height of sidebar and content.
         * 
         * @method equalHeight
         * @param {String} sidebar The selector of the sidebar.
         * @param {String} content The selector of the content.
         */
        equalHeight: function( sidebar, content ) {
            if ( _debug ) {
                console.log( '---------- viewer.helper.equalHeight() ----------' );
                console.log( 'viewer.helper.equalHeight: sidebar = ', sidebar );
                console.log( 'viewer.helper.equalHeight: content = ', content );
            }
            
            var $sidebar = $( sidebar );
            var $content = $( content );
            var sidebarHeight = $sidebar.outerHeight();
            var contentHeight = $content.outerHeight();
            
            if ( sidebarHeight > contentHeight ) {
                $content.css( {
                    'min-height': ( sidebarHeight ) + 'px'
                } );
            }
        },
        
        /**
         * Method to validate the reCAPTCHA response.
         * 
         * @method validateReCaptcha
         * @param {String} wrapper The reCAPTCHA widget wrapper.
         * @param {String} key The reCAPTCHA site key.
         * @returns {Boolean} Returns true if the response is valid.
         */
        validateReCaptcha: function( wrapper, key ) {
            var widget = grecaptcha.render( wrapper, {
                sitekey: key,
                callback: function() {
                    var response = grecaptcha.getResponse( widget );
                    
                    console.log( response );
                    
                    if ( response == 0 ) {
                        return false;
                    }
                    else {
                        return true;
                    }
                }
            } );
        },
        
        /**
         * Method to get the current used browser.
         * 
         * @method getCurrentBrowser
         * @returns {String} The name of the current Browser.
         */
        getCurrentBrowser: function() {
            // Opera 8.0+
            var isOpera = ( !!window.opr && !!opr.addons ) || !!window.opera || navigator.userAgent.indexOf( ' OPR/' ) >= 0;
            // Firefox 1.0+
            var isFirefox = typeof InstallTrigger !== 'undefined';
            // Safari 3.0+ "[object HTMLElementConstructor]"
            var isSafari = /constructor/i.test( window.HTMLElement ) || ( function( p ) {
                return p.toString() === "[object SafariRemoteNotification]";
            } )( !window[ 'safari' ] || ( typeof safari !== 'undefined' && safari.pushNotification ) );
            // Internet Explorer 6-11
            var isIE = /* @cc_on!@ */false || !!document.documentMode;
            // Edge 20+
            var isEdge = !isIE && !!window.StyleMedia;
            // Chrome 1+
            var isChrome = !!window.chrome && !!window.chrome.webstore;
            // Blink engine detection
            // var isBlink = ( isChrome || isOpera ) && !!window.CSS;
            
            if ( isOpera ) {
                return 'Opera';
            }
            else if ( isFirefox ) {
                return 'Firefox';
            }
            else if ( isSafari ) {
                return 'Safari';
            }
            else if ( isIE ) {
                return 'IE';
            }
            else if ( isEdge ) {
                return 'Edge';
            }
            else if ( isChrome ) {
                return 'Chrome';
            }
        },
    };
    
    viewer.localStoragePossible = viewer.helper.checkLocalStorage();
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _defaults = {
        navigationSelector: '#navigation',
        subMenuSelector: '[data-toggle="submenu"]',
        megaMenuSelector: '[data-toggle="megamenu"]',
        closeMegaMenuSelector: '[data-toggle="close"]',
    };
    
    viewer.navigation = {
        /**
         * Method to initialize the viewer main navigation.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.navigationSelector The selector for the navigation
         * element.
         * @param {String} config.subMenuSelector The selector for the submenu element.
         * @param {String} config.megaMenuSelector The selector for the mega menu element.
         * @param {String} config.closeMegaMenuSelector The selector for the close mega
         * menu element.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.navigation.init' );
                console.log( '##############################' );
                console.log( 'viewer.navigation.init: config - ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // TRIGGER STANDARD MENU
            $( _defaults.subMenuSelector ).on( 'click', function() {
                var currTrigger = $( this );
                
                if ( $( this ).parents( '.navigation__submenu' ).hasClass( 'in' ) ) {
                    _resetSubMenus();
                    currTrigger.parent().addClass( 'active' );
                    currTrigger.next( '.navigation__submenu' ).addClass( 'in' );
                    _calcSubMenuPosition( currTrigger.next( '.navigation__submenu' ) );
                }
                else {
                    _resetMenus();
                    currTrigger.parent().addClass( 'active' );
                    currTrigger.next( '.navigation__submenu' ).addClass( 'in' );
                }
            } );
            
            // TRIGGER MEGA MENU
            $( _defaults.megaMenuSelector ).on( 'click', function() {
                _resetMenus();
                
                if ( $( this ).next( '.navigation__megamenu-wrapper' ).hasClass( 'in' ) ) {
                    $( this ).parent().removeClass( 'active' );
                    $( this ).next( '.navigation__megamenu-wrapper' ).removeClass( 'in' );
                }
                else {
                    $( '.navigation__megamenu-trigger' ).removeClass( 'active' );
                    $( '.navigation__megamenu-wrapper' ).removeClass( 'in' );
                    $( this ).parent().addClass( 'active' );
                    $( this ).next( '.navigation__megamenu-wrapper' ).addClass( 'in' );
                }
            } );
            
            $( _defaults.closeMegaMenuSelector ).on( 'click', function() {
                _resetMenus();
            } );
            
            if ( $( '.navigation__megamenu-wrapper' ).length > 0 ) {
                _resetMenus();
            }
            
            // reset all menus by clicking on body
            $( 'body' ).on( 'click', function( event ) {
                if ( event.target.id == 'navigation' || $( event.target ).closest( _defaults.navigationSelector ).length ) {
                    return;
                }
                else {
                    _resetMenus();
                }
            } );
        },
    };
    
    /**
     * Method to reset all shown menus.
     * 
     * @method _resetMenus
     */
    function _resetMenus() {
        if ( _debug ) {
            console.log( '---------- _resetMenus() ----------' );
        }
        
        $( '.navigation__submenu-trigger' ).removeClass( 'active' );
        $( '.navigation__submenu' ).removeClass( 'in' );
        $( '.navigation__megamenu-trigger' ).removeClass( 'active' );
        $( '.navigation__megamenu-wrapper' ).removeClass( 'in' );
    }
    
    /**
     * Method to reset all shown submenus.
     * 
     * @method _resetSubMenus
     */
    function _resetSubMenus() {
        $( '.level-2, .level-3, .level-4, .level-5' ).parent().removeClass( 'active' );
        $( '.level-2, .level-3, .level-4, .level-5' ).removeClass( 'in' ).removeClass( 'left' );
    }
    
    /**
     * Method to calculate the position of the shown submenu.
     * 
     * @method _calcSubMenuPosition
     * @param {Object} menu An jQuery object of the current submenu.
     */
    function _calcSubMenuPosition( menu ) {
        if ( _debug ) {
            console.log( '---------- _clacSubMenuPosition() ----------' );
            console.log( '_clacSubMenuPosition: menu - ', menu );
        }
        
        var currentOffsetLeft = menu.offset().left;
        var menuWidth = menu.outerWidth();
        var windowWidth = $( window ).outerWidth();
        var offsetWidth = currentOffsetLeft + menuWidth;
        
        if ( _debug ) {
            console.log( '_clacSubMenuPosition: currentOffsetLeft - ', currentOffsetLeft );
            console.log( '_clacSubMenuPosition: menuWidth - ', menuWidth );
            console.log( '_clacSubMenuPosition: windowWidth - ', windowWidth );
            console.log( '_clacSubMenuPosition: offsetWidth - ', offsetWidth );
        }
        
        if ( offsetWidth >= windowWidth ) {
            menu.addClass( 'left' ).css( 'width', menuWidth );
        }
        else {
            return false;
        }
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _json = null;
    var _apiCall = '';
    var _html = '';
    var _pageCount = 0;
    var _scaleCount = 0;
    var _scaleHeight = 0;
    var _sliderHandlePosition = {};
    var _movedSliderHandlePosition = 0;
    var _recurrenceCount = 0;
    var _scaleValue = 0;
    var _sliderScaleHeight = 0;
    var _start = 0;
    var _end = 0;
    var _currentNerPageRangeSelected = '';
    var _currentNerPageRange = '';
    var _currentNerType = '';
    var _promise = null;
    var _defaults = {
        currentPage: '',
        baseUrl: '',
        apiUrl: '/rest/ner/tags/',
        workId: '',
        overviewTrigger: '',
        overviewContent: '',
        sectionTrigger: '',
        sectionContent: '',
        facettingTrigger: '',
        setTagRange: '',
        slider: '',
        sliderScale: '',
        sectionTags: '',
        currentTags: '',
        sliderHandle: '',
        sliderSectionStripe: '',
        recurrenceNumber: 0,
        recurrenceSectionNumber: 0,
        sidebarRight: false,
        loader: '',
        msg: {
            noJSON: 'Es konnten keine Daten abgerufen werden.',
            emptyTag: 'Keine Tags vorhanden',
            page: 'Seite',
            tags: 'Tags',
        }
    };
    
    viewer.nerFacetting = {
        /**
         * Method to initialize the NER-Widget or NER-View.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.currentPage The name of the current page.
         * @param {String} config.baseUrl The root URL.
         * @param {String} config.apiUrl The base URL for the API-Calls.
         * @param {String} config.workId The ID of the current work.
         * @param {String} config.overviewTrigger The ID/Class of the overview trigger.
         * @param {String} config.overviewContent The ID/Class of the content section from
         * overview.
         * @param {String} config.sectionTrigger The ID/Class of the section trigger.
         * @param {String} config.sectionContent The ID/Class of the content section from
         * section.
         * @param {String} config.facettingTrigger The ID/Class of the facetting trigger.
         * @param {String} config.setTagRange The ID/Class of the select menu for the
         * range.
         * @param {String} config.slider The ID/Class of the tag range slider.
         * @param {String} config.sliderScale The ID/Class of the slider scale.
         * @param {String} config.sectionTags The ID/Class of the tag section.
         * @param {String} config.currentTags The ID/Class of the tag container.
         * @param {String} config.sliderHandle The ID/Class of the slider handle.
         * @param {String} config.sliderSectionStripe The ID/Class of the range stripe on
         * the slider.
         * @param {Number} config.recurrenceNumber The number of displayed tags in a row.
         * @param {Number} config.recurrenceSectionNumber The number of displayed tags in
         * a section.
         * @param {Boolean} config.sidebarRight If true, the current tag row will show up
         * to the left of the sidebar widget.
         * @param {String} config.loader The ID/Class of the AJAX-Loader.
         * @param {Object} config.msg An object of strings for multi language use.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.nerFacetting.init' );
                console.log( '##############################' );
                console.log( 'viewer.nerFacetting.init: config - ', config );
            }
            
            $.extend( true, _defaults, config );
            
            if ( viewer.localStoragePossible ) {
                // show loader
                $( _defaults.loader ).show();
                
                // clean local storage
                _cleanUpLocalStorage();
                
                // reset select menu
                $( _defaults.setTagRange ).find( 'option' ).attr( 'selected', false );
                
                if ( _defaults.currentPage === 'nerfacetting' ) {
                    $( _defaults.setTagRangeOverview ).find( 'option[value="1"]' ).prop( 'selected', true );
                }
                else {
                    $( _defaults.setTagRangeOverview ).find( 'option[value="10"]' ).prop( 'selected', true );
                }
                
                // reset facetting icons
                _resetFacettingIcons();
                
                // get data for current work
                if ( _defaults.currentPage === 'nerfacetting' ) {
                    _apiCall = _getAllTagsOfARange( 1, '-' );
                }
                else {
                    _apiCall = _getAllTagsOfARange( 10, '-' );
                }
                
                _promise = viewer.helper.getRemoteData( _apiCall );
                
                _promise.then( function( json ) {
                    _json = json;
                    
                    // check if data is not empty
                    if ( _json !== null || _json !== 'undefinded' ) {
                        // check if overview is already loaded
                        if ( $( _defaults.overviewContent ).html() === '' ) {
                            _renderOverview( _json );
                        }
                    }
                    else {
                        _html = viewer.helper.renderAlert( 'alert-danger', _defaults.msg.noJSON + '<br /><br />URL: ' + _apiCall, true );
                        $( _defaults.overviewContent ).html( _html );
                    }
                } ).then( null, function( error ) {
                    $( '.facetting-content' ).empty().append( viewer.helper
                            .renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                    console.error( 'ERROR: viewer.nerFacetting.init - ', error );
                } );
                
                /**
                 * Event if overview tab is clicked.
                 */
                $( _defaults.overviewTrigger ).on( 'click', function() {
                    // show loader
                    $( _defaults.loader ).show();
                    
                    // resets
                    $( _defaults.setTagRange ).find( 'option' ).attr( 'selected', false );
                    
                    if ( _defaults.currentPage === 'nerfacetting' ) {
                        $( _defaults.setTagRangeOverview ).find( 'option[value="1"]' ).prop( 'selected', true );
                        localStorage.setItem( 'currentNerPageRange', '1' );
                    }
                    else {
                        $( _defaults.setTagRangeOverview ).find( 'option[value="10"]' ).prop( 'selected', true );
                        localStorage.setItem( 'currentNerPageRange', '10' );
                    }
                    _currentNerPageRange = localStorage.getItem( 'currentNerPageRange' );
                    
                    localStorage.setItem( 'currentNerType', '-' );
                    _currentNerType = localStorage.getItem( 'currentNerType' );
                    
                    _resetFacettingIcons();
                    
                    // check if tab is active
                    if ( $( this ).parent().hasClass( 'active' ) ) {
                        console.info( 'Overview is already active.' );
                    }
                    else {
                        if ( _defaults.currentPage === 'nerfacetting' ) {
                            _apiCall = _getAllTagsOfARange( 1, '-' );
                        }
                        else {
                            _apiCall = _getAllTagsOfARange( 10, '-' );
                        }
                        
                        _promise = viewer.helper.getRemoteData( _apiCall );
                        
                        _promise.then( function( json ) {
                            _json = json;
                            _renderOverview( _json );
                        } ).then( null, function( error ) {
                            $( '.facetting-content' ).empty().append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' '
                                    + error.statusText, false ) );
                            console.error( 'ERROR: viewer.nerFacetting.init - ', error );
                        } );
                        
                    }
                } );
                
                /**
                 * Event if section tab is clicked.
                 */
                $( _defaults.sectionTrigger ).on( 'click', function() {
                    // show loader
                    $( _defaults.loader ).show();
                    
                    // reset select menu
                    $( _defaults.setTagRange ).find( 'option' ).attr( 'selected', false );
                    
                    if ( _defaults.currentPage === 'nerfacetting' ) {
                        $( _defaults.setTagRangeSection ).find( 'option[value="5"]' ).prop( 'selected', true );
                    }
                    else {
                        $( _defaults.setTagRangeSection ).find( 'option[value="10"]' ).prop( 'selected', true );
                    }
                    
                    // reset facetting
                    _resetFacettingIcons()

                    // set local storage value
                    if ( _defaults.currentPage === 'nerfacetting' ) {
                        localStorage.setItem( 'currentNerPageRange', 5 );
                    }
                    else {
                        localStorage.setItem( 'currentNerPageRange', 10 );
                    }
                    _currentNerPageRange = localStorage.getItem( 'currentNerPageRange' );
                    localStorage.setItem( 'currentNerType', '-' );
                    _currentNerType = localStorage.getItem( 'currentNerType' );
                    
                    // check if tab is active
                    if ( $( this ).parent().hasClass( 'active' ) ) {
                        console.info( 'Section is already active.' );
                    }
                    else {
                        _renderSection();
                        
                        // reset section stripe
                        $( _defaults.sliderSectionStripe ).css( 'top', '0px' );
                    }
                } );
                
                /**
                 * Event if select menu changes.
                 */
                $( _defaults.setTagRange ).on( 'change', function() {
                    var currVal = $( this ).val();
                    _currentNerType = localStorage.getItem( 'currentNerType' );
                    
                    // show loader
                    $( _defaults.loader ).show();
                    
                    // save current value in local storage
                    localStorage.setItem( 'currentNerPageRange', currVal );
                    _currentNerPageRange = localStorage.getItem( 'currentNerPageRange' );
                    
                    // render overview
                    if ( $( this ).hasClass( 'overview' ) ) {
                        if ( _currentNerType === null || _currentNerType === '' ) {
                            _currentNerType = '-';
                        }
                        _apiCall = _getAllTagsOfARange( currVal, _currentNerType );
                        
                        _promise = viewer.helper.getRemoteData( _apiCall );
                        
                        _promise.then( function( json ) {
                            _json = json;
                            
                            // check if data is not empty
                            if ( _json !== null || _json !== 'undefinded' ) {
                                _renderOverview( _json );
                            }
                            else {
                                _html = viewer.helper.renderAlert( 'alert-danger', _defaults.msg.noJSON + '<br /><br />URL: ' + _apiCall, true );
                                $( _defaults.overviewContent ).html( _html );
                            }
                        } ).then( null, function( error ) {
                            $( '.facetting-content' ).empty().append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' '
                                    + error.statusText, false ) );
                            console.error( 'ERROR: viewer.nerFacetting.init - ', error );
                        } );
                    }
                    // render section
                    else {
                        // setup values
                        localStorage.setItem( 'currentNerPageRange', currVal );
                        _currentNerPageRange = localStorage.getItem( 'currentNerPageRange' );
                        
                        _renderSection();
                        
                        // reset section stripe
                        if ( _currentNerPageRange > _pageCount ) {
                            $( _defaults.sliderSectionStripe ).css( {
                                'top': '0px',
                                'height': '600px'
                            } );
                        }
                        else {
                            $( _defaults.sliderSectionStripe ).css( {
                                'top': '0px',
                                'height': '100px'
                            } );
                        }
                    }
                    
                } );
                
                /**
                 * Event if facetting icons are clicked.
                 */
                $( _defaults.facettingTrigger ).on( 'click', function() {
                    var currType = $( this ).attr( 'data-type' );
                    
                    // show loader
                    $( _defaults.loader ).show();
                    
                    // set values
                    localStorage.setItem( 'currentNerType', currType );
                    _currentNerType = localStorage.getItem( 'currentNerType' );
                    
                    if ( _defaults.currentPage === 'nerfacetting' ) {
                        if ( _currentNerPageRange == null || _currentNerPageRange === '' ) {
                            _currentNerPageRange = localStorage.setItem( 'currentNerPageRange', 1 );
                        }
                    }
                    else {
                        if ( _currentNerPageRange == null || _currentNerPageRange === '' ) {
                            _currentNerPageRange = localStorage.setItem( 'currentNerPageRange', 10 );
                        }
                    }
                    _currentNerPageRange = localStorage.getItem( 'currentNerPageRange' );
                    
                    // activate icons
                    $( '.facetting-trigger' ).removeClass( 'active' );
                    $( this ).addClass( 'active' );
                    $( '.reset-filter' ).show();
                    
                    // filter overview
                    if ( $( this ).parent().parent().parent().attr( 'id' ) === 'overview' ) {
                        // setup data
                        _apiCall = _getAllTagsOfARange( _currentNerPageRange, _currentNerType );
                        
                        _promise = viewer.helper.getRemoteData( _apiCall );
                        
                        _promise.then( function( json ) {
                            _json = json;
                            
                            _renderOverview( _json );
                            
                            // hide select all
                            if ( $( this ).parent().hasClass( 'reset-filter' ) ) {
                                $( this ).parent().hide();
                            }
                            // set icons to active if "all" is selected
                            if ( _currentNerType === '-' ) {
                                $( '.facetting-trigger' ).addClass( 'active' );
                            }
                        } ).then( null, function( error ) {
                            $( '.facetting-content' ).empty().append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' '
                                    + error.statusText, false ) );
                            console.error( 'ERROR: viewer.nerFacetting.init - ', error );
                        } );
                    }
                    // filter section
                    else {
                        _renderSection();
                        
                        // hide select all
                        if ( $( this ).parent().hasClass( 'reset-filter' ) ) {
                            $( this ).parent().hide();
                        }
                        // set icons to active if "all" is selected
                        if ( _currentNerType === '-' ) {
                            $( '.facetting-trigger' ).addClass( 'active' );
                        }
                        // reset section stripe
                        $( _defaults.sliderSectionStripe ).css( 'top', '0px' );
                    }
                    
                } );
            }
            else {
                $( '.facetting-content' ).empty().append( viewer.helper
                        .renderAlert( 'alert-danger', '<strong>Deactivated: </strong>Not possible to write in local Storage!', false ) );
            }
        }
    };
    
    /**
     * Method to render the NER overview.
     * 
     * @method _renderOverview
     * @param {Object} data A JSON-Object.
     * @returns {Sting} A HTML-String which renders the overview.
     */
    function _renderOverview( data ) {
        if ( _debug ) {
            console.log( '---------- _renderOverview() ----------' );
            console.log( '_renderOverview: data = ', data );
        }
        
        _html = '';
        _html += '<ul class="overview-scale">';
        
        // render page number
        $.each( data.pages, function( p, page ) {
            _html += '<li>';
            _html += '<div class="page-number">';
            if ( data.rangeSize == 1 ) {
                if ( _defaults.currentPage === 'nerfacetting' ) {
                    _html += '<a href="' + _defaults.baseUrl + '/image/' + _defaults.workId + '/' + page.pageOrder + '/">';
                }
                else {
                    _html += '<a href="' + _defaults.baseUrl + '/' + _defaults.currentPage + '/' + _defaults.workId + '/' + page.pageOrder + '/">';
                }
                _html += page.pageOrder;
                _html += '</a>';
            }
            else {
                if ( _defaults.currentPage === 'nerfacetting' ) {
                    if ( page.firstPage !== undefined || page.lastPage !== undefined ) {
                        _html += '<a href="' + _defaults.baseUrl + '/image/' + _defaults.workId + '/' + page.firstPage + '/">';
                        _html += page.firstPage + '-' + page.lastPage;
                        _html += '</a>';
                    }
                    else {
                        _html += '<a href="' + _defaults.baseUrl + '/image/' + _defaults.workId + '/' + page.pageOrder + '/">';
                        _html += page.pageOrder;
                        _html += '</a>';
                    }
                }
                else {
                    if ( page.firstPage !== undefined || page.lastPage !== undefined ) {
                        _html += '<a href="' + _defaults.baseUrl + '/' + _defaults.currentPage + '/' + _defaults.workId + '/' + page.firstPage + '/">';
                        _html += page.firstPage + '-' + page.lastPage;
                        _html += '</a>';
                    }
                    else {
                        _html += '<a href="' + _defaults.baseUrl + '/' + _defaults.currentPage + '/' + _defaults.workId + '/' + page.pageOrder + '/">';
                        _html += page.pageOrder;
                        _html += '</a>';
                    }
                }
            }
            _html += '</div>';
            _html += '<div class="tag-container">';
            
            // render tags
            if ( page.tags.length === 0 || page.tags.length === 'undefined' ) {
                _html += '<span class="page-tag empty">' + _defaults.msg.emptyTag + '</span>';
            }
            else {
                $.each( page.tags, function( t, tag ) {
                    _html += '<span class="page-tag ' + tag.type + '">' + tag.value + '</span>';
                } );
            }
            _html += '</div>';
            _html += '</li>';
        } );
        _html += '</ul>';
        
        $( _defaults.overviewContent ).hide().html( _html ).find( '.tag-container' ).each( function() {
            $( this ).children( '.page-tag' ).slice( _defaults.recurrenceNumber ).remove();
        } );
        $( _defaults.overviewContent ).show();
        
        // hide loader
        $( _defaults.loader ).hide();
        
        $( '.tag-container' ).on( {
            'mouseover': function() {
                var $this = $( this );
                
                _showCurrentTags( $this );
            },
            'mouseout': function() {
                _hideCurrentTags();
            }
        } );
    }
    
    /**
     * Method which shows the current tag row in a tooltip.
     * 
     * @method _showCurrentTags
     * @param {Object} $obj An jQuery object of the current tag row.
     */
    function _showCurrentTags( $obj ) {
        var content = $obj.html();
        var pos = $obj.position();
        
        if ( _defaults.sidebarRight ) {
            if ( _defaults.currentPage === 'nerfacetting' ) {
                $( _defaults.currentTags ).html( content ).css( {
                    'display': 'block',
                    'top': pos.top + 25 + 'px',
                } );
            }
            else {
                $( _defaults.currentTags ).addClass( 'right' ).html( content ).css( {
                    'display': 'block',
                    'top': pos.top - 2 + 'px',
                    'left': 'auto',
                    'right': '100%'
                } );
            }
        }
        else {
            if ( _defaults.currentPage === 'nerfacetting' ) {
                $( _defaults.currentTags ).html( content ).css( {
                    'display': 'block',
                    'top': pos.top + 25 + 'px'
                } );
            }
            else {
                $( _defaults.currentTags ).html( content ).css( {
                    'display': 'block',
                    'top': pos.top - 2 + 'px'
                } );
            }
        }
    }
    
    /**
     * Method which hides the current tag row tooltip.
     * 
     * @method _hideCurrentTags
     */
    function _hideCurrentTags() {
        $( _defaults.currentTags ).hide();
    }
    
    /**
     * Method to render the NER section.
     * 
     * @method _renderSection
     * @param {Object} data A JSON-Object.
     */
    function _renderSection() {
        if ( _debug ) {
            console.log( '---------- _renderSection() ----------' );
            console.log( '_renderSection: _currentNerPageRange = ', _currentNerPageRange );
            console.log( '_renderSection: _currentNerType = ', _currentNerType );
        }
        
        // set values
        _apiCall = _getAllTags();
        
        _promise = viewer.helper.getRemoteData( _apiCall );
        
        _promise.then( function( workCall ) {
            _pageCount = _getPageCount( workCall );
            
            if ( _currentNerPageRange === null || _currentNerPageRange === '' ) {
                _currentNerPageRange = localStorage.getItem( 'currentNerPageRange' );
            }
            if ( _currentNerType === null || _currentNerType === '' ) {
                _currentNerType = localStorage.getItem( 'currentNerType' )
            }
            
            // render page count to scale
            if ( _defaults.currentPage === 'nerfacetting' ) {
                $( '#sliderScale .scale-page.end' ).html( _pageCount );
            }
            else {
                if ( _pageCount > 1000 ) {
                    $( '#sliderScale .scale-page.end' ).html( '999+' );
                }
                else {
                    $( '#sliderScale .scale-page.end' ).html( _pageCount );
                }
            }
            
            // init slider
            $( _defaults.slider ).slider( {
                orientation: "vertical",
                range: false,
                min: 1,
                max: _pageCount,
                value: _pageCount,
                slide: function( event, ui ) {
                    _sliderHandlePosition = $( _defaults.sliderHandle ).position();
                    _scaleValue = ( _pageCount + 1 ) - ui.value;
                    
                    // show bubble
                    $( '.page-bubble' ).show();
                    _renderPageBubble( _scaleValue );
                },
                start: function() {
                    _sliderHandlePosition = $( _defaults.sliderHandle ).position();
                    _movedSliderHandlePosition = _sliderHandlePosition.top;
                },
                stop: function( event, ui ) {
                    _currentNerType = localStorage.getItem( 'currentNerType' );
                    _sliderScaleHeight = $( _defaults.sliderScale ).height();
                    
                    // set position of section stripe
                    if ( _currentNerPageRange > _pageCount ) {
                        $( _defaults.sliderSectionStripe ).css( {
                            'top': '0px',
                            'height': '600px'
                        } );
                    }
                    else {
                        if ( _sliderHandlePosition.top < 100 ) {
                            $( _defaults.sliderSectionStripe ).animate( {
                                'top': '0px',
                                'height': '100px'
                            } );
                        }
                        else if ( _sliderHandlePosition.top > 100 ) {
                            if ( _sliderHandlePosition.top > 500 ) {
                                $( _defaults.sliderSectionStripe ).animate( {
                                    'top': ( _sliderScaleHeight - 100 ) + 'px',
                                    'height': '100px'
                                } );
                            }
                            else {
                                if ( _movedSliderHandlePosition < _sliderHandlePosition.top ) {
                                    $( _defaults.sliderSectionStripe ).animate( {
                                        'top': _sliderHandlePosition.top - 25 + 'px',
                                        'height': '100px'
                                    } );
                                }
                                else {
                                    $( _defaults.sliderSectionStripe ).animate( {
                                        'top': _sliderHandlePosition.top - 50 + 'px',
                                        'height': '100px'
                                    } );
                                }
                            }
                        }
                    }
                    
                    // render tags
                    switch ( _currentNerPageRange ) {
                        case '5':
                            _start = _scaleValue - 2;
                            _end = _scaleValue + 3;
                            
                            while ( _start < 1 ) {
                                _start++;
                                _end++;
                            }
                            while ( _end > _pageCount ) {
                                _start--;
                                _end--;
                            }
                            
                            _apiCall = _getAllTagsOfPageSection( _start, _end, _currentNerType );
                            break;
                        case '10':
                            _start = _scaleValue - 5;
                            _end = _scaleValue + 5;
                            
                            while ( _start < 1 ) {
                                _start++;
                                _end++;
                            }
                            while ( _end > _pageCount ) {
                                _start--;
                                _end--;
                            }
                            
                            _apiCall = _getAllTagsOfPageSection( _start, _end, _currentNerType );
                            break;
                        case '50':
                            _start = _scaleValue - 25;
                            _end = _scaleValue + 25;
                            
                            while ( _start < 1 ) {
                                _start++;
                                _end++;
                            }
                            while ( _end > _pageCount ) {
                                _start--;
                                _end--;
                            }
                            
                            _apiCall = _getAllTagsOfPageSection( _start, _end, _currentNerType );
                            break;
                        case '100':
                            _start = _scaleValue - 50;
                            _end = _scaleValue + 50;
                            
                            while ( _start < 1 ) {
                                _start++;
                                _end++;
                            }
                            while ( _end > _pageCount ) {
                                _start--;
                                _end--;
                            }
                            
                            _apiCall = _getAllTagsOfPageSection( _start, _end, _currentNerType );
                            break;
                    }
                    
                    _promise = viewer.helper.getRemoteData( _apiCall );
                    
                    _promise.then( function( json ) {
                        _json = json;
                        
                        _html = _renderSectionTags( _json );
                        
                        if ( _html === '' ) {
                            $( _defaults.sectionTags ).hide().html( viewer.helper.renderAlert( 'alert-warning', _defaults.msg.emptyTag, false ) ).show();
                        }
                        else {
                            $( _defaults.sectionTags ).hide().html( _html ).each( function() {
                                $( this ).children( '.page-tag' ).slice( _defaults.recurrenceSectionNumber ).remove();
                            } );
                            $( _defaults.sectionTags ).show();
                        }
                        
                        // hide bubble
                        $( '.page-bubble' ).fadeOut();
                        
                    } ).then( null, function( error ) {
                        $( '.facetting-content' ).empty().append( viewer.helper
                                .renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                        console.error( 'ERROR: viewer.nerFacetting.init - ', error );
                    } );
                }
            } );
            
            // render section tags
            _apiCall = _getAllTagsOfPageSection( 0, _currentNerPageRange, _currentNerType );
            
            _promise = viewer.helper.getRemoteData( _apiCall );
            
            _promise.then( function( json ) {
                _json = json;
                
                _html = _renderSectionTags( _json );
                
                if ( _html === '' ) {
                    $( _defaults.sectionTags ).hide().html( viewer.helper.renderAlert( 'alert-warning', _defaults.msg.emptyTag, false ) ).show();
                }
                else {
                    $( _defaults.sectionTags ).hide().html( _html ).each( function() {
                        $( this ).children( '.page-tag' ).slice( _defaults.recurrenceSectionNumber ).remove();
                    } );
                    $( _defaults.sectionTags ).show();
                }
                
                // hide loader
                $( _defaults.loader ).hide();
                
            } )
                    .then( null, function( error ) {
                        $( '.facetting-content' ).empty().append( viewer.helper
                                .renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                        console.error( 'ERROR: viewer.nerFacetting.init - ', error );
                    } );
            
        } ).then( null, function( error ) {
            $( '.facetting-content' ).empty().append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
            console.error( 'ERROR: viewer.nerFacetting.init - ', error );
        } );
    }
    
    /**
     * Method which renders the tags in the section area.
     * 
     * @method _renderSectionTags
     * @param {Object} data A JSON-Object.
     * @returns {Sting} A HTML-String which renders the tag section.
     */
    function _renderSectionTags( data ) {
        if ( _debug ) {
            console.log( '---------- _renderSectionTags() ----------' );
            console.log( '_renderSectionTags: data - ', data );
        }
        
        _html = '';
        // render tags
        $.each( data.pages, function( p, page ) {
            if ( page.tags.length === 0 || page.tags.length === 'undefined' ) {
                _html += '';
            }
            else {
                $.each( page.tags, function( t, tag ) {
                    if ( _defaults.currentPage === 'nerfacetting' ) {
                        if ( tag.counter < 10 ) {
                            _html += '<span class="page-tag ' + tag.type + '" style="font-size: 1.' + tag.counter + 'rem;">' + tag.value + '</span>';
                        }
                        else {
                            _html += '<span class="page-tag ' + tag.type + '" style="font-size: 2rem;">' + tag.value + '</span>';
                        }
                    }
                    else {
                        if ( tag.counter < 10 ) {
                            _html += '<span class="page-tag ' + tag.type + '" style="font-size: 1' + tag.counter + 'px;">' + tag.value + '</span>';
                        }
                        else {
                            _html += '<span class="page-tag ' + tag.type + '" style="font-size: 19px;">' + tag.value + '</span>';
                        }
                    }
                } );
            }
        } );
        
        return _html;
    }
    
    /**
     * Method which renders a span showing the current page section.
     * 
     * @method _renderPageBubble
     * @param {Number} page The current pagenumber.
     */
    function _renderPageBubble( page ) {
        if ( _debug ) {
            console.log( '---------- _renderPageBubble() ----------' );
            console.log( '_renderPageBubble: page - ', page );
        }
        
        var pageBubble = '';
        
        switch ( _currentNerPageRange ) {
            case '5':
                _start = page - 2;
                _end = page + 3;
                
                while ( _start < 1 ) {
                    _start++;
                    _end++;
                }
                while ( _end > _pageCount ) {
                    _start--;
                    _end--;
                }
                
                pageBubble += '<span class="page-bubble">' + _start + '-' + _end + '</span>';
                break;
            case '10':
                _start = page - 5;
                _end = page + 5;
                
                while ( _start < 1 ) {
                    _start++;
                    _end++;
                }
                while ( _end > _pageCount ) {
                    _start--;
                    _end--;
                }
                
                pageBubble += '<span class="page-bubble">' + _start + '-' + _end + '</span>';
                break;
            case '50':
                _start = page - 25;
                _end = page + 25;
                
                while ( _start < 1 ) {
                    _start++;
                    _end++;
                }
                while ( _end > _pageCount ) {
                    _start--;
                    _end--;
                }
                
                pageBubble += '<span class="page-bubble">' + _start + '-' + _end + '</span>';
                break;
            case '100':
                _start = page - 50;
                _end = page + 50;
                
                while ( _start < 1 ) {
                    _start++;
                    _end++;
                }
                while ( _end > _pageCount ) {
                    _start--;
                    _end--;
                }
                
                pageBubble += '<span class="page-bubble">' + _start + '-' + _end + '</span>';
                break;
        }
        
        $( '#sliderVertical .ui-slider-handle' ).html( pageBubble );
    }
    
    /**
     * Method which returns the page count of the current work.
     * 
     * @method _getPageCount
     * @param {Object} work The current wor object.
     * @returns {Number} The page count of the current work.
     */
    function _getPageCount( work ) {
        if ( _debug ) {
            console.log( '---------- _getPageCount() ----------' );
            console.log( '_getPageCount: work - ', work );
        }
        
        return work.pages.length;
    }
    
    /**
     * Method which resets all facetting icons to default
     * 
     * @method _resetFacettingIcons
     */
    function _resetFacettingIcons() {
        if ( _debug ) {
            console.log( '---------- _resetFacettingIcons() ----------' );
        }
        
        $( '.facetting-trigger' ).addClass( 'active' );
        $( '.reset-filter' ).hide();
    }
    
    /**
     * Method which removes all set local storage values.
     * 
     * @method _cleanUpLocalStorage
     */
    function _cleanUpLocalStorage() {
        if ( _debug ) {
            console.log( '---------- _cleanUpLocalStorage() ----------' );
        }
        
        localStorage.removeItem( 'currentNerPageRange' );
        localStorage.removeItem( 'currentNerType' );
    }
    
    /**
     * API-Calls
     */
    // get all tags from all pages: /rest/ner/tags/{pi}/
    function _getAllTags() {
        return _defaults.baseUrl + _defaults.apiUrl + _defaults.workId;
    }
    
    // get all tags of a range: /viewer/rest/ner/tags/ranges/{range}/{type}/{pi}/
    function _getAllTagsOfARange( range, type ) {
        return _defaults.baseUrl + _defaults.apiUrl + 'ranges/' + range + '/' + type + '/' + _defaults.workId + '/';
    }
    
    // get all tags sorted of type: /rest/ner/tags/{type}/{pi}/
    function _getAllTagsOfAType( type ) {
        return _defaults.baseUrl + _defaults.apiUrl + type + '/' + _defaults.workId + '/';
    }
    
    // get all tags sorted of recurrence (asc/desc):
    // /rest/ner/tags/recurrence/{type}/{order}/{pi}/
    function _getAllTagsOfRecurrence( type, order ) {
        if ( type === '-' ) {
            return _defaults.baseUrl + _defaults.apiUrl + 'recurrence/-/' + order + '/' + _defaults.workId + '/';
        }
        else {
            return _defaults.baseUrl + _defaults.apiUrl + 'recurrence/' + type + '/' + order + '/' + _defaults.workId + '/';
        }
    }
    
    // get all tags sorted of page section: /rest/ner/tags/{start}/{end}/{pi}/
    function _getAllTagsOfPageSection( start, end, type ) {
        return _defaults.baseUrl + _defaults.apiUrl + start + '/' + end + '/' + type + '/' + _defaults.workId + '/';
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    // define variables
    var _debug = false;
    var _defaults = {
        path: null,
        lang: {}
    };
    var _contextPath = null;
    var _lang = null;
    
    viewer.nerFulltext = {
        /**
         * Method which initializes the NER Popover methods.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.path The rootpath of the application.
         * @example
         * 
         * <pre>
         * var nerConfig = {
         *     path: '#{request.contextPath}'
         * };
         * 
         * viewerJS.nerFulltext.init( nerConfig );
         * </pre>
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.nerFulltext.init' );
                console.log( '##############################' );
                console.log( 'viewer.nerFulltext.init: config - ' );
                console.log( config );
            }
            
            $.extend( true, _defaults, config );
            
            _initNerPopover( _defaults.path );
        }
    };
    
    /**
     * Method which fetches data from the API and returns an JSON object.
     * 
     * @method _getRemoteData
     * @param {String} target The API call URL.
     * @returns {Object} The JSON object with the API data.
     * 
     */
    function _getRemoteData( target ) {
        if ( _debug ) {
            console.log( 'viewer.nerFulltext _getRemoteData: target - ' );
            console.log( target );
        }
        
        // show preloader for current element
        $( '.ner-detail-loader', target ).css( {
            display: 'inline-block'
        } );
        
        // AJAX call
        var data = $.ajax( {
            url: decodeURI( $( target ).attr( 'data-remotecontent' ) ),
            type: 'POST',
            dataType: 'JSON',
            async: false,
            complete: function() {
                $( '.ner-detail-loader' ).hide();
            }
        } ).responseText;
        
        return data;
    }
    
    /**
     * Method which initializes the events for the NER-Popovers.
     * 
     * @method _initNerPopover
     * @param {String} path The root path of the application.
     * 
     */
    function _initNerPopover( path ) {
        if ( _debug ) {
            console.log( 'viewer.nerFulltext _initNerPopover: path - ' + path );
        }
        
        var data, position, title, triggerCoords, textBox, textBoxPosition, textBoxCoords;
        
        $( '.ner-trigger' ).on( 'click', function() {
            $( 'body' ).find( '.ner-popover-pointer' ).hide();
            $( 'body' ).find( '.ner-popover' ).remove();
            data = _getRemoteData( $( this ) );
            position = $( this ).position();
            triggerCoords = {
                top: position.top,
                left: position.left,
                width: $( this ).outerWidth()
            };
            textBox = $( '#view_fulltext_wrapp' );
            textBoxPosition = textBox.position();
            textBoxCoords = {
                top: textBoxPosition.top,
                left: 0,
                right: textBoxPosition.left + textBox.outerWidth()
            };
            title = $( this ).attr( 'title' );
            
            textBox.append( _renderNerPopover( data, _calculateNerPopoverPosition( triggerCoords, textBoxCoords ), title, path ) );
            
            if ( $( '.ner-popover' ) ) {
                $( this ).find( '.ner-popover-pointer' ).show();
                _removeNerPopover();
                
                $( '.ner-detail-trigger' ).on( 'click', function() {
                    data = _getRemoteData( $( this ) );
                    title = $( this ).attr( 'title' );
                    
                    $( this ).parent().next( '.ner-popover-detail' ).html( _renderNerPopoverDetail( data, title ) );
                } );
            }
        } );
    }
    
    /**
     * Method which renders a popover to the DOM.
     * 
     * @method _renderNerPopover
     * @param {Object} data The JSON object from the API.
     * @param {Object} position A jQuery object including the position of the clicked
     * trigger.
     * @param {String} title The value of the title attribute from the clicked trigger.
     * @param {String} path The root path of the application.
     * @returns {String} The HTML string which renders the popover.
     * 
     */
    function _renderNerPopover( data, position, title, path ) {
        if ( _debug ) {
            console.log( 'viewer.nerFulltext _renderNerPopover: data - ' );
            console.log( data );
            console.log( 'viewer.nerFulltext _renderNerPopover: position - ' );
            console.log( position );
            console.log( 'viewer.nerFulltext _renderNerPopover: title - ' + title );
            console.log( 'viewer.nerFulltext _renderNerPopover: path - ' + path );
        }
        
        var positionTop = position.top;
        var positionLeft = position.left;
        var popover = '';
        
        popover += '<div class="ner-popover" style="top:' + positionTop + 'px; left:' + positionLeft + 'px">';
        popover += '<div class="ner-popover-close" title="Fenster schlie&szlig;en">&times;</div>';
        popover += '<div class="ner-popover-header"><h4>' + title + '</h4></div>';
        popover += '<div class="ner-popover-body">';
        popover += '<dl class="dl-horizontal">';
        $.each( $.parseJSON( data ), function( i, object ) {
            $.each( object, function( property, value ) {
                popover += '<dt title="' + property + '">' + property + ':</dt>';
                var objValue = '';
                $.each( value, function( p, v ) {
                    var icon = '';
                    
                    switch ( property ) {
                        case 'Beruf':
                            icon = 'glyphicon-briefcase';
                            break;
                        case 'Verwandte Begriffe':
                            icon = 'glyphicon-briefcase';
                            break;
                        case 'Sohn':
                            icon = 'glyphicon-user';
                            break;
                        case 'Vater':
                            icon = 'glyphicon-user';
                            break;
                        case 'Geburtsort':
                            icon = 'glyphicon-map-marker';
                            break;
                        case 'Sterbeort':
                            icon = 'glyphicon-map-marker';
                            break;
                    }
                    
                    if ( v.url ) {
                        objValue += '<span ';
                        objValue += 'class="ner-detail-trigger" ';
                        objValue += 'title="' + v.text + '" ';
                        objValue += 'tabindex="-1"';
                        objValue += 'data-remotecontent="' + path + '/api?action=normdata&url=' + v.url + '">';
                        objValue += '<span class="glyphicon ' + icon + '"></span>&nbsp;';
                        objValue += v.text;
                        objValue += '<span class="ner-detail-loader"></span>';
                        objValue += '</span>';
                    }
                    else {
                        if ( property === 'URI' ) {
                            objValue += '<a href="' + v.text + '" target="_blank">' + v.text + '</a>';
                        }
                        else {
                            objValue += v.text;
                        }
                    }
                    
                    objValue += '<br />';
                } );
                popover += '<dd>' + objValue + '</dd>';
                popover += '<div class="ner-popover-detail"></div>';
            } );
        } );
        popover += '</dl>';
        popover += '</div>';
        popover += '</div>';
        
        return popover;
    }
    
    /**
     * Method which renders detail information into the popover.
     * 
     * @method _renderNerPopoverDetail
     * @param {Object} data The JSON object from the API.
     * @param {String} title The value of the title attribute from the clicked trigger.
     * @returns {String} The HTML string which renders the details.
     * 
     */
    function _renderNerPopoverDetail( data, title ) {
        if ( _debug ) {
            console.log( 'viewer.nerFulltext _renderNerPopoverDetail: data - ' );
            console.log( data );
            console.log( 'viewer.nerFulltext _renderNerPopoverDetail: title - ' + title );
        }
        
        var popoverDetail = '';
        
        popoverDetail += '<div class="ner-popover-detail">';
        popoverDetail += '<div class="ner-popover-detail-header"><h4>' + title + '</h4></div>';
        popoverDetail += '<div class="ner-popover-detail-body">';
        popoverDetail += '<dl class="dl-horizontal">';
        $.each( $.parseJSON( data ), function( i, object ) {
            $.each( object, function( property, value ) {
                popoverDetail += '<dt title="' + property + '">' + property + ':</dt>';
                var objValue = '';
                $.each( value, function( p, v ) {
                    if ( property === 'URI' ) {
                        objValue += '<a href="' + v.text + '" target="_blank">' + v.text + '</a>';
                    }
                    else {
                        objValue += v.text;
                    }
                    
                    objValue += '<br />';
                } );
                popoverDetail += '<dd>' + objValue + '</dd>';
                popoverDetail += '<div class="ner-popover-detail"></div>';
            } );
        } );
        popoverDetail += '</dl>';
        popoverDetail += '</div>';
        popoverDetail += '</div>';
        
        return popoverDetail;
    }
    
    /**
     * Method which calculates the position of the popover in the DOM.
     * 
     * @method _calculateNerPopoverPosition
     * @param {Object} triggerCoords A jQuery object including the position of the clicked
     * trigger.
     * @param {Object} textBoxCoords A jQuery object including the position of the parent
     * DIV.
     * @returns {Object} An object which includes the position of the popover.
     * 
     */
    function _calculateNerPopoverPosition( triggerCoords, textBoxCoords ) {
        if ( _debug ) {
            console.log( 'viewer.nerFulltext _calculateNerPopoverPosition: triggerCoords - ' );
            console.log( triggerCoords );
            console.log( 'viewer.nerFulltext _calculateNerPopoverPosition: textBoxCoords - ' );
            console.log( textBoxCoords );
        }
        
        var poLeftBorder = triggerCoords.left - ( 150 - ( triggerCoords.width / 2 ) ), poRightBorder = poLeftBorder + 300, tbLeftBorder = textBoxCoords.left, tbRightBorder = textBoxCoords.right, poTop, poLeft = poLeftBorder;
        
        poTop = triggerCoords.top + 27;
        
        if ( poLeftBorder <= tbLeftBorder ) {
            poLeft = tbLeftBorder;
        }
        
        if ( poRightBorder >= tbRightBorder ) {
            poLeft = textBoxCoords.right - 300;
        }
        
        return {
            top: poTop,
            left: poLeft
        };
    }
    
    /**
     * Method to remove a popover from the DOM.
     * 
     * @method _removeNerPopover
     * 
     */
    function _removeNerPopover() {
        if ( _debug ) {
            console.log( 'viewer.nerFulltext _removeNerPopover' );
        }
        
        $( '.ner-popover-close' ).on( 'click', function() {
            $( 'body' ).find( '.ner-popover-pointer' ).hide();
            $( this ).parent().remove();
        } );
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _data = null;
    var _dataURL = '';
    var _data = '';
    var _linkPos = null;
    var _popover = '';
    var _id = '';
    var _$this = null;
    var _normdataIcon = null;
    var _preloader = null;
    var _defaults = {
        id: 0,
        path: null,
        lang: {},
        elemWrapper: null
    };
    
    viewer.normdata = {
        /**
         * Method to initialize the timematrix slider and the events which builds the
         * matrix and popovers.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.id The starting ID of the popover.
         * @param {String} config.path The rootpath of the application.
         * @param {Object} config.lang An object of localized strings.
         * @param {Object} config.elemWrapper An jQuery object of the wrapper DIV.
         * @example
         * 
         * <pre>
         * var normdataConfig = {
         *     path: '#{request.contextPath}',
         *     lang: {
         *         popoverTitle: '#{msg.normdataPopverTitle}',
         *         popoverClose: '#{msg.normdataPopoverClose}'
         *     },
         *     elemWrapper: $( '#metadataElementWrapper' )
         * };
         * 
         * viewerJS.normdata.init( normdataConfig );
         * </pre>
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.normdata.init' );
                console.log( '##############################' );
                console.log( 'viewer.normdata.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // hide close icons
            $( '.closeAllPopovers' ).hide();
            
            // first level click
            $( '.normdataLink' ).on( 'click', function() {
                _$this = $( this );
                
                _$this.off( 'focus' );
                
                _renderPopoverAction( _$this, _defaults.id );
            } );
        },
    };
    
    /**
     * Method which executes the click event action of the popover.
     * 
     * @method _renderPopoverAction
     * @param {Object} $Obj The jQuery object of the current clicked link.
     * @param {String} id The current id of the popover.
     */
    function _renderPopoverAction( $Obj, id ) {
        if ( _debug ) {
            console.log( '---------- _renderPopoverAction() ----------' );
            console.log( '_renderPopoverAction: $Obj = ', $Obj );
            console.log( '_renderPopoverAction: id = ', id );
        }
        
        _normdataIcon = $Obj.find( '.fa-list-ul' );
        _preloader = $Obj.find( '.normdata-preloader' );
        
        // set variables
        _dataURL = $Obj.attr( 'data-remotecontent' );
        _data = _getRemoteData( _dataURL, _preloader, _normdataIcon );
        _linkPos = $Obj.offset();
        _popover = _buildPopover( _data, id );
        
        if ( _debug ) {
            console.log( '_renderPopoverAction: _dataURL = ', _dataURL );
            console.log( '_renderPopoverAction: _data = ', _data );
            console.log( '_renderPopoverAction: _linkPos = ', _linkPos );
        }
        
        // append popover to body
        $( 'body' ).append( _popover );
        
        // set popover position
        _calculatePopoverPosition( id, _linkPos, $Obj );
        
        // show popover
        $( document ).find( '#normdataPopover-' + id ).hide().fadeIn( 'fast', function() {
            // disable source button
            $Obj.attr( 'disabled', 'disabled' ).addClass( 'disabled' );
            
            // hide tooltip
            $Obj.tooltip( 'hide' );
            
            // set event for nth level popovers
            $( '.normdataDetailLink' ).off( 'click' ).on( 'click', function() {
                _$this = $( this );
                _renderPopoverAction( _$this, _defaults.id );
            } );
        } ).draggable();
        
        // init close method
        _closeNormdataPopover( $Obj );
        
        // increment id
        _defaults.id++;
        
        // init close all method
        _closeAllNormdataPopovers( $Obj );
    }
    
    /**
     * Returns an HTML-String which renders the fetched data into a popover.
     * 
     * @method _buildPopover
     * @param {Object} data The JSON-Object which includes the data.
     * @param {String} id The incremented id of the popover.
     * @returns {String} The HTML-String with the fetched data.
     */
    function _buildPopover( data, id ) {
        if ( _debug ) {
            console.log( '---------- _buildPopover() ----------' );
            console.log( '_buildPopover: data = ', data );
            console.log( '_buildPopover: id = ', id );
        }
        
        var html = '';
        
        html += '<div id="normdataPopover-' + id + '" class="normdata-popover">';
        html += '<div class="normdata-popover-title">';
        html += '<h4>' + _defaults.lang.popoverTitle + '</h4>';
        html += '<span class="normdata-popover-close glyphicon glyphicon-remove" title="' + _defaults.lang.popoverClose + '"></span>';
        html += '</div>';
        html += '<div class="normdata-popover-content">';
        html += '<dl class="dl-horizontal">';
        $.each( data, function( i, object ) {
            $.each( object, function( property, value ) {
                html += '<dt title="' + property + '">' + property + '</dt>';
                html += '<dd>';
                $.each( value, function( p, v ) {
                    if ( v.text ) {
                        if ( property === "URI" ) {
                            html += '<a href="' + v.text + '" target="_blank">';
                            html += v.text;
                            html += '</a>';
                        }
                        else {
                            html += v.text;
                        }
                    }
                    if ( v.identifier ) {
                        html += '<a href="' + _defaults.path + '/search/-/' + v.identifier + '/1/">';
                        html += '<span class="glyphicon glyphicon-search"></span>';
                        html += '</a>';
                    }
                    if ( v.url ) {
                        html += '<button type="button" class="normdataDetailLink" data-remotecontent="';
                        html += _defaults.path;
                        html += '/api?action=normdata&amp;url=';
                        html += v.url;
                        html += '" title="' + _defaults.lang.showNormdata + '">';
                        html += '<i class="fa fa-list-ul" aria-hidden="true"></i>';
                        html += '<div class="normdata-preloader"></div>';
                        html += '</button>';
                    }
                    html += '<br />';
                } );
                html += '</dd>'
            } );
        } );
        html += "</dl>";
        html += "</div>";
        html += "</div>";
        
        return html;
    }
    
    /**
     * Sets the position to the first level popovers.
     * 
     * @method _calculateFirstLevelPopoverPosition
     * @param {String} id The incremented id of the popover.
     * @param {Object} pos An Object with the current position oft the clicked link.
     * @param {Object} $Obj An jQuery-Object of the clicked link.
     * 
     */
    function _calculatePopoverPosition( id, pos, $Obj ) {
        if ( _debug ) {
            console.log( '---------- _calculatePopoverPosition() ----------' );
            console.log( '_calculatePopoverPosition: id = ', id );
            console.log( '_calculatePopoverPosition: pos = ', pos );
            console.log( '_calculatePopoverPosition: $Obj = ', $Obj );
        }
        
        var _bodyWidth = $( 'body' ).outerWidth();
        var _popoverWidth = $( '#normdataPopover-' + id ).outerWidth();
        var _popoverRight = pos.left + _popoverWidth;
        
        if ( _debug ) {
            console.log( '_calculatePopoverPosition: _bodyWidth = ', _bodyWidth );
            console.log( '_calculatePopoverPosition: _popoverWidth = ', _popoverWidth );
            console.log( '_calculatePopoverPosition: _popoverLeft = ', pos.left );
            console.log( '_calculatePopoverPosition: _popoverRight = ', _popoverRight );
        }
        
        if ( _popoverRight > _bodyWidth ) {
            var _diff = _popoverRight - _bodyWidth;
            
            if ( _debug ) {
                console.log( '_calculatePopoverPosition: _diff = ', _diff );
            }
            
            $( document ).find( '#normdataPopover-' + id ).css( {
                top: pos.top + $Obj.outerHeight() + 5,
                left: pos.left - _diff
            } );
        }
        else {
            $( document ).find( '#normdataPopover-' + id ).css( {
                top: pos.top + $Obj.outerHeight() + 5,
                left: pos.left
            } );
        }
    }
    
    /**
     * Removes current popover from the DOM on click.
     * 
     * @method _closeNormdataPopover
     * 
     */
    function _closeNormdataPopover( $Obj ) {
        if ( _debug ) {
            console.log( '---------- _closeNormdataPopover() ----------' );
            console.log( '_closeNormdataPopover: $Obj = ', $Obj );
        }
        
        $( document ).find( '.normdata-popover-close' ).on( 'click', function() {
            $( this ).parent().parent().remove();
            $Obj.removeAttr( 'disabled' ).removeClass( 'disabled' );
            
            if ( $( '.normdata-popover' ).length < 1 ) {
                $( '.closeAllPopovers' ).hide();
            }
        } );
    }
    
    /**
     * Removes all popovers from the DOM on click.
     * 
     * @method _closeAllNormdataPopovers
     * 
     */
    function _closeAllNormdataPopovers( $Obj ) {
        if ( _debug ) {
            console.log( '---------- _closeAllNormdataPopovers() ----------' );
            console.log( '_closeAllNormdataPopovers: $Obj = ', $Obj );
        }
        
        var _close = $Obj.parent().find( 'i.closeAllPopovers' );
        
        if ( $( '.normdata-popover' ).length > 0 ) {
            _close.show();
            _close.on( 'click', function() {
                // close all popovers
                $( '.normdata-popover' ).each( function() {
                    $( this ).remove();
                } );
                
                // hide all close icons
                $( '.closeAllPopovers' ).each( function() {
                    $( this ).hide();
                } );
                
                // set trigger to enable
                $( '.normdataLink' ).removeAttr( 'disabled' ).removeClass( 'disabled' );
            } );
        }
        else {
            _close.hide();
        }
    }
    
    /**
     * Returns an JSON object from a API call.
     * 
     * @method _getRemoteData
     * @returns {Object} The JSON object with the API data.
     */
    function _getRemoteData( url, loader, icon ) {
        if ( _debug ) {
            console.log( '---------- _getRemoteData() ----------' );
            console.log( '_getRemoteData: url = ', url );
            console.log( '_getRemoteData: loader = ', loader );
            console.log( '_getRemoteData: icon = ', icon );
        }
        
        loader.show();
        icon.hide();
        
        var data = $.ajax( {
            url: decodeURI( url ),
            type: "POST",
            dataType: "JSON",
            async: false,
            success: function() {
                loader.hide();
                icon.show();
            }
        } ).responseText;
        
        return jQuery.parseJSON( data );
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _elem = null;
    var _text = null;
    
    viewer.pageScroll = {
        /**
         * Initializes the animated pagescroll.
         * 
         * @method init
         * @param {String} obj The selector of the jQuery object.
         * @param {String} anchor The name of the anchor to scroll to.
         */
        init: function( obj, anchor ) {
            _elem = $( obj );
            _text = anchor;
            
            // eventlistener
            $( window ).on( 'scroll', function() {
                if ( window.pageYOffset > 200 ) {
                    _elem.fadeIn();
                }
                else {
                    _elem.hide();
                }
            } );
            
            _elem.on( 'click', function() {
                _scrollPage( _text );
            } );
        }
    };
    
    /**
     * Method which scrolls the page animated.
     * 
     * @method _scrollPage
     * @param {String} anchor The name of the anchor to scroll to.
     */
    function _scrollPage( anchor ) {
        $( 'html,body' ).animate( {
            scrollTop: $( anchor ).offset().top
        }, 1000 );
        
        return false;
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    // default variables
    var _debug = false;
    var _defaults = {
        themePath: '',
        imagePath: '',
        imageDataFile: '',
        galleryObject: null,
        maxColumnCount: null,
        maxImagesPerColumn: null,
        fixedHeight: false,
        maxHeight: '',
        caption: true,
        overlayColor: '',
        lang: {},
        lightbox: {
            active: true,
            caption: true
        },
    };
    var _promise = null;
    var _imageData = null;
    var _parentImage = null;
    var _lightboxImage = null;
    var _imageLightbox = null;
    var _smallViewport = null;
    var _dataUrl = null;
    
    viewer.responsiveColumnGallery = {
        /**
         * Method which initializes the column gallery.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.themePath The path to the current activated viewer
         * theme.
         * @param {String} config.imagePath The path to the used images.
         * @param {String} config.imageDataFile The path to the JSON-File, which contains
         * the images data.
         * @param {Object} config.galleryObject The DIV where the gallery should be
         * rendered.
         * @param {Number} config.maxColumnCount Count count of the gallery, 4 column are
         * maximum.
         * @param {Number} config.maxImagesPerColumn Count of the images per column.
         * @param {Boolean} config.fixedHeight If true the images have a fixed height,
         * default is false.
         * @param {String} config.maxHeight Sets the given max height value for the
         * images.
         * @param {Boolean} config.caption If true the gallery images have a caption with
         * the title text, default is true.
         * @param {String} config.overlayColor Takes a HEX-value to set the color of the
         * image overlay.
         * @param {Object} config.lang An object of strings for multilanguage
         * functionality.
         * @param {Object} config.lightbox An Object to configure the image lightbox.
         * @param {Boolean} config.lightbox.active If true the lightbox functionality is
         * enabled, default is true.
         * @param {Boolean} config.lightbox.caption If true the lightbox has a caption
         * text, default is true.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.responsiveColumnGallery.init' );
                console.log( '##############################' );
                console.log( 'viewer.responsiveColumnGallery.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // fetch image data and check the viewport
            _dataUrl = _defaults.themePath + _defaults.imageDataFile;
            
            _promise = viewer.helper.getRemoteData( _dataUrl );
            
            _promise.then( function( imageData ) {
                _imageData = imageData;
                _smallViewport = viewer.responsiveColumnGallery.checkForSmallViewport();
                
                // render columns
                if ( _defaults.maxColumnCount > 4 ) {
                    _defaults.galleryObject.append( viewer.helper.renderAlert( 'alert-danger', 'Die maximale Spaltenanzahl für die Galerie beträgt 4!', true ) );
                    
                    return false;
                }
                else {
                    for ( var i = 0; i < _defaults.maxColumnCount; i++ ) {
                        _defaults.galleryObject.append( viewer.responsiveColumnGallery.renderColumns( _defaults.maxColumnCount ) );
                    }
                }
                
                // render images
                while ( _imageData.length ) {
                    $.each( $( '.rcg-col' ), function() {
                        $( this ).append( viewer.responsiveColumnGallery.renderImages( _imageData.splice( 0, _defaults.maxImagesPerColumn ) ) );
                    } );
                }
                
                // set fixed height if activated and viewport is > 375px
                if ( _defaults.fixedHeight && !_smallViewport ) {
                    $.each( $( '.rcg-image-body' ), function() {
                        viewer.responsiveColumnGallery.fixedHeight( $( this ) );
                    } );
                }
                
                // prepare lightbox
                if ( _defaults.lightbox.active ) {
                    $( '.lightbox-toggle' ).on( 'click', function( event ) {
                        event.preventDefault();
                        
                        _parentImage = $( this ).parent().children( 'img' );
                        _lightboxImage = viewer.responsiveColumnGallery.prepareLightbox( _parentImage );
                        _imageLightbox = viewer.responsiveColumnGallery.renderLightbox( _lightboxImage );
                        
                        $( 'body' ).append( _imageLightbox );
                        
                        $( '.rcg-lightbox-body' ).hide();
                        
                        $( '.rcg-lightbox-overlay' ).fadeIn( 'slow' );
                        
                        // first load image, then center it and show it up
                        $( '.rcg-lightbox-image img' ).load( function() {
                            viewer.responsiveColumnGallery.centerLightbox( $( '.rcg-lightbox-body' ) );
                            $( '.rcg-lightbox-body' ).show();
                        } );
                        
                        // close lightbox via button
                        $( '.rcg-lightbox-close' ).on( 'click', function() {
                            $( '.rcg-lightbox-overlay' ).remove();
                        } );
                        
                        // close lightbox via esc
                        $( document ).keypress( function( event ) {
                            if ( event.keyCode === 27 ) {
                                $( '.rcg-lightbox-overlay' ).remove();
                            }
                        } );
                        
                        // close lightbox via click on picture
                        $( '.rcg-lightbox-image img' ).on( 'click', function() {
                            $( '.rcg-lightbox-overlay' ).remove();
                        } );
                    } );
                }
            } ).then( null, function( error ) {
                _defaults.galleryObject.append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                console.error( 'ERROR: viewer.responsiveColumnGallery.init - ', error );
            } );
            
        },
        /**
         * Method which renders the gallery columns.
         * 
         * @method renderColumns
         * @param {String} count The column count of the gallery.
         * @returns {String} A HTML-String which renders a column.
         */
        renderColumns: function( count ) {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.renderColumns() ----------' );
                console.log( 'viewer.responsiveColumnGallery.renderColumns: count = ', count );
            }
            var column = '';
            
            column += '<div class="rcg-col col-' + count + '"></div>';
            
            return column;
        },
        /**
         * Method which renders the gallery images.
         * 
         * @method renderImages
         * @param {Object} data An object of image data to render the images.
         * @returns {String} A HTML-String which renders the gallery images.
         */
        renderImages: function( data ) {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.renderImages() ----------' );
                console.log( 'viewer.responsiveColumnGallery.renderImages: data = ', data );
            }
            var image = '';
            
            $.each( data, function( i, j ) {
                $.each( j, function( m, n ) {
                    image += '<div class="rcg-image-container">';
                    image += '<div class="rcg-image-body">';
                    image += '<a href="' + n.url + '">';
                    image += '<div class="rcg-image-overlay" style="background-color:' + _defaults.overlayColor + '"></div>';
                    image += '</a>';
                    image += '<div class="rcg-image-title">';
                    image += '<h4>' + n.title + '</h4>';
                    image += '</div>';
                    image += '<img src="' + _defaults.themePath + _defaults.imagePath + n.name + '" alt="' + n.alt + '" />';
                    if ( _defaults.lightbox.active ) {
                        image += '<div class="lightbox-toggle" title="' + _defaults.lang.showLightbox + '">';
                        image += '<span class="glyphicon glyphicon-fullscreen"></span>';
                        image += '</div>';
                    }
                    image += '</div>';
                    if ( _defaults.caption ) {
                        image += '<div class="rcg-image-footer">';
                        image += '<p>' + n.caption + '<a href="' + n.url + '" title="' + n.title + '">';
                        image += _defaults.lang.goToWork + ' <span class="glyphicon glyphicon glyphicon-picture"></span></a></p>';
                        image += '</div>';
                    }
                    image += '</div>';
                } );
            } );
            
            return image;
        },
        /**
         * Method which sets a fixed height to the gallery images.
         * 
         * @method fixedHeight
         * @param {Object} $obj An jQuery object of the element which height should be
         * fixed.
         */
        fixedHeight: function( $obj ) {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.fixedHeight() ----------' );
                console.log( 'viewer.responsiveColumnGallery.fixedHeight: $obj = ', $obj );
            }
            
            $obj.children( 'img' ).css( {
                'height': _defaults.maxHeight
            } );
        },
        /**
         * Method which checks the viewport width and returns true if it´s smaller then
         * 375px.
         * 
         * @method checkForSmallViewport
         * @returns {Boolean} Returns true if it´s smaller then 375px.
         */
        checkForSmallViewport: function() {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.checkForSmallViewport() ----------' );
            }
            var windowWidth = $( window ).outerWidth();
            
            if ( windowWidth <= 375 ) {
                return true;
            }
            else {
                return false;
            }
        },
        /**
         * Method which prepares the lightbox object with the required data.
         * 
         * @method prepareLightbox
         * @param {Object} $obj An jQuery object which includes the required data
         * attributes.
         * @returns {Object} An Object which includes the required data.
         */
        prepareLightbox: function( $obj ) {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.prepareLightbox() ----------' );
                console.log( 'viewer.responsiveColumnGallery.prepareLightbox: $obj = ', $obj );
            }
            var lightboxData = {};
            
            lightboxData.src = $obj.attr( 'src' );
            lightboxData.caption = $obj.attr( 'alt' );
            
            return lightboxData;
        },
        /**
         * Method which renders a lightbox for the selected image.
         * 
         * @method renderLightbox
         * @param {Object} data An object which includes the required data.
         * @returns {String} A HTML-String which renders the lightbox.
         */
        renderLightbox: function( data ) {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.renderLightbox() ----------' );
                console.log( 'viewer.responsiveColumnGallery.renderLightbox: data = ', data );
            }
            var lightbox = '';
            
            lightbox += '<div class="rcg-lightbox-overlay">';
            lightbox += '<div class="rcg-lightbox-body">';
            lightbox += '<div class="rcg-lightbox-close" title="' + _defaults.lang.close + '"><span class="glyphicon glyphicon-remove"></span></div>';
            lightbox += '<div class="rcg-lightbox-image">';
            lightbox += '<img src="' + data.src + '" alt="' + data.alt + '" />';
            lightbox += '</div>'; // .rcg-lightbox-image
            if ( _defaults.lightbox.caption ) {
                lightbox += '<div class="rcg-lightbox-caption">';
                lightbox += '<p>' + data.caption + '</p>';
                lightbox += '</div>'; // .rcg-lightbox-caption
            }
            lightbox += '</div>'; // .rcg-lightbox-body
            lightbox += '</div>'; // .rcg-lightbox-overlay
            
            return lightbox;
        },
        /**
         * Method which centers the given object to the viewport.
         * 
         * @method centerLightbox
         * @param {Object} $obj An jQuery object of the element to center.
         */
        centerLightbox: function( $obj ) {
            if ( _debug ) {
                console.log( '---------- viewer.responsiveColumnGallery.centerLightbox() ----------' );
                console.log( 'viewer.responsiveColumnGallery.centerLightbox: $obj = ', $obj );
            }
            
            var boxWidth = $obj.outerWidth();
            var boxHeight = $obj.outerHeight();
            
            $obj.css( {
                'margin-top': '-' + boxHeight / 2 + 'px',
                'margin-left': '-' + boxWidth / 2 + 'px'
            } );
        },
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _advSearchValues = {};
    var _defaults = {
        loaderSelector: '.search-advanced__loader',
        inputSelector: '.value-text',
        resetSelector: '.reset',
    };
    
    viewer.searchAdvanced = {
        /**
         * Method to initialize the search advanced features.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.searchAdvanced.init' );
                console.log( '##############################' );
                console.log( 'viewer.searchAdvanced.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // init bs tooltips
            $( '[data-toggle="tooltip"]' ).tooltip();
            
            if ( viewer.localStoragePossible ) {
                localStorage.setItem( 'advSearchValues', JSON.stringify( _advSearchValues ) );
                
                // set search values
                _setAdvSearchValues();
                _resetValue();
                
                // ajax eventlistener
                jsf.ajax.addOnEvent( function( data ) {
                    var ajaxstatus = data.status;
                    
                    switch ( ajaxstatus ) {
                        case "begin":
                            // show loader
                            $( _defaults.loaderSelector ).show();
                            break;
                        case "success":
                            // init bs tooltips
                            $( '[data-toggle="tooltip"]' ).tooltip();
                            
                            // set search values
                            _setAdvSearchValues();
                            _getAdvSearchValues();
                            _resetValue();
                            
                            // set disabled state to select wrapper
                            $( 'select' ).each( function() {
                                if ( $( this ).attr( 'disabled' ) === 'disabled' ) {
                                    $( this ).parent().addClass( 'disabled' );
                                }
                                else {
                                    $( this ).parent().removeClass( 'disabled' );
                                }
                            } );
                            
                            // hide loader
                            $( _defaults.loaderSelector ).hide();
                            break;
                    }
                } );
            }
            else {
                return false;
            }
        },
    };
    
    function _setAdvSearchValues() {
        if ( _debug ) {
            console.log( '---------- _setAdvSearchValues() ----------' );
        }
        
        $( _defaults.inputSelector ).off().on( 'keyup', function() {
            var currId = $( this ).attr( 'id' );
            var currVal = $( this ).val();
            var currValues = JSON.parse( localStorage.getItem( 'advSearchValues' ) );
            
            // check if values are in local storage
            if ( !currValues.hasOwnProperty( currVal ) ) {
                currValues[ currId ] = currVal;
            }
            else {
                return false;
            }
            
            // write values to local storage
            localStorage.setItem( 'advSearchValues', JSON.stringify( currValues ) );
        } );
    }
    
    function _getAdvSearchValues() {
        if ( _debug ) {
            console.log( '---------- _getAdvSearchValues() ----------' );
        }
        
        var values = JSON.parse( localStorage.getItem( 'advSearchValues' ) );
        
        $.each( values, function( id, value ) {
            $( '#' + id ).val( value );
        } );
    }
    
    function _resetValue() {
        if ( _debug ) {
            console.log( '---------- _resetValue() ----------' );
        }
        
        $( _defaults.resetSelector ).off().on( 'click', function() {
            var inputId = $( this ).parents( '.input-group' ).find( 'input' ).attr( 'id' );
            var currValues = JSON.parse( localStorage.getItem( 'advSearchValues' ) );
            
            // delete value from local storage object
            if ( currValues.hasOwnProperty( inputId ) ) {
                delete currValues[ inputId ];
            }
            
            // write new values to local storage
            localStorage.setItem( 'advSearchValues', JSON.stringify( currValues ) );
            
            $( this ).parents( '.input-group' ).find( 'input' ).val( '' );
        } );
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _promise = null;
    var _childHits = null;
    var _defaults = {
        contextPath: '',
        restApiPath: '/rest/search/hit/',
        hitsPerCall: 20,
        resetSearchSelector: '#resetCurrentSearch',
        searchInputSelector: '#currentSearchInput',
        searchTriggerSelector: '#slCurrentSearchTrigger',
        saveSearchModalSelector: '#saveSearchModal',
        saveSearchInputSelector: '#saveSearchInput',
        excelExportSelector: '.excel-export-trigger',
        excelExportLoaderSelector: '.excel-export-loader',
        hitContentLoaderSelector: '.search-list__loader',
        hitContentSelector: '.search-list__hit-content',
        msg: {
            getMoreChildren: 'Mehr Treffer laden',
        }
    };
    
    viewer.searchList = {
        /**
         * Method to initialize the search list features.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.searchList.init' );
                console.log( '##############################' );
                console.log( 'viewer.searchList.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // init bs tooltips
            $( '[data-toggle="tooltip"]' ).tooltip();
            
            // focus save search modal input on show
            $( _defaults.saveSearchModalSelector ).on( 'shown.bs.modal', function() {
                $( _defaults.saveSearchInputSelector ).focus();
            } );
            
            // reset current search and redirect to standard search
            $( _defaults.resetSearchSelector ).on( 'click', function() {
                $( _defaults.searchInputSelector ).val( '' );
                location.href = _defaults.contextPath + '/search/';
            } );
            
            // show/hide loader for excel export
            $( _defaults.excelExportSelector ).on( 'click', function() {
                var trigger = $( this );
                var excelLoader = $( _defaults.excelExportLoaderSelector );
                
                trigger.hide();
                excelLoader.show();
               
                var url = _defaults.contextPath + '/rest/download/search/waitFor/';
                console.log("Calling ", url);
                var promise = Q( $.ajax( {
                    url: decodeURI( url ),
                    type: "GET",
                    dataType: "text",
                    async: true
                } ) );
                
                promise
                .then(function(data) {
                	if(_debug) {                		
                		console.log("Download started");
                	}
                	excelLoader.hide();
                	trigger.show();
                })
                .catch(function(error) {
                	if(_debug) {                		
                		console.log("Error downloading excel sheet: ", error.responseText);
                	}
                	excelLoader.hide();
                	trigger.show();
                });
                
            } );
            
            // get child hits
            
            $( '[data-toggle="hit-content"]' ).each( function() {
                var currBtn = $( this );
                var currIdDoc = $( this ).attr( 'data-iddoc' );
                var currUrl = _getApiUrl( currIdDoc, _defaults.hitsPerCall );
                
                if ( _debug ) {
                    console.log( 'Current API Call URL: ', currUrl );
                }
                
                _promise = viewer.helper.getRemoteData( currUrl );
                
                currBtn.find( _defaults.hitContentLoaderSelector ).css( 'display', 'inline-block' );
                
                // get data and render hits if data is valid
                _promise.then( function( data ) {
                    if ( data.hitsDisplayed < _defaults.hitsPerCall ) {
                        // render child hits into the DOM
                        _renderChildHits( data, currBtn );
                        // set current button active, remove loader and show content
                        currBtn.toggleClass( 'in' ).find( _defaults.hitContentLoaderSelector ).hide();
                        currBtn.next().show();
                        // set event to toggle current hits
                        currBtn.off().on( 'click', function() {
                            $( this ).toggleClass( 'in' ).next().slideToggle();
                        } );
                    }
                    else {
                      // remove loader
                      currBtn.find( _defaults.hitContentLoaderSelector ).hide();
                      // set event to toggle current hits
                      currBtn.off().on( 'click', function() {
                          // render child hits into the DOM
                          _renderChildHits( data, currBtn );
                          // check if more children exist and render link
                          _renderGetMoreChildren( data, currIdDoc, currBtn );
                          $( this ).toggleClass( 'in' ).next().slideToggle();                         
                      } );
                    }                    
                } ).then( null, function() {
                    currBtn.next().append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                    console.error( 'ERROR: viewer.searchList.init - ', error );
                } );
            } );
        },
    };
    
    /**
     * Method to get the full REST-API URL.
     * 
     * @method _getApiUrl
     * @param {String} id The current IDDoc of the hit set.
     * @returns {String} The full REST-API URL.
     */
    function _getApiUrl( id, hits ) {
        if ( _debug ) {
            console.log( '---------- _getApiUrl() ----------' );
            console.log( '_getApiUrl: id = ', id );
        }
        
        return _defaults.contextPath + _defaults.restApiPath + id + '/' + hits + '/';
    }
    
    /**
     * Method which renders the child hits into the DOM.
     * 
     * @method _renderChildHits
     * @param {Object} data The data object which contains the child hits.
     * @param {Object} $this The current child hits trigger.
     * @returns {Object} An jquery object which contains the child hits.
     */
    function _renderChildHits( data, $this ) {
        if ( _debug ) {
            console.log( '---------- _renderChildHits() ----------' );
            console.log( '_renderChildHits: data = ', data );
            console.log( '_renderChildHits: $this = ', $this );
        }
        
        var hitSet = null;
        
        // clean hit sets
        $this.next().empty();
        
        // build hits
        $.each( data.children, function( children, child ) {
            hitSet = $( '<div class="search-list__hit-content-set" />' );
            
            // build title
            hitSet.append( _renderHitSetTitle( child.browseElement ) );

            // append metadata if exist
            hitSet.append( _renderMetdataInfo( child.foundMetadata, child.url ) );
            
            // build child hits
            if ( child.hasChildren ) {
                $.each( child.children, function( subChildren, subChild ) {
                    hitSet.append( _renderSubChildHits( subChild.browseElement, subChild.type ) );
                } );
            }
            
            // append complete set
            $this.next().append( hitSet );
        } );
        
    }
    
    /**
     * Method which renders the hit set title.
     * 
     * @method _renderHitSetTitle
     * @param {Object} data The data object which contains the hit set title values.
     * @returns {Object} A jquery object which contains the hit set title.
     */
    function _renderHitSetTitle( data ) {
        if ( _debug ) {
            console.log( '---------- _renderHitSetTitle() ----------' );
            console.log( '_renderHitSetTitle: data = ', data );
        }
        
        var hitSetTitle = null;
        var hitSetTitleH5 = null;
        var hitSetTitleDl = null;
        var hitSetTitleDt = null;
        var hitSetTitleDd = null;
        var hitSetTitleLink = null;
        
        hitSetTitle = $( '<div class="search-list__struct-title" />' );
        hitSetTitleH5 = $( '<h5 />' );
        hitSetTitleLink = $( '<a />' );
        hitSetTitleLink.attr( 'href', _defaults.contextPath + '/' + data.url );
        hitSetTitleLink.append( data.labelShort );
        hitSetTitleH5.append( hitSetTitleLink );
        hitSetTitle.append( hitSetTitleH5 );
        
        return hitSetTitle;
    }
    
    /**
     * Method which renders metadata info.
     * 
     * @method _renderMetdataInfo
     * @param {Object} data The data object which contains the sub hit values.
     * @param {String} url The URL for the current work.
     * @returns {Object} A jquery object which contains the metadata info.
     */
    function _renderMetdataInfo( data, url ) {
        if ( _debug ) {
            console.log( '---------- _renderMetdataInfo() ----------' );
            console.log( '_renderMetdataInfo: data = ', data );
            console.log( '_renderMetdataInfo: url = ', url );
        }
        
        var metadataWrapper = null;
        var metadataList = null;
        var metadataKey = null;
        var metadataKeyIcon = null;
        var metadataKeyLink = null;
        var metadataValue = null;
        var metadataValueLink = null;
        
        if ( !$.isEmptyObject( data ) ) {
            metadataWrapper = $( '<div class="search-list__metadata-info" />' );
            metadataList = $( '<dl class="dl-horizontal" />' );

            $.each( data, function( metadata, item ) {
                // build metadata key
                metadataKey = $( '<dt />' );
                metadataKeyIcon = $( '<i class="fa fa-bookmark-o" aria-hidden="true" />' );
                metadataKeyLink = $( '<a />' );
                metadataKeyLink.attr( 'href', _defaults.contextPath + '/' + url );
                metadataKeyLink.append( item.one + ':' );
                metadataKey.append( metadataKeyIcon ).append( metadataKeyLink );
                // build metadata value
                metadataValue = $( '<dd />' );
                metadataValueLink = $( '<a />' );
                metadataValueLink.attr( 'href', _defaults.contextPath + '/' +  url );
                metadataValueLink.append( item.two );
                metadataValue.append( metadataValueLink );
                // build metadata list
                metadataList.append( metadataKey ).append( metadataValue );
                metadataWrapper.append( metadataList );
            } );            
                
            return metadataWrapper;
        }
    }
    
    /**
     * Method which renders sub child hits.
     * 
     * @method _renderSubChildHits
     * @param {Object} data The data object which contains the sub hit values.
     * @param {String} type The type of hit to render.
     * @returns {Object} A jquery object which contains the sub child hits.
     */
    function _renderSubChildHits( data, type ) {
        if ( _debug ) {
            console.log( '---------- _renderSubChildHits() ----------' );
            console.log( '_renderSubChildHits: data = ', data );
            console.log( '_renderSubChildHits: type = ', type );
        }
        
        var hitSetChildren = null;
        var hitSetChildrenDl = null;
        var hitSetChildrenDt = null;
        var hitSetChildrenDd = null;
        var hitSetChildrenLink = null;
        
        hitSetChildren = $( '<div class="search-list__struct-child-hits" />' );
        hitSetChildrenDl = $( '<dl class="dl-horizontal" />' );
        hitSetChildrenDt = $( '<dt />' );
        // check hit type
        switch ( type ) {
            case 'PAGE':
                hitSetChildrenDt.append( '<i class="fa fa-file-text-o" aria-hidden="true"></i>' );
                break;
            case 'EVENT':
                hitSetChildrenDt.append( '<i class="fa fa-calendar-o" aria-hidden="true"></i>' );
                break;
        }
        hitSetChildrenDd = $( '<dd />' );
        hitSetChildrenLink = $( '<a />' );
        hitSetChildrenLink.attr( 'href', _defaults.contextPath + '/' + data.url );
        switch ( type ) {
            case 'PAGE':
                hitSetChildrenLink.append( data.fulltextForHtml );
            break;
            default:
                hitSetChildrenLink.append( data.labelShort );
            break;
        }
        hitSetChildrenDd.append( hitSetChildrenLink );
        hitSetChildrenDl.append( hitSetChildrenDt ).append( hitSetChildrenDd );
        hitSetChildren.append( hitSetChildrenDl );
        
        return hitSetChildren;
    }
    
    /**
     * Method to render a get more children link.
     * 
     * @method _renderGetMoreChildren
     */
    function _renderGetMoreChildren( data, iddoc, $this ) {
        if ( _debug ) {
            console.log( '---------- _renderGetMoreChildren() ----------' );
            console.log( '_renderGetMoreChildren: data = ', data );
            console.log( '_renderGetMoreChildren: iddoc = ', iddoc );
            console.log( '_renderGetMoreChildren: $this = ', $this );
        }
        
        var apiUrl = _getApiUrl( iddoc, _defaults.hitsPerCall + data.hitsDisplayed );
        var hitContentMore = $( '<div />' );
        var getMoreChildrenLink = $( '<button type="button" />' );
        
        if ( data.hasMoreChildren ) {
            // build get more link
            hitContentMore.addClass( 'search-list__hit-content-more' );
            getMoreChildrenLink.addClass( 'btn-clean' );
            getMoreChildrenLink.attr( 'data-api', apiUrl );
            getMoreChildrenLink.attr( 'data-iddoc', iddoc );
            getMoreChildrenLink.append( _defaults.msg.getMoreChildren );
            hitContentMore.append( getMoreChildrenLink );
            // append links
            $this.next().append( hitContentMore );
            // render new hit set
            getMoreChildrenLink.off().on( 'click', function( event ) {
                var currApiUrl = $( this ).attr( 'data-api' );
                var parentOffset = $this.parent().offset().top;
                
                // get data and render hits if data is valid
                _promise = viewer.helper.getRemoteData( currApiUrl );
                _promise.then( function( data ) {
                    // render child hits into the DOM
                    _renderChildHits( data, $this );
                    // check if more children exist and render link
                    _renderGetMoreChildren( data, iddoc, $this );
                } ).then( null, function() {
                    $this.next().append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                    console.error( 'ERROR: _renderGetMoreChildren - ', error );
                } );
            } );
        }
        else {
            // clear and hide current get more link
            $this.next().find( _defaults.hitContentMoreSelector ).empty().hide();
            console.info( '_renderGetMoreChildren: No more child hits available' );
            return false;
        }
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _selectedSorting = '';
    var _dataSortFieldState = '';
    var _currUrl = '';
    var _valueUrl = '';
    var _checkValUrl = '';
    var _dataSortField = '';
    var _defaults = {
        select: '#sortSelect',
    };
    
    viewer.searchSortingDropdown = {
        /**
         * Method to initialize the search sorting widget.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {Object} config.select An jQuery object which holds the sorting menu.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.searchSortingDropdown.init' );
                console.log( '##############################' );
                console.log( 'viewer.searchSortingDropdown.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            if ( viewer.localStoragePossible ) {
                _selectedSorting = localStorage.dataSortField;
                _currUrl = location.href;
                
                // get selected sorting type from local storage an set the menu option to
                // selected
                if ( _selectedSorting !== '' || _selectedSorting !== 'undefinded' ) {
                    $( _defaults.select ).children( 'option' ).each( function() {
                        _dataSortFieldState = $( this ).attr( 'data-sortField' );
                        _checkValUrl = $( this ).val();
                        
                        if ( _dataSortFieldState === _selectedSorting && _checkValUrl === _currUrl ) {
                            $( this ).attr( 'selected', 'selected' );
                        }
                    } );
                }
                
                // get the sorting URL from the option value and reload the page on change
                $( _defaults.select ).on( 'change', function() {
                    _valueUrl = $( this ).val();
                    _dataSortField = $( this ).children( 'option:selected' ).attr( 'data-sortField' );
                    
                    if ( _valueUrl !== '' ) {
                        // save current sorting state to local storage
                        if ( typeof ( Storage ) !== "undefined" ) {
                            localStorage.dataSortField = _dataSortField;
                        }
                        else {
                            console.info( 'Local Storage is not defined. Current sorting state could not be saved.' );
                            
                            return false;
                        }
                        
                        window.location.href = _valueUrl;
                    }
                } );
            }
            else {
                return false;
            }
        },
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _box = null;
    var _imgpath = null;
    var _imgname = null;
    
    viewer.simpleLightBox = {
        /**
         * Initializes an event (click) which renders a lightbox with an bigger image.
         * 
         * @method init
         * @example
         * 
         * <pre>
         * viewerJS.simpleLightBox.init();
         * </pre>
         * 
         */
        init: function() {
            // eventlisteners
            $( '.lightbox-image' ).on( 'click', function( event ) {
                event.preventDefault();
                
                var $this = $( this );
                
                _imgpath = _getImagePath( $this );
                _imgname = _getImageName( $this );
                _box = _setupLightBox( _imgpath, _imgname );
                
                $( 'body' ).append( _box );
                
                _centerModalBox( $( '.lightbox-modal-box' ) );
                
                $( '.lightbox-overlay' ).fadeIn();
                
                $( '.lightbox-close-btn' ).on( 'click', function() {
                    $( '.lightbox-overlay' ).remove();
                } );
            } );
        }
    };
    
    /**
     * Returns the image path from the 'data-imgpath' attribute.
     * 
     * @method _getImagePath
     * @param {Object} $Obj Must be a jQuery-Object like $('.something')
     * @returns {String} The image path from the 'data-imgpath' attribute.
     * 
     */
    function _getImagePath( $Obj ) {
        _imgpath = $Obj.attr( 'data-imgpath' );
        
        return _imgpath;
    }
    
    /**
     * Returns the image name from the 'data-imgname' attribute.
     * 
     * @method _getImageName
     * @param {Object} $Obj Must be a jQuery-Object like $('.something')
     * @returns {String} The image name from the 'data-imgname' attribute.
     * 
     */
    function _getImageName( $Obj ) {
        _imgname = $Obj.attr( 'data-imgname' );
        
        return _imgname;
    }
    
    /**
     * Returns a HTML-String which renders the lightbox.
     * 
     * @method _setupLightBox
     * @param {String} path The path to the big image.
     * @param {String} name The name of the big image.
     * @returns {String} The HTML-Code to render the lightbox.
     * 
     */
    function _setupLightBox( path, name ) {
        var lightbox = '';
        
        lightbox = '<div class="lightbox-overlay">';
        lightbox += '<div class="lightbox-modal-box">';
        lightbox += '<div class="lightbox-close">';
        lightbox += '<span class="lightbox-close-btn" title="Fenster schlie&szlig;en">&times;</span>';
        lightbox += '</div>';
        lightbox += '<img src="' + path + name + '" alt="' + name + '" /></div></div>';
        
        return lightbox;
    }
    
    /**
     * Puts the lightbox to the center of the screen.
     * 
     * @method _centerModalBox
     * @param {Object} $Obj Must be a jQuery-Object like $('.something')
     */
    function _centerModalBox( $Obj ) {
        var boxWidth = $Obj.outerWidth();
        var boxHeight = $Obj.outerHeight();
        
        $Obj.css( {
            'margin-top': '-' + boxHeight / 2 + 'px',
            'margin-left': '-' + boxWidth / 2 + 'px'
        } );
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _imgWidth = null;
    var _imgHeight = null;
    var _defaults = {
        thumbs: '.stacked-thumbnail',
        thumbsBefore: '.stacked-thumbnail-before',
        thumbsAfter: '.stacked-thumbnail-after',
    };
    
    viewer.stackedThumbnails = {
        /**
         * Method to initialize the timematrix slider and the events which builds the
         * matrix and popovers.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {Object} config.thumbs All jQuery objects of the stacked thumbnails.
         * @param {String} config.thumbsBefore The classname of the stacked thumbnail
         * before element.
         * @param {String} config.thumbsAfter The classname of the stacked thumbnail after
         * element.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.stackedThumbnails.init' );
                console.log( '##############################' );
                console.log( 'viewer.stackedThumbnails.init: config - ' );
                console.log( config );
            }
            
            $.extend( true, _defaults, config );
            
            // hide stacked thumbs
            $( _defaults.thumbs ).hide();
            $( _defaults.thumbs ).siblings().hide();
            
            // iterate through thumbnails and set width and height for image stack
            $( _defaults.thumbs ).each( function() {
                _imgWidth = $( this ).outerWidth();
                _imgHeight = $( this ).outerHeight();
                
                $( this ).css( {
                    'margin-left': '-' + ( _imgWidth / 2 ) + 'px'
                } );
                
                $( this ).siblings().css( {
                    'width': _imgWidth,
                    'height': _imgHeight,
                    'margin-left': '-' + ( _imgWidth / 2 ) + 'px'
                } );
                
                // show stacked thumbs after building them
                $( this ).show();
                $( this ).siblings( _defaults.thumbsBefore ).fadeIn( 'slow', function() {
                    $( this ).siblings( _defaults.thumbsAfter ).fadeIn();
                } );
            } );
            
        },
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    // default variables
    var _debug = false;
    var _promise = null;
    var _apiData = null;
    var _defaults = {
        contextPath: null,
        apiQuery: 'api?action=timeline',
        startDateQuery: '&startDate=',
        rangeInput1: null,
        startDate: null,
        endDateQuery: '&endDate=',
        rangeInput2: null,
        endDate: null,
        countQuery: '&count=',
        count: null,
        $tmCanvas: null,
        $tmCanvasPos: null,
        $tmCanvasCoords: {},
        lang: {}
    };
    
    viewer.timematrix = {
        /**
         * Method to initialize the timematrix slider and the events which builds the
         * matrix and popovers.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.contextPath The rootpath of the application.
         * @param {String} config.apiQuery The API action to call.
         * @param {String} config.startDateQuery The GET-Parameter for the start date.
         * @param {Object} config.rangeInput1 An jQuery object of the first range input.
         * @param {String} config.startDate The value of the first range input.
         * @param {String} config.endDateQuery The GET-Parameter for the end date.
         * @param {Object} config.rangeInput2 An jQuery object of the second range input.
         * @param {String} config.endDate The value of the second range input.
         * @param {String} config.countQuery The GET-Parameter for the count query.
         * @param {String} config.count The number of results from the query.
         * @param {Object} config.$tmCanvas An jQuery object of the timematrix canvas.
         * @param {Object} config.$tmCanvasPos An jQuery object of the timematrix canvas
         * position.
         * @param {Object} config.lang An object of localized strings.
         * @example
         * 
         * <pre>
         * $( document ).ready( function() {
         *     var timematrixConfig = {
         *         path: '#{request.contextPath}/',
         *         lang: {
         *             closeWindow: '#{msg.timematrixCloseWindow}',
         *             goToWork: '#{msg.timematrixGoToWork}'
         *         }
         *     };
         *     viewerJS.timematrix.init( timematrixConfig );
         * } );
         * </pre>
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.timematrix.init' );
                console.log( '##############################' );
                console.log( 'viewer.timematrix.init: config - ' );
                console.log( config );
            }
            
            $.extend( true, _defaults, config );
            
            _defaults.$tmCanvasCoords = {
                top: _defaults.$tmCanvasPos.top,
                left: 0,
                right: _defaults.$tmCanvasPos.left + _defaults.$tmCanvas.outerWidth()
            };
            
            // range slider settings
            $( '#slider-range' ).slider( {
                range: true,
                min: parseInt( _defaults.startDate ),
                max: parseInt( _defaults.endDate ),
                values: [ parseInt( _defaults.startDate ), parseInt( _defaults.endDate ) ],
                slide: function( event, ui ) {
                    _defaults.rangeInput1.val( ui.values[ 0 ] );
                    $( '.timematrix-slider-bubble-startDate' ).html( ui.values[ 0 ] );
                    _defaults.startDate = ui.values[ 0 ];
                    _defaults.rangeInput1.val( ui.values[ 1 ] );
                    $( '.timematrix-slider-bubble-endDate' ).html( ui.values[ 1 ] );
                    _defaults.endDate = ui.values[ 1 ];
                }
            } );
            
            // append slider bubble to slider handle
            $( '#slider-range .ui-slider-range' ).next().append( _renderSliderBubble( 'startDate', _defaults.startDate ) );
            $( '#slider-range .ui-slider-range' ).next().next().append( _renderSliderBubble( 'endDate', _defaults.endDate ) );
            
            // listen to submit event of locate timematrix form
            $( '#locateTimematrix' ).on( 'submit', function( e ) {
                e.preventDefault();
                
                // check for popovers and remove them
                if ( $( '.timematrix-popover' ).length ) {
                    $( '.timematrix-popover' ).remove();
                }
                
                // build api target
                var apiTarget = _defaults.contextPath;
                apiTarget += _defaults.apiQuery;
                apiTarget += _defaults.startDateQuery;
                apiTarget += _defaults.startDate;
                apiTarget += _defaults.endDateQuery;
                apiTarget += _defaults.endDate;
                apiTarget += _defaults.countQuery;
                apiTarget += _defaults.count;
                
                // get data from api
                _promise = viewer.helper.getRemoteData( apiTarget );
                
                // render thumbnails
                _promise.then( function( data ) {
                    _apiData = data;
                    
                    _defaults.$tmCanvas.html( _renderThumbs( _apiData ) );
                    $( '.timematrix-thumb' ).css( {
                        height: $( '.timematrix-thumb' ).outerWidth()
                    } );
                    
                    // show thumbs after they´ve been loaded
                    $( '.timematrix-thumb img' ).load( function() {
                        $( this ).css( {
                            visibility: 'visible'
                        } );
                    } );
                    
                    // listen to click event on thumbnails
                    $( '.timematrix-thumb' ).on( 'click', function() {
                        if ( !$( '.timematrix-popover' ) ) {
                            $( '.timematrix-thumb' ).removeClass( 'marker' );
                            $( this ).addClass( 'marker' );
                            _renderPopover( $( this ), _defaults.lang );
                        }
                        else {
                            $( '.timematrix-popover' ).remove();
                            $( '.timematrix-thumb' ).removeClass( 'marker' );
                            $( this ).addClass( 'marker' );
                            _renderPopover( $( this ), _defaults.lang );
                        }
                        
                        // close popover
                        $( '.timematrix-popover-close' ).on( 'click', function() {
                            $( this ).parent().remove();
                            $( '.timematrix-thumb' ).removeClass( 'marker' );
                        } );
                        
                        // check if image is loaded and reset loader
                        $( '.timematrix-popover-body img' ).load( function() {
                            $( '.timematrix-popover-imageloader' ).hide();
                        } );
                    } );
                } ).then( null, function() {
                    _defaults.$tmCanvas.append( viewer.helper.renderAlert( 'alert-danger', '<strong>Status: </strong>' + error.status + ' ' + error.statusText, false ) );
                    console.error( 'ERROR: viewer.timematrix.init - ', error );
                } )
            } );
            
            // remove all popovers by clicking on body
            $( 'body' ).on( 'click', function( event ) {
                if ( $( event.target ).closest( '.timematrix-thumb' ).length ) {
                    return;
                }
                else {
                    _removePopovers();
                }
            } );
        }
    };
    
    /**
     * Method to render image thumbnails to the timematrix canvas.
     * 
     * @method _renderThumbs
     * @param {Object} json An JSON-Object which contains the image data.
     * @returns {String} HTML-String which displays the image thumbnails.
     */
    function _renderThumbs( json ) {
        if ( _debug ) {
            console.log( 'viewer.timematrix _renderThumbs: json - ' );
            console.log( json );
        }
        
        var tlbox = '';
        tlbox += '<div class="timematrix-box">';
        tlbox += '<header class="timematrix-header">';
        if ( _defaults.startDate !== '' && _defaults.endDate !== '' ) {
            tlbox += '<h3>' + _defaults.startDate + ' - ' + _defaults.endDate + '</h3>';
        }
        tlbox += '</header>';
        tlbox += '<section class="timematrix-body">';
        $.each( json, function( i, j ) {
            tlbox += '<div class="timematrix-thumb" data-title="' + j.title + '" data-mediumimage="' + j.mediumimage + '" data-url="' + j.url + '">';
            if ( j.thumbnailUrl ) {
                tlbox += '<img src="' + j.thumbnailUrl + '" style="visibility: hidden;" />';
            }
            else {
                tlbox += '';
            }
            tlbox += '</div>';
        } );
        tlbox += '</section>';
        tlbox += '<footer class="timematrix-footer"></footer>';
        tlbox += '</div>';
        
        return tlbox;
    }
    
    /**
     * Method to render a popover with a thumbnail image.
     * 
     * @method _renderPopover
     * @param {Object} $Obj Must be an jQuery-Object like $(this).
     * @param {Object} lang An Object with localized strings in the selected language.
     */
    function _renderPopover( $Obj, lang ) {
        if ( _debug ) {
            console.log( 'viewer.timematrix _renderPopover: obj - ' );
            console.log( $Obj );
            console.log( 'viewer.timematrix _renderPopover: lang - ' + lang );
        }
        
        var title = $Obj.attr( 'data-title' );
        var mediumimage = $Obj.attr( 'data-mediumimage' );
        var url = $Obj.attr( 'data-url' );
        var $objPos = $Obj.position();
        var $objCoords = {
            top: $objPos.top,
            left: $objPos.left,
            width: $Obj.outerWidth()
        };
        var popoverPos = _calculatePopoverPosition( $objCoords, _defaults.$tmCanvasCoords );
        var popover = '';
        popover += '<div class="timematrix-popover" style="top: ' + popoverPos.top + 'px; left: ' + popoverPos.left + 'px;">';
        popover += '<span class="timematrix-popover-close" title="' + lang.closeWindow + '">&times;</span>';
        popover += '<header class="timematrix-popover-header">';
        popover += '<h4 title="' + title + '">' + viewer.helper.truncateString( title, 75 ) + '</h4>';
        popover += '</header>';
        popover += '<section class="timematrix-popover-body">';
        popover += '<div class="timematrix-popover-imageloader"></div>';
        popover += '<a href="' + url + '"><img src="' + mediumimage + '" /></a>';
        popover += '</section>';
        popover += '<footer class="timematrix-popover-footer">';
        popover += '<a href="' + url + '" title="' + title + '">' + lang.goToWork + '</a>';
        popover += '</footer>';
        popover += '</div>';
        
        _defaults.$tmCanvas.append( popover );
    }
    
    /**
     * Method which calculates the position of the popover.
     * 
     * @method _calculatePopoverPosition
     * @param {Object} triggerCoords An object which contains the coordinates of the
     * element has been clicked.
     * @param {Object} tmCanvasCoords An object which contains the coordinates of the
     * wrapper element from the timematrix.
     * @returns {Object} An object which contains the top and the left position of the
     * popover.
     */
    function _calculatePopoverPosition( triggerCoords, tmCanvasCoords ) {
        if ( _debug ) {
            console.log( 'viewer.timematrix _calculatePopoverPosition: triggerCoords - ' );
            console.log( triggerCoords );
            console.log( 'viewer.timematrix _calculatePopoverPosition: tmCanvasCoords - ' );
            console.log( tmCanvasCoords );
        }
        
        var poLeftBorder = triggerCoords.left - ( 150 - ( triggerCoords.width / 2 ) );
        var poRightBorder = poLeftBorder + 300;
        var tbLeftBorder = tmCanvasCoords.left;
        var tbRightBorder = tmCanvasCoords.right;
        var poTop;
        var poLeft = poLeftBorder;
        
        poTop = ( triggerCoords.top + $( '.timematrix-thumb' ).outerHeight() ) - 1;
        
        if ( poLeftBorder <= tbLeftBorder ) {
            poLeft = tbLeftBorder;
        }
        
        if ( poRightBorder >= tbRightBorder ) {
            poLeft = tmCanvasCoords.right - 300;
        }
        
        return {
            top: poTop,
            left: poLeft
        };
    }
    
    /**
     * Method which renders the bubbles for the slider.
     * 
     * @method _renderSliderBubble
     * @param {String} time The string for the time value.
     * @param {String} val The string for the value.
     * @returns {String} HTML-String which renders the slider-bubble.
     */
    function _renderSliderBubble( time, val ) {
        if ( _debug ) {
            console.log( 'viewer.timematrix _renderSliderBubble: time - ' + time );
            console.log( 'viewer.timematrix _renderSliderBubble: val - ' + val );
        }
        
        return '<div class="timematrix-slider-bubble-' + time + '">' + val + '</div>';
    }
    
    /**
     * Method which removes all popovers.
     * 
     * @method _removePopovers
     */
    function _removePopovers() {
        if ( _debug ) {
            console.log( '---------- _removePopovers() ----------' );
        }
        
        $( '.timematrix-popover' ).remove();
        $( '.timematrix-thumb' ).removeClass( 'marker' );
    }
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _defaults = {
        currLang: 'de',
        selector: 'textarea.tinyMCE',
        width: '100%',
        height: 400,
        theme: 'modern',
        plugins: 'print preview fullpage paste searchreplace autolink directionality code visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists textcolor wordcount spellchecker imagetools media contextmenu colorpicker textpattern help',
        toolbar: 'undo redo | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | fullscreen',
        menubar: false,
        statusbar: false,
        relative_urls: false,
        force_br_newlines: false,
        force_p_newlines: false,
        forced_root_block: '',
        language: 'de'
    };
    
    viewer.tinyMce = {
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.tinyMce.init' );
                console.log( '##############################' );
                console.log( 'viewer.tinyMce.init: config - ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // check current language
            switch ( _defaults.currLang ) {
                case 'de':
                    _defaults.language = 'de';
                    break;
                case 'es':
                    _defaults.language = 'es';
                    break;
                case 'pt':
                    _defaults.language = 'pt_PT';
                    break;
                case 'ru':
                    _defaults.language = 'ru';
                    break;
            }
            
            // init editor
            tinymce.init( _defaults );
        },
        overview: function() {
            // check if description or publication editing is enabled and
            // set fullscreen options
            if ( $( '.overview__description-editor' ).length > 0 ) {
                viewerJS.tinyConfig.setup = function( editor ) {
                    editor.on( 'init', function( e ) {
                        $( '.overview__publication-action .btn' ).hide();
                    } );
                    editor.on( 'FullscreenStateChanged', function( e ) {
                        if ( e.state ) {
                            $( '.overview__description-action-fullscreen' ).addClass( 'in' );
                        }
                        else {
                            $( '.overview__description-action-fullscreen' ).removeClass( 'in' );
                        }
                    } );
                };
            }
            else {
                viewerJS.tinyConfig.setup = function( editor ) {
                    editor.on( 'init', function( e ) {
                        $( '.overview__description-action .btn' ).hide();
                    } );
                    editor.on( 'FullscreenStateChanged', function( e ) {
                        if ( e.state ) {
                            $( '.overview__publication-action-fullscreen' ).addClass( 'in' );
                        }
                        else {
                            $( '.overview__publication-action-fullscreen' ).removeClass( 'in' );
                        }
                    } );
                };
            }
        },
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var viewerJS = ( function( viewer ) {
    'use strict';
    
    var _debug = false;
    var _defaults = {
        versions: [],
        json: null,
        imgUrl: '',
        imgPi: '',
        versionLink: '',
        widgetInputs: '',
        widgetList: '',
    };
    
    viewer.versionHistory = {
        /**
         * Method to initialize the version history widget.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {Array} config.versions An array which holds all versions.
         * @param {Object} config.json An JSON-Object which takes all versions.
         * @param {String} config.imgUrl The image URL for the current work.
         * @param {String} config.imgPi The PI for the image of the current work.
         * @param {String} config.versionLink A string placeholder for the final HTML.
         * @param {String} config.widgetInputs A string placeholder for the final HTML.
         * @param {String} config.widgetList A string placeholder for the final HTML.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'viewer.versionHistory.init' );
                console.log( '##############################' );
                console.log( 'viewer.versionHistory.init: config = ', config );
            }
            
            $.extend( true, _defaults, config );
            
            // push versions into an array
            $( _defaults.widgetInputs ).each( function() {
                _defaults.versions.push( $( this ).val() );
            } );
            
            if ( _debug ) {
                console.log( 'viewer.versionHistory: versions = ', _defaults.versions );
            }
            
            // append list elements to widget
            for ( var i = 0; i < _defaults.versions.length; i++ ) {
                _defaults.json = JSON.parse( _defaults.versions[ i ] );
                
                if ( _defaults.json.id === _defaults.imgPi ) {
                    // Aktuell geöffnete Version - kein Link
                    _defaults.versionLink = '<li><span>' + _defaults.json.id + ' (' + _defaults.json.year + ')</span></li>';
                    
                    $( _defaults.widgetList ).append( _defaults.versionLink );
                }
                else {
                    // Vorgänger und Nachfolger jeweils mit Link
                    _defaults.versionLink = '<li><a href="' + _defaults.imgUrl + '/' + _defaults.json.id + '/1/">' + _defaults.json.id + ' (' + _defaults.json.year + ')</a></li>';
                    
                    $( _defaults.widgetList ).append( _defaults.versionLink );
                }
            }
        }
    };
    
    return viewer;
    
} )( viewerJS || {}, jQuery );
;var cmsJS = ( function() {
    'use strict';
    
    var _debug = false;
    var cms = {};
    
    /**
     * Method which initializes the CMS.
     * 
     * @method init
     * @example
     * 
     * <pre>
     * cmsJS.init();
     * </pre>
     */
    cms.init = function() {
        if ( _debug ) {
            console.log( '##############################' );
            console.log( 'cmsJS.init' );
            console.log( '##############################' );
        }
        
        // AJAX Loader Eventlistener
        jsf.ajax.addOnEvent( function( data ) {
            var ajaxstatus = data.status; // Can be "begin", "complete" and "success"
            var ajaxloader = document.getElementById( "AJAXLoader" );
            
            if ( ajaxloader ) {
                switch ( ajaxstatus ) {
                    case "begin": // This is called right before ajax request is been
                        // sent.
                        ajaxloader.style.display = 'block';
                        break;
                    
                    case "complete": // This is called right after ajax response is
                        // received.
                        ajaxloader.style.display = 'none';
                        break;
                    
                    case "success": // This is called when ajax response is successfully
                        // processed.
                        // NOOP.
                        break;
                }
            }
        } );
    };
    
    cms.dataTables_de = {
        "sEmptyTable": "Keine Daten in der Tabelle vorhanden",
        "sInfo": "_START_ bis _END_ von _TOTAL_ Einträgen",
        "sInfoEmpty": "0 bis 0 von 0 Einträgen",
        "sInfoFiltered": "(gefiltert von _MAX_ Einträgen)",
        "sInfoPostFix": "",
        "sInfoThousands": ".",
        "sLengthMenu": "_MENU_ Einträge anzeigen",
        "sLoadingRecords": "Wird geladen...",
        "sProcessing": "Bitte warten...",
        "sSearch": "Suchen",
        "sZeroRecords": "Keine Einträge vorhanden.",
        "oPaginate": {
            "sFirst": "Erste",
            "sPrevious": "Zurück",
            "sNext": "Nächste",
            "sLast": "Letzte"
        },
        "oAria": {
            "sSortAscending": ": aktivieren, um Spalte aufsteigend zu sortieren",
            "sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
        }
    };
    
    cms.dataTables_en = {
        "sEmptyTable": "No data available in table",
        "sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",
        "sInfoEmpty": "Showing 0 to 0 of 0 entries",
        "sInfoFiltered": "(filtered from _MAX_ total entries)",
        "sInfoPostFix": "",
        "sInfoThousands": ",",
        "sLengthMenu": "Show _MENU_ entries",
        "sLoadingRecords": "Loading...",
        "sProcessing": "Processing...",
        "sSearch": "Search:",
        "sZeroRecords": "No matching records found",
        "oPaginate": {
            "sFirst": "First",
            "sLast": "Last",
            "sNext": "Next",
            "sPrevious": "Previous"
        },
        "oAria": {
            "sSortAscending": ": activate to sort column ascending",
            "sSortDescending": ": activate to sort column descending"
        }
    };
    
    cms.dataTables_es = {
        "sProcessing": "Procesando...",
        "sLengthMenu": "Mostrar _MENU_ registros",
        "sZeroRecords": "No se encontraron resultados",
        "sEmptyTable": "Ningún dato disponible en esta tabla",
        "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
        "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
        "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
        "sInfoPostFix": "",
        "sSearch": "Buscar:",
        "sUrl": "",
        "sInfoThousands": ",",
        "sLoadingRecords": "Cargando...",
        "oPaginate": {
            "sFirst": "Primero",
            "sLast": "Último",
            "sNext": "Siguiente",
            "sPrevious": "Anterior"
        },
        "oAria": {
            "sSortAscending": ": Activar para ordenar la columna de manera ascendente",
            "sSortDescending": ": Activar para ordenar la columna de manera descendente"
        }
    };
    
    return cms;
    
} )( jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    var _debug = false;
    var _previewStatus = '';
    var _defaults = {
        selectedPageID: null,
        inputFields: null,
        prevBtn: null,
        prevDescription: null,
        saveBtn: null,
        sortablesConfig: {}
    };
    
    cms.createPage = {
        /**
         * Method which initializes the CMS create page module.
         * 
         * @method init
         * @param {Object} settings
         */
        init: function( settings ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.createPage.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.createPage.init: settings - ', settings );
            }
            
            $.extend( true, _defaults, settings );
            
            if ( _defaults.selectedPageID === null ) {
                cmsJS.createPage.disablePreview();
                _defaults.prevDescription.show();
            }
            
            // listen to changes on input fields
            _defaults.inputFields.on( 'change input paste', function() {
                cmsJS.createPage.disablePreview();
                _defaults.prevDescription.show();
            } );
            
            cmsJS.createPage.initSortables( _defaults );
            
            // set preview button status
            _previewStatus = localStorage.getItem( 'previewStatus' );
            
            if ( _previewStatus === 'false' ) {
                _defaults.prevBtn.attr( 'disabled', true );
                _defaults.prevDescription.show();
            }
            else {
                _defaults.prevBtn.attr( 'disabled', false );
                _defaults.prevDescription.hide();
                
                _defaults.prevBtn.on( 'click', function() {
                    var url = $( this ).attr( 'data-previewUrl' );
                    window.open( url, '_blank' );
                } );
            }
        },
        
        /**
         * Method which
         * 
         * @method initSortables
         * @param {Object} config
         */
        initSortables: function( config ) {
            if ( _debug ) {
                console.log( 'cmsJS.createPage.initSortables: config - ', config );
            }
            
            config.sortablesConfig.visibleItemList = $( config.sortablesConfig.visibleItemList );
            config.sortablesConfig.availableItemList = $( config.sortablesConfig.availableItemList );
            if ( config.sortablesConfig.availableItemList.length > 0 ) {
                cmsJS.sortableList.init( 0, false, config );
                config.sortablesConfig.editButton.on( 'click', function() {
                    if ( $( this ).hasClass( 'glyphicon-edit' ) ) {
                        $( this ).removeClass( 'glyphicon-edit' ).addClass( 'glyphicon-remove' );
                    }
                    else {
                        $( this ).removeClass( 'glyphicon-remove' ).addClass( 'glyphicon-edit' );
                    }
                    $( this ).parent( '.sidebar-editor-widget-item-header' ).next( '.sidebar-editor-widget-item-body' ).slideToggle( 'slow' );
                } );
                
                config.sortablesConfig.availableItemList.on( 'sortbeforestop', function( event, ui ) {
                    if ( $( ui.item ).parent().attr( 'id' ) === 'visibleItemList' ) {
                        cmsJS.createPage.disablePreview();
                    }
                } );
                
                config.sortablesConfig.visibleItemList.on( 'sortbeforestop', function() {
                    cmsJS.createPage.disablePreview();
                } );
            }
            else {
                if ( _debug )
                    console.log( "No sortable list elements available" );
                return false;
            }
        },
        
        /**
         * Method which disables the preview button by setting a local storage value.
         * 
         * @method disablePreview
         */
        disablePreview: function() {
            if ( _debug ) {
                console.log( '---------- cmsJS.createPage.disablePreview() ----------' );
            }
            
            localStorage.setItem( 'previewStatus', 'false' );
        },
        
        /**
         * Method which enables the preview button by setting a local storage value.
         * 
         * @method enablePreview
         */
        enablePreview: function() {
            if ( _debug ) {
                console.log( '---------- cmsJS.createPage.enablePreview() ----------' );
            }
            
            localStorage.setItem( 'previewStatus', 'true' );
        },
    };
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    // variables
    var _debug = false;
    var _data = null;
    var _lazyGrid = null;
    var _defaults = {
        $grid: null,
    };
    
    // DOM-Elements
    var $gridItem = null;
    var $gridItemImage = null;
    var $gridItemImageLink = null;
    var $gridItemTitle = null;
    var $gridItemTitleLink = null;
    var $gridItemCaption = null;
    var $gridItemCaptionHeading = null;
    var $gridItemCaptionLink = null;
    var $gridItemCaptionIcon = null;
    
    cms.masonry = {
        /**
         * Method which initializes the Masonry Grid.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {Object} config.$grid An jQuery object which represents the grid
         * container.
         * @param {Object} data An data object which contains the images sources for the
         * grid.
         */
        init: function( config, data ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.masonry.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.masonry.init: config - ', config );
                console.log( 'cmsJS.masonry.init: data - ', data );
            }
            
            $.extend( true, _defaults, config );
            
            // render grid
            _renderMasonryGrid( data );
            
            // init masonry
            _lazyGrid = _defaults.$grid.imagesLoaded( function() {
                // init Masonry after all images have loaded
                _lazyGrid.masonry( {
                    itemSelector: '.grid-item',
                    columnWidth: '.grid-sizer',
                    gutter: '.gutter-sizer',
                    percentPosition: true
                } );
            } );
            
            // fade in grid after rendering
            _lazyGrid.on( 'layoutComplete', function( event, laidOutItems ) {
                _defaults.$grid.addClass( 'ready' );
            } );
            
        }
    };
    
    /**
     * Method which renders the masonry grid.
     * 
     * @method _renderMasonryGrid
     * @param {Object} data An data object which contains the images sources for the grid.
     */
    function _renderMasonryGrid( data ) {
        if ( _debug ) {
            console.log( '---------- _renderMasonryGrid() ----------' );
            console.log( '_renderMasonryGrid: data = ', data );
        }
        
        // create items
        data.items.forEach( function( item ) {
            // grid item
            $gridItem = $( '<div />' );
            if ( item.important ) {
                $gridItem.addClass( 'grid-item important' );
            }
            else {
                $gridItem.addClass( 'grid-item' );
            }
            
            // grid item title
            $gridItemTitle = $( '<div />' );
            if ( item.url !== '' ) {
                $gridItemTitleLink = $( '<a />' );
                $gridItemTitleLink.attr( 'href', item.url );
                $gridItemTitleLink.attr( 'title', item.title );
            }
            $gridItemTitle.addClass( 'grid-item-title' );
            $gridItemTitle.text( item.title );
            if ( item.url !== '' ) {
                $gridItemTitleLink.append( $gridItemTitle );
                $gridItem.append( $gridItemTitleLink );
            }
            else {
                $gridItem.append( $gridItemTitle );
            }
            
            // grid item caption
            if ( item.caption !== '' ) {
                $gridItemCaption = $( '<div />' );
                $gridItemCaption.addClass( 'grid-item-caption' );
                $gridItemCaption.html( item.caption );
                
                // grid item caption heading
                $gridItemCaptionHeading = $( '<h4 />' );
                $gridItemCaptionHeading.text( item.title );
                $gridItemCaption.prepend( $gridItemCaptionHeading );
                
                if ( item.url !== '' ) {
                    // grid item caption link
                    $gridItemCaptionLink = $( '<a />' );
                    $gridItemCaptionLink.attr( 'href', item.url );
                    $gridItemCaptionLink.attr( 'title', item.title );
                    
                    // grid item caption icon
                    $gridItemCaptionIcon = $( '<i aria-hidden="true" />' );
                    $gridItemCaptionIcon.addClass( 'fa fa-arrow-right' );
                    
                    // append to grid item
                    $gridItemCaption.append( $gridItemCaptionIcon );
                    $gridItemCaptionLink.append( $gridItemCaption );
                    $gridItem.append( $gridItemCaptionLink );
                }
                else {
                    $gridItem.append( $gridItemCaption );
                }
            }
            
            // grid item image
            $gridItemImage = $( '<img />' );
            $gridItemImage.attr( 'src', item.name );
            $gridItemImage.addClass( 'img-responsive' );
            
            if ( item.url !== '' ) {
                // grid item image link
                $gridItemImageLink = $( '<a />' );
                $gridItemImageLink.attr( 'href', item.url );
                $gridItemImageLink.attr( 'title', item.title );
                $gridItemImageLink.append( $gridItemImage );
                $gridItem.append( $gridItemImageLink );
            }
            else {
                $gridItem.append( $gridItemImage );
            }
            
            // append to grid
            _defaults.$grid.append( $gridItem );
        } );
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    // variables
    var _debug = false;
    var _defaults = {
        rssFeedSelector: '.tpl-rss__feed',
    };
    
    cms.rssFeed = {
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
                console.log( 'cmsJS.rssFeed.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.rssFeed.init: config - ', config );
                console.log( 'cmsJS.rssFeed.init: data - ', data );
            }
            
            $.extend( true, _defaults, config );
            
            // render RSS Feed
            _renderRssFeed( data );
        }
    };
    
    /**
     * Method which renders the RSS feed into the DOM.
     * 
     * @method _renderRssFeed
     * @param {Object} data The RSS information data object.
     */
    function _renderRssFeed( data ) {
        if ( _debug ) {
            console.log( '---------- _renderRssFeed() ----------' );
            console.log( '_renderRssFeed: data = ', data );
        }
        
        // DOM elements
        var rssItem = null;
        var rssItemTitle = null;
        var rssItemTitleH3 = null;
        var rssItemTitleLink = null;
        var rssItemRow = null;
        var rssItemColLeft = null;
        var rssItemColRight = null;
        var rssItemImageWrapper = null;
        var rssItemImage = null;
        var rssItemImageLink = null;
        var rssItemDate = null;
        var rssItemTime = null;
        var rssItemMetadata = null;
        var rssItemMetadataKey = null;
        var rssItemMetadataValue = null;
        
        // create items
        data.items.forEach( function( item ) {
            // create item wrapper
            rssItem = $( '<div />' );
            rssItem.addClass( 'tpl-rss__item' );
            
            // create item title
            rssItemTitle = $( '<div />' );
            rssItemTitle.addClass( 'tpl-rss__item-title' );
            rssItemTitleH3 = $( '<h3 />' );
            rssItemTitleLink = $( '<a />' );
            rssItemTitleLink.attr( 'href', item.link );
            rssItemTitleLink.text( item.title );
            rssItemTitleH3.append( rssItemTitleLink );
            rssItemTitle.append( rssItemTitleH3 );
            
            // create item content
            rssItemRow = $( '<div />' );
            rssItemRow.addClass( 'row' );
            // left
            rssItemColLeft = $( '<div />' );
            rssItemColLeft.addClass( 'col-xs-3 col-sm-2' );
            rssItemImageWrapper = $( '<div />' );
            rssItemImageWrapper.addClass( 'tpl-rss__item-image' );
            rssItemImageLink = $( '<a />' );
            rssItemImageLink.attr( 'href', item.link );
            rssItemImage = $( '<img />' );
            rssItemImage.attr( 'src', item.description.image );
            rssItemImage.addClass( 'img-responsive' );
            rssItemImageLink.append( rssItemImage );
            rssItemImageWrapper.append( rssItemImageLink );
            rssItemColLeft.append( rssItemImageWrapper );
            // right
            rssItemColRight = $( '<div />' );
            rssItemColRight.addClass( 'col-xs-9 col-sm-10' );
            // create date
            rssItemDate = $( '<div />' );
            rssItemDate.addClass( 'tpl-rss__item-date' );
            rssItemTime = new Date( item.pubDate );
            rssItemDate.text( rssItemTime.toLocaleString() );
            // create metadata
            rssItemMetadata = $( '<dl />' );
            rssItemMetadata.addClass( 'tpl-rss__item-metadata dl-horizontal' );
            item.description.metadata.forEach( function( metadata ) {
                rssItemMetadataKey = $( '<dt />' );
                rssItemMetadataKey.text( metadata.label + ':' );
                rssItemMetadataValue = $( '<dd />' );
                rssItemMetadataValue.text( metadata.value );
                rssItemMetadata.append( rssItemMetadataKey ).append( rssItemMetadataValue );
            } );
            rssItemColRight.append( rssItemDate ).append( rssItemMetadata );
            // append to row
            rssItemRow.append( rssItemColLeft ).append( rssItemColRight );
            
            // create item
            rssItem.append( rssItemTitle ).append( rssItemRow );
            
            $( _defaults.rssFeedSelector ).append( rssItem );
        } );
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    var _debug = false;
    var _levelIndent = 0;
    var _allowMultipleOccurances = false;
    var _inputField = null;
    var _sortingAttribute = 'sortposition';
    
    cms.sortableList = {
        /**
         * Method which initializes the CMS sortable list items and sets events.
         * 
         * @method init
         * @param {String} indent
         * @param {Boolean} allowMultiple
         * @param {Object} config
         */
        init: function( indent, allowMultiple, config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.sortableList.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.sortableList.init: indent - ', indent );
                console.log( 'cmsJS.sortableList.init: allowMultiple - ', allowMultiple );
                console.log( 'cmsJS.sortableList.init: inputTextField - ', config.sortablesConfig.componentListInput );
            }
            
            _levelIndent = indent;
            _allowMultipleOccurances = allowMultiple;
            _inputField = config.sortablesConfig.componentListInput;
            
            // validation
            if ( _inputField === null ) {
                console.warn( "Input field for item order not found: No order information can be saved!" );
            }
            if ( config.sortablesConfig.visibleItemList.length === 0 ) {
                console.error( "No container for active items found. Cannot initialize sortable" );
            }
            if ( config.sortablesConfig.availableItemList.length === 0 ) {
                console.error( "No container for available items found. Cannot initialize sortable" );
            }
            
            _updateAllSortIcons();
            
            if ( _debug )
                console.log( "Make sortable ", config.sortablesConfig.visibleItemList );
            config.sortablesConfig.visibleItemList.sortable( {
                update: _serializeVisibleItems,
                connectWith: "#availableItemList"
            } );
            
            if ( _debug )
                console.log( "Make sortable ", config.sortablesConfig.availableItemList );
            config.sortablesConfig.availableItemList.sortable( {
                update: _serializeVisibleItems,
                connectWith: "#visibleItemList",
                helper: "clone"
            } );
            
            _serializeVisibleItems();
            $( "#availableItemList" ).on( "sortbeforestop", _handleBeforeDropFromAvailable );
            $( "#visibleItemList" ).on( "sortbeforestop", _handleBeforeDropFromVisible );
            $( "#availableItemList" ).on( "sortstop", _handleDrop );
            $( "#visibleItemList" ).on( "sortstop", _handleDrop );
        },
        
        /**
         * Method which
         * 
         * @method decreaseLevel
         * @param {String} element
         * @param {String} applyToNext
         */
        decreaseLevel: function( element, applyToNext ) {
            if ( _debug ) {
                console.log( 'cmsJS.sortableList.decreaseLevel: element - ', element );
                console.log( 'cmsJS.sortableList.decreaseLevel: applyToNext - ', applyToNext );
            }
            
            var item = _getJQueryItem( element );
            var level;
            
            if ( _getLevel( item ) > 0 ) {
                level = _changePos( item, -1 );
                if ( applyToNext ) {
                    var nextItem = item.next();
                    while ( nextItem !== null && _getLevel( nextItem ) > _getLevel( item ) + 1 ) {
                        cms.sortableList.decreaseLevel( nextItem, false );
                        nextItem = nextItem.next();
                    }
                }
            }
            
            _serializeVisibleItems();
            _updateAllSortIcons();
        },
        
        /**
         * Method which
         * 
         * @method increaseLevel
         * @param {String} element
         * @param {String} applyToNext
         */
        increaseLevel: function( element, applyToNext ) {
            if ( _debug ) {
                console.log( 'cmsJS.sortableList.increaseLevel: element - ', element );
                console.log( 'cmsJS.sortableList.increaseLevel: applyToNext - ', applyToNext );
            }
            var item = _getJQueryItem( element );
            var prevItem = item.prev();
            
            if ( _getLevel( item ) <= _getLevel( prevItem ) ) {
                _changePos( item, 1 );
                if ( applyToNext ) {
                    var nextItem = item.next();
                    while ( nextItem !== null && _getLevel( nextItem ) >= _getLevel( item ) ) {
                        cms.sortableList.increaseLevel( nextItem, false );
                        nextItem = nextItem.next();
                    }
                }
            }
            
            _serializeVisibleItems();
            _updateAllSortIcons();
        },
        
        save: function( ajaxData ) {
            if ( typeof ajaxData === "undefined" || ajaxData.status === "begin" ) {
                _serializeVisibleItems();
            }
        }
    };
    
    /**
     * (Privat) Method which
     * 
     * @method _handleBeforeDropFromAvailable
     * @param {String} event
     * @param {String} ui
     */
    function _handleBeforeDropFromAvailable( event, ui ) {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _handleBeforeDropFromAvailable: event - ', event );
            console.log( 'cmsJS.sortableList _handleBeforeDropFromAvailable: ui - ', ui );
        }
        
        var $item = $( ui.item );
        
        var $radioMenues = $item.find("td");
        $radioMenues.each(function(index, element) {
        	var $checkboxes = $(element).find("input");
        	if($checkboxes.length > 0) {
        		var anychecked = false;
        		$checkboxes.each(function(index, element) {
        			if($(element).prop('checked')) {
        				anychecked = true;
        				return false;
        			}
        		})
        		if(!anychecked) {
        			$($checkboxes.get(0)).prop('checked', true);
        		}
        	}
        })
        if ( _allowMultipleOccurances && item.parent().attr( "id" ) === "visibleItemList" ) {
            item.clone().appendTo( $( "#availableItemList" ) );
        }
        
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _handleBeforeDropFromAvailable
     * @param {String} event
     * @param {String} ui
     */
    function _handleBeforeDropFromVisible( event, ui ) {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _handleBeforeDropFromVisible: event - ', event );
            console.log( 'cmsJS.sortableList _handleBeforeDropFromVisible: ui - ', ui );
        }
        
        var item = $( ui.item );
        if ( _allowMultipleOccurances && item.parent().attr( "id" ) === "availableItemList" ) {
            ui.item.remove();
        }
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _handleDrop
     */
    function _handleDrop() {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _handleDrop' );
        }
        _updateAllSortIcons();
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _updateAllSortIcons
     */
    function _updateAllSortIcons() {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _updateAllSortIcons' );
        }
        
        var childrenVL = $( "#visibleItemList" ).children( "li" );
        childrenVL.each( function() {
            if ( $( this ).attr( _sortingAttribute ) != null ) {
                _updateSortIcons( $( this ) );
            }
        } );
        
        var childrenAL = $( "#availableItemList" ).children( "li" );
        childrenAL.each( function() {
            if ( $( this ).attr( _sortingAttribute ) != null ) {
                _updateSortIcons( $( this ) );
            }
        } );
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _updateSortIcons
     * @param {Object} item
     */
    function _updateSortIcons( item ) {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _updateSortIcons: item - ', item );
        }
        
        var parent = item.parent();
        
        if ( parent.attr( "id" ) === "visibleItemList" ) {
            item.children( '.menu-item__level' ).show();
            if ( _getLevel( item.prev() ) === -1 ) {
                while ( _getLevel( item ) > 0 ) {
                    cms.sortableList.decreaseLevel( item );
                }
            }
            
            if ( _getLevel( item ) === 0 ) {
                item.find( '.left' ).css( "visibility", "hidden" );
                item.find( '.right' ).css( "visibility", "hidden" );
                item.css( "margin-left", "0px" );
            }
            else {
                item.find( '.left' ).css( "visibility", "visible" );
                item.find( '.right' ).css( "visibility", "visible" );
                item.css( "margin-left", _getLevel( item ) * _levelIndent + "px" );
            }
            
            if ( _getLevel( item ) > _getLevel( item.prev() ) ) {
                item.find( '.left' ).css( "visibility", "visible" );
                item.find( '.right' ).css( "visibility", "hidden" );
            }
            else {
                item.find( '.left' ).css( "visibility", "visible" );
                item.find( '.right' ).css( "visibility", "visible" );
            }
        }
        else {
            item.children( '.menu-item__level' ).hide();
        }
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _getJQueryItem
     * @param {Object} element
     */
    function _getJQueryItem( element ) {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _getJQueryItem: element - ', element );
        }
        
        var item = $( element );
        
        while ( item !== null && item.attr( _sortingAttribute ) === undefined ) {
            item = item.parent();
        }
        
        return item;
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _getLevel
     * @param {Object} item
     */
    function _getLevel( item ) {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _getLevel: item - ', item );
        }
        
        var pos = item.attr( _sortingAttribute );
        
        if ( pos === null || pos === undefined ) {
            return -1;
        }
        
        var curLevel = pos.substr( pos.indexOf( '?' ) + 1 );
        var level = parseInt( curLevel );
        
        return level;
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _changePos
     * @param {Object} item
     * @param {String} diff
     */
    function _changePos( item, diff ) {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _changePos: item - ', item );
            console.log( 'cmsJS.sortableList _changePos: diff - ', diff );
        }
        
        var pos = item.attr( _sortingAttribute );
        
        if ( pos === null || pos === undefined ) {
            return -1;
        }
        
        var curLevel = pos.substr( pos.indexOf( '?' ) + 1 );
        var curItem = pos.substr( pos.indexOf( '_' ) + 1 );
        var curItemInt = parseInt( curItem );
        var level = parseInt( curLevel ) + diff;
        item.attr( _sortingAttribute, "item_" + curItemInt + '?' + level );
        
        return level;
    }
    
    /**
     * (Privat) Method which
     * 
     * @method _serializeVisibleItems
     */
    function _serializeVisibleItems() {
        if ( _debug ) {
            console.log( 'cmsJS.sortableList _serializeVisibleItems' );
        }
        
        var postData = $( "#visibleItemList" ).sortable( "serialize", {
            key: "item",
            attribute: _sortingAttribute
        } );
        
        if ( _inputField !== null ) {
            _inputField.value = postData;
            // postData = $("#itemOrderInput").val();
        }
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    // variables
    var _debug = true;
    var _defaults = {
        collectionsSelector: '.tpl-stacked-collection__collections',
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
        var panelCollapse = null;
        var panelBody = null;
        
        // create members
        data.members.forEach( function( member ) {
            // increase counter
            counter++;
            // create panels
            panel = $( '<div />' ).addClass( 'panel' );
            // create panel title
            panelHeading = $( '<div />' ).addClass( 'panel-heading' );
            panelTitle = $( '<h4 />' ).addClass( 'panel-title' );
            panelTitleLink = $( '<a />' ).attr( 'role', 'button' ).attr( 'data-toggle', 'collapse' ).attr( 'data-parent', '#stackedCollections' ).attr( 'href', '#collapse-'
                    + counter ).text( member.label );
            panelTitle.append( panelTitleLink );
            // create panel thumbnail if exist
            if ( member.thumbnail ) {
                panelThumbnail = $( '<div />' ).addClass( 'panel-thumbnail' );
                panelThumbnailImage = $( '<img />' ).attr( 'src', member.thumbnail ).addClass( 'img-responsive' );
                panelThumbnail.append( panelThumbnailImage );
                // build title
                panelHeading.append( panelThumbnail ).append( panelTitle );
            }
            else {
                // build title
                panelHeading.append( panelTitle );
            }
            // create collapse
            panelCollapse = $( '<div />' ).attr( 'id', 'collapse-' + counter ).attr( 'role', 'tabpanel' ).addClass( 'panel-collapse collapse' );
            // create panel body
            panelBody = $( '<div />' ).addClass( 'panel-body' ).append( _renderSubCollections( 'http://localhost:8080/viewer/rest/collections/de/DC/a/' ) );
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
        
        // get subcollection data
        $.ajax( {
            url: url,
            type: 'GET',
            datatype: 'JSON'
        } ).then( function( data ) {
            // add subcollection items
            data.members.forEach( function( member ) {
                // create subcollection item
                subCollectionItem = $( '<li />' );
                subCollectionItemLink = $( '<a />' ).attr( 'href', '#' ).text( member.label );
                // buils subcollection item
                subCollectionItem.append( subCollectionItemLink );
                subCollections.append( subCollectionItem );
            } );
        } );
        
        return subCollections;
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    // variables
    var _debug = false;
    var _data = null;
    var _defaults = {
        gridSelector: '.tpl-static-grid__grid'
    };
    
    // DOM elements
    var _grid = null;
    var _gridRow = null;
    var _gridCol = null;
    var _gridTile = null;
    var _gridTileTitle = null;
    var _gridTileTitleLink = null;
    var _gridTileTitleH4 = null;
    var _gridTileImage = null;
    var _gridTileImageLink = null;
    
    cms.staticGrid = {
        /**
         * Method which initializes the Masonry Grid.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.gridSelector The selector for the grid container.
         * @param {Object} data An data object which contains the images sources for the
         * grid.
         */
        init: function( config, data ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.staticGrid.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.staticGrid.init: config - ', config );
                console.log( 'cmsJS.staticGrid.init: data - ', data );
            }
            
            $.extend( true, _defaults, config );
            
            // render grid
            _grid = _buildGrid( data );
            $( _defaults.gridSelector ).append( _grid );
        }
    };
    
    /**
     * Method to build the elements of the static grid.
     * 
     * @method _buildGrid
     * @param {Object} data A JSON data object which contains the image informations.
     * @returns {Object} An jQuery object which contains all grid elements.
     */
    function _buildGrid( data ) {
        if ( _debug ) {
            console.log( '---------- _buildGrid() ----------' );
            console.log( '_buildGrid: data = ', data );
        }
        
        _gridRow = $( '<div class="row" />' );
        
        data.items.forEach( function( item ) {
            _gridCol = $( '<div class="col-xs-6 col-sm-3" />' );
            // tile
            _gridTile = $( '<div class="grid-tile" />' );
            // title
            _gridTileTitle = $( '<div class="grid-tile__title" />' );
            _gridTileTitleH4 = $( '<h4 />' );
            _gridTileTitleLink = $( '<a />' );
            if ( item.url !== '' ) {
                _gridTileTitleLink.attr( 'href', item.url );
            }
            else {
                _gridTileTitleLink.attr( 'href', '#' );
            }
            _gridTileTitleLink.attr( 'title', item.title );
            _gridTileTitleLink.append( item.title );
            _gridTileTitleH4.append( _gridTileTitleLink );
            // image
            _gridTileImage = $( '<div class="grid-tile__image" />' );
            _gridTileImage.css( 'background-image', 'url(' + item.name + ')' );
            _gridTileImageLink = $( '<a />' );
            if ( item.url !== '' ) {
                _gridTileImageLink.attr( 'href', item.url );
            }
            else {
                _gridTileImageLink.attr( 'href', '#' );
            }
            // concat everything
            _gridTileTitle.append( _gridTileTitleH4 );
            _gridTile.append( _gridTileTitle );
            _gridTileImage.append( _gridTileImageLink );
            _gridTile.append( _gridTileTitle );
            _gridTile.append( _gridTileImage );
            _gridCol.append( _gridTile );
            _gridRow.append( _gridCol );
        } );
        
        return _gridRow;
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    var _debug = false;
    var _defaults = {
        inputFieldId: 'tagInput',
        tagListId: 'tagList',
        autoSuggestUrl: '',
        msg: {
            addTagLabel: 'Tag hinzufügen'
        }
    };
    
    cms.tagList = {
        tags: [],
        $tagListElement: null,
        autoSuggestUrl: null,
        /**
         * Method which initializes the tag list.
         * 
         * @method init
         * @param {Object} config An config object which overwrites the defaults.
         * @param {String} config.inputFieldId The Selector for the tag input field.
         * @param {String} config.tagList The Selector for the tag list.
         * @param {String} config.autoSuggestUrl The URL for the tag auto suggest.
         * @param {Object} config.msg An object with message keys.
         */
        init: function( config ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.tagList.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.tagList.init: config - ', config );
            }
            
            $.extend( true, _defaults, config );
            
            this.$inputField = $( '#' + _defaults.inputFieldId );
            
            if ( this.$inputField.length === 0 ) {
                console.log( 'Data input field not found' );
            }
            
            this.$tagListElement = $( '#' + _defaults.tagListId );
            
            if ( this.$tagListElement.length === 0 ) {
                throw 'Tag list element not found';
            }
            
            this.autoSuggestUrl = _defaults.autoSuggestUrl;
            this.tags = _readTags( this.$inputField );
            _renderList( this.tags, this.$tagListElement );
            
        },
        /**
         * Method which adds a tag to the list.
         * 
         * @method addTag
         * @param {String} tagName The current tag name.
         */
        addTag: function( tagName ) {
            if ( _debug ) {
                console.log( '---------- cms.tagList.addTag() ----------' );
                console.log( 'cmsJS.tagList.addTag: tagName = ', tagName );
            }
            
            var containedTag = this.getTag( tagName );
            if ( containedTag ) {
                var duration = 200;
                $( containedTag ).fadeOut( duration / 2, function() {
                    $( containedTag ).fadeIn( duration / 2 );
                } );
            }
            else {
                if ( this.$tagListElement ) {
                    _createListElement( tagName, this.$tagListElement );
                }
                this.saveTags();
            }
        },
        /**
         * Method which deletes a tag from the list.
         * 
         * @method deleteTag
         * @param {Object} tag The current tag to delete.
         */
        deleteTag: function( tag ) {
            if ( _debug ) {
                console.log( '---------- cms.tagList.deleteTag() ----------' );
                console.log( 'cmsJS.tagList.deleteTag: tag = ', tag );
            }
            
            tag.remove();
            this.saveTags();
        },
        /**
         * Method to save the tag list.
         * 
         * @method saveTags
         */
        saveTags: function() {
            if ( _debug ) {
                console.log( '---------- cms.tagList.saveTags() ----------' );
            }
            
            _writeTags( cms.tagList.$tagListElement.children( '[id$=_item]' ), cms.tagList.$inputField );
        },
        /**
         * Method to ...
         * 
         * @method contains
         */
        contains: function( tagName ) {
            if ( _debug ) {
                console.log( '---------- cms.tagList.contains() ----------' );
                console.log( 'cmsJS.tagList.contains: tagName = ', tagName );
            }
            
            var found = false;
            var $tags = cms.tagList.$tagListElement.children( '[id$=_item]' );
            
            $tags.each( function() {
                var text = $( this ).text();
                if ( tagName.trim().toUpperCase() === text.trim().toUpperCase() ) {
                    found = true;
                    
                    return false;
                }
            } );
            
            return found;
        },
        /**
         * Method to ...
         * 
         * @method close
         */
        close: function() {
            if ( _debug ) {
                console.log( '---------- cms.tagList.close() ----------' );
            }
            
            this.$inputField.off();
            this.$tagListElement.off();
            this.$tagListElement.find( '.tag-terminator' ).off();
            this.$tagListElement.find( 'input' ).off();
        },
        /**
         * Method to get all tags.
         * 
         * @method getTags
         */
        getTags: function() {
            if ( _debug ) {
                console.log( '---------- cms.tagList.getTags() ----------' );
            }
            
            return cms.tagList.$tagListElement.children( '[id$=_item]' );
        },
        /**
         * Method to get all tag values.
         * 
         * @method getTagValues
         */
        getTagValues: function() {
            if ( _debug ) {
                console.log( '---------- cms.tagList.getTagValues() ----------' );
            }
            
            var values = cmsJS.tagList.getTags().map( function( index, tag ) {
                return $( tag ).text();
            } );
            
            return values;
        },
        /**
         * Method to get a single tag.
         * 
         * @method getTag
         */
        getTag: function( value ) {
            if ( _debug ) {
                console.log( '---------- cms.tagList.getTag() ----------' );
                console.log( 'cmsJS.tagList.getTag: value = ', value );
            }
            
            var selectedTag = undefined;
            
            cmsJS.tagList.getTags().each( function( index, tag ) {
                if ( cmsJS.tagList.getValue( tag ).trim().toUpperCase() === value.trim().toUpperCase() ) {
                    selectedTag = tag;
                    
                    return false;
                }
            } );
            
            return selectedTag;
        },
        /**
         * Method to get a single Value.
         * 
         * @method getValue
         */
        getValue: function( tag ) {
            if ( _debug ) {
                console.log( '---------- cms.tagList.getValue() ----------' );
                console.log( 'cmsJS.tagList.getValue: tag = ', tag );
            }
            
            return $( tag ).text();
        }
    };
    
    /**
     * Method to ...
     * 
     * @method _readTags
     * @param {Object} $input ...
     */
    function _readTags( $input ) {
        if ( _debug ) {
            console.log( '---------- _readTags() ----------' );
            console.log( '_readTags: $input = ', $input );
        }
        
        var tagString = $input.val();
        
        if ( !tagString ) {
            tagString = '[]';
        }
        
        if ( tagString.length > 0 ) {
            if ( _debug ) {
                console.log( '---------- _readTags() ----------' );
                console.log( 'tagString: ', tagString );
            }
            
            try {
                var tagList = JSON.parse( tagString );
                return tagList;
            }
            catch ( error ) {
                console.log( 'Error reading tags from ' + tagString );
                
                return [];
            }
        }
        else {
            return [];
        }
    }
    
    /**
     * Method to ...
     * 
     * @method _writeTags
     * @param {Object} $tags ...
     * @param {Object} $input ...
     */
    function _writeTags( $tags, $input ) {
        if ( _debug ) {
            console.log( '---------- _writeTags() ----------' );
            console.log( '_writeTags: $tags = ', $tags );
            console.log( '_writeTags: $input = ', $input );
        }
        
        var tags = [];
        
        $tags.each( function() {
            if ( $( this ).text().length > 0 ) {
                tags.push( $( this ).text() );
            }
        } )

        var tagString = JSON.stringify( tags );
        
        $input.val( tagString );
    }
    
    /**
     * Method to ...
     * 
     * @method _renderList
     * @param {Array} tags ...
     * @param {Object} $ul ...
     */
    function _renderList( tags, $ul ) {
        if ( _debug ) {
            console.log( '---------- _renderList() ----------' );
            console.log( '_renderList: tags = ', tags );
            console.log( '_renderList: $ul = ', $ul );
        }
        
        var count = 0;
        var ulId = $ul.attr( 'id' );
        for ( var index = 0; index < tags.length; index++ ) {
            var tag = tags[ index ];
            _createListElement( tag, $ul, count );
            count++;
        }
        
        _createTagInputElement( $ul.parent() );
    }
    
    /**
     * Method to ...
     * 
     * @method _createListElement
     * @param {String} value ...
     * @param {Object} $parent ...
     * @param {Number} count
     */
    function _createListElement( value, $parent, count ) {
        if ( _debug ) {
            console.log( '---------- _createListElement() ----------' );
            console.log( '_createListElement: value = ', value );
            console.log( '_createListElement: $parent = ', $parent );
            console.log( '_createListElement: count = ', count );
        }
        
        if ( !count ) {
            count = $parent.children( '[id$=_item]' ).length;
        }
        
        var ulId = $parent.attr( 'id' );
        var $tagInput = $( '.tag-input' );
        var $li = $( '<li/>' );
        $li.attr( 'id', ulId + '_' + count + '_item' );
        var $liText = $( '<span class="tag label"/>' );
        $liText.text( value );
        var $terminator = $( '<span />' );
        $terminator.addClass( 'tag-terminator' );
        $terminator.on( 'click', _handleClickTerminator );
        $li.append( $liText );
        $liText.append( $terminator );
        
        if ( $tagInput.length > 0 ) {
            $li.insertBefore( $tagInput );
        }
        else {
            $parent.append( $li );
        }
    }
    
    /**
     * Method to ...
     * 
     * @method _createTagInputElement
     * @param {Object} $parent ...
     */
    function _createTagInputElement( $parent ) {
        if ( _debug ) {
            console.log( '---------- _createTagInputElement() ----------' );
            console.log( '_createTagInputElement: $parent = ', $parent );
        }
        
        var $container = $( '.media-modal__tags' );
        var sizeCount = 1;
        var ulId = $parent.attr( 'id' );
        var $inputListElement = $( '<li />' );
        $inputListElement.addClass( 'tag-input' );
        var $input = $( '<input type="text" />' );
        $input.attr( 'id', ulId + '_inputField' );
        $input.attr( 'size', sizeCount );
        $inputListElement.append( $input );
        $parent.find( 'ul' ).append( $inputListElement );
        
        // handler
        $container.on( 'click', function() {
            $input.focus();
        } );
        $input.on( 'change', _handleInputChange );
        $input.on( 'keypress', function( event ) {
            // change size of input
            sizeCount++;
            $input.attr( 'size', sizeCount );
            
            // press enter
            if ( event.keyCode == 13 ) {
                sizeCount = 1;
                $input.attr( 'size', sizeCount );
                
                return _handleInputChange( event );
            }
        } );
        
        // autocomplete
        $input.autocomplete( {
            source: function( request, response ) {
                Q( $.ajax( {
                    url: cms.tagList.autoSuggestUrl + request.term + '/',
                    type: 'GET',
                    datatype: 'json',
                } ) ).then( function( data ) {
                    response( data );
                } )
            },
            appendTo: $input.parent(),
            select: function( event, ui ) {
                _handleInputChange( event, ui.item.value );
            }
        } );
    }
    
    /**
     * Method to ...
     * 
     * @method _handleInputChange
     * @param {Object} event ...
     * @param {String} text ...
     */
    function _handleInputChange( event, text ) {
        if ( _debug ) {
            console.log( '---------- _handleInputChange() ----------' );
            console.log( '_handleInputChange: event = ', event );
            console.log( '_handleInputChange: text = ', text );
            console.log( 'on change occured in: ', event.target );
        }
        if ( !text || text.length === 0 ) {
            text = $( event.target ).val();
        }
        if ( text.trim().length > 0 ) {
            cms.tagList.addTag( text );
            $( event.target ).val( '' );
        }
        event.preventDefault();
        event.stopPropagation();
        
        return false;
    }
    
    /**
     * Method to ...
     * 
     * @method _handleClickTerminator
     * @param {Object} event ...
     */
    function _handleClickTerminator( event ) {
        if ( _debug ) {
            console.log( '---------- _handleClickTerminator() ----------' );
            console.log( '_handleClickTerminator: event = ', event );
            console.log( 'Click on: ', event.currentTarget );
        }
        
        var $li = $( event.target ).parent().parent();
        cms.tagList.deleteTag( $li );
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
;var cmsJS = ( function( cms ) {
    'use strict';
    
    // variables
    var _debug = false;
    var _data = null;
    var _tiles = [];
    var _defaults = {
        $highlights: null,
        $grid: null
    };
    
    // DOM-Elements
    var $gridItem = null;
    var $gridItemLink = null;
    var $gridItemCaptionLink = null;
    var $gridItemCaptionIcon = null;
    var $gridItemFigure = null;
    var $gridItemFigcaption = null;
    var $gridItemFigcaptionHeader = null;
    var $gridItemImage = null;
    
    cms.tileGrid = {
        init: function( config, data ) {
            if ( _debug ) {
                console.log( '##############################' );
                console.log( 'cmsJS.tileGrid.init' );
                console.log( '##############################' );
                console.log( 'cmsJS.tileGrid.init: config - ', config );
                console.log( 'cmsJS.tileGrid.init: data - ', data );
            }
            
            $.extend( true, _defaults, config );
            
            _tiles = _getTiles( data );
            _renderTileGrid( _tiles );
        }
    };
    
    function _getTiles( data ) {
        if ( _debug ) {
            console.log( '---------- _getTiles() ----------' );
            console.log( '_getTiles: data = ', data );
        }
        
        var tiles = [];
        
        data.items.forEach( function( item ) {
            $gridItem = $( '<div />' );
            $gridItemLink = $( '<a />' );
            $gridItemCaptionLink = $( '<a />' );
            $gridItemCaptionIcon = $( '<i aria-hidden="true" />' );
            $gridItemFigure = $( '<figure />' );
            $gridItemFigcaption = $( '<figcaption />' );
            $gridItemFigcaptionHeader = $( '<h3 />' );
            $gridItemImage = $( '<img />' );
            
            // create item
            if ( item.important ) {
                $gridItem.addClass( 'tpl-tile-grid__grid-item important' );
            }
            else {
                $gridItem.addClass( 'tpl-tile-grid__grid-item' );
            }
            if ( item.size !== '' ) {
                $gridItem.addClass( item.size );
            }
            $gridItemImage.attr( 'src', item.name );
            // $gridItemImage.attr( 'class', 'img-responsive' );
            $gridItemImage.attr( 'alt', item.title );
            if ( item.url !== '' ) {
                $gridItemLink.attr( 'href', item.url );
                $gridItemLink.append( $gridItemImage );
                $gridItemFigure.append( $gridItemLink );
            }
            else {
                $gridItemFigure.append( $gridItemImage );
            }
            $gridItemFigcaptionHeader.text( item.title );
            $gridItemFigure.append( $gridItemFigcaptionHeader );
            $gridItemFigcaption.append( item.caption );
            if ( item.url !== '' ) {
                $gridItemCaptionLink.attr( 'href', item.url );
                $gridItemCaptionIcon.addClass( 'fa fa-arrow-right' );
                $gridItemCaptionLink.append( $gridItemCaptionIcon );
                $gridItemFigcaption.append( $gridItemCaptionLink );
            }
            $gridItemFigure.append( $gridItemFigcaption );
            $gridItem.append( $gridItemFigure );
            
            // push tile into tiles array
            tiles.push( $gridItem );
        } );
        
        return tiles;
    }
    
    function _renderTileGrid( tiles ) {
        if ( _debug ) {
            console.log( '---------- _renderTileGrid() ----------' );
            console.log( '_renderTileGrid: tiles = ', tiles );
        }
        
        tiles.forEach( function( tile ) {
            if ( tile.hasClass( 'important' ) ) {
                _defaults.$highlights.append( tile );
            }
            else {
                _defaults.$grid.append( tile );
            }
        } );
    }
    
    return cms;
    
} )( cmsJS || {}, jQuery );
