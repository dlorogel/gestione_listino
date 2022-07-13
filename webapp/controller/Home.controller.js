sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast) {
        "use strict";

        return Controller.extend("it.orogel.gestionelistino.controller.Home", {
            onInit: function () {
                //var model = this.getView().setModel()
                this.oGlobalBusyDialog = new sap.m.BusyDialog();
                this.setInitialModels();
                //this.getEkorg();
            },
            setInitialModels: function () {
                var listaModel = this.getOwnerComponent().setModel(new JSONModel({ list1: false, list2: false, list3: false, list4: false }), "listaModel");
                var zlistModel = this.getOwnerComponent().setModel(new JSONModel({}), "zlistModel");
                var zlistModelSurg = this.getOwnerComponent().setModel(new JSONModel({}), "zlistModelSurg");
                var filterModel = this.getOwnerComponent().setModel(new JSONModel({}), "filterModel");
                var dynamicModel = this.getOwnerComponent().setModel(new JSONModel({}), "dynamicModel");
                var actionModel = this.getOwnerComponent().setModel(new JSONModel({insert: false, modify: false}), "actionModel");
                var typeList = this.getOwnerComponent().setModel(new JSONModel([{key: "SS", text: this.getText("ssList")},{key: "SC", text: this.getText("scList")},{key: "DS", text: this.getText("dsList")},{key: "DC", text: this.getText("dcList")}]), "typeList");
                var typeListSurg = this.getOwnerComponent().setModel(new JSONModel([{key: "SSU", text: this.getText("ssuList")},{key: "DSU", text: this.getText("dsuList")}]), "typeListSurg");
                var uMList = this.getOwnerComponent().setModel(new JSONModel([{key: "€/kg", text: this.getText("eurKg")},{key: "€/pz", text: this.getText("eurPz")}]), "uMList");
            },
            onNavToList: function () {
                var lista = this.getOwnerComponent().getModel("listaModel").getData()
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                if (lista.list1) {
                    oRouter.navTo("RouteLista");
                } else if (lista.list2) {
                    oRouter.navTo("RouteListaSurg");
                } else if (lista.list3) {

                } else if (lista.list4) {
                    oRouter.navTo("RouteListaTrasp");
                } else {
                    MessageToast.show(this.getText("errListUnselected"));
                }

            },
            getText: function (text) {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(text);
            },
        });
    });
