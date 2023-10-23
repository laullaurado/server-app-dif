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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/dataTransfer", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/dnd", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/configuration/common/configuration", "vs/platform/dnd/browser/dnd", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace"], function (require, exports, arrays_1, dataTransfer_1, lifecycle_1, mime_1, resources_1, uri_1, dnd_1, editorExtensions_1, range_1, languageFeatures_1, editorState_1, snippetController2_1, configuration_1, dnd_2, instantiation_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropIntoEditorController = void 0;
    let DropIntoEditorController = class DropIntoEditorController extends lifecycle_1.Disposable {
        constructor(editor, workspaceContextService, _instantiationService, _languageFeaturesService, _configurationService) {
            super();
            this._instantiationService = _instantiationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._configurationService = _configurationService;
            this._register(editor.onDropIntoEditor(e => this.onDropIntoEditor(editor, e.position, e.event)));
            this._languageFeaturesService.documentOnDropEditProvider.register('*', new DefaultOnDropProvider(workspaceContextService));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.experimental.editor.dropIntoEditor.enabled')) {
                    this.updateEditorOptions(editor);
                }
            }));
            this.updateEditorOptions(editor);
        }
        updateEditorOptions(editor) {
            editor.updateOptions({
                enableDropIntoEditor: this._configurationService.getValue('workbench.experimental.editor.dropIntoEditor.enabled')
            });
        }
        async onDropIntoEditor(editor, position, dragEvent) {
            if (!dragEvent.dataTransfer || !editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            const modelVersionNow = model.getVersionId();
            const ourDataTransfer = await this.extractDataTransferData(dragEvent);
            if (ourDataTransfer.size === 0) {
                return;
            }
            if (editor.getModel().getVersionId() !== modelVersionNow) {
                return;
            }
            const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */);
            try {
                const providers = this._languageFeaturesService.documentOnDropEditProvider.ordered(model);
                for (const provider of providers) {
                    const edit = await provider.provideDocumentOnDropEdits(model, position, ourDataTransfer, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested || editor.getModel().getVersionId() !== modelVersionNow) {
                        return;
                    }
                    if (edit) {
                        (0, snippetController2_1.performSnippetEdit)(editor, edit);
                        return;
                    }
                }
            }
            finally {
                tokenSource.dispose();
            }
        }
        async extractDataTransferData(dragEvent) {
            if (!dragEvent.dataTransfer) {
                return new dataTransfer_1.VSDataTransfer();
            }
            const textEditorDataTransfer = (0, dnd_1.toVSDataTransfer)(dragEvent.dataTransfer);
            const editorData = (await this._instantiationService.invokeFunction(dnd_2.extractEditorsDropData, dragEvent))
                .filter(input => input.resource)
                .map(input => input.resource.toString());
            if (editorData.length) {
                const str = (0, arrays_1.distinct)(editorData).join('\n');
                textEditorDataTransfer.replace(mime_1.Mimes.uriList, (0, dataTransfer_1.createStringDataTransferItem)(str));
            }
            return textEditorDataTransfer;
        }
    };
    DropIntoEditorController.ID = 'editor.contrib.dropIntoEditorController';
    DropIntoEditorController = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, configuration_1.IConfigurationService)
    ], DropIntoEditorController);
    exports.DropIntoEditorController = DropIntoEditorController;
    let DefaultOnDropProvider = class DefaultOnDropProvider {
        constructor(_workspaceContextService) {
            this._workspaceContextService = _workspaceContextService;
        }
        async provideDocumentOnDropEdits(model, position, dataTransfer, _token) {
            var _a;
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const urlListEntry = dataTransfer.get('text/uri-list');
            if (urlListEntry) {
                const urlList = await urlListEntry.asString();
                return this.doUriListDrop(range, urlList);
            }
            const textEntry = (_a = dataTransfer.get('text')) !== null && _a !== void 0 ? _a : dataTransfer.get(mime_1.Mimes.text);
            if (textEntry) {
                const text = await textEntry.asString();
                return { range, snippet: text };
            }
            return undefined;
        }
        doUriListDrop(range, urlList) {
            const uris = [];
            for (const resource of urlList.split('\n')) {
                try {
                    uris.push(uri_1.URI.parse(resource));
                }
                catch (_a) {
                    // noop
                }
            }
            if (!uris.length) {
                return;
            }
            const snippet = uris
                .map(uri => {
                const root = this._workspaceContextService.getWorkspaceFolder(uri);
                if (root) {
                    const rel = (0, resources_1.relativePath)(root.uri, uri);
                    if (rel) {
                        return rel;
                    }
                }
                return uri.fsPath;
            })
                .join(' ');
            return { range, snippet };
        }
    };
    DefaultOnDropProvider = __decorate([
        __param(0, workspace_1.IWorkspaceContextService)
    ], DefaultOnDropProvider);
    (0, editorExtensions_1.registerEditorContribution)(DropIntoEditorController.ID, DropIntoEditorController);
});
//# sourceMappingURL=dropIntoEditorContribution.js.map