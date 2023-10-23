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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/dataTransfer", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uuid", "vs/editor/browser/dnd", "vs/editor/browser/services/bulkEditService", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration"], function (require, exports, dom_1, async_1, dataTransfer_1, lifecycle_1, mime_1, uuid_1, dnd_1, bulkEditService_1, languageFeatures_1, editorState_1, snippetController2_1, clipboardService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyPasteController = void 0;
    const vscodeClipboardMime = 'application/vnd.code.copyId';
    const defaultPasteEditProvider = new class {
        async provideDocumentPasteEdits(model, selection, dataTransfer, _token) {
            var _a;
            const textDataTransfer = (_a = dataTransfer.get(mime_1.Mimes.text)) !== null && _a !== void 0 ? _a : dataTransfer.get('text');
            if (textDataTransfer) {
                const text = await textDataTransfer.asString();
                return {
                    edits: [{
                            resource: model.uri,
                            edit: { range: selection, text },
                        }]
                };
            }
            return undefined;
        }
    };
    let CopyPasteController = class CopyPasteController extends lifecycle_1.Disposable {
        constructor(editor, _bulkEditService, _clipboardService, _configurationService, _languageFeaturesService) {
            super();
            this._bulkEditService = _bulkEditService;
            this._clipboardService = _clipboardService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._editor = editor;
            const container = editor.getContainerDomNode();
            this._register((0, dom_1.addDisposableListener)(container, 'copy', (e) => {
                var _a;
                if (!e.clipboardData) {
                    return;
                }
                const model = editor.getModel();
                const selection = this._editor.getSelection();
                if (!model || !selection) {
                    return;
                }
                if (!this.arePasteActionsEnabled(model)) {
                    return;
                }
                const providers = this._languageFeaturesService.documentPasteEditProvider.ordered(model).filter(x => !!x.prepareDocumentPaste);
                if (!providers.length) {
                    return;
                }
                const dataTransfer = (0, dnd_1.toVSDataTransfer)(e.clipboardData);
                // Save off a handle pointing to data that VS Code maintains.
                const handle = (0, uuid_1.generateUuid)();
                e.clipboardData.setData(vscodeClipboardMime, handle);
                const promise = (0, async_1.createCancelablePromise)(async (token) => {
                    const results = await Promise.all(providers.map(provider => {
                        return provider.prepareDocumentPaste(model, selection, dataTransfer, token);
                    }));
                    for (const result of results) {
                        result === null || result === void 0 ? void 0 : result.forEach((value, key) => {
                            dataTransfer.replace(key, value);
                        });
                    }
                    return dataTransfer;
                });
                (_a = this._currentClipboardItem) === null || _a === void 0 ? void 0 : _a.dataTransferPromise.cancel();
                this._currentClipboardItem = { handle: handle, dataTransferPromise: promise };
            }));
            this._register((0, dom_1.addDisposableListener)(container, 'paste', async (e) => {
                var _a, _b;
                const selection = this._editor.getSelection();
                if (!e.clipboardData || !selection || !editor.hasModel()) {
                    return;
                }
                const model = editor.getModel();
                if (!this.arePasteActionsEnabled(model)) {
                    return;
                }
                const originalDocVersion = model.getVersionId();
                const providers = this._languageFeaturesService.documentPasteEditProvider.ordered(model);
                if (!providers.length) {
                    return;
                }
                const handle = (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData(vscodeClipboardMime);
                if (typeof handle !== 'string') {
                    return;
                }
                e.preventDefault();
                e.stopImmediatePropagation();
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */);
                try {
                    const dataTransfer = (0, dnd_1.toVSDataTransfer)(e.clipboardData);
                    if (handle && ((_b = this._currentClipboardItem) === null || _b === void 0 ? void 0 : _b.handle) === handle) {
                        const toMergeDataTransfer = await this._currentClipboardItem.dataTransferPromise;
                        toMergeDataTransfer.forEach((value, key) => {
                            dataTransfer.append(key, value);
                        });
                    }
                    if (!dataTransfer.has(mime_1.Mimes.uriList)) {
                        const resources = await this._clipboardService.readResources();
                        if (resources.length) {
                            const value = resources.join('\n');
                            dataTransfer.append(mime_1.Mimes.uriList, (0, dataTransfer_1.createStringDataTransferItem)(value));
                        }
                    }
                    dataTransfer.delete(vscodeClipboardMime);
                    for (const provider of [...providers, defaultPasteEditProvider]) {
                        const edit = await provider.provideDocumentPasteEdits(model, selection, dataTransfer, tokenSource.token);
                        if (originalDocVersion !== model.getVersionId()) {
                            return;
                        }
                        if (edit) {
                            if (edit.edits) {
                                await this._bulkEditService.apply(bulkEditService_1.ResourceEdit.convert(edit), { editor });
                            }
                            else {
                                (0, snippetController2_1.performSnippetEdit)(editor, edit);
                            }
                            return;
                        }
                    }
                }
                finally {
                    tokenSource.dispose();
                }
            }, true));
        }
        static get(editor) {
            return editor.getContribution(CopyPasteController.ID);
        }
        arePasteActionsEnabled(model) {
            return this._configurationService.getValue('editor.experimental.pasteActions.enabled', {
                resource: model.uri
            });
        }
    };
    CopyPasteController.ID = 'editor.contrib.copyPasteActionController';
    CopyPasteController = __decorate([
        __param(1, bulkEditService_1.IBulkEditService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], CopyPasteController);
    exports.CopyPasteController = CopyPasteController;
});
//# sourceMappingURL=copyPasteController.js.map