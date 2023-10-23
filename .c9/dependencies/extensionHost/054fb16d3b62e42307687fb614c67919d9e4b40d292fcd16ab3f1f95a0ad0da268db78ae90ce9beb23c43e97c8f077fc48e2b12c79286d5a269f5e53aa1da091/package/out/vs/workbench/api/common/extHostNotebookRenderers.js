/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostNotebookEditor"], function (require, exports, event_1, extHost_protocol_1, extHostNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookRenderers = void 0;
    class ExtHostNotebookRenderers {
        constructor(mainContext, _extHostNotebook) {
            this._extHostNotebook = _extHostNotebook;
            this._rendererMessageEmitters = new Map();
            this.proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookRenderers);
        }
        $postRendererMessage(editorId, rendererId, message) {
            var _a;
            const editor = this._extHostNotebook.getEditorById(editorId);
            (_a = this._rendererMessageEmitters.get(rendererId)) === null || _a === void 0 ? void 0 : _a.fire({ editor: editor.apiEditor, message });
        }
        createRendererMessaging(manifest, rendererId) {
            var _a, _b;
            if (!((_b = (_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.notebookRenderer) === null || _b === void 0 ? void 0 : _b.some(r => r.id === rendererId))) {
                throw new Error(`Extensions may only call createRendererMessaging() for renderers they contribute (got ${rendererId})`);
            }
            const messaging = {
                onDidReceiveMessage: (listener, thisArg, disposables) => {
                    return this.getOrCreateEmitterFor(rendererId).event(listener, thisArg, disposables);
                },
                postMessage: (message, editorOrAlias) => {
                    if (extHostNotebookEditor_1.ExtHostNotebookEditor.apiEditorsToExtHost.has(message)) { // back compat for swapped args
                        [message, editorOrAlias] = [editorOrAlias, message];
                    }
                    const extHostEditor = editorOrAlias && extHostNotebookEditor_1.ExtHostNotebookEditor.apiEditorsToExtHost.get(editorOrAlias);
                    return this.proxy.$postMessage(extHostEditor === null || extHostEditor === void 0 ? void 0 : extHostEditor.id, rendererId, message);
                },
            };
            return messaging;
        }
        getOrCreateEmitterFor(rendererId) {
            let emitter = this._rendererMessageEmitters.get(rendererId);
            if (emitter) {
                return emitter;
            }
            emitter = new event_1.Emitter({
                onLastListenerRemove: () => {
                    emitter === null || emitter === void 0 ? void 0 : emitter.dispose();
                    this._rendererMessageEmitters.delete(rendererId);
                }
            });
            this._rendererMessageEmitters.set(rendererId, emitter);
            return emitter;
        }
    }
    exports.ExtHostNotebookRenderers = ExtHostNotebookRenderers;
});
//# sourceMappingURL=extHostNotebookRenderers.js.map