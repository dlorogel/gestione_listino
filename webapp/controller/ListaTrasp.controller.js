sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function (BaseController) {
        "use strict";

        return BaseController.extend("it.orogel.gestionelistino.controller.controller.ListaTrasp", {
            onInit() {
            },
            onNavToList: function(){
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteLista");
            }
        });
    }
);
