/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/network"], function (require, exports, nls_1, path_1, map_1, resources_1, uri_1, instantiation_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasWorkspaceFileExtension = exports.isSavedWorkspace = exports.isTemporaryWorkspace = exports.isUntitledWorkspace = exports.UNTITLED_WORKSPACE_NAME = exports.WORKSPACE_FILTER = exports.WORKSPACE_EXTENSION = exports.toWorkspaceFolder = exports.WorkspaceFolder = exports.Workspace = exports.isWorkspaceFolder = exports.isWorkspace = exports.WorkbenchState = exports.reviveIdentifier = exports.isWorkspaceIdentifier = exports.toWorkspaceIdentifier = exports.isSingleFolderWorkspaceIdentifier = exports.IWorkspaceContextService = void 0;
    exports.IWorkspaceContextService = (0, instantiation_1.createDecorator)('contextService');
    function isSingleFolderWorkspaceIdentifier(obj) {
        const singleFolderIdentifier = obj;
        return typeof (singleFolderIdentifier === null || singleFolderIdentifier === void 0 ? void 0 : singleFolderIdentifier.id) === 'string' && uri_1.URI.isUri(singleFolderIdentifier.uri);
    }
    exports.isSingleFolderWorkspaceIdentifier = isSingleFolderWorkspaceIdentifier;
    function toWorkspaceIdentifier(workspace) {
        // Multi root
        if (workspace.configuration) {
            return {
                id: workspace.id,
                configPath: workspace.configuration
            };
        }
        // Single folder
        if (workspace.folders.length === 1) {
            return {
                id: workspace.id,
                uri: workspace.folders[0].uri
            };
        }
        // Empty workspace
        return undefined;
    }
    exports.toWorkspaceIdentifier = toWorkspaceIdentifier;
    function isWorkspaceIdentifier(obj) {
        const workspaceIdentifier = obj;
        return typeof (workspaceIdentifier === null || workspaceIdentifier === void 0 ? void 0 : workspaceIdentifier.id) === 'string' && uri_1.URI.isUri(workspaceIdentifier.configPath);
    }
    exports.isWorkspaceIdentifier = isWorkspaceIdentifier;
    function reviveIdentifier(identifier) {
        // Single Folder
        const singleFolderIdentifierCandidate = identifier;
        if (singleFolderIdentifierCandidate === null || singleFolderIdentifierCandidate === void 0 ? void 0 : singleFolderIdentifierCandidate.uri) {
            return { id: singleFolderIdentifierCandidate.id, uri: uri_1.URI.revive(singleFolderIdentifierCandidate.uri) };
        }
        // Multi folder
        const workspaceIdentifierCandidate = identifier;
        if (workspaceIdentifierCandidate === null || workspaceIdentifierCandidate === void 0 ? void 0 : workspaceIdentifierCandidate.configPath) {
            return { id: workspaceIdentifierCandidate.id, configPath: uri_1.URI.revive(workspaceIdentifierCandidate.configPath) };
        }
        // Empty
        if (identifier === null || identifier === void 0 ? void 0 : identifier.id) {
            return { id: identifier.id };
        }
        return undefined;
    }
    exports.reviveIdentifier = reviveIdentifier;
    var WorkbenchState;
    (function (WorkbenchState) {
        WorkbenchState[WorkbenchState["EMPTY"] = 1] = "EMPTY";
        WorkbenchState[WorkbenchState["FOLDER"] = 2] = "FOLDER";
        WorkbenchState[WorkbenchState["WORKSPACE"] = 3] = "WORKSPACE";
    })(WorkbenchState = exports.WorkbenchState || (exports.WorkbenchState = {}));
    function isWorkspace(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && typeof candidate.id === 'string'
            && Array.isArray(candidate.folders));
    }
    exports.isWorkspace = isWorkspace;
    function isWorkspaceFolder(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && uri_1.URI.isUri(candidate.uri)
            && typeof candidate.name === 'string'
            && typeof candidate.toResource === 'function');
    }
    exports.isWorkspaceFolder = isWorkspaceFolder;
    class Workspace {
        constructor(_id, folders, _transient, _configuration, _ignorePathCasing) {
            this._id = _id;
            this._transient = _transient;
            this._configuration = _configuration;
            this._ignorePathCasing = _ignorePathCasing;
            this._foldersMap = map_1.TernarySearchTree.forUris(this._ignorePathCasing, () => true);
            this.folders = folders;
        }
        update(workspace) {
            this._id = workspace.id;
            this._configuration = workspace.configuration;
            this._transient = workspace.transient;
            this._ignorePathCasing = workspace._ignorePathCasing;
            this.folders = workspace.folders;
        }
        get folders() {
            return this._folders;
        }
        set folders(folders) {
            this._folders = folders;
            this.updateFoldersMap();
        }
        get id() {
            return this._id;
        }
        get transient() {
            return this._transient;
        }
        get configuration() {
            return this._configuration;
        }
        set configuration(configuration) {
            this._configuration = configuration;
        }
        getFolder(resource) {
            if (!resource) {
                return null;
            }
            return this._foldersMap.findSubstr(resource) || null;
        }
        updateFoldersMap() {
            this._foldersMap = map_1.TernarySearchTree.forUris(this._ignorePathCasing, () => true);
            for (const folder of this.folders) {
                this._foldersMap.set(folder.uri, folder);
            }
        }
        toJSON() {
            return { id: this.id, folders: this.folders, transient: this.transient, configuration: this.configuration };
        }
    }
    exports.Workspace = Workspace;
    class WorkspaceFolder {
        constructor(data, 
        /**
         * Provides access to the original metadata for this workspace
         * folder. This can be different from the metadata provided in
         * this class:
         * - raw paths can be relative
         * - raw paths are not normalized
         */
        raw) {
            this.raw = raw;
            this.uri = data.uri;
            this.index = data.index;
            this.name = data.name;
        }
        toResource(relativePath) {
            return (0, resources_1.joinPath)(this.uri, relativePath);
        }
        toJSON() {
            return { uri: this.uri, name: this.name, index: this.index };
        }
    }
    exports.WorkspaceFolder = WorkspaceFolder;
    function toWorkspaceFolder(resource) {
        return new WorkspaceFolder({ uri: resource, index: 0, name: (0, resources_1.basenameOrAuthority)(resource) }, { uri: resource.toString() });
    }
    exports.toWorkspaceFolder = toWorkspaceFolder;
    exports.WORKSPACE_EXTENSION = 'code-workspace';
    const WORKSPACE_SUFFIX = `.${exports.WORKSPACE_EXTENSION}`;
    exports.WORKSPACE_FILTER = [{ name: (0, nls_1.localize)('codeWorkspace', "Code Workspace"), extensions: [exports.WORKSPACE_EXTENSION] }];
    exports.UNTITLED_WORKSPACE_NAME = 'workspace.json';
    function isUntitledWorkspace(path, environmentService) {
        return resources_1.extUriBiasedIgnorePathCase.isEqualOrParent(path, environmentService.untitledWorkspacesHome);
    }
    exports.isUntitledWorkspace = isUntitledWorkspace;
    function isTemporaryWorkspace(arg1) {
        let path;
        if (uri_1.URI.isUri(arg1)) {
            path = arg1;
        }
        else {
            path = arg1.configuration;
        }
        return (path === null || path === void 0 ? void 0 : path.scheme) === network_1.Schemas.tmp;
    }
    exports.isTemporaryWorkspace = isTemporaryWorkspace;
    function isSavedWorkspace(path, environmentService) {
        return !isUntitledWorkspace(path, environmentService) && !isTemporaryWorkspace(path);
    }
    exports.isSavedWorkspace = isSavedWorkspace;
    function hasWorkspaceFileExtension(path) {
        const ext = (typeof path === 'string') ? (0, path_1.extname)(path) : (0, resources_1.extname)(path);
        return ext === WORKSPACE_SUFFIX;
    }
    exports.hasWorkspaceFileExtension = hasWorkspaceFileExtension;
});
//# sourceMappingURL=workspace.js.map