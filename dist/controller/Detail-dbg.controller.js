sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], (Controller, JSONModel, Fragment, MessageToast, History, MessageBox) => {
    "use strict";

    return Controller.extend("at.hb.makrancz.procodeapp.controller.Detail", {

        aForm: {},

        onInit: function() {
            this._oModel = new JSONModel({
                createMode: false,
                editMode: false
            });
            this.getView().setModel(this._oModel, "ui");
            this.getOwnerComponent().getRouter().getRoute("Detail").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function(oEvent) {
            let sTravelID = oEvent.getParameters().arguments.TravelID;
            if(sTravelID !== "-"){
                this._oModel.setProperty("/createMode", false);
                this.path = `/Travel('${sTravelID}')`;
                this.getView().bindElement(this.path);
                this.loadFragment("DisplayForm");
            }else{
                this._oModel.setProperty("/createMode", true);
                this.oCreatedContext = this.getView().getModel().createEntry("/Travel", {
                    TravelID: "-"
                });
                this.getView().bindElement(this.oCreatedContext.getPath());
                this.loadFragment("EditForm");
            }
        },

        loadFragment: function(sFragment) {
            this.getView().byId("travelDetailSubSection").removeAllBlocks();
            if(!this.aForm[sFragment]){
                Fragment.load({
                    id: this.getView().getId(),
                    name: `at.hb.makrancz.procodeapp.view.fragment.${sFragment}`,
                    controller: this
                }).then(function(oForm) {
                    this.getView().addDependent(oForm);
                    this.aForm[sFragment] = oForm;
                    this.getView().byId("travelDetailSubSection").addBlock(oForm);
                }.bind(this));
            }else{
                this.getView().byId("travelDetailSubSection").addBlock(this.aForm[sFragment]);
            }
        },

        onEdit: function() {
            this._oModel.setProperty("/editMode", true);
            this.loadFragment("EditForm");
        },

        onSave: function(){
            this.getView().getModel().submitChanges({
                success: () => {
                    MessageToast.show("Successfully saved.");
                    if(this._oModel.getProperty("/createMode")){
                        this.getOwnerComponent().getRouter().navTo("Detail", {
                            TravelID: this.oCreatedContext.getObject().TravelID
                        });
                        this._oModel.setProperty("/createMode", false)
                        this.loadFragment("DisplayForm");
                    }else{
                        this._oModel.setProperty("/editMode", false);
                        this.loadFragment("DisplayForm");
                    }
                }
            });
        },

        onCancel: function(){
            MessageBox.warning("Your entries will be lost when you leave this page.", {
                actions: ["Leave Page", "Cancel"],
                emphasizedAction: "Leave Page",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if(sAction === "Leave Page"){
                        this.getView().getModel().resetChanges({
                            success: () => {
                                if(this.getView().getModel("ui").getProperty("/createMode")){
                                    this.onNavBack();
                                }else{
                                    this._oModel.setProperty("/editMode", false);
                                    this.loadFragment("DisplayForm");
                                }
                            }
                        });
                    }
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

        onDelete: function(){
            
            MessageBox.warning(`Delete object ${this.getView().getElementBinding().getBoundContext().getObject().TravelID}?`, {
                actions: ["Delete", "Cancel"],
                emphasizedAction: "Delete",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if(sAction === "Delete"){
                        this.getView().getModel().remove(this.getView().getElementBinding().getPath(), {
                            success: () => {
                                this.onNavBack();
                            }
                        });
                    }
                }
            });
        }
    });
});