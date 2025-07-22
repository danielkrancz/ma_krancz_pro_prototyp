sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/core/Messaging",
	'sap/ui/table/Column',
	'sap/m/Column',
	'sap/m/Label'
], (Controller, JSONModel, Fragment, MessageToast, History, MessageBox, Messaging, UIColumn, MColumn, Label) => {
    "use strict";

    return Controller.extend("at.hb.makrancz.procodeapp.controller.BookingCreate", {
        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("BookingCreate").attachPatternMatched(this.onPatternMatched, this);
            Messaging.registerObject(this.getView(), true);
        },

        onPatternMatched: function(oEvent) {
            this.sTravelID = oEvent.getParameters().arguments.TravelID;
            this.createModel = new JSONModel({
                TravelID: this.sTravelID
            });
            this.getView().setModel(this.createModel, "createModel");

            this.uiModel = new JSONModel({supportMultiselect: false, supportRanges: false});
            this.getView().setModel(this.uiModel, "ui");
        },

        onSave: function(){
            let oCreatedData = this.getView().getModel("createModel").getData();

                this.getOwnerComponent().getModel().create(`/Travel('${this.sTravelID}')/to_Booking`, {
                    TravelID: oCreatedData.TravelID,
                            BookingID: oCreatedData.BookingID,
                            BookingDate: new Date(oCreatedData.BookingDate),
                            CustomerID: oCreatedData.CustomerID,
                            CarrierID: oCreatedData.CarrierID,
                            ConnectionID: oCreatedData.ConnectionID,
                            FlightDate: new Date(oCreatedData.FlightDate),
                            FlightPrice: oCreatedData.FlightPrice,
                            CurrencyCode: oCreatedData.CurrencyCode,
                            BookingStatus: oCreatedData.BookingStatus
                }, {
                    success: (oCreatedData) => {
                        MessageToast.show("Successfully saved.");
                        this.getOwnerComponent().getRouter().navTo("BookingDetail", {
                            TravelID: oCreatedData.TravelID,
                            BookingID: oCreatedData.BookingID
                        }, true);
                    },
                    error: (oError) => {

                    }
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
			this.sVHPath = "/CurrencyCode";

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

        onFlightValueHelpRequested: function(oEvent) {
            this.bFlightVH = true;

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
                    this.getView().getModel("createModel").setProperty("/CarrierID", oObject.AirlineID);
                    this.getView().getModel("createModel").setProperty("/ConnectionID", oObject.ConnectionID);
                    this.getView().getModel("createModel").setProperty("/FlightDate", oObject.FlightDate);
                    this.getView().getModel("createModel").setProperty("/FlightPrice", oObject.Price);
                    this.getView().getModel("createModel").setProperty("/CurrencyCode", oObject.CurrencyCode);
                })
            }else{
                this.getView().getModel("createModel").setProperty(this.sVHPath, oEvent.getParameters().tokens[0].getKey());
            }
			
			this._oVHD.close();
		},

		onValueHelpCancelPress: function () {
			this._oVHD.close();
		},

		onValueHelpAfterClose: function () {
			this._oVHD.destroy();
		}

    });
});