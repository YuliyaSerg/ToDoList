
var todoList = todoList || {

    /*
     Properties
    */

    currentTab: "todo",

    /*
     Methods
    */

    addItem: function ( item ) {

        // Add item to top of list (in memory)
        todoList.todolist.items.reverse();
        todoList.todolist.items.push( item );
        todoList.todolist.items.reverse();

        // Update localStorage & bind list
        localStorage.todolist = JSON.stringify( todoList.todolist );
        this.bindList( "todo" );

    },

    bindList: function ( list ) {

        $( "#" + list + " .list" ).html(
            Mustache.render( todoList.templates.list, todoList[list + "list"] )
        );
        this.initLists();

    },

    hideMenu: function ( menu ) {
        $( "#" + menu + " div.menu" ).hide();
    },

    init: function () {

        this.bindList( "todo" );
        this.initAddForm();
        this.initLists();
        this.initTabs();
        this.initTools();

    },

    initAddForm: function () {

        $( "#form" ).off( "click", "#add-item-button" )
            .on( "click", "#add-item-button", { instance: this }, function ( e ) {

                var me = e.data.instance,
                    textbox = $( "#add-item-textbox" ),
                    item = $.trim( textbox.val() );

                if ( item !== "" ) {

                    $( "#add-error" ).remove();
                    me.addItem( item );
                    textbox.val( "" );

                } else {

                    $( "#main" ).prepend( Mustache.render( me.templates.message, {
                        id: "add-error",
                        type: "error",
                        message: "Please enter a task to add to your list."
                    } )
                    );

                }

                e.preventDefault();
                e.stopPropagation();

            } );

    },

    initLists: function () {

        /// Setup list-items to be dropped on tabs
        $( ".tabs li" ).droppable(
            {
                accept:".list li",
                hoverClass: "highlight",
                tolerance: "pointer",
                drop: function ( e, ui ) {

                    // Get list referencea
                    var listitem = ui.draggable[0] || null,
                        newlist = $( this ).attr( "data-panel" ) + "list",
                        oldlist = $( listitem ).parents( ".tab-panel:first" ).attr( "id" ) + "list",
                        value;

                    if ( listitem === null || newlist === oldlist ) return;

                    // Extract text value
                    value =  $( "label", listitem ).text();

                    // Update new list
                    todoList[ newlist ].items.reverse();
                    todoList[ newlist ].items.push( value );
                    todoList[ newlist ].items.reverse();
                    localStorage[ newlist ] = JSON.stringify( todoList[ newlist ] );

                    // Update old list
                    todoList[ oldlist ].items.splice(
                        todoList[ oldlist ].items.indexOf( value ), 1
                    );
                    localStorage[ oldlist ] = JSON.stringify( todoList[ oldlist ] );

                    // Remove dropped element
                    $( ui.draggable[0] ).remove();
                }
            } );

        /// Setup lists to be sortable
        $( ".list" ).sortable( {
            placeholder: "placeholder", revert: 125, update: function ( event, ui ) {

                var task = $( "label", ui.item ).text(),
                    newindex = $( ui.item ).index(),
                    oldindex = todoList[ todoList.currentTab + "list" ].items.indexOf( task );

                todoList[ todoList.currentTab + "list" ].items.move( oldindex, newindex );
                localStorage[ todoList.currentTab + "list" ] = JSON.stringify(
                        todoList[ todoList.currentTab + "list" ]
                    );
            }
        } );

        /// Show/hide Bulk Actions icon based on selected list checkboxes
        $( "#lists" ).off( "click", ".tab-panel li :checkbox" )
            .on( "click", ".tab-panel li :checkbox", function () {

                var checked = $( this ).is( ":checked" );

                if ( checked ) {
                    $( "#bulk-actions" ).show();
                    return;
                }

                if ( $( ".tab-panel li input:checked" ).length === 0 ) {
                    $( "#bulk-actions" ).hide();
                }

            } );

        /// Make items editable on double-click
        $( "#lists" ).off( "dblclick", ".tab-panel li" )
            .on( "dblclick", ".tab-panel li", { instance:this }, function ( e ) {

                var label = $( "label", this ),
                    me = e.data.instance,
                    reset = $( this ).parents( ".tab-panel" ).find( "li :text" ),
                    i;

                if ( reset.length > 0 ) {
                    me.resetItems( reset );
                }

                // Replace label with textbox
                label.replaceWith( Mustache.render( todoList.templates.itemEditor, label.text() ) );
                $( "#edit-item-textbox" ).select();

                e.preventDefault();
                e.stopPropagation();

            } );

        /// Save edited item
        $( "#lists" ).off( "submit", "#edit-item-form" )
            .on( "submit", "#edit-item-form", { instance: this }, function ( e ) {

                var me = e.data.instance,
                    textbox = $( this ).find( ":text" ),
                    newValue = textbox.val(),
                    oldValue = textbox.attr( "data-value" ),
                    changed = newValue != oldValue;

                // Update list in memory and localStorage
                if ( changed ) {
                    me[ me.currentTab + "list" ].items[
                        me[ me.currentTab + "list" ].items.indexOf( oldValue )
                        ] = newValue;
                    localStorage[ me.currentTab + "list" ] = JSON.stringify( me[ me.currentTab + "list" ] );
                }

                // Remove form
                $( this ).parents( "li:first" ).replaceWith(
                    Mustache.render( todoList.templates.list, { items: [ newValue ] } )
                );

                e.preventDefault();
                e.stopPropagation();

            } );

    },

    initTabs: function () {

        $( "#lists" ).off( "click", ".tabs li" )
            .on( "click", ".tabs li", { instance: this }, function ( e ) {

                var me = e.data.instance,
                    panel = $( this ).attr( "data-panel" );

                // Hide current panel an remove selected class
                $( ".tabs li" ).removeClass( "selected" );
                $( ".tab-panel" ).hide();
                $( "#bulk-actions" ).hide();

                // Bind new panel, add selected class and show
                me.bindList( panel );
                me.currentTab = panel;
                $( this ).addClass( "selected" );
                $( "#" + panel ).show();

                e.preventDefault();
                e.stopPropagation();

            } );

    },

    initTools: function () {

        /// Hide menus on document click
        $( document ).off( "click" )
            .on( "click", { instance: this }, function ( e ) {

                var me = e.data.instance,
                    reset;

                if ( $( e.target ).parents( "div.menu" ).length === 0 ) {
                    me.hideMenu( "tools" );
                    me.hideMenu( "bulk-actions" );
                }

                if ( $( e.target ).parents( "ul.list" ).length === 0 ) {

                    reset = $( ".tab-panel li :text" );
                    me.resetItems( reset );

                }

            } );

        /// Show/hide menus on button click
        $( document ).off( "click", "#options-button, #bulk-actions-link" )
            .on( "click", "#options-button, #bulk-actions-link", function ( e ) {

                $( this ).next( ".menu" ).toggle();

                e.preventDefault();
                e.stopPropagation();

            } );

        /// Export/backup lists
        $( document ).off( "click", "#export-link" )
            .on( "click", "#export-link", { instance: this }, function ( e ) {

                var todo = todoList.todolist || "",
                    backlog = todoList.backloglist || "",
                    completed = todoList.completedlist || "",
                    exportJson, exportObject = {}, me = e.data.instance;

                // Hide menu
                me.hideMenu( "tools" );

                // Build list wrapper object
                exportObject.lists = [todo, backlog, completed];

                // Encode and stringify
                exportJson = encodeURI( JSON.stringify( exportObject ) );

                // Save
                window.location.href = "data:text/json;charset=utf-8," + exportJson;

                e.preventDefault();
                e.stopPropagation();

            } );

        /// Open explorer window when import button clicked
        $( document ).off( "click", "#import-link" )
            .on( "click", "#import-link", function ( e ) {

                $( "#list-importer" ).click();

                e.preventDefault();
                e.stopPropagation();

            } );

        /// Import json saved lists file
        $( document ).off( "change", "#list-importer" )
            .on( "change", "#list-importer", { instance: this }, function ( e ) {

                var me = e.data.instance,
                    reader = new FileReader(),
                    files = e.target.files,
                    i;

                reader.onload = function ( event ) {

                    var lists = JSON.parse( event.target.result.toString() );

                    me.todolist = lists.lists[ 0 ];
                    me.backloglist = lists.lists[ 1 ];
                    me.completedlist = lists.lists[ 2 ];

                    localStorage.todolist = JSON.stringify( me.todolist );
                    localStorage.backloglist = JSON.stringify( me.backloglist );
                    localStorage.completedlist = JSON.stringify( me.completedlist );

                    me.bindList( "todo" );

                };

                reader.onerror = function () {
                    alert( "TODO: Handle import error." );
                };

                for( i = 0; i < files.length; i++ ) {
                    reader.readAsText( files[ i ] );
                }


            } );

        /// Perform bulk action on selected items
        $( document ).off( "click", "#bulk-actions .menu a" )
            .on( "click", "#bulk-actions .menu a", { instance: this }, function ( e ) {

                var linkId = this.id,
                    me = e.data.instance,
                    items = $( "#" + me.currentTab + " :checked + label" ),
                    oldlist = me.currentTab + "list",
                    message, newlist, newlistTab, i, word;

                if ( items.length === 0 ) return;

                switch ( linkId ) {

                    case "move-to-todo-link":
                        newlist = "todolist";
                        break;

                    case "move-to-backlog-link":
                        newlist = "backloglist";
                        break;

                    case "move-to-completed-link":
                        newlist = "completedlist";
                        break;

                    case "delete-link":
                        newlist = "deletedlist";
                        break;

                }

                // Clear previously deleted cache
                if ( newlist === "deletedlist" ) {
                    todoList.deletedlist.items = [];
                    localStorage.deletedlist = JSON.stringify( todoList.deletedlist );
                }

                // Add items to new list and remove from current list
                me[ newlist ].items.reverse();
                for ( i = 0; i < items.length; i++ ) {
                    me[oldlist].items.splice( todoList[ oldlist ].items.indexOf( items[ i ].innerHTML ), 1 );
                    me[ newlist ].items.push( items[i].innerHTML );
                }
                me[ newlist ].items.reverse();

                // Update localStorage
                localStorage[ oldlist ] = JSON.stringify( me[ oldlist ] );
                localStorage[ newlist ] = JSON.stringify( me[ newlist ] );

                // Rebind list & hide menu
                me.bindList( me.currentTab );
                me.hideMenu( "bulk-actions" );

                // Highlight new tab
                newlistTab = $( "#list-header .tabs li[data-panel='" + newlist.replace( "list", "" ) + "']" );
                newlistTab.css( { background: "#81E526", color: "#fff" } );
                newlistTab.animate( { backgroundColor: "transparent", color: "#999" }, 1500 );

                // If new location is 'deleted list' then show message
                if ( newlist === "deletedlist" ) {

                    word = items.length.toWord();

                    $( "#deleted-items-info" ).remove();

                    message = word.charAt( 0 ).toUpperCase()
                        + word.slice( 1 ) + ( items.length > 1 ? " items " : " item " ) + "deleted.";
                    $( "#main" ).prepend( Mustache.render( me.templates.message, {
                        id: "deleted-items-info",
                        type: "info",
                        message: message,
                        buttons: [
                            {
                                id: "undo-delete-link",
                                tab: me.currentTab + "list",
                                title: "Undo",
                                tooltip: "Undo delete"
                            },
                            {
                                id: "close-message-link",
                                tab: me.currentTab,
                                title: "X",
                                tooltip: "Close this message"
                            }
                        ]
                    } ) );

                }

                e.preventDefault();
                e.stopPropagation();

            } );

        /// Perform undo of deleted items
        $( document ).off( "click", "#undo-delete-link" )
            .on( "click", "#undo-delete-link", { instance: this }, function ( e ) {

                var me = e.data.instance,
                    list = $( this ).attr( "data-panel" ),
                    i;

                // Add deleted items back to list
                me[ list ].items.reverse();


                for ( i = 0; i < me.deletedlist.items.length; i++ ) {
                    me[ list ].items.push( me.deletedlist.items[ i ] );
                }
                me[ list ].items.reverse();

                // Update localStorage
                localStorage[ list ] = JSON.stringify( me[ list ] );

                // Clear deleted list
                me.deletedlist = { items: [] };
                localStorage.deletedlist = JSON.stringify( me.deletedlist );

                // Rebind list & remove message
                me.bindList( me.currentTab );
                $( "#deleted-items-info" ).hide( 500, "easeInBack", function () {
                    message.remove();
                } );

                e.preventDefault();
                e.stopPropagation();

            } );

        /// Close message when close button is clicked
        $( document ).off( "click", "#close-message-link" )
            .on( "click", "#close-message-link", function ( e ) {

                var message = $( "div.message" );

                message.hide( 500, "easeInBack", function () {
                    message.remove();
                } );

                e.preventDefault();
                e.stopPropagation();

            } );

    },

    /// Reset any currently editable items
    resetItems: function ( reset ) {

        reset.each( function ( index, element ) {

            var value = $( this ).val();

            $( this ).parents( "li:first" ).replaceWith(
                Mustache.render( todoList.templates.list, { items:[ value ] } )
            );
        } );

    }

};

