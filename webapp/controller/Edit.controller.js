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
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
	'sap/ui/core/library'
], (Controller, History, MessageBox, Spreadsheet, exportLibrary, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, JSONModel, MessageToast, coreLibrary) => {
    "use strict";

    var EdmType = exportLibrary.EdmType;

    return Controller.extend("at.hb.makrancz.procodeapp.controller.Edit", {
        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("Edit").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            this.sTravelID = oEvent.getParameters().arguments.TravelID;
            this.path = `/Travel('${this.sTravelID}')`;
            this.getOwnerComponent().getModel().read(this.path, {
                urlParameters: {
                    "$expand": "to_Booking"
                },
                success: (oData) => {
                    this.editModel = new JSONModel(oData);
                    this.getView().setModel(this.editModel, "editModel");
                    this.getView().bindElement({path: "/", model: "editModel"});
                }
            });
        },

        onSave: function(){
            let oData = this.getView().getModel("editModel").getData(),
                aPromise = [];

                aPromise.push(new Promise((resolve, reject) => {
                    this.getView().getModel().update(this.path, {
                        AgencyID: oData.AgencyID,
                        CustomerID: oData.CustomerID,
                        BeginDate: new Date(oData.BeginDate),
                        EndDate: new Date(oData.EndDate),
                        BookingFee: oData.BookingFee,
                        CurrencyCode: oData.CurrencyCode,
                        OverallStatus: oData.OverallStatus,
						Description: oData.Description
                    }, {
                        success: () => {
                            resolve();
                        }
                    });
                }));

                oData.to_Booking.results.forEach((oItem) => {
                    aPromise.push(new Promise((resolve, reject) => {
                        
                        this.getView().getModel().update(`/Booking(TravelID='${oItem.TravelID}',BookingID='${oItem.BookingID}')`, {
                            CarrierID: oItem.CarrierID,
                            ConnectionID: oItem.ConnectionID,
                            FlightDate: new Date(oItem.FlightDate),
                            FlightPrice: oItem.FlightPrice,
                            CurrencyCode: oItem.CurrencyCode,
                            BookingStatus: oItem.BookingStatus
                        }, {
                            success: () => {
                                resolve();
                            }
                        });
                    }));
                });

                Promise.allSettled(aPromise).then(() => {
                    MessageToast.show("Successfully saved.");
                    this.getOwnerComponent().getRouter().navTo("Detail", {
                        TravelID: this.sTravelID
                    });
                });
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

        onCancel: function(){
            MessageBox.warning("Your entries will be lost when you leave this page.", {
                actions: ["Leave Page", "Cancel"],
                emphasizedAction: "Leave Page",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if(sAction === "Leave Page"){
                        this.onNavBack();
                    }
                }
            });
        },

        onExport: function() {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this.oTable) {
				this.oTable = this.byId('bookingTable');
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
				fileName: 'Bookings.xlsx',
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
				label: 'Booking Number',
				property: 'BookingID',
				type: EdmType.String
			});

            aCols.push({
                label: 'Booking Date',
				property: 'BookingDate',
				type: EdmType.Date
			});

            aCols.push({
				label: 'Customer ID',
				property: ['CustomerID', 'CustomerName'],
				type: EdmType.String,
				template: '{1} ({0})'
			});

            aCols.push({
				label: 'Airline ID',
				property: ['CarrierID', 'CarrierName'],
				type: EdmType.String,
				template: '{1} ({0})'
			});

            aCols.push({
                label: 'Flight',
				property: 'ConnectionID',
				type: EdmType.String
			});

            aCols.push({
                label: 'Flight Date',
				property: 'FlightDate',
				type: EdmType.Date
			});

            aCols.push({
				label: 'Flight Price',
				type: EdmType.Number,
				property: 'FlightPrice',
				scale: 2
			});

            aCols.push({
                label: 'Booking Status',
				property: 'BookingStatusText',
				type: EdmType.String
			});

			return aCols;
		},

        _registerForP13n: function() {
			var oTable = this.byId("bookingTable");

			this.oMetadataHelper = new MetadataHelper([
				{key: "bookingid", label: "Booking Number", path: "BookingID", cell: "{TravelID}"},
				{key: "bookingdate", label: "Booking Date", path: "BookingDate", cell: "{path: 'BookingDate', type: 'sap.ui.model.odata.type.Date'}"},
				{key: "customerid", label: "Customer ID", path: "CustomerID", cell: "{CustomerName} ({CustomerID})"},
				{key: "carrierid", label: "Airline ID", path: "CarrierID", cell: "{CarrierName} ({CarrierID})"},
				{key: "connectionid", label: "Flight", path: "ConnectionID", cell: "{ConnectionID}"},
                {key: "flightdate", label: "Flight Date", path: "FlightDate", cell: "{ path: 'FlightDate', type: 'sap.ui.model.odata.type.Date' }"},
                {key: "flightprice", label: "Flight Price", path: "FlightPrice"},
				{key: "status", label: "Booking Status", path: "BookingStatusText", cell: "{BookingStatusText}"}
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
			var oTable = this.byId("bookingTable");

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
			var oTable = this.byId("bookingTable");
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
				path: 'to_Booking',
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
			var oTable = this.byId("bookingTable");

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
			var oTable = this.byId("bookingTable");
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
			var oTable = this.byId("bookingTable");
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

			var oTable = this.byId("bookingTable");
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
			var oTable = this.byId("bookingTable");

			var oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(oTable, {
				ColumnWidth: oColumnState
			});
		}

    });
});