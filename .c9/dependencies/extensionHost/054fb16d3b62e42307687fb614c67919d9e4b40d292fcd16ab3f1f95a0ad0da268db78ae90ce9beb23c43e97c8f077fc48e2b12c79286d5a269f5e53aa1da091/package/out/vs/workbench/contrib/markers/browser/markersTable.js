/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/network", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/workbench/contrib/markers/browser/markersModel", "vs/platform/markers/common/markers", "vs/platform/severityIcon/common/severityIcon", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/label/common/label", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/platform/opener/browser/link", "vs/platform/opener/common/opener", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/base/browser/event", "vs/workbench/contrib/markers/browser/messages", "vs/base/common/types", "vs/editor/common/core/range"], function (require, exports, nls_1, DOM, network, event_1, lifecycle_1, instantiation_1, listService_1, highlightedLabel_1, markersModel_1, markers_1, severityIcon_1, actionbar_1, label_1, markersFilterOptions_1, link_1, opener_1, markersViewActions_1, event_2, messages_1, types_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersTable = void 0;
    const $ = DOM.$;
    let MarkerSeverityColumnRenderer = class MarkerSeverityColumnRenderer {
        constructor(markersViewModel, instantiationService) {
            this.markersViewModel = markersViewModel;
            this.instantiationService = instantiationService;
            this.templateId = MarkerSeverityColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const severityColumn = DOM.append(container, $('.severity'));
            const icon = DOM.append(severityColumn, $(''));
            const actionBarColumn = DOM.append(container, $('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionBarColumn, {
                actionViewItemProvider: (action) => action.id === markersViewActions_1.QuickFixAction.ID ? this.instantiationService.createInstance(markersViewActions_1.QuickFixActionViewItem, action) : undefined,
                animated: false
            });
            return { actionBar, icon };
        }
        renderElement(element, index, templateData, height) {
            const toggleQuickFix = (enabled) => {
                if (!(0, types_1.isUndefinedOrNull)(enabled)) {
                    const container = DOM.findParentWithClass(templateData.icon, 'monaco-table-td');
                    container.classList.toggle('quickFix', enabled);
                }
            };
            templateData.icon.className = `marker-icon codicon ${severityIcon_1.SeverityIcon.className(markers_1.MarkerSeverity.toSeverity(element.marker.severity))}`;
            templateData.actionBar.clear();
            const viewModel = this.markersViewModel.getViewModel(element);
            if (viewModel) {
                const quickFixAction = viewModel.quickFixAction;
                templateData.actionBar.push([quickFixAction], { icon: true, label: false });
                toggleQuickFix(viewModel.quickFixAction.enabled);
                quickFixAction.onDidChange(({ enabled }) => toggleQuickFix(enabled));
                quickFixAction.onShowQuickFixes(() => {
                    const quickFixActionViewItem = templateData.actionBar.viewItems[0];
                    if (quickFixActionViewItem) {
                        quickFixActionViewItem.showQuickFixes();
                    }
                });
            }
        }
        disposeTemplate(templateData) { }
    };
    MarkerSeverityColumnRenderer.TEMPLATE_ID = 'severity';
    MarkerSeverityColumnRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], MarkerSeverityColumnRenderer);
    let MarkerCodeColumnRenderer = class MarkerCodeColumnRenderer {
        constructor(openerService) {
            this.openerService = openerService;
            this.templateId = MarkerCodeColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const codeColumn = DOM.append(container, $('.code'));
            const sourceLabel = new highlightedLabel_1.HighlightedLabel(codeColumn);
            sourceLabel.element.classList.add('source-label');
            const codeLabel = new highlightedLabel_1.HighlightedLabel(codeColumn);
            codeLabel.element.classList.add('code-label');
            const codeLink = new link_1.Link(codeColumn, { href: '', label: '' }, {}, this.openerService);
            return { codeColumn, sourceLabel, codeLabel, codeLink };
        }
        renderElement(element, index, templateData, height) {
            if (element.marker.source && element.marker.code) {
                templateData.codeColumn.classList.toggle('code-link', typeof element.marker.code !== 'string');
                DOM.show(templateData.codeLabel.element);
                if (typeof element.marker.code === 'string') {
                    templateData.sourceLabel.set(element.marker.source, element.sourceMatches);
                    templateData.codeLabel.set(element.marker.code, element.codeMatches);
                }
                else {
                    templateData.sourceLabel.set(element.marker.source, element.sourceMatches);
                    const codeLinkLabel = new highlightedLabel_1.HighlightedLabel($('.code-link-label'));
                    codeLinkLabel.set(element.marker.code.value, element.codeMatches);
                    templateData.codeLink.link = {
                        href: element.marker.code.target.toString(),
                        title: element.marker.code.target.toString(),
                        label: codeLinkLabel.element,
                    };
                }
            }
            else {
                templateData.sourceLabel.set('-');
                DOM.hide(templateData.codeLabel.element);
            }
        }
        disposeTemplate(templateData) { }
    };
    MarkerCodeColumnRenderer.TEMPLATE_ID = 'code';
    MarkerCodeColumnRenderer = __decorate([
        __param(0, opener_1.IOpenerService)
    ], MarkerCodeColumnRenderer);
    class MarkerMessageColumnRenderer {
        constructor() {
            this.templateId = MarkerMessageColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const fileColumn = DOM.append(container, $('.message'));
            const highlightedLabel = new highlightedLabel_1.HighlightedLabel(fileColumn);
            return { highlightedLabel };
        }
        renderElement(element, index, templateData, height) {
            templateData.highlightedLabel.set(element.marker.message, element.messageMatches);
        }
        disposeTemplate(templateData) { }
    }
    MarkerMessageColumnRenderer.TEMPLATE_ID = 'message';
    let MarkerFileColumnRenderer = class MarkerFileColumnRenderer {
        constructor(labelService) {
            this.labelService = labelService;
            this.templateId = MarkerFileColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const fileColumn = DOM.append(container, $('.file'));
            const fileLabel = new highlightedLabel_1.HighlightedLabel(fileColumn);
            fileLabel.element.classList.add('file-label');
            const positionLabel = new highlightedLabel_1.HighlightedLabel(fileColumn);
            positionLabel.element.classList.add('file-position');
            return { fileLabel, positionLabel };
        }
        renderElement(element, index, templateData, height) {
            templateData.fileLabel.set(this.labelService.getUriLabel(element.marker.resource, { relative: true }), element.fileMatches);
            templateData.positionLabel.set(messages_1.default.MARKERS_PANEL_AT_LINE_COL_NUMBER(element.marker.startLineNumber, element.marker.startColumn), undefined);
        }
        disposeTemplate(templateData) { }
    };
    MarkerFileColumnRenderer.TEMPLATE_ID = 'file';
    MarkerFileColumnRenderer = __decorate([
        __param(0, label_1.ILabelService)
    ], MarkerFileColumnRenderer);
    class MarkerOwnerColumnRenderer {
        constructor() {
            this.templateId = MarkerOwnerColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const fileColumn = DOM.append(container, $('.owner'));
            const highlightedLabel = new highlightedLabel_1.HighlightedLabel(fileColumn);
            return { highlightedLabel };
        }
        renderElement(element, index, templateData, height) {
            templateData.highlightedLabel.set(element.marker.owner, element.ownerMatches);
        }
        disposeTemplate(templateData) { }
    }
    MarkerOwnerColumnRenderer.TEMPLATE_ID = 'owner';
    class MarkersTableVirtualDelegate {
        constructor() {
            this.headerRowHeight = MarkersTableVirtualDelegate.HEADER_ROW_HEIGHT;
        }
        getHeight(item) {
            return MarkersTableVirtualDelegate.ROW_HEIGHT;
        }
    }
    MarkersTableVirtualDelegate.HEADER_ROW_HEIGHT = 24;
    MarkersTableVirtualDelegate.ROW_HEIGHT = 24;
    let MarkersTable = class MarkersTable extends lifecycle_1.Disposable {
        constructor(container, markersViewModel, resourceMarkers, filterOptions, options, instantiationService, labelService) {
            super();
            this.container = container;
            this.markersViewModel = markersViewModel;
            this.resourceMarkers = resourceMarkers;
            this.filterOptions = filterOptions;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this._itemCount = 0;
            this.table = this.instantiationService.createInstance(listService_1.WorkbenchTable, 'Markers', this.container, new MarkersTableVirtualDelegate(), [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: 36,
                    maximumWidth: 36,
                    templateId: MarkerSeverityColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('codeColumnLabel', "Code"),
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 100,
                    maximumWidth: 200,
                    templateId: MarkerCodeColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('messageColumnLabel', "Message"),
                    tooltip: '',
                    weight: 4,
                    templateId: MarkerMessageColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('fileColumnLabel', "File"),
                    tooltip: '',
                    weight: 2,
                    templateId: MarkerFileColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('sourceColumnLabel', "Source"),
                    tooltip: '',
                    weight: 1,
                    minimumWidth: 100,
                    maximumWidth: 200,
                    templateId: MarkerOwnerColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                }
            ], [
                this.instantiationService.createInstance(MarkerSeverityColumnRenderer, this.markersViewModel),
                this.instantiationService.createInstance(MarkerCodeColumnRenderer),
                this.instantiationService.createInstance(MarkerMessageColumnRenderer),
                this.instantiationService.createInstance(MarkerFileColumnRenderer),
                this.instantiationService.createInstance(MarkerOwnerColumnRenderer),
            ], options);
            const list = this.table.domNode.querySelector('.monaco-list-rows');
            // mouseover/mouseleave event handlers
            const onRowHover = event_1.Event.chain(this._register(new event_2.DomEmitter(list, 'mouseover')).event)
                .map(e => DOM.findParentWithClass(e.target, 'monaco-list-row', 'monaco-list-rows'))
                .filter(((e) => !!e))
                .map(e => parseInt(e.getAttribute('data-index')))
                .event;
            const onListLeave = event_1.Event.map(this._register(new event_2.DomEmitter(list, 'mouseleave')).event, () => -1);
            const onRowHoverOrLeave = event_1.Event.latch(event_1.Event.any(onRowHover, onListLeave));
            const onRowPermanentHover = event_1.Event.debounce(onRowHoverOrLeave, (_, e) => e, 500);
            this._register(onRowPermanentHover(e => {
                if (e !== -1 && this.table.row(e)) {
                    this.markersViewModel.onMarkerMouseHover(this.table.row(e));
                }
            }));
        }
        get contextKeyService() {
            return this.table.contextKeyService;
        }
        get onContextMenu() {
            return this.table.onContextMenu;
        }
        get onDidOpen() {
            return this.table.onDidOpen;
        }
        get onDidChangeFocus() {
            return this.table.onDidChangeFocus;
        }
        get onDidChangeSelection() {
            return this.table.onDidChangeSelection;
        }
        collapseMarkers() { }
        domFocus() {
            this.table.domFocus();
        }
        filterMarkers(resourceMarkers, filterOptions) {
            this.filterOptions = filterOptions;
            this.reset(resourceMarkers);
        }
        getFocus() {
            const focus = this.table.getFocus();
            return focus.length > 0 ? [this.table.row(focus[0])] : [];
        }
        getHTMLElement() {
            return this.table.getHTMLElement();
        }
        getRelativeTop(marker) {
            return marker ? this.table.getRelativeTop(this.table.indexOf(marker)) : null;
        }
        getSelection() {
            const selection = this.table.getSelection();
            return selection.length > 0 ? [this.table.row(selection[0])] : [];
        }
        getVisibleItemCount() {
            return this._itemCount;
        }
        isVisible() {
            return !this.container.classList.contains('hidden');
        }
        layout(height, width) {
            this.table.layout(height, width);
        }
        reset(resourceMarkers) {
            var _a, _b, _c, _d, _e;
            this.resourceMarkers = resourceMarkers;
            const items = [];
            for (const resourceMarker of this.resourceMarkers) {
                for (const marker of resourceMarker.markers) {
                    if (marker.resource.scheme === network.Schemas.walkThrough || marker.resource.scheme === network.Schemas.walkThroughSnippet) {
                        continue;
                    }
                    // Exclude pattern
                    if (this.filterOptions.excludesMatcher.matches(marker.resource)) {
                        continue;
                    }
                    // Include pattern
                    if (this.filterOptions.includesMatcher.matches(marker.resource)) {
                        items.push(new markersModel_1.MarkerTableItem(marker));
                        continue;
                    }
                    // Severity filter
                    const matchesSeverity = this.filterOptions.showErrors && markers_1.MarkerSeverity.Error === marker.marker.severity ||
                        this.filterOptions.showWarnings && markers_1.MarkerSeverity.Warning === marker.marker.severity ||
                        this.filterOptions.showInfos && markers_1.MarkerSeverity.Info === marker.marker.severity;
                    if (!matchesSeverity) {
                        continue;
                    }
                    // Text filter
                    if (this.filterOptions.textFilter.text) {
                        const sourceMatches = marker.marker.source ? (_a = markersFilterOptions_1.FilterOptions._filter(this.filterOptions.textFilter.text, marker.marker.source)) !== null && _a !== void 0 ? _a : undefined : undefined;
                        const codeMatches = marker.marker.code ? (_b = markersFilterOptions_1.FilterOptions._filter(this.filterOptions.textFilter.text, typeof marker.marker.code === 'string' ? marker.marker.code : marker.marker.code.value)) !== null && _b !== void 0 ? _b : undefined : undefined;
                        const messageMatches = (_c = markersFilterOptions_1.FilterOptions._messageFilter(this.filterOptions.textFilter.text, marker.marker.message)) !== null && _c !== void 0 ? _c : undefined;
                        const fileMatches = (_d = markersFilterOptions_1.FilterOptions._messageFilter(this.filterOptions.textFilter.text, this.labelService.getUriLabel(marker.resource, { relative: true }))) !== null && _d !== void 0 ? _d : undefined;
                        const ownerMatches = (_e = markersFilterOptions_1.FilterOptions._messageFilter(this.filterOptions.textFilter.text, marker.marker.owner)) !== null && _e !== void 0 ? _e : undefined;
                        const matched = sourceMatches || codeMatches || messageMatches || fileMatches || ownerMatches;
                        if ((matched && !this.filterOptions.textFilter.negate) || (!matched && this.filterOptions.textFilter.negate)) {
                            items.push(new markersModel_1.MarkerTableItem(marker, sourceMatches, codeMatches, messageMatches, fileMatches, ownerMatches));
                        }
                        continue;
                    }
                    items.push(new markersModel_1.MarkerTableItem(marker));
                }
            }
            this._itemCount = items.length;
            this.table.splice(0, Number.POSITIVE_INFINITY, items.sort((a, b) => {
                let result = markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity);
                if (result === 0) {
                    result = (0, markersModel_1.compareMarkersByUri)(a.marker, b.marker);
                }
                if (result === 0) {
                    result = range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
                }
                return result;
            }));
        }
        revealMarkers(activeResource, focus, lastSelectedRelativeTop) {
            if (activeResource) {
                const activeResourceIndex = this.resourceMarkers.indexOf(activeResource);
                if (activeResourceIndex !== -1) {
                    if (this.hasSelectedMarkerFor(activeResource)) {
                        const tableSelection = this.table.getSelection();
                        this.table.reveal(tableSelection[0], lastSelectedRelativeTop);
                        if (focus) {
                            this.table.setFocus(tableSelection);
                        }
                    }
                    else {
                        this.table.reveal(activeResourceIndex, 0);
                        if (focus) {
                            this.table.setFocus([activeResourceIndex]);
                            this.table.setSelection([activeResourceIndex]);
                        }
                    }
                }
            }
            else if (focus) {
                this.table.setSelection([]);
                this.table.focusFirst();
            }
        }
        setAriaLabel(label) {
            this.table.domNode.ariaLabel = label;
        }
        setMarkerSelection(marker) {
            if (this.isVisible()) {
                if (marker) {
                    const index = this.findMarkerIndex(marker);
                    if (index !== -1) {
                        this.table.setFocus([index]);
                        this.table.setSelection([index]);
                    }
                }
                else if (this.getSelection().length === 0 && this.getVisibleItemCount() > 0) {
                    this.table.setFocus([0]);
                    this.table.setSelection([0]);
                }
            }
        }
        toggleVisibility(hide) {
            this.container.classList.toggle('hidden', hide);
        }
        update(resourceMarkers) {
            for (const resourceMarker of resourceMarkers) {
                const index = this.resourceMarkers.indexOf(resourceMarker);
                this.resourceMarkers.splice(index, 1, resourceMarker);
            }
            this.reset(this.resourceMarkers);
        }
        updateMarker(marker) {
            this.table.rerender();
        }
        findMarkerIndex(marker) {
            for (let index = 0; index < this.table.length; index++) {
                if (this.table.row(index).marker === marker.marker) {
                    return index;
                }
            }
            return -1;
        }
        hasSelectedMarkerFor(resource) {
            let selectedElement = this.getSelection();
            if (selectedElement && selectedElement.length > 0) {
                if (selectedElement[0] instanceof markersModel_1.Marker) {
                    if (resource.has(selectedElement[0].marker.resource)) {
                        return true;
                    }
                }
            }
            return false;
        }
    };
    MarkersTable = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, label_1.ILabelService)
    ], MarkersTable);
    exports.MarkersTable = MarkersTable;
});
//# sourceMappingURL=markersTable.js.map