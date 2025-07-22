sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
	'sap/ui/table/Column',
	'sap/m/Column',
	'sap/m/Label',
], (Controller, JSONModel, Fragment, MessageToast, History, MessageBox, UIColumn, MColumn, Label) => {
    "use strict";

    

    return Controller.extend("at.hb.makrancz.procodeapp.controller.Create", {
        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("Create").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            this.createModel = new JSONModel({});
            this.getView().setModel(this.createModel, "createModel");

			this.uiModel = new JSONModel({supportMultiselect: false, supportRanges: false});
            this.getView().setModel(this.uiModel, "ui");
        },

        onSave: function(){
            let oData = this.getView().getModel("createModel").getData();

                this.getOwnerComponent().getModel().create("/Travel", oData, {
                    success: (oCreatedData) => {
                        MessageToast.show("Successfully saved.");
                        this.getOwnerComponent().getRouter().navTo("Detail", {
                            TravelID: oCreatedData.TravelID
                        }, true);
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

        onValueHelpOkPress: function (oEvent) {
			this.getView().getModel("createModel").setProperty(this.sVHPath, oEvent.getParameters().tokens[0].getKey());
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