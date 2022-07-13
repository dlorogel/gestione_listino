sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast",
        "sap/ui/core/Fragment",
        "sap/ui/model/json/JSONModel",
        "../model/formatter",
        "sap/m/MessageBox",
        "sap/ui/export/Spreadsheet",
        "sap/ui/export/library",
        "../libs/xlsx"
    ],
    function (BaseController, Filter, FilterOperator, MessageToast, Fragment, JSONModel, formatter, MessageBox, Spreadsheet,
        exportLibrary) {
        "use strict";
        var creation = false;
        var modify = false;
        var EdmType = exportLibrary.EdmType;
        return BaseController.extend("it.orogel.gestionelistino.controller.controller.Lista", {
            formatter: formatter,
            onInit() {
                this.oGlobalBusyDialog = new sap.m.BusyDialog();
                let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteLista").attachMatched(this._onObjectMatched, this);
            },
            _onObjectMatched: function (oEvent) {
                var filterModel = this.getOwnerComponent().getModel("filterModel").getData();
                this.onSearchLista(filterModel)
            },
            onPressAddRow: function () {
                if (modify) {
                    MessageToast.show(this.getText("errAction"));
                    return;
                }
                creation = true;
                modify = false;
                this.byId("btnSave").setVisible(true);
                this.byId("btnReject").setVisible(true);
                this.getOwnerComponent().getModel("zlistModel").getData().unshift(this.createEntry())
                this.refresh("zlistModel");
            },
            onEditRow: function (oEvt) {
                if (creation) {
                    MessageToast.show(this.getText("errAction"));
                    return;
                }
                creation = false;
                modify = true;
                this.byId("btnSave").setVisible(true);
                this.byId("btnReject").setVisible(true);
                var indx = this.byId("tabellaTestata").getSelectedIndices()
                for (let i = 0; i < indx.length; i++) {
                    this.byId("tabellaTestata").getContextByIndex(indx[i]).getObject().modify = true
                }
                this.refresh("zlistModel");
            },
            onDelRevertRows: function (oEvt, flag) {
                var indxSelected = this.byId("tabellaTestata").getSelectedIndices()
                if (indxSelected.length < 1) {
                    MessageToast.show(this.getText("errRowUnselected"));
                    return;
                }
                for (let i = 0; i < indxSelected.length; i++) {
                    const element = this.byId("tabellaTestata").getContextByIndex(indxSelected[i]).getObject();
                    if (flag) {
                        element.ZCANC = "X"
                    } else {
                        element.ZCANC = ""
                    }
                    delete element.insert
                    delete element.modify
                    //element.ZDAT_FROM = element.ZDAT_FROM.toJSON().slice(0, 19)
                    //element.ZDAT_TO = element.ZDAT_TO.toJSON().slice(0, 19)
                    this.updateList(element)
                    rowSelected.push(element)
                }
            },
            onSearchFilterLista: function (oEvent) {
                var filterModel = this.getOwnerComponent().getModel("filterModel").getData();
                this.onSearchLista(filterModel);
            },
            onSearchLista: function (filtri) {
                this.oGlobalBusyDialog.open();
                var flag = false;
                var model = this.getOwnerComponent().getModel();
                var that = this;
                var aFilter = this.getFilters(filtri);
                //TO DO da riattivare in default del flag
                //aFilter.push(new Filter("ZCANC", sap.ui.model.FilterOperator.NE, "X"));
                model.read("/ZZ1_ZLISTINO", {
                    filters: [aFilter],
                    success: function (response) {
                        response.results.forEach(e => {
                            e.insert = false
                            e.modify = false
                        });
                        that.getOwnerComponent().getModel("zlistModel").setData(response.results);
                        that.refresh("zlistModel");
                        that.oGlobalBusyDialog.close();
                        //that.getOwnerComponent().setModel(response.results, "zlistModel")
                    },
                    error: function (error) {
                        console.log(error)
                        that.oGlobalBusyDialog.close();
                    }
                });
            },
            postList: function (body) {
                var model = this.getOwnerComponent().getModel();
                var that = this;
                const promise = new Promise((resolve, reject) => {
                    model.create("/ZZ1_ZLISTINO", body, {
                        success: function (data) {
                            resolve(data)
                            that.onSearchFilterLista();
                        },
                        error: function (error) {
                            reject(error)
                        }
                    });
                });
            },
            updateList: function (body) {
                var model = this.getOwnerComponent().getModel();
                var that = this;
                const promise = new Promise((resolve, reject) => {
                    model.update("/ZZ1_ZLISTINO(guid'" + body.SAP_UUID + "')", body, {
                        success: function (data) {
                            resolve(data)
                            that.onSearchFilterLista();
                        },
                        error: function (error) {
                            reject(error)
                        }
                    });
                });
            },
            onSave: function () {
                var indxSelected = this.byId("tabellaTestata").getSelectedIndices()
                var rowSelected = [];

                let DataFrom = sap.ui.model.odata.ODataUtils.formatValue(new Date(this.getOwnerComponent().getModel("zlistModel").getData()[0].ZDAT_FROM), "Edm.DateTime");
                if (creation) {
                    var arrayTab = this.getOwnerComponent().getModel("zlistModel").getData();
                    let newRows = arrayTab.filter(function (e) {
                        return e.SAP_UUID === "";
                    });
                    console.log(newRows)
                    newRows.forEach(e => {
                        if (this.checkMandatory(e)) {
                            return;
                        };
                        e.ZDAT_FROM = new Date(e.ZDAT_FROM).toJSON().slice(0, 19)
                        e.ZDAT_TO = new Date(e.ZDAT_TO).toJSON().slice(0, 19)
                        delete e.SAP_UUID
                        delete e.insert
                        delete e.modify
                        this.postList(e)
                        creation = false;
                        modify = false;
                    });

                } else if (modify) {
                    if (indxSelected.length < 1) {
                        MessageToast.show(this.getText("errRowUnselected"));
                        return;
                    }
                    for (let i = 0; i < indxSelected.length; i++) {
                        const element = this.byId("tabellaTestata").getContextByIndex(indxSelected[i]).getObject();
                        element.ZDAT_FROM = sap.ui.model.odata.ODataUtils.formatValue(new Date(element.ZDAT_FROM), "Edm.DateTime");
                        element.ZDAT_TO = sap.ui.model.odata.ODataUtils.formatValue(new Date(element.ZDAT_TO), "Edm.DateTime");
                        delete element.insert
                        delete element.modify
                        //element.ZDAT_FROM = element.ZDAT_FROM.toJSON().slice(0, 19)
                        //element.ZDAT_TO = element.ZDAT_TO.toJSON().slice(0, 19)
                        this.updateList(element)
                        rowSelected.push(element)
                        creation = false;
                        modify = false;
                    }

                }

            },
            getValues: function (field, flag) {
                this.oGlobalBusyDialog.open();
                var sapModel = this.getOwnerComponent().getModel("sapModel")
                var that = this;
                var aFilter = [];
                var arrayRes = [];

                aFilter.push(new Filter("Zattr", sap.ui.model.FilterOperator.EQ, field));
                aFilter.push(new Filter("Zdel", sap.ui.model.FilterOperator.NE, "X"));
                aFilter.push(new Filter("ZdatFrom", FilterOperator.LE, new Date().toJSON().slice(0, 19)));
                aFilter.push(new Filter("ZdatTo", FilterOperator.GE, new Date().toJSON().slice(0, 19)));

                sapModel.read("/ZMM_ATTR_HEADSet", {
                    filters: [aFilter],
                    success: function (response) {
                        response.results.forEach(e => {
                            const obj = { key: e.Zvalue, text: e.Zdescr, type: field, filter: flag }
                            arrayRes.push(obj)
                        });
                        that.getOwnerComponent().getModel("dynamicModel").setData(arrayRes);
                        that.refresh("dynamicModel");
                        that.oGlobalBusyDialog.close();
                    },
                    error: function (error) {
                        console.log(error)
                        that.oGlobalBusyDialog.close();
                    }
                });

            },
            getEkorg: function (field, flag) {
                this.oGlobalBusyDialog.open();
                var model = this.getOwnerComponent().getModel("ekorgModel");
                var that = this;
                var aFilter= [];
                var arrayRes = [];
                const oFinalFilter = new Filter({
                    filters: [],
                    and: true
                });
                aFilter.push(new Filter("PurchasingOrganization", sap.ui.model.FilterOperator.NE, "0001"));
                aFilter.push(new Filter("PurchasingOrganization", sap.ui.model.FilterOperator.NE, "0002"));
                oFinalFilter.aFilters.push(new Filter({
                    filters: aFilter,
                    and: true
                }));
                //TO DO da riattivare in default del flag
                //aFilter.push(new Filter("ZCANC", sap.ui.model.FilterOperator.NE, "X"));
                model.read("/C_PurchasingOrganizationVHTemp", {
                    filters: [oFinalFilter],
                    success: function (response) {
                        response.results.forEach(e => {
                            const obj = { key: e.PurchasingOrganization, text: e.PurchasingOrganizationName, type: field, filter: flag }
                            arrayRes.push(obj)
                        });
                        that.getOwnerComponent().getModel("dynamicModel").setData(arrayRes);
                        that.refresh("dynamicModel");
                        that.oGlobalBusyDialog.close();
                    },
                    error: function (error) {
                        console.log(error)
                        that.oGlobalBusyDialog.close();
                    }
                });
            },
            getValuesPos: function (entity, Zattr, Zvalue, Zname, flag, field) {
                this.oGlobalBusyDialog.open();
                var sapModel = this.getOwnerComponent().getModel("sapModel")
                var that = this;
                var aFilter = [];
                var arrayRes = [];

                aFilter.push(new Filter("Zattr", sap.ui.model.FilterOperator.EQ, Zattr));
                aFilter.push(new Filter("Zdel", sap.ui.model.FilterOperator.NE, "X"));
                aFilter.push(new Filter("Zvalue", sap.ui.model.FilterOperator.EQ, Zvalue));
                if (Zname !== '') {
                    aFilter.push(new Filter("Zname", sap.ui.model.FilterOperator.EQ, Zname));
                }

                sapModel.read(entity, {
                    filters: [aFilter],
                    success: function (response) {
                        if (response.results.length > 0) {
                            response.results.forEach(e => {
                                const obj = { key: e.ZvalueInf, text: e.Zdescr, type: field, filter: flag }
                                arrayRes.push(obj)
                            });
                            that.getOwnerComponent().getModel("dynamicModel").setData(arrayRes);
                            that.refresh("dynamicModel");
                            that.oGlobalBusyDialog.close();
                        } else {
                            that.getValues(Zname)
                        }

                    },
                    error: function (error) {
                        console.log(error)
                        that.oGlobalBusyDialog.close();
                    }
                });

            },
            onValueHelpRequest: async function (event, field, isFilter) {

                var oView = this.getView();
                var newRow = this.getOwnerComponent().getModel("zlistModel").getData()[0];

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "it.orogel.gestionelistino.view.Fragments.DynamicFrag",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                if (field === 'VARIETA') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS1Set', 'SPECIE', newRow.ZSPECIE, 'VARIETA', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else if (field === 'EKORG') {
                    await this.getEkorg(field, isFilter)
                } else if (field === 'RAGG_VARIET') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '' && newRow.ZVARIETA !== '000' && newRow.ZVARIETA !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS2Set', 'VARIETA', newRow.ZVARIETA, '', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else if (field === 'SPECIFICA') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS1Set', 'SPECIE', newRow.ZSPECIE, 'SPECIFICA', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else if (field === 'LAVORAZIONE') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS1Set', 'SPECIE', newRow.ZSPECIE, 'LAVORAZIONE', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else if (field === 'QUALITA') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS1Set', 'SPECIE', newRow.ZSPECIE, 'QUALITA', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else if (field === 'CALIBRAZ') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS1Set', 'SPECIE', newRow.ZSPECIE, 'CALIBRAZ', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else if (field === 'RAGGCALIBR') {
                    if (newRow.ZSPECIE !== '000' && newRow.ZSPECIE !== '') {
                        await this.getValuesPos('/ZMM_ATTR_POS1Set', 'SPECIE', newRow.ZSPECIE, 'ZRAGGCAL', isFilter, field)
                    } else {
                        await this.getValues(field, isFilter)
                    }
                } else {
                    await this.getValues(field, isFilter)
                }
                //await this.getValues(field);
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    oValueHelpDialog.open();
                }.bind(this));
            },
            onValueHelpDialogClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");

                var allRows = this.getOwnerComponent().getModel("zlistModel").getData()
                let newRows = allRows.filter(function (e) {
                    return e.SAP_UUID === "";
                });
                var filterModel = this.getOwnerComponent().getModel("filterModel").getData()
                var type = this.getOwnerComponent().getModel("dynamicModel").getData()[0].type
                var isFilter = this.getOwnerComponent().getModel("dynamicModel").getData()[0].filter

                switch (type) {
                    case 'EKORG':
                        if (isFilter) {
                            filterModel.EKORG = oSelectedItem.getTitle()
                        } else {
                            newRows[0].EKORG = oSelectedItem.getTitle();
                        }
                        break;
                    case 'SPECIE':
                        if (isFilter) {
                            filterModel.ZSPECIE = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZSPECIE = oSelectedItem.getTitle();
                        }
                        break;
                    case 'STAGIONALITA':
                        if (isFilter) {
                            filterModel.ZSTAG = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZSTAG = oSelectedItem.getTitle();
                        }
                        break;
                    case 'CERTIFICAZIONE_AZIENDALE':
                        if (isFilter) {
                            filterModel.ZCERTAZ = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZCERTAZ = oSelectedItem.getTitle();
                        }
                        break;
                    case 'CERTIFICAZIONE_PRODOTTO':
                        if (isFilter) {
                            filterModel.ZCERTPROD = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZCERTPROD = oSelectedItem.getTitle();
                        }
                        break;
                    case 'RESIDUO':
                        if (isFilter) {
                            filterModel.ZRESIDUO = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZRESIDUO = oSelectedItem.getTitle();
                        }
                        break;
                    case 'CERTIFICAZIONE_COMMERCIALE':
                        if (isFilter) {
                            filterModel.ZCERTIFCOM = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZCERTIFCOM = oSelectedItem.getTitle();
                        }
                        break;
                    case 'ORIGINE':
                        if (isFilter) {
                            filterModel.ZORIGINE = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZORIGINE = oSelectedItem.getTitle();
                        }
                        break;
                    case 'EVENTI':
                        if (isFilter) {
                            filterModel.ZEVCOLT = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZEVCOLT = oSelectedItem.getTitle();
                        }
                        break;
                    case 'CAR_RACTAG':
                        if (isFilter) {
                            filterModel.ZSERRACTAG = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZSERRACTAG = oSelectedItem.getTitle();
                        }
                        break;
                    case 'SERVIZIO1':
                        newRows[0].ZSERASTC = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIO3':
                        newRows[0].ZSERCAR = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIO2':
                        newRows[0].ZSERASSTEC = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIO4':
                        newRows[0].ZSERDEP = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIO5':
                        newRows[0].ZSERCAL = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIOEXTRA1':
                        newRows[0].ZSER1 = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIOEXTRA2':
                        newRows[0].ZSER2 = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIOEXTRA3':
                        newRows[0].ZSER3 = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIOEXTRA4':
                        newRows[0].ZSER4 = oSelectedItem.getTitle();
                        break;
                    case 'SERVIZIOEXTRA5':
                        newRows[0].ZSER5 = oSelectedItem.getTitle();
                        break;
                    case 'RAGGLIQ':
                        newRows[0].ZRAGGLIQ = oSelectedItem.getTitle();
                        break;
                    case 'POLITICHEOP':
                        newRows[0].ZRAGGLIQ = oSelectedItem.getTitle();
                        break;
                    case 'VARIETA':
                        if (isFilter) {
                            filterModel.ZVARIETA = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZVARIETA = oSelectedItem.getTitle();
                        }
                        break;
                    case 'RAGG_VARIET':
                        if (isFilter) {
                            filterModel.ZGRVARIETA = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZGRVARIETA = oSelectedItem.getTitle();
                        }
                        break;
                    case 'SPECIFICA':
                        if (isFilter) {
                            filterModel.ZSPECIFICA = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZSPECIFICA = oSelectedItem.getTitle();
                        }
                        break;
                    case 'LAVORAZIONE':
                        if (isFilter) {
                            filterModel.ZLAVORAZIONE = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZLAVORAZIONE = oSelectedItem.getTitle();
                        }
                        break;
                    case 'QUALITA':
                        if (isFilter) {
                            filterModel.ZQUALITA = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZQUALITA = oSelectedItem.getTitle();
                        }
                        break;
                    case 'CALIBRAZ':
                        if (isFilter) {
                            filterModel.ZCALIBRAZIONE = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZCALIBRAZIONE = oSelectedItem.getTitle();
                        }
                        break;
                    case 'RAGGCALIBR':
                        if (isFilter) {
                            filterModel.ZRAGGCAL = oSelectedItem.getTitle()
                        } else {
                            newRows[0].ZRAGGCAL = oSelectedItem.getTitle();
                        }
                        break;
                    default:
                        break;
                }

                this.getOwnerComponent().setModel(new JSONModel({}), "dynamicModel")
                this.refresh("dynamicModel");
                this.refresh("zlistModel");
                this.refresh("filterModel");
            },
            getFilters: function (filtri) {
                var aFilter = [];
                var flag = false;
                if (filtri) {
                    if (filtri.hasOwnProperty('EKORG')) {
                        if (filtri.EKORG !== "") {
                            aFilter.push(new Filter("EKORG", sap.ui.model.FilterOperator.EQ, filtri.EKORG));
                            flag = true;
                        }
                    }
                    if (filtri.hasOwnProperty('ZTIPLIST')) {
                        if (filtri.ZTIPLIST !== "") {
                            aFilter.push(new Filter("ZTIPLIST", sap.ui.model.FilterOperator.EQ, filtri.ZTIPLIST));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZDAT_FROM')) {
                        if (filtri.ZDAT_FROM !== "") {
                            aFilter.push(new Filter("ZDAT_FROM", sap.ui.model.FilterOperator.EQ, filtri.ZDAT_FROM));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZDAT_TO')) {
                        if (filtri.ZDAT_TO !== "") {
                            aFilter.push(new Filter("ZDAT_TO", sap.ui.model.FilterOperator.EQ, filtri.ZDAT_TO));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZSPECIE')) {
                        if (filtri.ZSPECIE !== "") {
                            aFilter.push(new Filter("ZSPECIE", sap.ui.model.FilterOperator.EQ, filtri.ZSPECIE));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZSTAG')) {
                        if (filtri.ZSTAG !== "") {
                            aFilter.push(new Filter("ZSTAG", sap.ui.model.FilterOperator.EQ, filtri.ZSTAG));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZVARIETA')) {
                        if (filtri.ZVARIETA !== "") {
                            aFilter.push(new Filter("ZVARIETA", sap.ui.model.FilterOperator.EQ, filtri.ZVARIETA));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZGRVARIETA')) {
                        if (filtri.ZGRVARIETA !== "") {
                            aFilter.push(new Filter("ZGRVARIETA", sap.ui.model.FilterOperator.EQ, filtri.ZGRVARIETA));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZCERTAZ')) {
                        if (filtri.ZCERTAZ !== "") {
                            aFilter.push(new Filter("ZCERTAZ", sap.ui.model.FilterOperator.EQ, filtri.ZCERTAZ));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZCERTPROD')) {
                        if (filtri.ZCERTPROD !== "") {
                            aFilter.push(new Filter("ZCERTPROD", sap.ui.model.FilterOperator.EQ, filtri.ZCERTPROD));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZRESIDUO')) {
                        if (filtri.ZRESIDUO !== "") {
                            aFilter.push(new Filter("ZRESIDUO", sap.ui.model.FilterOperator.EQ, filtri.ZRESIDUO));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZCERTIFCOM')) {
                        if (filtri.ZCERTIFCOM !== "") {
                            aFilter.push(new Filter("ZCERTIFCOM", sap.ui.model.FilterOperator.EQ, filtri.ZCERTIFCOM));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZSPECIFICA')) {
                        if (filtri.ZSPECIFICA !== "") {
                            aFilter.push(new Filter("ZSPECIFICA", sap.ui.model.FilterOperator.EQ, filtri.ZSPECIFICA));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZLAVORAZIONE')) {
                        if (filtri.ZLAVORAZIONE !== "") {
                            aFilter.push(new Filter("ZLAVORAZIONE", sap.ui.model.FilterOperator.EQ, filtri.ZLAVORAZIONE));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZORIGINE')) {
                        if (filtri.ZORIGINE !== "") {
                            aFilter.push(new Filter("ZORIGINE", sap.ui.model.FilterOperator.EQ, filtri.ZORIGINE));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZQUALITA')) {
                        if (filtri.ZQUALITA !== "") {
                            aFilter.push(new Filter("ZQUALITA", sap.ui.model.FilterOperator.EQ, filtri.ZQUALITA));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZCALIBRAZIONE')) {
                        if (filtri.ZCALIBRAZIONE !== "") {
                            aFilter.push(new Filter("ZCALIBRAZIONE", sap.ui.model.FilterOperator.EQ, filtri.ZCALIBRAZIONE));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZRAGGCAL')) {
                        if (filtri.ZRAGGCAL !== "") {
                            aFilter.push(new Filter("ZRAGGCAL", sap.ui.model.FilterOperator.EQ, filtri.ZRAGGCAL));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZEVCOLT')) {
                        if (filtri.ZEVCOLT !== "") {
                            aFilter.push(new Filter("ZEVCOLT", sap.ui.model.FilterOperator.EQ, filtri.ZEVCOLT));
                            flag = true;
                        }
                    }

                    if (filtri.hasOwnProperty('ZSERRACTAG')) {
                        if (filtri.ZSERRACTAG !== "") {
                            aFilter.push(new Filter("ZSERRACTAG", sap.ui.model.FilterOperator.EQ, filtri.ZSERRACTAG));
                            flag = true;
                        }
                    }

                    return aFilter;
                }
            },
            checkMandatory: function (lista) {
                var stringa = this.getText("erInit") + "\n";
                var check = false;

                if (!lista.EKORG || lista.EKORG === null || lista.EKORG === undefined || lista.EKORG === "" || lista.EKORG == "0" || lista.EKORG == "00" || lista.EKORG == "000" || lista.EKORG == "0000") {
                    check = true;
                    stringa += this.getText("EKORG") + "\n";
                }

                if (!lista.ZTIPLIST || lista.ZTIPLIST === null || lista.ZTIPLIST === undefined || lista.ZTIPLIST === "") {
                    check = true;
                    stringa += this.getText("ZTIPLIST") + "\n";
                }

                if (!lista.ZDAT_FROM || lista.ZDAT_FROM === null || lista.ZDAT_FROM === undefined || lista.ZDAT_FROM === "") {
                    check = true;
                    stringa += this.getText("ZDAT_FROM") + "\n";
                }

                if (!lista.ZDAT_TO || lista.ZDAT_TO === null || lista.ZDAT_TO === undefined || lista.ZDAT_TO === "") {
                    check = true;
                    stringa += this.getText("ZDAT_TO") + "\n";
                }

                if (!lista.ZSTAG || lista.ZSTAG === null || lista.ZSTAG === undefined || lista.ZSTAG === "" || lista.ZSTAG == "0") {
                    check = true;
                    stringa += this.getText("ZSTAG") + "\n";
                }

                if (!lista.ZCERTAZ || lista.ZCERTAZ === null || lista.ZCERTAZ === undefined || lista.ZCERTAZ === "" || lista.ZCERTAZ == "0") {
                    check = true;
                    stringa += this.getText("ZCERTAZ") + "\n";
                }

                if (!lista.ZCERTPROD || lista.ZCERTPROD === null || lista.ZCERTPROD === undefined || lista.ZCERTPROD === "" || lista.ZCERTPROD == "0") {
                    check = true;
                    stringa += this.getText("ZCERTPROD") + "\n";
                }

                if (!lista.ZRESIDUO || lista.ZRESIDUO === null || lista.ZRESIDUO === undefined || lista.ZRESIDUO === "" || lista.ZRESIDUO == "0") {
                    check = true;
                    stringa += this.getText("ZRESIDUO") + "\n";
                }

                if (!lista.ZCERTIFCOM || lista.ZCERTIFCOM === null || lista.ZCERTIFCOM === undefined || lista.ZCERTIFCOM === "" || lista.ZCERTIFCOM == "0" || lista.ZCERTIFCOM == "00") {
                    check = true;
                    stringa += this.getText("ZCERTIFCOM") + "\n";
                }

                if (!lista.ZSPECIFICA || lista.ZSPECIFICA === null || lista.ZSPECIFICA === undefined || lista.ZSPECIFICA === "" || lista.ZSPECIFICA == "0") {
                    check = true;
                    stringa += this.getText("ZSPECIFICA") + "\n";
                }

                if (!lista.ZLAVORAZIONE || lista.ZLAVORAZIONE === null || lista.ZLAVORAZIONE === undefined || lista.ZLAVORAZIONE === "" || lista.ZLAVORAZIONE == "0" || lista.ZLAVORAZIONE == "00") {
                    check = true;
                    stringa += this.getText("ZLAVORAZIONE") + "\n";
                }

                if (!lista.ZORIGINE || lista.ZORIGINE === null || lista.ZORIGINE === undefined || lista.ZORIGINE === "" || lista.ZORIGINE == "0" || lista.ZORIGINE == "00") {
                    check = true;
                    stringa += this.getText("ZORIGINE") + "\n";
                }

                if (!lista.ZQUALITA || lista.ZQUALITA === null || lista.ZQUALITA === undefined || lista.ZQUALITA === "" || lista.ZQUALITA == "0" || lista.ZQUALITA == "00") {
                    check = true;
                    stringa += this.getText("ZQUALITA") + "\n";
                }

                if (!lista.ZCALIBRAZIONE || lista.ZCALIBRAZIONE === null || lista.ZCALIBRAZIONE === undefined || lista.ZCALIBRAZIONE === "" || lista.ZCALIBRAZIONE == "0" || lista.ZCALIBRAZIONE == "00") {
                    check = true;
                    stringa += this.getText("ZCALIBRAZIONE") + "\n";
                }

                if (check) {
                    MessageBox.error(stringa, {
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                        onClose: function (sAction) {
                            if (sAction === "OK") {
                                return true;
                            } else {
                                return true;
                            }
                        }
                    });
                    return true;
                }
            },
            onChangeToComma: function (value) {
                if (value.mParameters.value !== null && value.mParameters.value !== undefined) {
                    value.mParameters.value = value.mParameters.value.replace(".", ",");
                    return value;
                }                
            },
            onExport: function () {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
                this.sDay = String(new Date().getDate()).padStart(2, "0");
                this.sMonth = String(new Date().getMonth() + 1).padStart(2, "0");
                this.sYear = new Date().getFullYear();
                let dToday = "_" + this.sDay + "_" + this.sMonth + "_" + this.sYear;
                let sFileName = this.getText("appTitle") + dToday + ".xlsx";

                oTable = this.byId("tabellaTestata");
                oRowBinding = oTable.getBinding("rows");
                aCols = this._createColumnConfig();

                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: oRowBinding,
                    fileName: sFileName,
                    worker: true // We need to disable worker because we are using a MockServer as OData Service
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show("Spreadsheet export has finished");
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            },
            /**
             * Create column configuration 
             * ---------------------------
             */
            _createColumnConfig: function () {
                let aCols = [];

                aCols.push({
                    label: this.getText("EKORG"),
                    type: EdmType.String,
                    property: "EKORG"
                });
                aCols.push({
                    label: this.getText("ZTIPLIST"),
                    type: EdmType.String,
                    property: "ZTIPLIST"
                });
                aCols.push({
                    label: this.getText("ZDAT_FROM"),
                    type: EdmType.Date,
                    format: "dd.MM.yyyy",
                    property: "ZDAT_FROM"
                });
                aCols.push({
                    label: this.getText("ZDAT_TO"),
                    type: EdmType.Date,
                    format: "dd.MM.yyyy",
                    property: "ZDAT_TO"
                });
                aCols.push({
                    label: this.getText("ZSPECIE"),
                    type: EdmType.String,
                    property: "ZSPECIE"
                });
                aCols.push({
                    label: this.getText("ZSTAG"),
                    type: EdmType.String,
                    property: "ZSTAG"
                });
                aCols.push({
                    label: this.getText("ZVARIETA"),
                    type: EdmType.String,
                    property: "ZVARIETA"
                });
                aCols.push({
                    label: this.getText("ZGRVARIETA"),
                    type: EdmType.String,
                    property: "ZGRVARIETA"
                });
                aCols.push({
                    label: this.getText("ZCERTAZ"),
                    type: EdmType.String,
                    property: "ZCERTAZ"
                });
                aCols.push({
                    label: this.getText("ZCERTPROD"),
                    type: EdmType.String,
                    property: "ZCERTPROD"
                });
                aCols.push({
                    label: this.getText("ZRESIDUO"),
                    type: EdmType.String,
                    property: "ZRESIDUO"
                });
                aCols.push({
                    label: this.getText("ZCERTIFCOM"),
                    type: EdmType.String,
                    property: "ZCERTIFCOM"
                });
                aCols.push({
                    label: this.getText("ZSPECIFICA"),
                    type: EdmType.String,
                    property: "ZSPECIFICA"
                });
                aCols.push({
                    label: this.getText("ZLAVORAZIONE"),
                    type: EdmType.String,
                    property: "ZLAVORAZIONE"
                });
                aCols.push({
                    label: this.getText("ZORIGINE"),
                    type: EdmType.String,
                    property: "ZORIGINE"
                });
                aCols.push({
                    label: this.getText("ZQUALITA"),
                    type: EdmType.String,
                    property: "ZQUALITA"
                });
                aCols.push({
                    label: this.getText("ZCALIBRAZIONE"),
                    type: EdmType.String,
                    property: "ZCALIBRAZIONE"
                });
                aCols.push({
                    label: this.getText("ZRAGGCAL"),
                    type: EdmType.String,
                    property: "ZRAGGCAL"
                });
                aCols.push({
                    label: this.getText("ZPRZBASE"),
                    type: EdmType.String,
                    property: "ZPRZBASE"
                });
                aCols.push({
                    label: this.getText("ZUM"),
                    type: EdmType.String,
                    property: "ZUM"
                });
                aCols.push({
                    label: this.getText("ZSERRACTAG"),
                    type: EdmType.String,
                    property: "ZSERRACTAG"
                });
                aCols.push({
                    label: this.getText("ZSERASTC"),
                    type: EdmType.String,
                    property: "ZSERASTC"
                });
                aCols.push({
                    label: this.getText("ZCOSSERASTC"),
                    type: EdmType.String,
                    property: "ZCOSSERASTC"
                });
                aCols.push({
                    label: this.getText("ZSERCAR"),
                    type: EdmType.String,
                    property: "ZSERCAR"
                });
                aCols.push({
                    label: this.getText("ZCOSSERCAR"),
                    type: EdmType.String,
                    property: "ZCOSSERCAR"
                });
                aCols.push({
                    label: this.getText("ZSERASSTEC"),
                    type: EdmType.String,
                    property: "ZSERASSTEC"
                });
                aCols.push({
                    label: this.getText("ZCOSSERASSTEC"),
                    type: EdmType.String,
                    property: "ZCOSSERASSTEC"
                });
                aCols.push({
                    label: this.getText("ZSERDEP"),
                    type: EdmType.String,
                    property: "ZSERDEP"
                });
                aCols.push({
                    label: this.getText("ZCOSSERDEP"),
                    type: EdmType.String,
                    property: "ZCOSSERDEP"
                });
                aCols.push({
                    label: this.getText("ZSERCAL"),
                    type: EdmType.String,
                    property: "ZSERCAL"
                });
                aCols.push({
                    label: this.getText("ZCOSSERCAL"),
                    type: EdmType.String,
                    property: "ZCOSSERCAL"
                });
                aCols.push({
                    label: this.getText("ZSER1"),
                    type: EdmType.String,
                    property: "ZSER1"
                });
                aCols.push({
                    label: this.getText("ZCOSSER1"),
                    type: EdmType.String,
                    property: "ZCOSSER1"
                });
                aCols.push({
                    label: this.getText("ZSER2"),
                    type: EdmType.String,
                    property: "ZSER2"
                });
                aCols.push({
                    label: this.getText("ZCOSSER2"),
                    type: EdmType.String,
                    property: "ZCOSSER2"
                });
                aCols.push({
                    label: this.getText("ZSER3"),
                    type: EdmType.String,
                    property: "ZSER3"
                });
                aCols.push({
                    label: this.getText("ZCOSSER3"),
                    type: EdmType.String,
                    property: "ZCOSSER3"
                });
                aCols.push({
                    label: this.getText("ZSER4"),
                    type: EdmType.String,
                    property: "ZSER4"
                });
                aCols.push({
                    label: this.getText("ZCOSSER4"),
                    type: EdmType.String,
                    property: "ZCOSSER4"
                });
                aCols.push({
                    label: this.getText("ZSER5"),
                    type: EdmType.String,
                    property: "ZSER5"
                });
                aCols.push({
                    label: this.getText("ZCOSSER5"),
                    type: EdmType.String,
                    property: "ZCOSSER5"
                });
                aCols.push({
                    label: this.getText("ZRAGGLIQ"),
                    type: EdmType.String,
                    property: "ZRAGGLIQ"
                });
                aCols.push({
                    label: this.getText("ZOP"),
                    type: EdmType.String,
                    property: "ZOP"
                });
                aCols.push({
                    label: this.getText("ZMARKUP"),
                    type: EdmType.String,
                    property: "ZMARKUP"
                });
                aCols.push({
                    label: this.getText("MATNR"),
                    type: EdmType.String,
                    property: "MATNR"
                });
                aCols.push({
                    label: this.getText("ZCANC"),
                    type: EdmType.String,
                    property: "ZCANC"
                });
                return aCols;
            },
            createEntry: function () {
                return {
                    EKORG: "0", MATNR: "", SAP_UUID: "", ZCALIBRAZIONE: "00", ZCANC: "0", ZCERTAZ: "0", ZCERTIFCOM: "00", ZCERTPROD: "0", ZCOSSER1_C: "", ZCOSSER1_C_Text: "", ZCOSSER1_V: "0.00", ZCOSSER2_C: "", ZCOSSER2_C_Text: "", ZCOSSER2_V: "0.00", ZCOSSER3_C: "", ZCOSSER3_C_Text: "", ZCOSSER3_V: "0.00", ZCOSSER4_C: "", ZCOSSER4_C_Text: "", ZCOSSER4_V: "0.00", ZCOSSER5_C: "", ZCOSSER5_C_Text: "", ZCOSSER5_V: "0.00", ZCOSSERASSTEC_C: "", ZCOSSERASSTEC_C_Text: "", ZCOSSERASSTEC_V: "0.00", ZCOSSERASTC_C: "", ZCOSSERASTC_C_Text: "", ZCOSSERASTC_V: "0.00", ZCOSSERCAL_C: "", ZCOSSERCAL_C_Text: "", ZCOSSERCAL_V: "0.00", ZCOSSERCAR_C: "", ZCOSSERCAR_C_Text: "", ZCOSSERCAR_V: "0.00", ZCOSSERDEP_C: "", ZCOSSERDEP_C_Text: "", ZCOSSERDEP_V: "0.00", ZDAT_FROM: new Date().toJSON().slice(0, 19), ZDAT_TO: new Date().toJSON().slice(0, 19), ZEVCOLT: "0", ZGRVARIETA: "0000", ZLAVORAZIONE: "00", ZMARKUP_C: "", ZMARKUP_C_Text: "", ZMARKUP_V: "0.00", ZOP: "000", ZORIGINE: "00", ZPRZBASE_C: "", ZPRZBASE_C_Text: "", ZPRZBASE_V: "0.00", ZQUALITA: "00", ZRAGGCAL: "00", ZRAGGLIQ: "0000", ZRESIDUO: "0", ZSER1: "0", ZSER2: "0", ZSER3: "0", ZSER4: "0", ZSER5: "0", ZSERASSTEC: "0", ZSERASTC: "0", ZSERCAL: "0", ZSERCAR: "0", ZSERDEP: "0", ZSERRACTAG: "0", ZSPECIE: "000", ZSPECIFICA: "0", ZSTAG: "0", ZTIPLIST: "", ZUM: "", ZVARIETA: "000", insert: true, modify: true
                };
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
