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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/event", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/base/common/labels", "vs/platform/label/common/label", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/glob", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/workbench/services/path/common/pathService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/network", "vs/platform/storage/common/storage", "vs/workbench/common/memento"], function (require, exports, nls_1, uri_1, lifecycle_1, path_1, event_1, contributions_1, platform_1, environmentService_1, workspace_1, resources_1, labels_1, label_1, extensionsRegistry_1, glob_1, lifecycle_2, extensions_1, pathService_1, extensions_2, platform_2, remoteAgentService_1, network_1, storage_1, memento_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelService = void 0;
    const resourceLabelFormattersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'resourceLabelFormatters',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters', 'Contributes resource label formatting rules.'),
            type: 'array',
            items: {
                type: 'object',
                required: ['scheme', 'formatting'],
                properties: {
                    scheme: {
                        type: 'string',
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.scheme', 'URI scheme on which to match the formatter on. For example "file". Simple glob patterns are supported.'),
                    },
                    authority: {
                        type: 'string',
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.authority', 'URI authority on which to match the formatter on. Simple glob patterns are supported.'),
                    },
                    formatting: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.formatting', "Rules for formatting uri resource labels."),
                        type: 'object',
                        properties: {
                            label: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.label', "Label rules to display. For example: myLabel:/${path}. ${path}, ${scheme}, ${authority} and ${authoritySuffix} are supported as variables.")
                            },
                            separator: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.separator', "Separator to be used in the uri label display. '/' or '\' as an example.")
                            },
                            stripPathStartingSeparator: {
                                type: 'boolean',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.stripPathStartingSeparator', "Controls whether `${path}` substitutions should have starting separator characters stripped.")
                            },
                            tildify: {
                                type: 'boolean',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.tildify', "Controls if the start of the uri label should be tildified when possible.")
                            },
                            workspaceSuffix: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.formatting.workspaceSuffix', "Suffix appended to the workspace label.")
                            }
                        }
                    }
                }
            }
        }
    });
    const sepRegexp = /\//g;
    const labelMatchingRegexp = /\$\{(scheme|authoritySuffix|authority|path|(query)\.(.+?))\}/g;
    function hasDriveLetterIgnorePlatform(path) {
        return !!(path && path[2] === ':');
    }
    let ResourceLabelFormattersHandler = class ResourceLabelFormattersHandler {
        constructor(labelService) {
            this.formattersDisposables = new Map();
            resourceLabelFormattersExtPoint.setHandler((extensions, delta) => {
                delta.added.forEach(added => added.value.forEach(formatter => {
                    if (!(0, extensions_2.isProposedApiEnabled)(added.description, 'contribLabelFormatterWorkspaceTooltip') && formatter.formatting.workspaceTooltip) {
                        formatter.formatting.workspaceTooltip = undefined; // workspaceTooltip is only proposed
                    }
                    this.formattersDisposables.set(formatter, labelService.registerFormatter(formatter));
                }));
                delta.removed.forEach(removed => removed.value.forEach(formatter => {
                    this.formattersDisposables.get(formatter).dispose();
                }));
            });
        }
    };
    ResourceLabelFormattersHandler = __decorate([
        __param(0, label_1.ILabelService)
    ], ResourceLabelFormattersHandler);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ResourceLabelFormattersHandler, 3 /* LifecyclePhase.Restored */);
    const FORMATTER_CACHE_SIZE = 50;
    let LabelService = class LabelService extends lifecycle_1.Disposable {
        constructor(environmentService, contextService, pathService, remoteAgentService, storageService, lifecycleService) {
            var _a;
            super();
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.pathService = pathService;
            this.remoteAgentService = remoteAgentService;
            this._onDidChangeFormatters = this._register(new event_1.Emitter({ leakWarningThreshold: 400 }));
            this.onDidChangeFormatters = this._onDidChangeFormatters.event;
            // Find some meaningful defaults until the remote environment
            // is resolved, by taking the current OS we are running in
            // and by taking the local `userHome` if we run on a local
            // file scheme.
            this.os = platform_2.OS;
            this.userHome = pathService.defaultUriScheme === network_1.Schemas.file ? this.pathService.userHome({ preferLocal: true }) : undefined;
            const memento = this.storedFormattersMemento = new memento_1.Memento('cachedResourceLabelFormatters', storageService);
            this.storedFormatters = memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            this.formatters = ((_a = this.storedFormatters) === null || _a === void 0 ? void 0 : _a.formatters) || [];
            // Remote environment is potentially long running
            this.resolveRemoteEnvironment();
        }
        async resolveRemoteEnvironment() {
            var _a;
            // OS
            const env = await this.remoteAgentService.getEnvironment();
            this.os = (_a = env === null || env === void 0 ? void 0 : env.os) !== null && _a !== void 0 ? _a : platform_2.OS;
            // User home
            this.userHome = await this.pathService.userHome();
        }
        findFormatting(resource) {
            let bestResult;
            for (const formatter of this.formatters) {
                if (formatter.scheme === resource.scheme) {
                    if (!formatter.authority && (!bestResult || formatter.priority)) {
                        bestResult = formatter;
                        continue;
                    }
                    if (!formatter.authority) {
                        continue;
                    }
                    if ((0, glob_1.match)(formatter.authority.toLowerCase(), resource.authority.toLowerCase()) &&
                        (!bestResult ||
                            !bestResult.authority ||
                            formatter.authority.length > bestResult.authority.length ||
                            ((formatter.authority.length === bestResult.authority.length) && formatter.priority))) {
                        bestResult = formatter;
                    }
                }
            }
            return bestResult ? bestResult.formatting : undefined;
        }
        getUriLabel(resource, options = {}) {
            let formatting = this.findFormatting(resource);
            if (formatting && options.separator) {
                // mixin separator if defined from the outside
                formatting = Object.assign(Object.assign({}, formatting), { separator: options.separator });
            }
            const label = this.doGetUriLabel(resource, formatting, options);
            // Without formatting we still need to support the separator
            // as provided in options (https://github.com/microsoft/vscode/issues/130019)
            if (!formatting && options.separator) {
                return label.replace(sepRegexp, options.separator);
            }
            return label;
        }
        doGetUriLabel(resource, formatting, options = {}) {
            var _a, _b;
            if (!formatting) {
                return (0, labels_1.getPathLabel)(resource, {
                    os: this.os,
                    tildify: this.userHome ? { userHome: this.userHome } : undefined,
                    relative: options.relative ? {
                        noPrefix: options.noPrefix,
                        getWorkspace: () => this.contextService.getWorkspace(),
                        getWorkspaceFolder: resource => this.contextService.getWorkspaceFolder(resource)
                    } : undefined
                });
            }
            // Relative label
            if (options.relative) {
                const folder = (_a = this.contextService) === null || _a === void 0 ? void 0 : _a.getWorkspaceFolder(resource);
                if (folder) {
                    const folderLabel = this.formatUri(folder.uri, formatting, options.noPrefix);
                    let relativeLabel = this.formatUri(resource, formatting, options.noPrefix);
                    let overlap = 0;
                    while (relativeLabel[overlap] && relativeLabel[overlap] === folderLabel[overlap]) {
                        overlap++;
                    }
                    if (!relativeLabel[overlap] || relativeLabel[overlap] === formatting.separator) {
                        relativeLabel = relativeLabel.substring(1 + overlap);
                    }
                    else if (overlap === folderLabel.length && folder.uri.path === path_1.posix.sep) {
                        relativeLabel = relativeLabel.substring(overlap);
                    }
                    // always show root basename if there are multiple folders
                    const hasMultipleRoots = this.contextService.getWorkspace().folders.length > 1;
                    if (hasMultipleRoots && !options.noPrefix) {
                        const rootName = (_b = folder === null || folder === void 0 ? void 0 : folder.name) !== null && _b !== void 0 ? _b : (0, resources_1.basenameOrAuthority)(folder.uri);
                        relativeLabel = relativeLabel ? `${rootName} • ${relativeLabel}` : rootName;
                    }
                    return relativeLabel;
                }
            }
            // Absolute label
            return this.formatUri(resource, formatting, options.noPrefix);
        }
        getUriBasenameLabel(resource) {
            const formatting = this.findFormatting(resource);
            const label = this.doGetUriLabel(resource, formatting);
            let pathLib;
            if ((formatting === null || formatting === void 0 ? void 0 : formatting.separator) === path_1.win32.sep) {
                pathLib = path_1.win32;
            }
            else if ((formatting === null || formatting === void 0 ? void 0 : formatting.separator) === path_1.posix.sep) {
                pathLib = path_1.posix;
            }
            else {
                pathLib = (this.os === 1 /* OperatingSystem.Windows */) ? path_1.win32 : path_1.posix;
            }
            return pathLib.basename(label);
        }
        getWorkspaceLabel(workspace, options) {
            if ((0, workspace_1.isWorkspace)(workspace)) {
                const identifier = (0, workspace_1.toWorkspaceIdentifier)(workspace);
                if (identifier) {
                    return this.getWorkspaceLabel(identifier, options);
                }
                return '';
            }
            // Workspace: Single Folder (as URI)
            if (uri_1.URI.isUri(workspace)) {
                return this.doGetSingleFolderWorkspaceLabel(workspace, options);
            }
            // Workspace: Single Folder (as workspace identifier)
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                return this.doGetSingleFolderWorkspaceLabel(workspace.uri, options);
            }
            // Workspace: Multi Root
            if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                return this.doGetWorkspaceLabel(workspace.configPath, options);
            }
            return '';
        }
        doGetWorkspaceLabel(workspaceUri, options) {
            // Workspace: Untitled
            if ((0, workspace_1.isUntitledWorkspace)(workspaceUri, this.environmentService)) {
                return (0, nls_1.localize)('untitledWorkspace', "Untitled (Workspace)");
            }
            // Workspace: Temporary
            if ((0, workspace_1.isTemporaryWorkspace)(workspaceUri)) {
                return (0, nls_1.localize)('temporaryWorkspace', "Workspace");
            }
            // Workspace: Saved
            let filename = (0, resources_1.basename)(workspaceUri);
            if (filename.endsWith(workspace_1.WORKSPACE_EXTENSION)) {
                filename = filename.substr(0, filename.length - workspace_1.WORKSPACE_EXTENSION.length - 1);
            }
            let label;
            if (options === null || options === void 0 ? void 0 : options.verbose) {
                label = (0, nls_1.localize)('workspaceNameVerbose', "{0} (Workspace)", this.getUriLabel((0, resources_1.joinPath)((0, resources_1.dirname)(workspaceUri), filename)));
            }
            else {
                label = (0, nls_1.localize)('workspaceName', "{0} (Workspace)", filename);
            }
            return this.appendWorkspaceSuffix(label, workspaceUri);
        }
        doGetSingleFolderWorkspaceLabel(folderUri, options) {
            const label = (options === null || options === void 0 ? void 0 : options.verbose) ? this.getUriLabel(folderUri) : (0, resources_1.basename)(folderUri) || path_1.posix.sep;
            return this.appendWorkspaceSuffix(label, folderUri);
        }
        getSeparator(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return (formatter === null || formatter === void 0 ? void 0 : formatter.separator) || path_1.posix.sep;
        }
        getHostLabel(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return (formatter === null || formatter === void 0 ? void 0 : formatter.workspaceSuffix) || authority || '';
        }
        getHostTooltip(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter === null || formatter === void 0 ? void 0 : formatter.workspaceTooltip;
        }
        registerCachedFormatter(formatter) {
            var _a;
            var _b;
            const list = (_a = (_b = this.storedFormatters).formatters) !== null && _a !== void 0 ? _a : (_b.formatters = []);
            let replace = list.findIndex(f => f.scheme === formatter.scheme && f.authority === formatter.authority);
            if (replace === -1 && list.length >= FORMATTER_CACHE_SIZE) {
                replace = FORMATTER_CACHE_SIZE - 1; // at max capacity, replace the last element
            }
            if (replace === -1) {
                list.unshift(formatter);
            }
            else {
                for (let i = replace; i > 0; i--) {
                    list[i] = list[i - 1];
                }
                list[0] = formatter;
            }
            this.storedFormattersMemento.saveMemento();
            return this.registerFormatter(formatter);
        }
        registerFormatter(formatter) {
            this.formatters.push(formatter);
            this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
            return {
                dispose: () => {
                    this.formatters = this.formatters.filter(f => f !== formatter);
                    this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
                }
            };
        }
        formatUri(resource, formatting, forceNoTildify) {
            let label = formatting.label.replace(labelMatchingRegexp, (match, token, qsToken, qsValue) => {
                switch (token) {
                    case 'scheme': return resource.scheme;
                    case 'authority': return resource.authority;
                    case 'authoritySuffix': {
                        const i = resource.authority.indexOf('+');
                        return i === -1 ? resource.authority : resource.authority.slice(i + 1);
                    }
                    case 'path':
                        return formatting.stripPathStartingSeparator
                            ? resource.path.slice(resource.path[0] === formatting.separator ? 1 : 0)
                            : resource.path;
                    default: {
                        if (qsToken === 'query') {
                            const { query } = resource;
                            if (query && query[0] === '{' && query[query.length - 1] === '}') {
                                try {
                                    return JSON.parse(query)[qsValue] || '';
                                }
                                catch (_a) { }
                            }
                        }
                        return '';
                    }
                }
            });
            // convert \c:\something => C:\something
            if (formatting.normalizeDriveLetter && hasDriveLetterIgnorePlatform(label)) {
                label = label.charAt(1).toUpperCase() + label.substr(2);
            }
            if (formatting.tildify && !forceNoTildify) {
                if (this.userHome) {
                    label = (0, labels_1.tildify)(label, this.userHome.fsPath, this.os);
                }
            }
            if (formatting.authorityPrefix && resource.authority) {
                label = formatting.authorityPrefix + label;
            }
            return label.replace(sepRegexp, formatting.separator);
        }
        appendWorkspaceSuffix(label, uri) {
            const formatting = this.findFormatting(uri);
            const suffix = formatting && (typeof formatting.workspaceSuffix === 'string') ? formatting.workspaceSuffix : undefined;
            return suffix ? `${label} [${suffix}]` : label;
        }
    };
    LabelService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, pathService_1.IPathService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, storage_1.IStorageService),
        __param(5, lifecycle_2.ILifecycleService)
    ], LabelService);
    exports.LabelService = LabelService;
    (0, extensions_1.registerSingleton)(label_1.ILabelService, LabelService, true);
});
//# sourceMappingURL=labelService.js.map