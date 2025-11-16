"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.extensibility.ISelectionId;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;


export class Visual implements IVisual {
    private target: HTMLElement;
    private dropdown: HTMLSelectElement;
    private selectionManager: ISelectionManager;
    private host: IVisualHost;
    private firstUpdateDone: boolean;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.dropdown = document.createElement("select");
        this.target.appendChild(this.dropdown);
        this.selectionManager = options.host.createSelectionManager();
        this.host = options.host;
        this.firstUpdateDone = false;

    }

    public update(options: VisualUpdateOptions) {
        const dataView = options.dataViews[0]
        const categoryColumn = dataView.categorical.categories[0];
        const categories = categoryColumn.values;

        // Limpia opciones previas
        while (this.dropdown.firstChild) {
          this.dropdown.removeChild(this.dropdown.firstChild);
        }

        categories.forEach((cat: any, idx:number) => {
            const opt = document.createElement("option");
            opt.text = cat.toString();
            opt.value = idx.toString();
            this.dropdown.add(opt); 
        });

        // Ejecutar lógica solo en la primera carga
        if (this.firstUpdateDone === false && categories.length > 0) {
            
            this.firstUpdateDone = true;

            let maxIndex = 0;
            let maxValue = categories[0];
            for (let i = 1; i < categories.length; i++) {
                if (categories[i] > maxValue) {
                    maxValue = categories[i];
                    maxIndex = i;
                }
            }

            // Selecciona automáticamente la primera categoría
            const selectionId: ISelectionId = this.host.createSelectionIdBuilder()
                .withCategory(categoryColumn, maxIndex)
                .createSelectionId();

            this.selectionManager.select(selectionId).then(() => {
                this.dropdown.value = maxIndex.toString(); // reflejar selección en el dropdown
            });
        }

        // Selección única
        this.dropdown.onchange = () => {
            const selectedIndex = parseInt(this.dropdown.value, 10);
            const selectionId: ISelectionId = this.host.createSelectionIdBuilder()
            .withCategory(categoryColumn, selectedIndex)
            .createSelectionId();

            this.selectionManager.select([selectionId], true).then(() => {
                console.log("Filtro aplicado:", categories[selectedIndex]);
            });
        };

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}