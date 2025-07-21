sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    'sap/ui/export/Spreadsheet',
    'sap/ui/export/library',
    'sap/m/p13n/Engine',
	'sap/m/p13n/SelectionController',
	'sap/m/p13n/SortController',
	'sap/m/p13n/GroupController',
	'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library',
], (Controller, History, MessageBox, Spreadsheet, exportLibrary, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, coreLibrary) => {
    "use strict";

    var EdmType = exportLibrary.EdmType;

    return Controller.extend("at.hb.makrancz.procodeapp.controller.BookingDetail", {

        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("BookingDetail").attachPatternMatched(this._onPatternMatched, this);
            this._registerForP13n();
        },

        _onPatternMatched: function(oEvent) {
            this.sTravelID = oEvent.getParameters().arguments.TravelID;
            this.sBookingID = oEvent.getParameters().arguments.BookingID;
            this.path = `/Booking(TravelID='${this.sTravelID}',BookingID='${this.sBookingID}')`;
            this.getView().bindElement(this.path);
        },

        onEdit: function() {
            this.getOwnerComponent().getRouter().navTo("Edit", {
                TravelID: this.sTravelID
            });
        },

        onSearchChanged: function(oEvent) {
            let oList = this.byId("bookingSupplementTable"),
                oBindingInfo = oList.getBindingInfo("items");

            if (!oBindingInfo.parameters) {
                oBindingInfo.parameters = {};
            }
            if (!oBindingInfo.parameters.custom) {
                oBindingInfo.parameters.custom = {};
            }
            oBindingInfo.parameters.custom.search = oEvent.getParameters().value;
            oList.bindItems(oBindingInfo);
        },

        onNavBack() {
			const oHistory = History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				const oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("RouteMain", {}, true);
			}
		},

        onExport: function() {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this.oTable) {
				this.oTable = this.byId('bookingSupplementTable');
			}

			oTable = this.oTable;
			oRowBinding = oTable.getBinding('items');
			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level'
				},
				dataSource: oRowBinding,
				fileName: 'BookingSupplements.xlsx',
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
		},

        createColumnConfig: function() {
			var aCols = [];

			aCols.push({
				label: 'Booking Supplement ID',
				property: 'BookingSupplementID',
				type: EdmType.String
			});

            aCols.push({
				label: 'Supplement ID',
				property: ['SupplementID', 'SupplementDescription'],
				type: EdmType.String,
				template: '{1} ({0})'
			});

            aCols.push({
				label: 'Price',
				type: EdmType.Number,
				property: 'Price',
				scale: 2
			});

			return aCols;
		},

        _registerForP13n: function() {
			var oTable = this.byId("bookingSupplementTable");

			this.oMetadataHelper = new MetadataHelper([
				{key: "bookingsupplementid", label: "Booking Supplement ID", path: "BookingSupplementID", cell: "{BookingSupplementID}"},
				{key: "SupplementID", label: "Supplement ID", path: "SupplementID", cell: "{SupplementDescription} ({SupplementID})"},
                {key: "price", label: "Price", path: "Price"}
			]);

			Engine.getInstance().register(oTable, {
				helper: this.oMetadataHelper,
				controller: {
					Columns: new SelectionController({
						targetAggregation: "columns",
						control: oTable
					}),
					Sorter: new SortController({
						control: oTable
					}),
					Groups: new GroupController({
						control: oTable
					}),
					ColumnWidth: new ColumnWidthController({
						control: oTable
					})
				}
			});

			Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
		},

		openPersoDialog: function(oEvt) {
			var oTable = this.byId("bookingSupplementTable");

			Engine.getInstance().show(oTable, ["Columns", "Sorter", "Groups"], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oEvt.getSource()
			});
		},

		_getKey: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
		},

		handleStateChange: function(oEvt) {
			var oTable = this.byId("bookingSupplementTable");
			var oState = oEvt.getParameter("state");

			if (!oState) {
				return;
			}

			var aSorter = [];

			oState.Groups.forEach(function(oGroup) {
				aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oGroup.key).path, false, true));
			}.bind(this));

			oState.Sorter.forEach(function(oSorter) {
				var oExistingSorter = aSorter.find(function(oSort){
					return oSort.sPath === this.oMetadataHelper.getProperty(oSorter.key).path;
				}.bind(this));

				if (oExistingSorter) {
					oExistingSorter.bDescending = !!oSorter.descending;
				} else {
					aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
				}
			}.bind(this));

			oTable.getColumns().forEach(function(oColumn, iIndex){
				oColumn.setVisible(false);
				oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)]);
				oColumn.setSortIndicator(coreLibrary.SortOrder.None);
				oColumn.data("grouped", false);
			}.bind(this));

			oState.Sorter.forEach(function(oSorter) {
				var oCol = this.byId(oSorter.key);
				if (oSorter.sorted !== false) {
					oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
				}
			}.bind(this));

			oState.Groups.forEach(function(oSorter) {
				var oCol = this.byId(oSorter.key);
				oCol.data("grouped", true);
			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex){
				var oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				oTable.removeColumn(oCol);
				oTable.insertColumn(oCol, iIndex);
			}.bind(this));

			var aCells = oState.Columns.map(function(oColumnState) {
				return new Text({
					text: this.oMetadataHelper.getProperty(oColumnState.key).cell
				});
			}.bind(this));

			oTable.bindItems({
				templateShareable: false,
				path: 'to_BookSupplement',
				sorter: aSorter,
				template: new ColumnListItem({
					cells: aCells
				})
			});

		},

		beforeOpenColumnMenu: function(oEvt) {
			var oMenu = this.byId("menu");
			var oColumn = oEvt.getParameter("openBy");
			var oSortItem = oMenu.getQuickActions()[0].getItems()[0];
			var oGroupItem = oMenu.getQuickActions()[1].getItems()[0];

			oSortItem.setKey(this._getKey(oColumn));
			oSortItem.setLabel(oColumn.getHeader().getText());
			oSortItem.setSortOrder(oColumn.getSortIndicator());

			oGroupItem.setKey(this._getKey(oColumn));
			oGroupItem.setLabel(oColumn.getHeader().getText());
			oGroupItem.setGrouped(oColumn.data("grouped"));
		},

		onColumnHeaderItemPress: function(oEvt) {
			var oTable = this.byId("bookingSupplementTable");

			var oColumnHeaderItem = oEvt.getSource();
			var sPanel = "Columns";
			if (oColumnHeaderItem.getIcon().indexOf("group") >= 0) {
				sPanel = "Groups";
			} else if (oColumnHeaderItem.getIcon().indexOf("sort") >= 0) {
				sPanel = "Sorter";
			}

			Engine.getInstance().show(oTable, [sPanel], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oTable
			});
		},

		onSort: function(oEvt) {
			var oSortItem = oEvt.getParameter("item");
			var oTable = this.byId("bookingSupplementTable");
			var sAffectedProperty = oSortItem.getKey();
			var sSortOrder = oSortItem.getSortOrder();

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter){
					oSorter.sorted = false;
				});

				if (sSortOrder !== coreLibrary.SortOrder.None) {
					oState.Sorter.push({
						key: sAffectedProperty,
						descending:  sSortOrder === coreLibrary.SortOrder.Descending
					});
				}

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},

		onGroup: function(oEvt) {
			var oGroupItem = oEvt.getParameter("item");
			var oTable = this.byId("bookingSupplementTable");
			var sAffectedProperty = oGroupItem.getKey();

			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all groupings before
				oState.Groups.forEach(function(oSorter){
					oSorter.grouped = false;
				});

				if (oGroupItem.getGrouped()) {
					oState.Groups.push({
						key: sAffectedProperty
					});
				}

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},

		onColumnMove: function(oEvt) {
			var oDraggedColumn = oEvt.getParameter("draggedControl");
			var oDroppedColumn = oEvt.getParameter("droppedControl");

			if (oDraggedColumn === oDroppedColumn) {
				return;
			}

			var oTable = this.byId("bookingSupplementTable");
			var sDropPosition = oEvt.getParameter("dropPosition");
			var iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
			var iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
			var iNewPos = iDroppedIndex + (sDropPosition == "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
			var sKey = this._getKey(oDraggedColumn);

			Engine.getInstance().retrieveState(oTable).then(function(oState){

				var oCol = oState.Columns.find(function(oColumn) {
					return oColumn.key === sKey;
				}) || {key: sKey};
				oCol.position = iNewPos;

				Engine.getInstance().applyState(oTable, {Columns: [oCol]});
			});
		},

		onColumnResize: function(oEvt) {
			var oColumn = oEvt.getParameter("column");
			var sWidth = oEvt.getParameter("width");
			var oTable = this.byId("bookingSupplementTable");

			var oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(oTable, {
				ColumnWidth: oColumnState
			});
		}
    });
});