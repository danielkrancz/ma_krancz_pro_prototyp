sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("at.hb.makrancz.procodeapp.controller.Detail", {
        onInit: function() {
            this.getOwnerComponent().getRouter().getRoute("Detail").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function(oEvent) {
            let sTravelID = oEvent.getParameters().arguments.TravelID;
            if(sTravelID !== "-"){
                this.path = `/Travel('${sTravelID}')`;
                this.getView().bindElement(this.path);
            }
            
        }
    });
});