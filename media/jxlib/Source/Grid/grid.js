/*
---

name: Jx.Grid

description: A tabular control that has fixed scrolling headers on the rows and columns like a spreadsheet.

license: MIT-style license.

requires:
 - Jx.Widget
 - Jx.Styles
 - Jx.Layout
 - Jx.Columns
 - Jx.Row
 - Jx.Plugin.Grid
 - Jx.Store
 - Jx.List
 - Jx.Selection

provides: [Jx.Grid]

css:
 - grid

images:
 - table_col.png
 - table_row.png

...
 */
// $Id: grid.js 960 2010-06-06 22:23:16Z jonlb@comcast.net $
/**
 * Class: Jx.Grid
 *
 * Extends: <Jx.Widget>
 *
 * A tabular control that has fixed, optional, scrolling headers on the rows and
 * columns like a spreadsheet.
 *
 * Jx.Grid is a tabular control with convenient controls for resizing columns,
 * sorting, and inline editing.  It is created inside another element, typically
 * a div.  If the div is resizable (for instance it fills the page or there is a
 * user control allowing it to be resized), you must call the resize() method
 * of the grid to let it know that its container has been resized.
 *
 * When creating a new Jx.Grid, you can specify a number of options for the grid
 * that control its appearance and functionality. You can also specify plugins
 * to load for additional functionality. Currently Jx provides the following
 * plugins
 *
 * Prelighter - prelights rows, columns, and cells
 * Selector - selects rows, columns, and cells
 * Sorter - sorts rows by specific column
 *
 * Jx.Grid renders data that comes from an external source.  This external
 * source, called the model, must be a Jx.Store or extended from it.
 *
 * Events:
 * gridCellEnter(cell, list) - called when the mouse enters a cell
 * gridCellLeave(cell, list) - called when the mouse leaves a cell
 * gridCellSelect(cell) - called when a cell is clicked
 * gridMouseLeave() - called when the mouse leaves the grid at any point.
 *
 *
 * License:
 * Copyright (c) 2008, DM Solutions Group Inc.
 * This version Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Grid = new Class({

    Family : 'Jx.Grid',
    Extends : Jx.Widget,

    Binds: ['modelChanged','render','addRow','removeRow','removeRows',
            'onSelect', 'onUnselect','onMouseEnter','onMouseLeave'],
    
    options : {
        /**
         * Option: parent
         * the HTML element to create the grid inside. The grid will resize
         * to fill the domObj.
         */
        parent : null,

        /**
         * Options: columns
         * an object consisting of a columns array that defines the individuals
         * columns as well as containing any options for Jx.Grid.Columns or
         * a Jx.Grid.Columns object itself.
         */
        columns : {
            columns : []
        },

        /**
         * Option: row
         * Either a Jx.Grid.Row object or a json object defining options for
         * the class
         */
        row : null,

        /**
         * Option: plugins
         * an array containing Jx.Grid.Plugin subclasses or an object
         * that indicates the name of a predefined plugin and its options.
         */
        plugins : [],

        /**
         * Option: model
         * An instance of Jx.Store
         */
        model : null,

        deferRender: true

    },
    /**
     * Property: model
     * holds a reference to the <Jx.Store> that is the model for this
     * grid
     */
    model : null,
    /**
     * Property: columns
     * holds a reference to the columns object
     */
    columns : null,
    /**
     * Property: row
     * Holds a reference to the row object
     */
    row : null,
    /**
     * Property: styleSheet
     * the name of the dynamic style sheet to use for manipulating styles
     */
    styleSheet: 'JxGridStyles',
    /**
     * Property: pluginNamespace
     * the required variable for plugins
     */
    pluginNamespace: 'Grid',
    /**
     * Property: selection
     * holds the Jx.Selection instance used by the cell lists
     */
    selection: null,
    /**
     * Property: lists
     * An array of Jx.List instances, one per row. All of them use the same
     * Jx.Selection instance
     */
    lists: [],

    /**
     * Constructor: Jx.Grid
     */
    init : function () {
        this.uniqueId = this.generateId('jxGrid_');
        
        var opts;
        if ($defined(this.options.model)
                && this.options.model instanceof Jx.Store) {
            this.model = this.options.model;
            this.model.addEvent('storeColumnChanged', this.modelChanged);
            this.model.addEvent('storeSortFinished', this.render);
            this.model.addEvent('storeRecordAdded', this.addRow);
            this.model.addEvent('storeRecordRemoved', this.removeRow);
            this.model.addEvent('storeMultipleRecordsRemoved', this.removeRows);
        }

        if ($defined(this.options.columns)) {
            if (this.options.columns instanceof Jx.Columns) {
                this.columns = this.options.columns;
            } else if (Jx.type(this.options.columns) === 'object') {
                opts = this.options.columns;
                opts.grid = this;
                this.columns = new Jx.Columns(opts);
            }
        }

        //check for row
        if ($defined(this.options.row)) {
            if (this.options.row instanceof Jx.Row) {
                this.row = this.options.row;
            } else if (Jx.type(this.options.row) === "object") {
                opts = this.options.row;
                opts.grid = this;
                this.row = new Jx.Row(opts);
            }
        } else {
            this.row = new Jx.Row({grid: this});
        }

        //initialize the grid
        this.domObj = new Element('div', {'class':this.uniqueId});
        var l = new Jx.Layout(this.domObj, {
            onSizeChange : this.resize.bind(this)
        });
        
        //we need to know if the mouse leaves the grid so we can turn off prelighters and the such
        this.domObj.addEvent('mouseleave',function(){
            this.fireEvent('gridMouseLeave');
        }.bind(this));

        if (this.options.parent) {
            this.addTo(this.options.parent);
        }

        //top left corner
        this.rowColObj = new Element('div', {
            'class' : 'jxGridContainer'
        });

        //holds the column headers
        this.colObj = new Element('div', {
            'class' : 'jxGridContainer'
        });
        this.colTable = new Element('table', {
            'class' : 'jxGridTable jxGridHeader'
        });
        this.colTableBody = new Element('thead');
        this.colTable.appendChild(this.colTableBody);
        this.colObj.appendChild(this.colTable);

        //hold the row headers
        this.rowObj = new Element('div', {
            'class' : 'jxGridContainer jxGridHeader'
        });
        this.rowTable = new Element('table', {
            'class' : 'jxGridTable'
        });
        this.rowTableHead = new Element('thead');
        this.rowTable.appendChild(this.rowTableHead);
        this.rowObj.appendChild(this.rowTable);

        //The actual body of the grid
        this.gridObj = new Element('div', {
            'class' : 'jxGridContainer',
            styles : {
                overflow : 'auto'
            }
        });
        this.gridTable = new Element('table', {
            'class' : 'jxGridTable jxGridContent'
        });
        this.gridTableBody = new Element('tbody');
        this.gridTable.appendChild(this.gridTableBody);
        this.gridObj.appendChild(this.gridTable);

        var target = this;

        this.domObj.appendChild(this.rowColObj);
        this.domObj.appendChild(this.rowObj);
        this.domObj.appendChild(this.colObj);
        this.domObj.appendChild(this.gridObj);

        this.gridObj.addEvent('scroll', this.onScroll.bind(this));

        //setup the selection
        this.selection = new Jx.Selection();
        this.selection.addEvents({
            select: this.onSelect,
            unselect: this.onUnselect
        });
        this.parent();

        this.domObj.store('grid', this);
    },

    /**
     * Method: onScroll
     * handle the grid scrolling by updating the position of the headers
     */
    onScroll : function () {
        this.colObj.scrollLeft = this.gridObj.scrollLeft;
        this.rowObj.scrollTop = this.gridObj.scrollTop;
    },


    /**
     * APIMethod: resize
     * resize the grid to fit inside its container.  This involves knowing something
     * about the model it is displaying (the height of the column header and the
     * width of the row header) so nothing happens if no model is set
     */
    resize : function () {
        if (!this.model) {
            return;
        }

        var colHeight = this.columns.useHeaders() ? this.columns
                .getHeaderHeight() : 1;
        var rowWidth = this.row.useHeaders() ? this.row
                .getRowHeaderWidth() : 1;

        var size = this.domObj.getContentBoxSize();


        
        /* -1 because of the right/bottom borders */
        this.rowColObj.setStyles({
            width : rowWidth - 1,
            height : colHeight - 1
        });
        this.rowObj.setStyles({
            top : colHeight,
            left : 0,
            width : rowWidth - 1,
            height : size.height - colHeight - 1
        });

        this.colObj.setStyles({
            top : 0,
            left : rowWidth,
            width : size.width - rowWidth - 1,
            height : colHeight - 1
        });

        this.gridObj.setStyles({
            top : colHeight,
            left : rowWidth,
            width : size.width - rowWidth - 1,
            height : size.height - colHeight - 1
        });

    },

    resizeRowsCols: function (mode) {
        mode = $defined(mode) ? mode : 'all';

        if (mode === 'all' || mode === 'columns') {
            Jx.Styles.removeStyleSheet(this.styleSheet + "Columns");
            Jx.Styles.enableStyleSheet(this.styleSheet + "Columns");
            this.columns.calculateWidths();
            this.columns.createRules(this.styleSheet + "Columns", "."+this.uniqueId);
        }
        
        if (mode === 'all' || mode === 'rows') {
            Jx.Styles.removeStyleSheet(this.styleSheet + "Rows");
            Jx.Styles.enableStyleSheet(this.styleSheet + "Rows");
            this.row.calculateHeights();
            this.row.createRules(this.styleSheet + "Rows", "."+this.uniqueId);
        }

    },

    /**
     * APIMethod: setModel
     * set the model for the grid to display.  If a model is attached to the grid
     * it is removed and the new model is displayed. However, It needs to have
     * the same columns
     *
     * Parameters:
     * model - {Object} the model to use for this grid
     */
    setModel : function (model) {
        this.model = model;
        if (this.model) {
            this.render();
            this.domObj.resize();
        } else {
            this.destroyGrid();
        }
    },

    /**
     * APIMethod: getModel
     * gets the model set for this grid.
     */
    getModel : function () {
        return this.model;
    },

    /**
     * APIMethod: destroyGrid
     * destroy the contents of the grid safely
     */
    destroyGrid : function () {

        var n = this.colTableBody.cloneNode(false);
        this.colTable.replaceChild(n, this.colTableBody);
        this.colTableBody = n;

        n = this.rowTableHead.cloneNode(false);
        this.rowTable.replaceChild(n, this.rowTableHead);
        this.rowTableHead = n;

        n = this.gridTableBody.cloneNode(false);
        this.gridTable.replaceChild(n, this.gridTableBody);
        this.gridTableBody = n;

        document.id(this.rowColObj).empty();
        
        if (Jx.Styles.isStyleSheetDefined(this.styleSheet)) {
        	Jx.Styles.removeStyleSheet(this.styleSheet);
        }

    },

    /**
     * APIMethod: render
     * Create the grid for the current model
     */
    render : function () {
        this.destroyGrid();

        this.fireEvent('beginCreateGrid', this);

        if (this.model && this.model.loaded) {
            var model = this.model;
            var nColumns = this.columns.getColumnCount();
            var nRows = model.count();
            var th;

            /* create header if necessary */
            if (this.columns.useHeaders()) {
                this.colTableBody.setStyle('visibility', 'visible');
                var colHeight = this.columns.getHeaderHeight();
                var trBody = new Element('tr', {
                    styles : {
                        height : colHeight
                    }
                });
                this.colTableBody.appendChild(trBody);

                var headerList = this.makeList(trBody);

                this.columns.getHeaders(headerList);

                /* one extra column at the end for filler */
                th = new Element('th', {
                    'class':'jxGridColHead',
                    styles: {
                      width: 1000,
                      height: colHeight - 1
                    }
                }).inject(trBody);
            } else {
                //hide the headers
                this.colTableBody.setStyle('visibility', 'hidden');
            }

            //This section actually adds the rows
            this.model.first();
            while (this.model.valid()) {
                tr = this.row.getGridRowElement(this.model.getPosition());
                var rl = this.makeList(tr);
                this.gridTableBody.appendChild(tr);
                //this.rowList.add(rl.container);

                //Actually add the columns
                this.columns.getColumnCells(rl);

                if (this.model.hasNext()) {
                    this.model.next();
                } else {
                    break;
                }

            }
            
            
            //Moved rowheaders after other columns so we can figure the heights
            //of each row (after render)
            if (this.row.useHeaders()) {
                this.rowTableHead.setStyle('visibility', 'visible');

                //loop through all rows and add header
                this.model.first();
                while (this.model.valid()) {
                    var tr = new Element('tr',{
                    	'class': 'jxGridRow'+this.model.getPosition()
                    });
                    tr.store('jxRowData', {row:this.model.getPosition()});
                    var rowHeaderList = this.makeList(tr);
                    this.row.getRowHeader(rowHeaderList);
                    this.rowTableHead.appendChild(tr);
                    if (this.model.hasNext()) {
                        this.model.next();
                    } else {
                        break;
                    }
                }
                /* one extra row at the end for filler */
                tr = new Element('tr').inject(this.rowTableHead);
                th = new Element('th', {
                    'class' : 'jxGridRowHead',
                    styles : {
                        width : this.row.getRowHeaderWidth(),
                        height : 1000
                    }
                }).inject(tr);
            } else {
                //hide row headers
                this.rowTableHead.setStyle('visibility', 'hidden');
            }
            
            this.domObj.resize();
            this.resizeRowsCols();
            this.resize();

            this.fireEvent('doneCreateGrid', this);
        } else {
            this.model.load();
        }
        
    },

    /**
     * Method: modelChanged
     * Event listener that is fired when the model changes in some way
     */
    modelChanged : function (row, col) {
        //grab new TD
        var column = this.columns.getIndexFromGrid(col);
        var td = document.id(this.gridObj.childNodes[0].childNodes[0].childNodes[row].childNodes[column]);

        var currentRow = this.model.getPosition();
        this.model.moveTo(row);
        // need to find out whether the header is used or not, to have the right reference back
        var colIndex = this.options.row.useHeaders ? column+1 : column;
        var newTD = this.columns.getColumnCell(this.columns.getByName(col),colIndex);
        //get parent list
        var list = td.getParent().retrieve('jxList');
        list.replace(td, newTD);
        this.columns.updateRule(col);
        this.model.moveTo(currentRow);
    },
    
    /**
     * APIMethod: addRow
     * Adds a row to the table. Can add to either the beginning or the end 
     * based on passed flag
     */
    addRow: function (store, record, position) {
        if (this.model.loaded) {
            if (position === 'bottom') {
                this.model.last();
            } else {
                this.model.first();
                this.renumberGrid(0, 1);
            }
            
            //row header
            if (this.row.useHeaders()) {
                var rowHeight = this.row.getHeight();
                var tr = new Element('tr', {
                    styles : {
                        height : rowHeight
                    }
                });
                var rowHeaderList = this.makeList(tr);
                this.row.getRowHeader(rowHeaderList);
                if (position === 'top') {
                    tr.inject(this.rowTableHead, position);
                } else {
                    var lastTr = this.rowTableHead.children[this.rowTableHead.children.length - 1];
                    tr.inject(lastTr, 'before');
                }
            }
            tr = this.row.getGridRowElement();
            tr.store('jxRowData', {row: this.model.getPosition()});
            var rl = this.makeList(tr);
            this.columns.getColumnCells(rl);
            tr.inject(this.gridTableBody, position);
        }
    },
    
    renumberGrid: function (offset, increment) {
        var l = this.gridTable.rows.length;
        for (var i = offset; i < l; i++) {
            var r = document.id(this.gridTable.rows[i]);
            var d = r.retrieve('jxRowData');
            d.row += increment;
            r.store('jxRowData', d);
            $A(r.children).each(function(cell){
                var d = cell.retrieve('jxCellData');
                d.row += increment;
                cell.store('jxCellData', d);
            },this);
        }
    },
    
    removeRow: function (store, index) {
        this.gridTable.deleteRow(index);
        this.rowTable.deleteRow(index);
        this.renumberGrid(index, -1);
    },
    
    removeRows: function (store, first, last) {
      for (var i = first; i <= last; i++) {
          this.removeRow(first);
      }
    },
    
    /**
     * Method: makeList
     * utility method used to make row lists
     *
     * Parameters:
     * container - the row to use as the Jx.List container
     */
    makeList: function (container) {
        var l = new Jx.List(container, {
            hover: true,
            select: true
        }, this.selection);
        var target = this;
        l.addEvents({
            mouseenter: this.onMouseEnter,
            mouseleave: this.onMouseLeave
        });
        this.lists.push(l);
        return l;
    },

    onSelect: function (cell, select) {
        this.fireEvent('gridCellSelect', [cell,select,this]);
    },

    onUnselect: function (cell, select) {
        this.fireEvent('gridCellUnselect', [cell,select,this]);
    },

    onMouseEnter: function (cell, list) {
        this.fireEvent('gridCellEnter', [cell,list,this]);
    },

    onMouseLeave: function (cell, list) {
        this.fireEvent('gridCellLeave', [cell,list,this]);
    },

    changeText : function(lang) {
        this.parent();
        /*
        this.resize();
        this.resizeRowsCols();
        */
        this.render();
    }

});
