sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/core/Messaging",
], (Controller, JSONModel, Fragment, MessageToast, History, MessageBox, Messaging) => {
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
        }

    });
});