sap.ui.define([], function () {
    "use strict";
    return {

        formatAvailableToIcon: function (bAvailable) {
            return bAvailable ? "sap-icon://accept" : "sap-icon://decline";
        },
        fmIconModView: function (flag) {
            return flag ? "sap-icon://message-information" : "sap-icon://edit";
        },
        fmFormatDate: function (date) {
            if (!date) return "";

            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd.MM.yyyy"
            });

            return dateFormat.format(new Date(date));
        },
        /*fmComma: function (value) {
            if (value !== null && value !== undefined) {
                return value.replace(".", ",");

            }
        }*/
    };
});