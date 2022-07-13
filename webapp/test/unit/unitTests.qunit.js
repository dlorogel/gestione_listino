/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"itorogel/gestione_listino/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