/// Load lists from localStorage
todoList.todolist = localStorage.todolist ? JSON.parse( localStorage.todolist ) : { items: [] };
todoList.backloglist = localStorage.backloglist ? JSON.parse( localStorage.backloglist ) : { items: [] };
todoList.completedlist = localStorage.completedlist ? JSON.parse( localStorage.completedlist ) : { items: [] };
todoList.deletedlist = { items: [] };

/// Mustache templates
todoList.templates = {

    list: "\
        {{#items}}\
        <li class=\"clearfix\">\
            <input type=\"checkbox\" id=\"{{.}}\" data-value=\"{{.}}\" />\
            <label for=\"{{.}}\">{{.}}</label>\
        </li>\
        {{/items}}\
     ",

    itemEditor: "\
        <form id=\"edit-item-form\">\
            <input id=\"edit-item-textbox\" type=\"text\" data-value=\"{{.}}\" value=\"{{.}}\" />\
        </form>\
    ",

    message: "\
        <div id=\"{{id}}\" class=\"message {{type}}\">{{message}}\
        {{#buttons}}\
            <a id=\"{{id}}\" data-panel=\"{{tab}}\" title=\"{{tooltip}}\">{{title}}</a>\
        {{/buttons}}\
        </div>\
    "
};

/// Go!
$( document ).ready( function () {
    todoList.init();
} );

