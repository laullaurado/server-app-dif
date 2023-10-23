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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/workbench/services/environment/browser/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/base/common/labels", "vs/platform/label/common/label", "vs/base/common/event", "vs/base/common/async", "vs/platform/product/common/productService", "vs/base/common/network", "vs/base/common/types", "vs/platform/workspace/common/virtualWorkspace"], function (require, exports, nls_1, resources_1, configuration_1, editorService_1, lifecycle_1, editor_1, environmentService_1, workspace_1, platform_1, strings_1, instantiation_1, labels_1, label_1, event_1, async_1, productService_1, network_1, types_1, virtualWorkspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowTitle = void 0;
    let WindowTitle = class WindowTitle extends lifecycle_1.Disposable {
        constructor(configurationService, editorService, environmentService, contextService, instantiationService, labelService, productService) {
            super();
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.productService = productService;
            this.properties = { isPure: true, isAdmin: false, prefix: undefined };
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.titleUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateTitle(), 0));
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.registerListeners();
        }
        get value() {
            var _a;
            return (_a = this.title) !== null && _a !== void 0 ? _a : '';
        }
        get workspaceName() {
            return this.labelService.getWorkspaceLabel(this.contextService.getWorkspace());
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChange()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkspaceName(() => this.titleUpdater.schedule()));
            this._register(this.labelService.onDidChangeFormatters(() => this.titleUpdater.schedule()));
        }
        onConfigurationChanged(event) {
            if (event.affectsConfiguration('window.title') || event.affectsConfiguration('window.titleSeparator')) {
                this.titleUpdater.schedule();
            }
        }
        onActiveEditorChange() {
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Calculate New Window Title
            this.titleUpdater.schedule();
            // Apply listener for dirty and label changes
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                this.activeEditorListeners.add(activeEditor.onDidChangeDirty(() => this.titleUpdater.schedule()));
                this.activeEditorListeners.add(activeEditor.onDidChangeLabel(() => this.titleUpdater.schedule()));
            }
        }
        doUpdateTitle() {
            const title = this.getWindowTitle();
            if (title !== this.title) {
                // Always set the native window title to identify us properly to the OS
                let nativeTitle = title;
                if (!(0, strings_1.trim)(nativeTitle)) {
                    nativeTitle = this.productService.nameLong;
                }
                window.document.title = nativeTitle;
                this.title = title;
                this.onDidChangeEmitter.fire();
            }
        }
        getWindowTitle() {
            let title = this.doGetWindowTitle() || this.productService.nameLong;
            let { prefix, suffix } = this.getTitleDecorations();
            if (prefix) {
                title = `${prefix} ${title}`;
            }
            if (suffix) {
                title = `${title} ${suffix}`;
            }
            // Replace non-space whitespace
            title = title.replace(/[^\S ]/g, ' ');
            return title;
        }
        getTitleDecorations() {
            let prefix;
            let suffix;
            if (this.properties.prefix) {
                prefix = this.properties.prefix;
            }
            if (this.environmentService.isExtensionDevelopment) {
                prefix = !prefix
                    ? WindowTitle.NLS_EXTENSION_HOST
                    : `${WindowTitle.NLS_EXTENSION_HOST} - ${prefix}`;
            }
            if (this.properties.isAdmin) {
                suffix = WindowTitle.NLS_USER_IS_ADMIN;
            }
            if (!this.properties.isPure) {
                suffix = !suffix
                    ? WindowTitle.NLS_UNSUPPORTED
                    : `${suffix} ${WindowTitle.NLS_UNSUPPORTED}`;
            }
            return { prefix, suffix };
        }
        updateProperties(properties) {
            const isAdmin = typeof properties.isAdmin === 'boolean' ? properties.isAdmin : this.properties.isAdmin;
            const isPure = typeof properties.isPure === 'boolean' ? properties.isPure : this.properties.isPure;
            const prefix = typeof properties.prefix === 'string' ? properties.prefix : this.properties.prefix;
            if (isAdmin !== this.properties.isAdmin || isPure !== this.properties.isPure || prefix !== this.properties.prefix) {
                this.properties.isAdmin = isAdmin;
                this.properties.isPure = isPure;
                this.properties.prefix = prefix;
                this.titleUpdater.schedule();
            }
        }
        /**
         * Possible template values:
         *
         * {activeEditorLong}: e.g. /Users/Development/myFolder/myFileFolder/myFile.txt
         * {activeEditorMedium}: e.g. myFolder/myFileFolder/myFile.txt
         * {activeEditorShort}: e.g. myFile.txt
         * {activeFolderLong}: e.g. /Users/Development/myFolder/myFileFolder
         * {activeFolderMedium}: e.g. myFolder/myFileFolder
         * {activeFolderShort}: e.g. myFileFolder
         * {rootName}: e.g. myFolder1, myFolder2, myFolder3
         * {rootPath}: e.g. /Users/Development
         * {folderName}: e.g. myFolder
         * {folderPath}: e.g. /Users/Development/myFolder
         * {appName}: e.g. VS Code
         * {remoteName}: e.g. SSH
         * {dirty}: indicator
         * {separator}: conditional separator
         */
        doGetWindowTitle() {
            const editor = this.editorService.activeEditor;
            const workspace = this.contextService.getWorkspace();
            // Compute root
            let root;
            if (workspace.configuration) {
                root = workspace.configuration;
            }
            else if (workspace.folders.length) {
                root = workspace.folders[0].uri;
            }
            // Compute active editor folder
            const editorResource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            let editorFolderResource = editorResource ? (0, resources_1.dirname)(editorResource) : undefined;
            if ((editorFolderResource === null || editorFolderResource === void 0 ? void 0 : editorFolderResource.path) === '.') {
                editorFolderResource = undefined;
            }
            // Compute folder resource
            // Single Root Workspace: always the root single workspace in this case
            // Otherwise: root folder of the currently active file if any
            let folder = undefined;
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                folder = workspace.folders[0];
            }
            else if (editorResource) {
                folder = (0, types_1.withNullAsUndefined)(this.contextService.getWorkspaceFolder(editorResource));
            }
            // Compute remote
            // vscode-remtoe: use as is
            // otherwise figure out if we have a virtual folder opened
            let remoteName = undefined;
            if (this.environmentService.remoteAuthority && !platform_1.isWeb) {
                remoteName = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.environmentService.remoteAuthority);
            }
            else {
                const virtualWorkspaceLocation = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(workspace);
                if (virtualWorkspaceLocation) {
                    remoteName = this.labelService.getHostLabel(virtualWorkspaceLocation.scheme, virtualWorkspaceLocation.authority);
                }
            }
            // Variables
            const activeEditorShort = editor ? editor.getTitle(0 /* Verbosity.SHORT */) : '';
            const activeEditorMedium = editor ? editor.getTitle(1 /* Verbosity.MEDIUM */) : activeEditorShort;
            const activeEditorLong = editor ? editor.getTitle(2 /* Verbosity.LONG */) : activeEditorMedium;
            const activeFolderShort = editorFolderResource ? (0, resources_1.basename)(editorFolderResource) : '';
            const activeFolderMedium = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource, { relative: true }) : '';
            const activeFolderLong = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource) : '';
            const rootName = this.labelService.getWorkspaceLabel(workspace);
            const rootPath = root ? this.labelService.getUriLabel(root) : '';
            const folderName = folder ? folder.name : '';
            const folderPath = folder ? this.labelService.getUriLabel(folder.uri) : '';
            const dirty = (editor === null || editor === void 0 ? void 0 : editor.isDirty()) && !editor.isSaving() ? WindowTitle.TITLE_DIRTY : '';
            const appName = this.productService.nameLong;
            const separator = this.configurationService.getValue('window.titleSeparator');
            const titleTemplate = this.configurationService.getValue('window.title');
            return (0, labels_1.template)(titleTemplate, {
                activeEditorShort,
                activeEditorLong,
                activeEditorMedium,
                activeFolderShort,
                activeFolderMedium,
                activeFolderLong,
                rootName,
                rootPath,
                folderName,
                folderPath,
                dirty,
                appName,
                remoteName,
                separator: { label: separator }
            });
        }
    };
    WindowTitle.NLS_UNSUPPORTED = (0, nls_1.localize)('patchedWindowTitle', "[Unsupported]");
    WindowTitle.NLS_USER_IS_ADMIN = platform_1.isWindows ? (0, nls_1.localize)('userIsAdmin', "[Administrator]") : (0, nls_1.localize)('userIsSudo', "[Superuser]");
    WindowTitle.NLS_EXTENSION_HOST = (0, nls_1.localize)('devExtensionWindowTitlePrefix', "[Extension Development Host]");
    WindowTitle.TITLE_DIRTY = '\u25cf ';
    WindowTitle = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, label_1.ILabelService),
        __param(6, productService_1.IProductService)
    ], WindowTitle);
    exports.WindowTitle = WindowTitle;
});
//# sourceMappingURL=windowTitle.js.map