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
	'sap/ui/core/library',
	'sap/ui/table/Column',
	'sap/m/Column',
	'sap/m/Label',
	"sap/ui/core/Fragment"
], (Controller, History, MessageBox, Spreadsheet, exportLibrary, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, JSONModel, MessageToast, coreLibrary, UIColumn, MColumn, Label, Fragment) => {
    "use strict";

    var EdmType = exportLibrary.EdmType;

    return Controller.extend("at.hb.makrancz.procodeapp.controller.BookingEdit", {
        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("BookingEdit").attachPatternMatched(this.onPatternMatched, this);
            this._registerForP13n();
        },

        onPatternMatched: function(oEvent) {
            this.sTravelID = oEvent.getParameters().arguments.TravelID;
            this.sBookingID = oEvent.getParameters().arguments.BookingID;
            this.path = `/Booking(TravelID='${this.sTravelID}',BookingID='${this.sBookingID}')`;
            this.getOwnerComponent().getModel().read(this.path, {
                urlParameters: {
                    "$expand": "to_BookSupplement"
                },
                success: (oData) => {
                    this.editModel = new JSONModel(oData);
                    this.getView().setModel(this.editModel, "editModel");
                    this.getView().bindElement({path: "/", model: "editModel"});
                }
            });

			this.uiModel = new JSONModel({supportMultiselect: false, supportRanges: false});
            this.getView().setModel(this.uiModel, "ui");
        },

        onSave: function(){
            let oData = this.getView().getModel("editModel").getData(),
                aPromise = [];

                aPromise.push(new Promise((resolve, reject) => {
                    this.getView().getModel().update(this.path, {
                            BookingDate: new Date(oData.BookingDate),
                            CustomerID: oData.CustomerID,
                            CarrierID: oData.CarrierID,
                            ConnectionID: oData.ConnectionID,
                            FlightDate: new Date(oData.FlightDate),
                            FlightPrice: oData.FlightPrice,
                            CurrencyCode: oData.CurrencyCode,
                            BookingStatus: oData.BookingStatus
                    }, {
                        success: () => {
                            resolve();
                        }
                    });
                }));

                oData.to_BookSupplement.results.forEach((oItem) => {
                    aPromise.push(new Promise((resolve, reject) => {
                        
                        this.getView().getModel().update(`/BookingSupplement(TravelID='${oItem.TravelID}',BookingID='${oItem.BookingID}',BookingSupplementID='${oItem.BookingSupplementID}')`, {
                            SupplementID: oItem.SupplementID,
                            Price: oItem.Price,
                            CurrencyCode: oItem.CurrencyCode
                        }, {
                            success: () => {
                                resolve();
                            }
                        });
                    }));
                });

                Promise.allSettled(aPromise).then(() => {
                    MessageToast.show("Successfully saved.");
                    this.getView().getModel().refresh();
                    this.getOwnerComponent().getRouter().navTo("BookingDetail", {
                        TravelID: this.sTravelID,
                        BookingID: this.sBookingID
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

		onAgencyValueHelpRequested: function(oEvent) {
            this._oInput = oEvent.getSource();
			this.sVHPath = "/AgencyID";

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogAgency",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set key fields for filtering in the Define Conditions Tab
				oDialog.setRangeKeyFields([{
					label: "Agency",
					key: "AgencyID",
					type: "string"
				}]);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/TravelAgency",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Agency ID"}), template: new Text({wrapping: false, text: "{AgencyID}"})});
						oColumnID.data({
							fieldName: "AgencyID"
						});
						let oColumnName = new UIColumn({label: new Label({text: "Agency Name"}), template: new Text({wrapping: false, text: "{AgencyName}"})});
						oColumnName.data({
							fieldName: "AgencyName"
						});
                        let oColumnStreet = new UIColumn({label: new Label({text: "Street"}), template: new Text({wrapping: false, text: "{Street}"})});
						oColumnStreet.data({
							fieldName: "Street"
						});
                        let oColumnPostalCode = new UIColumn({label: new Label({text: "Postal Code"}), template: new Text({wrapping: false, text: "{PostalCode}"})});
						oColumnPostalCode.data({
							fieldName: "PostalCode"
						});
                        let oColumnCity = new UIColumn({label: new Label({text: "City"}), template: new Text({wrapping: false, text: "{City}"})});
						oColumnCity.data({
							fieldName: "City"
						});
                        let oColumnCountryCode = new UIColumn({label: new Label({text: "Country Code"}), template: new Text({wrapping: false, text: "{CountryCode}"})});
						oColumnCountryCode.data({
							fieldName: "CountryCode"
						});
                        let oColumnPhone = new UIColumn({label: new Label({text: "Phone"}), template: new Text({wrapping: false, text: "{PhoneNumber}"})});
						oColumnPhone.data({
							fieldName: "PhoneNumber"
						});
                        let oColumnEmail = new UIColumn({label: new Label({text: "Email"}), template: new Text({wrapping: false, text: "{EMailAddress}"})});
						oColumnEmail.data({
							fieldName: "EMailAddress"
						});
                        let oColumnWebsite = new UIColumn({label: new Label({text: "Website"}), template: new Text({wrapping: false, text: "{WebAddress}"})});
						oColumnWebsite.data({
							fieldName: "WebAddress"
						});
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
                        oTable.addColumn(oColumnStreet);
                        oTable.addColumn(oColumnPostalCode);
                        oTable.addColumn(oColumnCountryCode);
                        oTable.addColumn(oColumnPhone);
                        oTable.addColumn(oColumnEmail);
                        oTable.addColumn(oColumnWebsite);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/TravelAgency",
							template: new ColumnListItem({
								cells: [new Label({text: "{AgencyID}"}), new Label({text: "{AgencyName}"}), new Label({text: "{Street}"}), new Label({text: "{PostalCode}"}), new Label({text: "{City}"}), new Label({text: "{CountryCode}"}), new Label({text: "{PhoneNumber}"}), new Label({text: "{EMailAddress}"}), new Label({text: "{WebAddress}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Agency ID"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Agency Name"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Steet"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Postal Code"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "City"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Country"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Phone"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Email"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Website"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.open();
			}.bind(this));
		},

        onCustomerValueHelpRequested: function(oEvent) {
            this._oInput = oEvent.getSource();
			this.sVHPath = "/CustomerID";

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogCustomer",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set key fields for filtering in the Define Conditions Tab
				oDialog.setRangeKeyFields([{
					label: "Customer",
					key: "CustomerID",
					type: "string"
				}]);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Passenger",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Customer ID"}), template: new Text({wrapping: false, text: "{CustomerID}"})});
						oColumnID.data({
							fieldName: "CustomerID"
						});
						let oColumnName = new UIColumn({label: new Label({text: "First Name"}), template: new Text({wrapping: false, text: "{FirstName}"})});
						oColumnName.data({
							fieldName: "FirstName"
						});
                        let oColumnLastName = new UIColumn({label: new Label({text: "Last Name"}), template: new Text({wrapping: false, text: "{LastName}"})});
						oColumnLastName.data({
							fieldName: "LastName"
						});
                        let oColumnTitle = new UIColumn({label: new Label({text: "Title"}), template: new Text({wrapping: false, text: "{Title}"})});
						oColumnTitle.data({
							fieldName: "Title"
						});
                        let oColumnStreet = new UIColumn({label: new Label({text: "Street"}), template: new Text({wrapping: false, text: "{Street}"})});
						oColumnStreet.data({
							fieldName: "Street"
						});
                        
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
                        oTable.addColumn(oColumnLastName);
                        oTable.addColumn(oColumnTitle);
                        oTable.addColumn(oColumnStreet);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Passenger",
							template: new ColumnListItem({
								cells: [new Label({text: "{CustomerID}"}), new Label({text: "{FirstName}"}), new Label({text: "{LastName}"}), new Label({text: "{Title}"}), new Label({text: "{Street}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Customer ID"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "First Name"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Last Name"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Title"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Steet"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.open();
			}.bind(this));
		},

		onCurrencyValueHelpRequested: function(oEvent) {
            this._oInput = oEvent.getSource();
			debugger;
			this.sVHPath = oEvent.getSource().getBindingContext("editModel").getPath() + "CurrencyCode";

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogCurrency",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set key fields for filtering in the Define Conditions Tab
				oDialog.setRangeKeyFields([{
					label: "Currency Code",
					key: "CurrencyCode",
					type: "string"
				}]);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Currency",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Currency"}), template: new Text({wrapping: false, text: "{Currency}"})});
						oColumnID.data({
							fieldName: "Currency"
						});
						let oColumnName = new UIColumn({label: new Label({text: "Description"}), template: new Text({wrapping: false, text: "{Currency_Text}"})});
						oColumnName.data({
							fieldName: "Currency_Text"
						});
                        
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Currency",
							template: new ColumnListItem({
								cells: [new Label({text: "{Currency}"}), new Label({text: "{Currency_Text}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Currency"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Description"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.open();
			}.bind(this));
		},

        onSupplementValueHelpRequested: function(oEvent) {
            this.bSupplementVH = true;
			this.sSupplementPath = oEvent.getSource().getBindingContext("editModel").getPath();

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogSupplement",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set key fields for filtering in the Define Conditions Tab
				oDialog.setRangeKeyFields([{
					label: "Supplement ID",
					key: "SupplementID",
					type: "string"
				}]);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Supplement",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Supplement ID"}), template: new Text({wrapping: false, text: "{SupplementID}"})});
						oColumnID.data({
							fieldName: "SupplementID"
						});
						let oColumnName = new UIColumn({label: new Label({text: "SupplementCategory"}), template: new Text({wrapping: false, text: "{SupplementCategory}"})});
						oColumnName.data({
							fieldName: "SupplementCategory"
						});
                        let oPrice = new UIColumn({label: new Label({text: "Price"}), template: new Text({wrapping: false, text: "{Price}"})});
						oPrice.data({
							fieldName: "Price"
						});
                        
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
						oTable.addColumn(oPrice);

					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Supplement",
							template: new ColumnListItem({
								cells: [new Label({text: "{SupplementID}"}), new Label({text: "{SupplementCategory}"}), new Label({text: "{Price}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "SupplementID"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "SupplementCategory"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Price"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.open();
			}.bind(this));
		},

		onFlightValueHelpRequested: function(oEvent) {
            this.bFlightVH = true;
			this.sBookingPath = oEvent.getSource().getBindingContext("editModel").getPath();

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogFlight",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Flight",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Airline ID"}), template: new Text({wrapping: false, text: "{AirlineID}"})});
						oColumnID.data({
							fieldName: "AirlineID"
						});
						let oColumnName = new UIColumn({label: new Label({text: "Flight Number"}), template: new Text({wrapping: false, text: "{ConnectionID}"})});
						oColumnName.data({
							fieldName: "ConnectionID"
						});
                        let oColumnLastName = new UIColumn({label: new Label({text: "Flight Date"}), template: new Text({wrapping: false, text: "{FlightDate}"})});
						oColumnLastName.data({
							fieldName: "FlightDate"
						});
                        let oColumnTitle = new UIColumn({label: new Label({text: "Flight Price"}), template: new Text({wrapping: false, text: "{Price}"})});
						oColumnTitle.data({
							fieldName: "Price"
						});
                        let oColumnStreet = new UIColumn({label: new Label({text: "Plane Type"}), template: new Text({wrapping: false, text: "{PlaneType}"})});
						oColumnStreet.data({
							fieldName: "PlaneType"
						});

                        let oMaxSeats = new UIColumn({label: new Label({text: "Maximum Seats"}), template: new Text({wrapping: false, text: "{MaximumSeats}"})});
						oMaxSeats.data({
							fieldName: "MaximumSeats"
						});

                        let oOccSeats = new UIColumn({label: new Label({text: "Occupied Seats"}), template: new Text({wrapping: false, text: "{Occupied Seats}"})});
						oOccSeats.data({
							fieldName: "OccupiedSeats"
						});
                        
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
                        oTable.addColumn(oColumnLastName);
                        oTable.addColumn(oColumnTitle);
                        oTable.addColumn(oColumnStreet);
                        oTable.addColumn(oMaxSeats);
                        oTable.addColumn(oOccSeats);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Flight",
							template: new ColumnListItem({
								cells: [new Label({text: "{AirlineID}"}),new Label({text: "{ConnectionID}"}), new Label({text: "{FlightDate}"}), new Label({text: "{Price}"}), new Label({text: "{PlaneType}"}), new Label({text: "{MaximumSeats}"}), new Label({text: "{OccupiedSeats}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Airline ID"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Flight Number"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Flight Date"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Price"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Plane Type"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Maximum Seats"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Occupied Seats"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.open();
			}.bind(this));
		},

        onValueHelpOkPress: function (oEvent) {
            if(this.bFlightVH){
                oEvent.getSource().getTableAsync().then((oTable) => {
                    let oObject = oTable.getContextByIndex(oTable.getSelectedIndices()[0]).getObject();
                    this.getView().getModel("editModel").setProperty( this.sBookingPath + "/CarrierID", oObject.AirlineID);
                    this.getView().getModel("editModel").setProperty( this.sBookingPath + "/ConnectionID", oObject.ConnectionID);
                    this.getView().getModel("editModel").setProperty( this.sBookingPath + "/FlightDate", oObject.FlightDate);
                    this.getView().getModel("editModel").setProperty( this.sBookingPath + "/FlightPrice", oObject.Price);
                    this.getView().getModel("editModel").setProperty( this.sBookingPath + "/CurrencyCode", oObject.CurrencyCode);
                })
            }else if(this.bSupplementVH){
                oEvent.getSource().getTableAsync().then((oTable) => {
                    let oObject = oTable.getContextByIndex(oTable.getSelectedIndices()[0]).getObject();
                    this.getView().getModel("editModel").setProperty( this.sSupplementPath + "/SupplementID", oObject.SupplementID);
                    this.getView().getModel("editModel").setProperty( this.sSupplementPath + "/Price", oObject.Price);
                    this.getView().getModel("editModel").setProperty( this.sSupplementPath + "/CurrencyCode", oObject.CurrencyCode);
                })
            }else{
                this.getView().getModel("editModel").setProperty(this.sVHPath, oEvent.getParameters().tokens[0].getKey());
            }
			
			this._oVHD.close();
		},

		onValueHelpCancelPress: function () {
			this._oVHD.close();
		},

		onValueHelpAfterClose: function () {
			this._oVHD.destroy();
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