/// Extend native JavaScript

Number.prototype.toWord = function () {

    var dictionary = {
            ones: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
            tens: ['', '', 'twenty', 'thirty', 'fourty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
            sep: ['', ' thousand ', ' million ', ' billion ', ' trillion ', ' quadrillion ', ' quintillion ', ' sextillion ']
        },
        val = this, arr = [], str = '', i = 0;

    while ( val ) {
        arr.push( val % 1000 );
        val = parseInt( val / 1000, 10 );
    }

    while ( arr.length ) {
        str = (function( a ) {
            var x = Math.floor( a / 100 ),
                y = Math.floor( a / 10 ) % 10,
                z = a % 10;

            return ( x > 0 ? dictionary.ones[x] + ' hundred ' : '' ) +
                ( y >= 2 ? dictionary.tens[y] + ' ' + dictionary.ones[z] : dictionary.ones[10*y + z] );
        })( arr.shift() ) + dictionary.sep[i++] + str;
    }

    return str;

};

Array.prototype.move = function ( old_index, new_index ) {

    if ( new_index >= this.length ) {
        var k = new_index - this.length;
        while ( ( k-- ) + 1 ) {
            this.push( undefined );
        }
    }
    this.splice( new_index, 0, this.splice( old_index, 1 )[0] );

    return this;
};
