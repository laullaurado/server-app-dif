/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dnd", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/files/browser/htmlFileSystemProvider", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/registry/common/platform"], function (require, exports, dnd_1, arrays_1, async_1, buffer_1, marshalling_1, network_1, platform_1, severity_1, types_1, uri_1, nls_1, dialogs_1, htmlFileSystemProvider_1, webFileSystemAccess_1, files_1, instantiation_1, opener_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = exports.containsDragType = exports.extractFileListData = exports.createDraggedEditorInputFromRawResourcesData = exports.extractEditorsDropData = exports.CodeDataTransfers = void 0;
    //#region Editor / Resources DND
    exports.CodeDataTransfers = {
        EDITORS: 'CodeEditors',
        FILES: 'CodeFiles'
    };
    async function extractEditorsDropData(accessor, e) {
        var _a, _b;
        const editors = [];
        if (e.dataTransfer && e.dataTransfer.types.length > 0) {
            // Data Transfer: Code Editors
            const rawEditorsData = e.dataTransfer.getData(exports.CodeDataTransfers.EDITORS);
            if (rawEditorsData) {
                try {
                    editors.push(...(0, marshalling_1.parse)(rawEditorsData));
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Data Transfer: Resources
            else {
                try {
                    const rawResourcesData = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                    editors.push(...createDraggedEditorInputFromRawResourcesData(rawResourcesData));
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Check for native file transfer
            if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const file = e.dataTransfer.files[i];
                    if (file && file.path /* Electron only */) {
                        try {
                            editors.push({ resource: uri_1.URI.file(file.path), isExternal: true, allowWorkspaceOpen: true });
                        }
                        catch (error) {
                            // Invalid URI
                        }
                    }
                }
            }
            // Check for CodeFiles transfer
            const rawCodeFiles = e.dataTransfer.getData(exports.CodeDataTransfers.FILES);
            if (rawCodeFiles) {
                try {
                    const codeFiles = JSON.parse(rawCodeFiles);
                    for (const codeFile of codeFiles) {
                        editors.push({ resource: uri_1.URI.file(codeFile), isExternal: true, allowWorkspaceOpen: true });
                    }
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Web: Check for file transfer
            if (platform_1.isWeb && containsDragType(e, dnd_1.DataTransfers.FILES)) {
                const files = e.dataTransfer.items;
                if (files) {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const filesData = await instantiationService.invokeFunction(accessor => extractFilesDropData(accessor, e));
                    for (const fileData of filesData) {
                        editors.push({ resource: fileData.resource, contents: (_b = fileData.contents) === null || _b === void 0 ? void 0 : _b.toString(), isExternal: true, allowWorkspaceOpen: fileData.isDirectory });
                    }
                }
            }
            // Workbench contributions
            const contributions = platform_2.Registry.as(exports.Extensions.DragAndDropContribution).getAll();
            for (const contribution of contributions) {
                const data = e.dataTransfer.getData(contribution.dataFormatKey);
                if (data) {
                    try {
                        editors.push(...contribution.getEditorInputs(data));
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
            }
        }
        return editors;
    }
    exports.extractEditorsDropData = extractEditorsDropData;
    function createDraggedEditorInputFromRawResourcesData(rawResourcesData) {
        const editors = [];
        if (rawResourcesData) {
            const resourcesRaw = JSON.parse(rawResourcesData);
            for (const resourceRaw of resourcesRaw) {
                if (resourceRaw.indexOf(':') > 0) { // mitigate https://github.com/microsoft/vscode/issues/124946
                    const { selection, uri } = (0, opener_1.extractSelection)(uri_1.URI.parse(resourceRaw));
                    editors.push({ resource: uri, options: { selection } });
                }
            }
        }
        return editors;
    }
    exports.createDraggedEditorInputFromRawResourcesData = createDraggedEditorInputFromRawResourcesData;
    async function extractFilesDropData(accessor, event) {
        var _a, _b;
        // Try to extract via `FileSystemHandle`
        if (webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
            const items = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.items;
            if (items) {
                return extractFileTransferData(accessor, items);
            }
        }
        // Try to extract via `FileList`
        const files = (_b = event.dataTransfer) === null || _b === void 0 ? void 0 : _b.files;
        if (!files) {
            return [];
        }
        return extractFileListData(accessor, files);
    }
    async function extractFileTransferData(accessor, items) {
        const fileSystemProvider = accessor.get(files_1.IFileService).getProvider(network_1.Schemas.file);
        if (!(fileSystemProvider instanceof htmlFileSystemProvider_1.HTMLFileSystemProvider)) {
            return []; // only supported when running in web
        }
        const results = [];
        for (let i = 0; i < items.length; i++) {
            const file = items[i];
            if (file) {
                const result = new async_1.DeferredPromise();
                results.push(result);
                (async () => {
                    try {
                        const handle = await file.getAsFileSystemHandle();
                        if (!handle) {
                            result.complete(undefined);
                            return;
                        }
                        if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle)) {
                            result.complete({
                                resource: await fileSystemProvider.registerFileHandle(handle),
                                isDirectory: false
                            });
                        }
                        else if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                            result.complete({
                                resource: await fileSystemProvider.registerDirectoryHandle(handle),
                                isDirectory: true
                            });
                        }
                        else {
                            result.complete(undefined);
                        }
                    }
                    catch (error) {
                        result.complete(undefined);
                    }
                })();
            }
        }
        return (0, arrays_1.coalesce)(await Promise.all(results.map(result => result.p)));
    }
    async function extractFileListData(accessor, files) {
        const dialogService = accessor.get(dialogs_1.IDialogService);
        const results = [];
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (file) {
                // Skip for very large files because this operation is unbuffered
                if (file.size > 100 * files_1.ByteSize.MB) {
                    dialogService.show(severity_1.default.Warning, (0, nls_1.localize)('fileTooLarge', "File is too large to open as untitled editor. Please upload it first into the file explorer and then try again."));
                    continue;
                }
                const result = new async_1.DeferredPromise();
                results.push(result);
                const reader = new FileReader();
                reader.onerror = () => result.complete(undefined);
                reader.onabort = () => result.complete(undefined);
                reader.onload = async (event) => {
                    var _a;
                    const name = file.name;
                    const loadResult = (0, types_1.withNullAsUndefined)((_a = event.target) === null || _a === void 0 ? void 0 : _a.result);
                    if (typeof name !== 'string' || typeof loadResult === 'undefined') {
                        result.complete(undefined);
                        return;
                    }
                    result.complete({
                        resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: name }),
                        contents: typeof loadResult === 'string' ? buffer_1.VSBuffer.fromString(loadResult) : buffer_1.VSBuffer.wrap(new Uint8Array(loadResult))
                    });
                };
                // Start reading
                reader.readAsArrayBuffer(file);
            }
        }
        return (0, arrays_1.coalesce)(await Promise.all(results.map(result => result.p)));
    }
    exports.extractFileListData = extractFileListData;
    //#endregion
    function containsDragType(event, ...dragTypesToFind) {
        if (!event.dataTransfer) {
            return false;
        }
        const dragTypes = event.dataTransfer.types;
        const lowercaseDragTypes = [];
        for (let i = 0; i < dragTypes.length; i++) {
            lowercaseDragTypes.push(dragTypes[i].toLowerCase()); // somehow the types are lowercase
        }
        for (const dragType of dragTypesToFind) {
            if (lowercaseDragTypes.indexOf(dragType.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }
    exports.containsDragType = containsDragType;
    class DragAndDropContributionRegistry {
        constructor() {
            this._contributions = new Map();
        }
        register(contribution) {
            if (this._contributions.has(contribution.dataFormatKey)) {
                throw new Error(`A drag and drop contributiont with key '${contribution.dataFormatKey}' was already registered.`);
            }
            this._contributions.set(contribution.dataFormatKey, contribution);
        }
        getAll() {
            return this._contributions.values();
        }
    }
    exports.Extensions = {
        DragAndDropContribution: 'workbench.contributions.dragAndDrop'
    };
    platform_2.Registry.add(exports.Extensions.DragAndDropContribution, new DragAndDropContributionRegistry());
});
//#endregion
//# sourceMappingURL=dnd.js.map