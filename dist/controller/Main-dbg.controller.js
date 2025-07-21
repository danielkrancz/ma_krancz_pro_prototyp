sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/p13n/Engine',
	'sap/m/p13n/SelectionController',
	'sap/m/p13n/SortController',
	'sap/m/p13n/GroupController',
	'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library',
    'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageBox',
    'sap/m/MessageToast',
    'sap/ui/model/Sorter',
    'sap/m/ColumnListItem',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/comp/smartvariants/PersonalizableInfo',
    'sap/m/Token',
    'sap/ui/core/Fragment',
    'sap/ui/model/type/String',
    'sap/ui/table/Column',
	'sap/m/Column',
    'sap/m/Label'
], (Controller, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, coreLibrary, exportLibrary, Spreadsheet,
    JSONModel, MessageBox, MessageToast, Sorter, ColumnListItem, Filter, FilterOperator, PersonalizableInfo, Token, Fragment, TypeString, UIColumn, MColumn, Label) => {
    "use strict";

    var EdmType = exportLibrary.EdmType;

    return Controller.extend("at.hb.makrancz.procodeapp.controller.Main", {
        onInit() {
            this._uiModel = new JSONModel({
                usePopin: false,
                itemSelected: false
            });
            this.getView().setModel(this._uiModel, "ui");
            this._registerForP13n();

            this.applyData = this.applyData.bind(this);
			this.fetchData = this.fetchData.bind(this);
			this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

			this.oSmartVariantManagement = this.getView().byId("svm");
			this.oExpandedLabel = this.getView().byId("expandedLabel");
			this.oSnappedLabel = this.getView().byId("snappedLabel");
			this.oFilterBar = this.getView().byId("filterbar");
			this.oTable = this.byId('travelTable');

			this.oFilterBar.registerFetchData(this.fetchData);
			this.oFilterBar.registerApplyData(this.applyData);
			this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

			var oPersInfo = new PersonalizableInfo({
				type: "filterBar",
				keyName: "persistencyKey",
				dataSource: "",
				control: this.oFilterBar
			});

			this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
			this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);

            // add validator
			var fnValidator = function(args){
				var text = args.text;

				return new Token({key: text, text: text});
			};

			this.getView().byId("inputCustomerFilter").addValidator(fnValidator);
			this.getView().byId("inputAgencyFilter").addValidator(fnValidator);
        },

        onPopinSelectionChanged: function(oEvent) {
            let bSelected = oEvent.getSource().getSelectedKey();
            this._uiModel.setProperty("/usePopin", bSelected === 'X' ? true : false);
        },

        onTableSelectionChanged: function(oEvent) {
            this._uiModel.setProperty("/itemSelected", true);
        },

        onListItemPressed: function(oEvent) {
            let sTravelId = oEvent.getSource().getBindingContext().getObject().TravelID;
            this.getOwnerComponent().getRouter().navTo("Detail", {
                TravelID: sTravelId
            }, false)
        },

		onCreatePressed: function() {
			this.getOwnerComponent().getRouter().navTo("Detail", {
                TravelID: "-"
            }, true)
		},

		onCopyPressed: function() {
			let selectedItem = this.getView().byId("travelTable").getSelectedItem().getBindingContext();
            this.getView().getModel().callFunction("/copyTravel", {
				urlParameters: {
					TravelID: selectedItem.getObject().TravelID
				},
				method: "POST",
				success: (oReturn) => {
					debugger;
					this.getOwnerComponent().getRouter().navTo("Detail", {
						TravelID: oReturn.TravelID
					}, false)
				}
			})
			
		},

        onDeleteItem: function() {
            let selectedItem = this.getView().byId("travelTable").getSelectedItem().getBindingContext();
            MessageBox.confirm("Delete object " + selectedItem.getObject().TravelID, {
                actions: ["Delete", "Cancel"],
                emphasizedAction: "Delete",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if(sAction === "Delete"){
                        this.getView().setBusy(true);
                        this.getView().getModel().remove(selectedItem.getPath(), {
                            success: () => {
                                this.getView().setBusy(false);
                                this.getView().byId("travelTable").getBinding("items").refresh();
                                MessageToast.show("Object was deleted.");
                            },
                            error: () => {
                                this.getView().setBusy(false);
                            }
                        });
                    }
                }
            });
        },

        // ----------- Filter und Variantenmanagement -----------

        fetchData: function () {
			var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
				aResult.push({
					groupName: oFilterItem.getGroupName(),
					fieldName: oFilterItem.getName(),
					fieldData: oFilterItem.getControl().getSelectedKeys()
				});

				return aResult;
			}, []);

			return aData;
		},

		applyData: function (aData) {
			aData.forEach(function (oDataObject) {
				var oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
				oControl.setSelectedKeys(oDataObject.fieldData);
			}, this);
		},

		getFiltersWithValues: function () {
			var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl();

				if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
					aResult.push(oFilterGroupItem);
				}

				return aResult;
			}, []);

			return aFiltersWithValue;
		},

		onSelectionChange: function (oEvent) {
			this.oSmartVariantManagement.currentVariantSetModified(true);
			this.oFilterBar.fireFilterChange(oEvent);
		},

		onSearch: function () {
			var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl(),
                    aSelectedKeys = [],
                    aFilters = [];

                if(oControl.getId().includes("OverallStatus")){
                    aSelectedKeys = oControl.getSelectedKeys();
                }else{
                    oControl.getTokens().forEach((oToken) => {
                        aSelectedKeys.push(oToken.getKey());
                    });
                }
				
					aFilters = aSelectedKeys.map(function (sSelectedKey) {
						return new Filter({
							path: oFilterGroupItem.getName(),
							operator: FilterOperator.Contains,
							value1: sSelectedKey
						});
					});

				if (aSelectedKeys.length > 0) {
					aResult.push(new Filter({
						filters: aFilters,
						and: false
					}));
				}

				return aResult;
			}, []);

			this.oTable.getBinding("items").filter(aTableFilters);
			this.oTable.setShowOverlay(false);
		},

		onFilterChange: function () {
			this._updateLabelsAndTable();
		},

		onAfterVariantLoad: function () {
			this._updateLabelsAndTable();
		},

		getFormattedSummaryText: function() {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			if (aFiltersWithValues.length === 1) {
				return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
			}

			return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
		},

		getFormattedSummaryTextExpanded: function() {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			var sText = aFiltersWithValues.length + " filters active",
				aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();

			if (aFiltersWithValues.length === 1) {
				sText = aFiltersWithValues.length + " filter active";
			}

			if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) {
				sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
			}

			return sText;
		},

		_updateLabelsAndTable: function () {
			this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
			this.oSnappedLabel.setText(this.getFormattedSummaryText());
			this.oTable.setShowOverlay(true);
		},

        onAgencyValueHelpRequested: function(oEvent) {
            this._oMultiInput = oEvent.getSource();

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogAgency",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set key fields for filtering in the Define Conditions Tab
				oDialog.setRangeKeyFields([{
					label: "Agency",
					key: "AgencyID",
					type: "string"
				}]);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/TravelAgency",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Agency ID"}), template: new Text({wrapping: false, text: "{AgencyID}"})});
						oColumnID.data({
							fieldName: "AgencyID"
						});
						let oColumnName = new UIColumn({label: new Label({text: "Agency Name"}), template: new Text({wrapping: false, text: "{AgencyName}"})});
						oColumnName.data({
							fieldName: "AgencyName"
						});
                        let oColumnStreet = new UIColumn({label: new Label({text: "Street"}), template: new Text({wrapping: false, text: "{Street}"})});
						oColumnStreet.data({
							fieldName: "Street"
						});
                        let oColumnPostalCode = new UIColumn({label: new Label({text: "Postal Code"}), template: new Text({wrapping: false, text: "{PostalCode}"})});
						oColumnPostalCode.data({
							fieldName: "PostalCode"
						});
                        let oColumnCity = new UIColumn({label: new Label({text: "City"}), template: new Text({wrapping: false, text: "{City}"})});
						oColumnCity.data({
							fieldName: "City"
						});
                        let oColumnCountryCode = new UIColumn({label: new Label({text: "Country Code"}), template: new Text({wrapping: false, text: "{CountryCode}"})});
						oColumnCountryCode.data({
							fieldName: "CountryCode"
						});
                        let oColumnPhone = new UIColumn({label: new Label({text: "Phone"}), template: new Text({wrapping: false, text: "{PhoneNumber}"})});
						oColumnPhone.data({
							fieldName: "PhoneNumber"
						});
                        let oColumnEmail = new UIColumn({label: new Label({text: "Email"}), template: new Text({wrapping: false, text: "{EMailAddress}"})});
						oColumnEmail.data({
							fieldName: "EMailAddress"
						});
                        let oColumnWebsite = new UIColumn({label: new Label({text: "Website"}), template: new Text({wrapping: false, text: "{WebAddress}"})});
						oColumnWebsite.data({
							fieldName: "WebAddress"
						});
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
                        oTable.addColumn(oColumnStreet);
                        oTable.addColumn(oColumnPostalCode);
                        oTable.addColumn(oColumnCountryCode);
                        oTable.addColumn(oColumnPhone);
                        oTable.addColumn(oColumnEmail);
                        oTable.addColumn(oColumnWebsite);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/TravelAgency",
							template: new ColumnListItem({
								cells: [new Label({text: "{AgencyID}"}), new Label({text: "{AgencyName}"}), new Label({text: "{Street}"}), new Label({text: "{PostalCode}"}), new Label({text: "{City}"}), new Label({text: "{CountryCode}"}), new Label({text: "{PhoneNumber}"}), new Label({text: "{EMailAddress}"}), new Label({text: "{WebAddress}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Agency ID"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Agency Name"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Steet"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Postal Code"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "City"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Country"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Phone"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Email"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Website"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.setTokens(this._oMultiInput.getTokens());
				oDialog.open();
			}.bind(this));
		},

        onCustomerValueHelpRequested: function(oEvent) {
            this._oMultiInput = oEvent.getSource();

			Fragment.load({
				name: "at.hb.makrancz.procodeapp.view.fragment.ValueHelpDialogCustomer",
                controller: this
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar();
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set key fields for filtering in the Define Conditions Tab
				oDialog.setRangeKeyFields([{
					label: "Customer",
					key: "CustomerID",
					type: "string"
				}]);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);

				oDialog.getTableAsync().then(function (oTable) {

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Passenger",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						let oColumnID = new UIColumn({label: new Label({text: "Customer ID"}), template: new Text({wrapping: false, text: "{CustomerID}"})});
						oColumnID.data({
							fieldName: "CustomerID"
						});
						let oColumnName = new UIColumn({label: new Label({text: "First Name"}), template: new Text({wrapping: false, text: "{FirstName}"})});
						oColumnName.data({
							fieldName: "FirstName"
						});
                        let oColumnLastName = new UIColumn({label: new Label({text: "Last Name"}), template: new Text({wrapping: false, text: "{LastName}"})});
						oColumnLastName.data({
							fieldName: "LastName"
						});
                        let oColumnTitle = new UIColumn({label: new Label({text: "Title"}), template: new Text({wrapping: false, text: "{Title}"})});
						oColumnTitle.data({
							fieldName: "Title"
						});
                        let oColumnStreet = new UIColumn({label: new Label({text: "Street"}), template: new Text({wrapping: false, text: "{Street}"})});
						oColumnStreet.data({
							fieldName: "Street"
						});
                        
						oTable.addColumn(oColumnID);
						oTable.addColumn(oColumnName);
                        oTable.addColumn(oColumnLastName);
                        oTable.addColumn(oColumnTitle);
                        oTable.addColumn(oColumnStreet);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Passenger",
							template: new ColumnListItem({
								cells: [new Label({text: "{CustomerID}"}), new Label({text: "{FirstName}"}), new Label({text: "{LastName}"}), new Label({text: "{Title}"}), new Label({text: "{Street}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Customer ID"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "First Name"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Last Name"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "Title"})}));
                        oTable.addColumn(new MColumn({header: new Label({text: "Steet"})}));
					}
					oDialog.update();
				}.bind(this));

				oDialog.setTokens(this._oMultiInput.getTokens());
				oDialog.open();
			}.bind(this));
		},

		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oMultiInput.setTokens(aTokens);
			this._oVHD.close();
		},

		onValueHelpCancelPress: function () {
			this._oVHD.close();
		},

		onValueHelpAfterClose: function () {
			this._oVHD.destroy();
		},

        // ----------- Excel Export -----------

        onExport: function() {
			var aCols, oRowBinding, oSettings, oSheet, oTable;

			if (!this.oTable) {
				this.oTable = this.byId('travelTable');
			}

			oTable = this.oTable;
			oRowBinding = oTable.getBinding('items');
			aCols = this.createColumnConfig();

			oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level'
				},
				dataSource: oRowBinding,
				fileName: 'Travels.xlsx',
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
		},

        createColumnConfig: function() {
			var aCols = [];

			aCols.push({
				label: 'Travel ID',
				property: 'TravelID',
				type: EdmType.String
			});

            aCols.push({
				label: 'Agency ID',
				property: ['AgencyID', 'AgencyName'],
				type: EdmType.String,
				template: '{1} ({0})'
			});

            aCols.push({
				label: 'Customer ID',
				property: ['CustomerID', 'CustomerName'],
				type: EdmType.String,
				template: '{1} ({0})'
			});

            aCols.push({
                label: 'Starting Date',
				property: 'BeginDate',
				type: EdmType.Date
			});

            aCols.push({
                label: 'End Date',
				property: 'EndDate',
				type: EdmType.Date
			});

            aCols.push({
                label: 'Overall Status',
				property: 'OverallStatusText',
				type: EdmType.String
			});

			aCols.push({
				label: 'Total Price',
				type: EdmType.Number,
				property: 'TotalPrice',
				scale: 2
			});

			return aCols;
		},

        // ----------- Tabellenpersonalisierung -----------

        _registerForP13n: function() {
			var oTable = this.byId("travelTable");

			this.oMetadataHelper = new MetadataHelper([
				{key: "travelid", label: "Travel ID", path: "TravelID", cell: "{TravelID}"},
				{key: "agencyid", label: "Agency ID", path: "AgencyID", cell: "{AgencyName} ({AgencyID})"},
				{key: "customerid", label: "Customer ID", path: "CustomerID", cell: "{CustomerName} ({CustomerID})"},
				{key: "begindate", label: "Starting Date", path: "BeginDate", cell: "{ path: 'BeginDate', type: 'sap.ui.model.odata.type.Date' }"},
				{key: "enddate", label: "End Date", path: "EndDate", cell: "{ path: 'EndDate', type: 'sap.ui.model.odata.type.Date' }"},
				{key: "status", label: "Overall Status", path: "OverallStatusText", cell: "{OverallStatusText}"},
				{key: "totalprice", label: "Total Price", path: "TotalPrice"}
			]);

			Engine.getInstance().register(oTable, {
				helper: this.oMetadataHelper,
				controller: {
					Columns: new SelectionController({
						targetAggregation: "columns",
						control: oTable
					}),
					Sorter: new SortController({
						control: oTable
					}),
					Groups: new GroupController({
						control: oTable
					}),
					ColumnWidth: new ColumnWidthController({
						control: oTable
					})
				}
			});

			Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
		},

		openPersoDialog: function(oEvt) {
			var oTable = this.byId("travelTable");

			Engine.getInstance().show(oTable, ["Columns", "Sorter", "Groups"], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oEvt.getSource()
			});
		},

		_getKey: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
		},

		handleStateChange: function(oEvt) {
			var oTable = this.byId("travelTable");
			var oState = oEvt.getParameter("state");

			if (!oState) {
				return;
			}

			var aSorter = [];

			oState.Groups.forEach(function(oGroup) {
				aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oGroup.key).path, false, true));
			}.bind(this));

			oState.Sorter.forEach(function(oSorter) {
				var oExistingSorter = aSorter.find(function(oSort){
					return oSort.sPath === this.oMetadataHelper.getProperty(oSorter.key).path;
				}.bind(this));

				if (oExistingSorter) {
					oExistingSorter.bDescending = !!oSorter.descending;
				} else {
					aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
				}
			}.bind(this));

			oTable.getColumns().forEach(function(oColumn, iIndex){
				oColumn.setVisible(false);
				oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)]);
				oColumn.setSortIndicator(coreLibrary.SortOrder.None);
				oColumn.data("grouped", false);
			}.bind(this));

			oState.Sorter.forEach(function(oSorter) {
				var oCol = this.byId(oSorter.key);
				if (oSorter.sorted !== false) {
					oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
				}
			}.bind(this));

			oState.Groups.forEach(function(oSorter) {
				var oCol = this.byId(oSorter.key);
				oCol.data("grouped", true);
			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex){
				var oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				oTable.removeColumn(oCol);
				oTable.insertColumn(oCol, iIndex);
			}.bind(this));

			var aCells = oState.Columns.map(function(oColumnState) {
				return new Text({
					text: this.oMetadataHelper.getProperty(oColumnState.key).cell
				});
			}.bind(this));

			oTable.bindItems({
				templateShareable: false,
				path: '/Travel',
				sorter: aSorter,
				template: new ColumnListItem({
                    type: "Navigation",
                    press: this.onListItemPressed.bind(this),
					cells: aCells
				})
			});

		},

		beforeOpenColumnMenu: function(oEvt) {
			var oMenu = this.byId("menu");
			var oColumn = oEvt.getParameter("openBy");
			var oSortItem = oMenu.getQuickActions()[0].getItems()[0];
			var oGroupItem = oMenu.getQuickActions()[1].getItems()[0];

			oSortItem.setKey(this._getKey(oColumn));
			oSortItem.setLabel(oColumn.getHeader().getText());
			oSortItem.setSortOrder(oColumn.getSortIndicator());

			oGroupItem.setKey(this._getKey(oColumn));
			oGroupItem.setLabel(oColumn.getHeader().getText());
			oGroupItem.setGrouped(oColumn.data("grouped"));
		},

		onColumnHeaderItemPress: function(oEvt) {
			var oTable = this.byId("travelTable");

			var oColumnHeaderItem = oEvt.getSource();
			var sPanel = "Columns";
			if (oColumnHeaderItem.getIcon().indexOf("group") >= 0) {
				sPanel = "Groups";
			} else if (oColumnHeaderItem.getIcon().indexOf("sort") >= 0) {
				sPanel = "Sorter";
			}

			Engine.getInstance().show(oTable, [sPanel], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oTable
			});
		},

		onSort: function(oEvt) {
			var oSortItem = oEvt.getParameter("item");
			var oTable = this.byId("travelTable");
			var sAffectedProperty = oSortItem.getKey();
			var sSortOrder = oSortItem.getSortOrder();

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter){
					oSorter.sorted = false;
				});

				if (sSortOrder !== coreLibrary.SortOrder.None) {
					oState.Sorter.push({
						key: sAffectedProperty,
						descending:  sSortOrder === coreLibrary.SortOrder.Descending
					});
				}

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},

		onGroup: function(oEvt) {
			var oGroupItem = oEvt.getParameter("item");
			var oTable = this.byId("travelTable");
			var sAffectedProperty = oGroupItem.getKey();

			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(oTable).then(function(oState){

				//2) Modify the existing personalization state --> clear all groupings before
				oState.Groups.forEach(function(oSorter){
					oSorter.grouped = false;
				});

				if (oGroupItem.getGrouped()) {
					oState.Groups.push({
						key: sAffectedProperty
					});
				}

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(oTable, oState);
			});
		},

		onColumnMove: function(oEvt) {
			var oDraggedColumn = oEvt.getParameter("draggedControl");
			var oDroppedColumn = oEvt.getParameter("droppedControl");

			if (oDraggedColumn === oDroppedColumn) {
				return;
			}

			var oTable = this.byId("travelTable");
			var sDropPosition = oEvt.getParameter("dropPosition");
			var iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
			var iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
			var iNewPos = iDroppedIndex + (sDropPosition == "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
			var sKey = this._getKey(oDraggedColumn);

			Engine.getInstance().retrieveState(oTable).then(function(oState){

				var oCol = oState.Columns.find(function(oColumn) {
					return oColumn.key === sKey;
				}) || {key: sKey};
				oCol.position = iNewPos;

				Engine.getInstance().applyState(oTable, {Columns: [oCol]});
			});
		},

		onColumnResize: function(oEvt) {
			var oColumn = oEvt.getParameter("column");
			var sWidth = oEvt.getParameter("width");
			var oTable = this.byId("travelTable");

			var oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(oTable, {
				ColumnWidth: oColumnState
			});
		}
    });
});