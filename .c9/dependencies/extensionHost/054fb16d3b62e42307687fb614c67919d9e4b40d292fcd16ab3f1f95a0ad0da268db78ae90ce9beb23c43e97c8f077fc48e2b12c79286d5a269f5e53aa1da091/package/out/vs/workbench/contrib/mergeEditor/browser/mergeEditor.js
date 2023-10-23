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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/grid/grid", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/splitview/splitview", "vs/base/browser/ui/toggle/toggle", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/core/range", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/codeeditor", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/audioCues/browser/observable", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/contrib/mergeEditor/browser/model", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "./editorGutter", "vs/css!./media/mergeEditor"], function (require, exports, dom_1, grid_1, iconLabel_1, splitview_1, toggle_1, arrays_1, codicons_1, color_1, errors_1, event_1, lifecycle_1, objects_1, strings_1, editorBrowser_1, codeEditorWidget_1, range_1, textResourceConfiguration_1, nls_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1, label_1, storage_1, telemetry_1, themeService_1, codeeditor_1, editorPane_1, observable_1, mergeEditorInput_1, model_1, utils_1, settingsEditorColorRegistry_1, editorGutter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditor = exports.ctxUsesColumnLayout = exports.ctxIsMergeEditor = void 0;
    exports.ctxIsMergeEditor = new contextkey_1.RawContextKey('isMergeEditor', false);
    exports.ctxUsesColumnLayout = new contextkey_1.RawContextKey('mergeEditorUsesColumnLayout', false);
    let MergeEditor = class MergeEditor extends editorPane_1.EditorPane {
        constructor(instantiation, _labelService, _menuService, _contextKeyService, telemetryService, storageService, themeService, textResourceConfigurationService) {
            super(MergeEditor.ID, telemetryService, themeService, storageService);
            this.instantiation = instantiation;
            this._labelService = _labelService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this.input1View = this.instantiation.createInstance(InputCodeEditorView, 1, { readonly: true });
            this.input2View = this.instantiation.createInstance(InputCodeEditorView, 2, { readonly: true });
            this.inputResultView = this.instantiation.createInstance(ResultCodeEditorView, { readonly: false });
            // --- layout
            this._usesColumnLayout = false;
            this._ctxIsMergeEditor = exports.ctxIsMergeEditor.bindTo(_contextKeyService);
            this._ctxUsesColumnLayout = exports.ctxUsesColumnLayout.bindTo(_contextKeyService);
            const reentrancyBarrier = new utils_1.ReentrancyBarrier();
            const input1ResultMapping = (0, observable_1.derivedObservable)('input1ResultMapping', reader => {
                const model = this.input1View.model.read(reader);
                if (!model) {
                    return undefined;
                }
                const resultDiffs = model.resultDiffs.read(reader);
                const modifiedBaseRanges = model_1.ModifiedBaseRange.fromDiffs(model.base, model.input1, model.input1LinesDiffs, model.result, resultDiffs);
                return modifiedBaseRanges;
            });
            const input2ResultMapping = (0, observable_1.derivedObservable)('input2ResultMapping', reader => {
                const model = this.input2View.model.read(reader);
                if (!model) {
                    return undefined;
                }
                const resultDiffs = model.resultDiffs.read(reader);
                const modifiedBaseRanges = model_1.ModifiedBaseRange.fromDiffs(model.base, model.input2, model.input2LinesDiffs, model.result, resultDiffs);
                return modifiedBaseRanges;
            });
            this._register((0, observable_1.keepAlive)(input1ResultMapping));
            this._register((0, observable_1.keepAlive)(input2ResultMapping));
            this._store.add(this.input1View.editor.onDidScrollChange(reentrancyBarrier.makeExclusive((c) => {
                if (c.scrollTopChanged) {
                    const mapping = input1ResultMapping.get();
                    synchronizeScrolling(this.input1View.editor, this.inputResultView.editor, mapping, 1);
                    this.input2View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                }
            })));
            this._store.add(this.input2View.editor.onDidScrollChange(reentrancyBarrier.makeExclusive((c) => {
                if (c.scrollTopChanged) {
                    const mapping = input2ResultMapping.get();
                    synchronizeScrolling(this.input2View.editor, this.inputResultView.editor, mapping, 1);
                    this.input1View.editor.setScrollTop(c.scrollTop, 1 /* ScrollType.Immediate */);
                }
            })));
            this._store.add(this.inputResultView.editor.onDidScrollChange(reentrancyBarrier.makeExclusive((c) => {
                if (c.scrollTopChanged) {
                    const mapping1 = input1ResultMapping.get();
                    synchronizeScrolling(this.inputResultView.editor, this.input1View.editor, mapping1, 2);
                    const mapping2 = input2ResultMapping.get();
                    synchronizeScrolling(this.inputResultView.editor, this.input2View.editor, mapping2, 2);
                }
            })));
            // TODO@jrieken make this proper: add menu id and allow extensions to contribute
            const toolbarMenu = this._menuService.createMenu(actions_1.MenuId.MergeToolbar, this._contextKeyService);
            const toolbarMenuDisposables = new lifecycle_1.DisposableStore();
            const toolbarMenuRender = () => {
                toolbarMenuDisposables.clear();
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(toolbarMenu, { renderShortTitle: true, shouldForwardArgs: true }, actions);
                if (actions.length > 0) {
                    const [first] = actions;
                    const acceptBtn = this.instantiation.createInstance(codeeditor_1.FloatingClickWidget, this.inputResultView.editor, first.label, first.id);
                    toolbarMenuDisposables.add(acceptBtn.onClick(() => { var _a; return first.run((_a = this.inputResultView.editor.getModel()) === null || _a === void 0 ? void 0 : _a.uri); }));
                    toolbarMenuDisposables.add(acceptBtn);
                    acceptBtn.render();
                }
            };
            this._store.add(toolbarMenu);
            this._store.add(toolbarMenuDisposables);
            this._store.add(toolbarMenu.onDidChange(toolbarMenuRender));
            toolbarMenuRender();
        }
        get model() { return this._model; }
        dispose() {
            this._sessionDisposables.dispose();
            this._ctxIsMergeEditor.reset();
            super.dispose();
        }
        // TODO use this method & make it private
        getEditorOptions(resource) {
            return (0, objects_1.deepClone)(this.textResourceConfigurationService.getValue(resource));
        }
        createEditor(parent) {
            var _a;
            parent.classList.add('merge-editor');
            this._grid = grid_1.SerializableGrid.from({
                orientation: 0 /* Orientation.VERTICAL */,
                size: 100,
                groups: [
                    {
                        size: 38,
                        groups: [{
                                data: this.input1View.view
                            }, {
                                data: this.input2View.view
                            }]
                    },
                    {
                        size: 62,
                        data: this.inputResultView.view
                    },
                ]
            }, {
                styles: { separatorBorder: (_a = this.theme.getColor(settingsEditorColorRegistry_1.settingsSashBorder)) !== null && _a !== void 0 ? _a : color_1.Color.transparent },
                proportionalLayout: true
            });
            (0, dom_1.reset)(parent, this._grid.element);
            this._ctxUsesColumnLayout.set(false);
        }
        layout(dimension) {
            this._grid.layout(dimension.width, dimension.height);
        }
        async setInput(input, options, context, token) {
            if (!(input instanceof mergeEditorInput_1.MergeEditorInput)) {
                throw new errors_1.BugIndicatingError('ONLY MergeEditorInput is supported');
            }
            await super.setInput(input, options, context, token);
            this._sessionDisposables.clear();
            const model = await input.resolve();
            this._model = model;
            this.input1View.setModel(model, model.input1, (0, nls_1.localize)('yours', 'Yours'), model.input1Detail, model.input1Description);
            this.input2View.setModel(model, model.input2, (0, nls_1.localize)('theirs', 'Theirs'), model.input2Detail, model.input2Description);
            this.inputResultView.setModel(model, model.result, (0, nls_1.localize)('result', 'Result'), this._labelService.getUriLabel(model.result.uri, { relative: true }), undefined);
            // TODO: Update editor options!
            const input1ViewZoneIds = [];
            const input2ViewZoneIds = [];
            for (const m of model.modifiedBaseRanges) {
                const max = Math.max(m.input1Range.lineCount, m.input2Range.lineCount, 1);
                this.input1View.editor.changeViewZones(a => {
                    input1ViewZoneIds.push(a.addZone({
                        afterLineNumber: m.input1Range.endLineNumberExclusive - 1,
                        heightInLines: max - m.input1Range.lineCount,
                        domNode: (0, dom_1.$)('div.diagonal-fill'),
                    }));
                });
                this.input2View.editor.changeViewZones(a => {
                    input2ViewZoneIds.push(a.addZone({
                        afterLineNumber: m.input2Range.endLineNumberExclusive - 1,
                        heightInLines: max - m.input2Range.lineCount,
                        domNode: (0, dom_1.$)('div.diagonal-fill'),
                    }));
                });
            }
            this._sessionDisposables.add({
                dispose: () => {
                    this.input1View.editor.changeViewZones(a => {
                        for (const zone of input1ViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                    this.input2View.editor.changeViewZones(a => {
                        for (const zone of input2ViewZoneIds) {
                            a.removeZone(zone);
                        }
                    });
                }
            });
        }
        setEditorVisible(visible) {
            this._ctxIsMergeEditor.set(visible);
        }
        // ---- interact with "outside world" via `getControl`, `scopedContextKeyService`
        getControl() {
            for (const view of [this.input1View, this.input2View, this.inputResultView]) {
                if (view.editor.hasWidgetFocus()) {
                    return view.editor;
                }
            }
            return undefined;
        }
        get scopedContextKeyService() {
            const control = this.getControl();
            return (0, editorBrowser_1.isCodeEditor)(control)
                ? control.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService))
                : undefined;
        }
        toggleLayout() {
            if (!this._usesColumnLayout) {
                this._grid.moveView(this.inputResultView.view, splitview_1.Sizing.Distribute, this.input1View.view, 3 /* Direction.Right */);
            }
            else {
                this._grid.moveView(this.inputResultView.view, this._grid.height * .62, this.input1View.view, 1 /* Direction.Down */);
                this._grid.moveView(this.input2View.view, splitview_1.Sizing.Distribute, this.input1View.view, 3 /* Direction.Right */);
            }
            this._usesColumnLayout = !this._usesColumnLayout;
            this._ctxUsesColumnLayout.set(this._usesColumnLayout);
        }
    };
    MergeEditor.ID = 'mergeEditor';
    MergeEditor = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, label_1.ILabelService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, storage_1.IStorageService),
        __param(6, themeService_1.IThemeService),
        __param(7, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], MergeEditor);
    exports.MergeEditor = MergeEditor;
    function synchronizeScrolling(scrollingEditor, targetEditor, mapping, sourceNumber) {
        if (!mapping) {
            return;
        }
        const visibleRanges = scrollingEditor.getVisibleRanges();
        if (visibleRanges.length === 0) {
            return;
        }
        const topLineNumber = visibleRanges[0].startLineNumber - 1;
        const firstBefore = (0, arrays_1.findLast)(mapping, r => r.getInputRange(sourceNumber).startLineNumber <= topLineNumber);
        let sourceRange;
        let targetRange;
        const targetNumber = sourceNumber === 1 ? 2 : 1;
        const firstBeforeSourceRange = firstBefore === null || firstBefore === void 0 ? void 0 : firstBefore.getInputRange(sourceNumber);
        const firstBeforeTargetRange = firstBefore === null || firstBefore === void 0 ? void 0 : firstBefore.getInputRange(targetNumber);
        if (firstBeforeSourceRange && firstBeforeSourceRange.contains(topLineNumber)) {
            sourceRange = firstBeforeSourceRange;
            targetRange = firstBeforeTargetRange;
        }
        else if (firstBeforeSourceRange && firstBeforeSourceRange.isEmpty && firstBeforeSourceRange.startLineNumber === topLineNumber) {
            sourceRange = firstBeforeSourceRange.deltaEnd(1);
            targetRange = firstBeforeTargetRange.deltaEnd(1);
        }
        else {
            const delta = firstBeforeSourceRange ? firstBeforeTargetRange.endLineNumberExclusive - firstBeforeSourceRange.endLineNumberExclusive : 0;
            sourceRange = new model_1.LineRange(topLineNumber, 1);
            targetRange = new model_1.LineRange(topLineNumber + delta, 1);
        }
        // sourceRange contains topLineNumber!
        const resultStartTopPx = targetEditor.getTopForLineNumber(targetRange.startLineNumber);
        const resultEndPx = targetEditor.getTopForLineNumber(targetRange.endLineNumberExclusive);
        const sourceStartTopPx = scrollingEditor.getTopForLineNumber(sourceRange.startLineNumber);
        const sourceEndPx = scrollingEditor.getTopForLineNumber(sourceRange.endLineNumberExclusive);
        const factor = Math.min((scrollingEditor.getScrollTop() - sourceStartTopPx) / (sourceEndPx - sourceStartTopPx), 1);
        const resultScrollPosition = resultStartTopPx + (resultEndPx - resultStartTopPx) * factor;
        /*
            console.log({
                topLineNumber,
                sourceRange: sourceRange.toString(),
                targetRange: targetRange.toString(),
                // resultStartTopPx,
                // resultEndPx,
                // sourceStartTopPx,
                // sourceEndPx,
                factor,
                resultScrollPosition,
                top: scrollingEditor.getScrollTop(),
            });*/
        targetEditor.setScrollTop(resultScrollPosition, 1 /* ScrollType.Immediate */);
    }
    let CodeEditorView = class CodeEditorView extends lifecycle_1.Disposable {
        constructor(_options, instantiationService) {
            super();
            this._options = _options;
            this.instantiationService = instantiationService;
            this._model = new observable_1.ObservableValue(undefined, 'model');
            this.model = this._model;
            this.htmlElements = (0, utils_1.n)('div.code-view', [
                (0, utils_1.n)('div.title', { $: 'title' }),
                (0, utils_1.n)('div.container', [
                    (0, utils_1.n)('div.gutter', { $: 'gutterDiv' }),
                    (0, utils_1.n)('div', { $: 'editor' }),
                ]),
            ]);
            this._onDidViewChange = new event_1.Emitter();
            this.view = {
                element: this.htmlElements.root,
                minimumWidth: 10,
                maximumWidth: Number.MAX_SAFE_INTEGER,
                minimumHeight: 10,
                maximumHeight: Number.MAX_SAFE_INTEGER,
                onDidChange: this._onDidViewChange.event,
                layout: (width, height, top, left) => {
                    (0, utils_1.setStyle)(this.htmlElements.root, { width, height, top, left });
                    this.editor.layout({
                        width: width - this.htmlElements.gutterDiv.clientWidth,
                        height: height - this.htmlElements.title.clientHeight,
                    });
                }
                // preferredWidth?: number | undefined;
                // preferredHeight?: number | undefined;
                // priority?: LayoutPriority | undefined;
                // snap?: boolean | undefined;
            };
            this._title = new iconLabel_1.IconLabel(this.htmlElements.title, { supportIcons: true });
            this._detail = new iconLabel_1.IconLabel(this.htmlElements.title, { supportIcons: true });
            this.editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.htmlElements.editor, {
                minimap: { enabled: false },
                readOnly: this._options.readonly,
                glyphMargin: false,
                lineNumbersMinChars: 2,
            }, { contributions: [] });
        }
        setModel(model, textModel, title, description, detail) {
            this.editor.setModel(textModel);
            this._title.setLabel(title, description);
            this._detail.setLabel('', detail);
            this._model.set(model, undefined);
        }
    };
    CodeEditorView = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CodeEditorView);
    let InputCodeEditorView = class InputCodeEditorView extends CodeEditorView {
        constructor(inputNumber, options, instantiationService) {
            super(options, instantiationService);
            this.inputNumber = inputNumber;
            this.decorations = (0, observable_1.derivedObservable)('decorations', reader => {
                const model = this.model.read(reader);
                if (!model) {
                    return [];
                }
                const result = new Array();
                for (const m of model.modifiedBaseRanges) {
                    const range = m.getInputRange(this.inputNumber);
                    if (!range.isEmpty) {
                        result.push({
                            range: new range_1.Range(range.startLineNumber, 1, range.endLineNumberExclusive - 1, 1),
                            options: {
                                isWholeLine: true,
                                className: 'merge-base-range-projection',
                                description: 'Base Range Projection'
                            }
                        });
                    }
                }
                return result;
            });
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
            this._register(new editorGutter_1.EditorGutter(this.editor, this.htmlElements.gutterDiv, {
                getIntersectingGutterItems: (range, reader) => {
                    const model = this.model.read(reader);
                    if (!model) {
                        return [];
                    }
                    return model.modifiedBaseRanges
                        .filter((r) => r.getInputDiffs(this.inputNumber).length > 0)
                        .map((baseRange, idx) => ({
                        id: idx.toString(),
                        additionalHeightInPx: 0,
                        offsetInPx: 0,
                        range: baseRange.getInputRange(this.inputNumber),
                        toggleState: (0, observable_1.derivedObservable)('toggle', (reader) => model
                            .getState(baseRange)
                            .read(reader)
                            .getInput(this.inputNumber)),
                        setState: (value, tx) => model.setState(baseRange, model
                            .getState(baseRange)
                            .get()
                            .withInputValue(this.inputNumber, value), tx),
                    }));
                },
                createView: (item, target) => new MergeConflictGutterItemView(item, target),
            }));
        }
    };
    InputCodeEditorView = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], InputCodeEditorView);
    class MergeConflictGutterItemView extends lifecycle_1.Disposable {
        constructor(item, target) {
            super();
            this.item = item;
            this.target = target;
            target.classList.add('merge-accept-gutter-marker');
            // TODO: localized title
            const checkBox = new toggle_1.Toggle({ isChecked: false, title: 'Accept Merge', icon: codicons_1.Codicon.check });
            checkBox.domNode.classList.add('accept-conflict-group');
            this._register((0, observable_1.autorun)((reader) => {
                const value = this.item.toggleState.read(reader);
                checkBox.setIcon(value === true
                    ? codicons_1.Codicon.check
                    : value === false
                        ? undefined
                        : codicons_1.Codicon.circleFilled);
                checkBox.checked = value === true;
            }, 'Update Toggle State'));
            this._register(checkBox.onChange(() => {
                this.item.setState(checkBox.checked, undefined);
            }));
            target.appendChild((0, utils_1.n)('div.background', [strings_1.noBreakWhitespace]).root);
            target.appendChild((0, utils_1.n)('div.checkbox', [(0, utils_1.n)('div.checkbox-background', [checkBox.domNode])]).root);
        }
        layout(top, height, viewTop, viewHeight) {
            this.target.classList.remove('multi-line');
            this.target.classList.remove('single-line');
            this.target.classList.add(height > 30 ? 'multi-line' : 'single-line');
        }
        update(baseRange) {
            this.item = baseRange;
        }
    }
    let ResultCodeEditorView = class ResultCodeEditorView extends CodeEditorView {
        constructor(options, instantiationService) {
            super(options, instantiationService);
            this.decorations = (0, observable_1.derivedObservable)('decorations', reader => {
                const model = this.model.read(reader);
                if (!model) {
                    return [];
                }
                const result = new Array();
                for (const m of model.resultDiffs.read(reader)) {
                    const range = m.modifiedRange;
                    if (!range.isEmpty) {
                        result.push({
                            range: new range_1.Range(range.startLineNumber, 1, range.endLineNumberExclusive - 1, 1),
                            options: {
                                isWholeLine: true,
                                // TODO
                                className: 'merge-base-range-projection',
                                description: 'Result Diff'
                            }
                        });
                    }
                }
                return result;
            });
            this._register((0, utils_1.applyObservableDecorations)(this.editor, this.decorations));
        }
    };
    ResultCodeEditorView = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ResultCodeEditorView);
});
//# sourceMappingURL=mergeEditor.js.map