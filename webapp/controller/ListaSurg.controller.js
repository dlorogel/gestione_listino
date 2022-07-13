sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast",
        "sap/ui/core/Fragment",
        "sap/ui/model/json/JSONModel",
        "../model/formatter",
    ],
    function (BaseController, Filter, FilterOperator, MessageToast, Fragment, JSONModel, formatter) {
        "use strict";

        return BaseController.extend("it.orogel.gestionelistino.controller.controller.ListaSurg", {
            formatter: formatter,
            onInit() {

            },
            refresh: function (modelName) {
                this.getOwnerComponent().getModel(modelName).refresh();
            },
            getText: function (text) {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(text);
            },
        });
    }
);
