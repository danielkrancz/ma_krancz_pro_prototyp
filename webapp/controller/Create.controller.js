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

    

    return Controller.extend("at.hb.makrancz.procodeapp.controller.Create", {
        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("Create").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            this.createModel = new JSONModel({});
            this.getView().setModel(this.createModel, "createModel");
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
        }

    });
});