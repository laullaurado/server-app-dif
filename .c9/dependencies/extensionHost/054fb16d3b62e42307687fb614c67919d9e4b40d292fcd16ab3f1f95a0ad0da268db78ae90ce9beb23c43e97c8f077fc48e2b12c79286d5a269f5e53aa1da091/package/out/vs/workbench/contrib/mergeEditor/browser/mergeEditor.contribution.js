/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/editor", "vs/workbench/contrib/mergeEditor/browser/mergeEditor", "vs/workbench/contrib/mergeEditor/browser/mergeEditorInput", "vs/workbench/services/editor/common/editorService", "./mergeEditorSerializer", "vs/base/common/codicons", "vs/workbench/services/files/common/files", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/buffer", "vs/platform/clipboard/common/clipboardService", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/editor/common/services/resolverService"], function (require, exports, nls_1, uri_1, actions_1, descriptors_1, instantiation_1, platform_1, editor_1, editor_2, mergeEditor_1, mergeEditorInput_1, editorService_1, mergeEditorSerializer_1, codicons_1, files_1, inMemoryFilesystemProvider_1, buffer_1, clipboardService_1, quickInput_1, notification_1, resolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(mergeEditor_1.MergeEditor, mergeEditor_1.MergeEditor.ID, (0, nls_1.localize)('name', "Merge Editor")), [
        new descriptors_1.SyncDescriptor(mergeEditorInput_1.MergeEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(mergeEditorInput_1.MergeEditorInput.ID, mergeEditorSerializer_1.MergeEditorSerializer);
    (0, actions_1.registerAction2)(class ToggleLayout extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.toggleLayout',
                title: (0, nls_1.localize)('toggle.title', "Switch to column view"),
                icon: codicons_1.Codicon.layoutCentered,
                toggled: {
                    condition: mergeEditor_1.ctxUsesColumnLayout,
                    icon: codicons_1.Codicon.layoutPanel,
                    title: (0, nls_1.localize)('toggle.title2', "Switch to 2 by 1 view"),
                },
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        when: mergeEditor_1.ctxIsMergeEditor,
                        group: 'navigation'
                    }]
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            if (activeEditorPane instanceof mergeEditor_1.MergeEditor) {
                activeEditorPane.toggleLayout();
            }
        }
    });
    (0, actions_1.registerAction2)(class Open extends actions_1.Action2 {
        constructor() {
            super({
                id: '_open.mergeEditor',
                title: (0, nls_1.localize)('title', "Open Merge Editor"),
            });
        }
        run(accessor, ...args) {
            const validatedArgs = IRelaxedOpenArgs.validate(args[0]);
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const input = instaService.createInstance(mergeEditorInput_1.MergeEditorInput, validatedArgs.ancestor, validatedArgs.input1, validatedArgs.input2, validatedArgs.output);
            accessor.get(editorService_1.IEditorService).openEditor(input);
        }
    });
    var IRelaxedOpenArgs;
    (function (IRelaxedOpenArgs) {
        function toUri(obj) {
            if (typeof obj === 'string') {
                return uri_1.URI.parse(obj, true);
            }
            else if (obj && typeof obj === 'object') {
                return uri_1.URI.revive(obj);
            }
            throw new TypeError('invalid argument');
        }
        function isUriComponents(obj) {
            if (!obj || typeof obj !== 'object') {
                return false;
            }
            return typeof obj.scheme === 'string'
                && typeof obj.authority === 'string'
                && typeof obj.path === 'string'
                && typeof obj.query === 'string'
                && typeof obj.fragment === 'string';
        }
        function toInputResource(obj) {
            if (typeof obj === 'string') {
                return new mergeEditorInput_1.MergeEditorInputData(uri_1.URI.parse(obj, true), undefined, undefined);
            }
            if (!obj || typeof obj !== 'object') {
                throw new TypeError('invalid argument');
            }
            if (isUriComponents(obj)) {
                return new mergeEditorInput_1.MergeEditorInputData(uri_1.URI.revive(obj), undefined, undefined);
            }
            let uri = toUri(obj.uri);
            let detail = obj.detail;
            let description = obj.description;
            return new mergeEditorInput_1.MergeEditorInputData(uri, detail, description);
        }
        function validate(obj) {
            if (!obj || typeof obj !== 'object') {
                throw new TypeError('invalid argument');
            }
            const ancestor = toUri(obj.ancestor);
            const output = toUri(obj.output);
            const input1 = toInputResource(obj.input1);
            const input2 = toInputResource(obj.input2);
            return { ancestor, input1, input2, output };
        }
        IRelaxedOpenArgs.validate = validate;
    })(IRelaxedOpenArgs || (IRelaxedOpenArgs = {}));
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.copyContents',
                title: (0, nls_1.localize)('merge.dev.copyContents', "Developer Merge Editor: Copy Contents of Inputs, Base and Result as JSON"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
            });
        }
        run(accessor) {
            const { activeEditorPane } = accessor.get(editorService_1.IEditorService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (!(activeEditorPane instanceof mergeEditor_1.MergeEditor)) {
                notificationService.info({
                    name: (0, nls_1.localize)('mergeEditor.name', 'Merge Editor'),
                    message: (0, nls_1.localize)('mergeEditor.noActiveMergeEditor', "No active merge editor")
                });
                return;
            }
            const model = activeEditorPane.model;
            if (!model) {
                return;
            }
            const contents = {
                languageId: model.result.getLanguageId(),
                base: model.base.getValue(),
                input1: model.input1.getValue(),
                input2: model.input2.getValue(),
                result: model.result.getValue(),
            };
            const jsonStr = JSON.stringify(contents, undefined, 4);
            clipboardService.writeText(jsonStr);
            notificationService.info({
                name: (0, nls_1.localize)('mergeEditor.name', 'Merge Editor'),
                message: (0, nls_1.localize)('mergeEditor.successfullyCopiedMergeEditorContents', "Successfully copied merge editor contents"),
            });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'merge.dev.openContents',
                title: (0, nls_1.localize)('merge.dev.openContents', "Developer Merge Editor: Open Contents of Inputs, Base and Result from JSON"),
                icon: codicons_1.Codicon.layoutCentered,
                f1: true,
            });
        }
        async run(accessor) {
            const service = accessor.get(files_1.IWorkbenchFileService);
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const inputService = accessor.get(quickInput_1.IQuickInputService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const result = await inputService.input({
                prompt: (0, nls_1.localize)('mergeEditor.enterJSON', 'Enter JSON'),
                value: await clipboardService.readText(),
            });
            if (!result) {
                return;
            }
            const content = JSON.parse(result);
            const scheme = 'merge-editor-dev';
            let provider = service.getProvider(scheme);
            if (!provider) {
                provider = new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider();
                service.registerProvider(scheme, provider);
            }
            const baseUri = uri_1.URI.from({ scheme, path: '/ancestor' });
            const input1Uri = uri_1.URI.from({ scheme, path: '/input1' });
            const input2Uri = uri_1.URI.from({ scheme, path: '/input2' });
            const resultUri = uri_1.URI.from({ scheme, path: '/result' });
            function writeFile(uri, content) {
                return provider.writeFile(uri, buffer_1.VSBuffer.fromString(content).buffer, { create: true, overwrite: true, unlock: true });
            }
            await Promise.all([
                writeFile(baseUri, content.base),
                writeFile(input1Uri, content.input1),
                writeFile(input2Uri, content.input2),
                writeFile(resultUri, content.result),
            ]);
            async function setLanguageId(uri, languageId) {
                const ref = await textModelService.createModelReference(uri);
                ref.object.textEditorModel.setMode(languageId);
                ref.dispose();
            }
            await Promise.all([
                setLanguageId(baseUri, content.languageId),
                setLanguageId(input1Uri, content.languageId),
                setLanguageId(input2Uri, content.languageId),
                setLanguageId(resultUri, content.languageId),
            ]);
            const input = instaService.createInstance(mergeEditorInput_1.MergeEditorInput, baseUri, { uri: input1Uri, description: 'Input 1', detail: '(from JSON)' }, { uri: input2Uri, description: 'Input 2', detail: '(from JSON)' }, resultUri);
            editorService.openEditor(input);
        }
    });
});
//# sourceMappingURL=mergeEditor.contribution.js.map