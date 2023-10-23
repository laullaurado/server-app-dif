"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const vscode_1 = require("vscode");
const repository_1 = require("./repository");
const decorators_1 = require("./decorators");
const util_1 = require("./util");
const path = require("path");
const fs = require("fs");
const nls = require("vscode-nls");
const uri_1 = require("./uri");
const api1_1 = require("./api/api1");
const localize = nls.loadMessageBundle();
class RepositoryPick {
    constructor(repository, index) {
        this.repository = repository;
        this.index = index;
    }
    get label() {
        return path.basename(this.repository.root);
    }
    get description() {
        return [this.repository.headLabel, this.repository.syncLabel]
            .filter(l => !!l)
            .join(' ');
    }
}
__decorate([
    decorators_1.memoize
], RepositoryPick.prototype, "label", null);
__decorate([
    decorators_1.memoize
], RepositoryPick.prototype, "description", null);
class Model {
    constructor(git, askpass, globalState, outputChannelLogger, telemetryReporter) {
        this.git = git;
        this.askpass = askpass;
        this.globalState = globalState;
        this.outputChannelLogger = outputChannelLogger;
        this.telemetryReporter = telemetryReporter;
        this._onDidOpenRepository = new vscode_1.EventEmitter();
        this.onDidOpenRepository = this._onDidOpenRepository.event;
        this._onDidCloseRepository = new vscode_1.EventEmitter();
        this.onDidCloseRepository = this._onDidCloseRepository.event;
        this._onDidChangeRepository = new vscode_1.EventEmitter();
        this.onDidChangeRepository = this._onDidChangeRepository.event;
        this._onDidChangeOriginalResource = new vscode_1.EventEmitter();
        this.onDidChangeOriginalResource = this._onDidChangeOriginalResource.event;
        this.openRepositories = [];
        this.possibleGitRepositoryPaths = new Set();
        this._onDidChangeState = new vscode_1.EventEmitter();
        this.onDidChangeState = this._onDidChangeState.event;
        this._onDidPublish = new vscode_1.EventEmitter();
        this.onDidPublish = this._onDidPublish.event;
        this._state = 'uninitialized';
        this.remoteSourcePublishers = new Set();
        this._onDidAddRemoteSourcePublisher = new vscode_1.EventEmitter();
        this.onDidAddRemoteSourcePublisher = this._onDidAddRemoteSourcePublisher.event;
        this._onDidRemoveRemoteSourcePublisher = new vscode_1.EventEmitter();
        this.onDidRemoveRemoteSourcePublisher = this._onDidRemoveRemoteSourcePublisher.event;
        this.showRepoOnHomeDriveRootWarning = true;
        this.pushErrorHandlers = new Set();
        this.disposables = [];
        vscode_1.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders, this, this.disposables);
        vscode_1.window.onDidChangeVisibleTextEditors(this.onDidChangeVisibleTextEditors, this, this.disposables);
        vscode_1.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this, this.disposables);
        const fsWatcher = vscode_1.workspace.createFileSystemWatcher('**');
        this.disposables.push(fsWatcher);
        const onWorkspaceChange = (0, util_1.anyEvent)(fsWatcher.onDidChange, fsWatcher.onDidCreate, fsWatcher.onDidDelete);
        const onGitRepositoryChange = (0, util_1.filterEvent)(onWorkspaceChange, uri => /\/\.git/.test(uri.path));
        const onPossibleGitRepositoryChange = (0, util_1.filterEvent)(onGitRepositoryChange, uri => !this.getRepository(uri));
        onPossibleGitRepositoryChange(this.onPossibleGitRepositoryChange, this, this.disposables);
        this.setState('uninitialized');
        this.doInitialScan().finally(() => this.setState('initialized'));
    }
    get repositories() { return this.openRepositories.map(r => r.repository); }
    firePublishEvent(repository, branch) {
        this._onDidPublish.fire({ repository: new api1_1.ApiRepository(repository), branch: branch });
    }
    get state() { return this._state; }
    setState(state) {
        this._state = state;
        this._onDidChangeState.fire(state);
        vscode_1.commands.executeCommand('setContext', 'git.state', state);
    }
    get isInitialized() {
        if (this._state === 'initialized') {
            return Promise.resolve();
        }
        return (0, util_1.eventToPromise)((0, util_1.filterEvent)(this.onDidChangeState, s => s === 'initialized'));
    }
    async doInitialScan() {
        await Promise.all([
            this.onDidChangeWorkspaceFolders({ added: vscode_1.workspace.workspaceFolders || [], removed: [] }),
            this.onDidChangeVisibleTextEditors(vscode_1.window.visibleTextEditors),
            this.scanWorkspaceFolders()
        ]);
    }
    /**
     * Scans each workspace folder, looking for git repositories. By
     * default it scans one level deep but that can be changed using
     * the git.repositoryScanMaxDepth setting.
     */
    async scanWorkspaceFolders() {
        const config = vscode_1.workspace.getConfiguration('git');
        const autoRepositoryDetection = config.get('autoRepositoryDetection');
        this.outputChannelLogger.logTrace(`[swsf] Scan workspace sub folders. autoRepositoryDetection=${autoRepositoryDetection}`);
        if (autoRepositoryDetection !== true && autoRepositoryDetection !== 'subFolders') {
            return;
        }
        await Promise.all((vscode_1.workspace.workspaceFolders || []).map(async (folder) => {
            const root = folder.uri.fsPath;
            this.outputChannelLogger.logTrace(`[swsf] Workspace folder: ${root}`);
            // Workspace folder children
            const repositoryScanMaxDepth = (vscode_1.workspace.isTrusted ? vscode_1.workspace.getConfiguration('git', folder.uri) : config).get('repositoryScanMaxDepth', 1);
            const repositoryScanIgnoredFolders = (vscode_1.workspace.isTrusted ? vscode_1.workspace.getConfiguration('git', folder.uri) : config).get('repositoryScanIgnoredFolders', []);
            const subfolders = new Set(await this.traverseWorkspaceFolder(root, repositoryScanMaxDepth, repositoryScanIgnoredFolders));
            // Repository scan folders
            const scanPaths = (vscode_1.workspace.isTrusted ? vscode_1.workspace.getConfiguration('git', folder.uri) : config).get('scanRepositories') || [];
            this.outputChannelLogger.logTrace(`[swsf] Workspace scan settings: repositoryScanMaxDepth=${repositoryScanMaxDepth}; repositoryScanIgnoredFolders=[${repositoryScanIgnoredFolders.join(', ')}]; scanRepositories=[${scanPaths.join(', ')}]`);
            for (const scanPath of scanPaths) {
                if (scanPath === '.git') {
                    this.outputChannelLogger.logTrace('[swsf] \'.git\' not supported in \'git.scanRepositories\' setting.');
                    continue;
                }
                if (path.isAbsolute(scanPath)) {
                    const notSupportedMessage = localize('not supported', "Absolute paths not supported in 'git.scanRepositories' setting.");
                    this.outputChannelLogger.logWarning(notSupportedMessage);
                    console.warn(notSupportedMessage);
                    continue;
                }
                subfolders.add(path.join(root, scanPath));
            }
            this.outputChannelLogger.logTrace(`[swsf] Workspace scan sub folders: [${[...subfolders].join(', ')}]`);
            await Promise.all([...subfolders].map(f => this.openRepository(f)));
        }));
    }
    async traverseWorkspaceFolder(workspaceFolder, maxDepth, repositoryScanIgnoredFolders) {
        const result = [];
        const foldersToTravers = [{ path: workspaceFolder, depth: 0 }];
        while (foldersToTravers.length > 0) {
            const currentFolder = foldersToTravers.shift();
            if (currentFolder.depth < maxDepth || maxDepth === -1) {
                const children = await fs.promises.readdir(currentFolder.path, { withFileTypes: true });
                const childrenFolders = children
                    .filter(dirent => dirent.isDirectory() && dirent.name !== '.git' &&
                    !repositoryScanIgnoredFolders.find(f => (0, util_1.pathEquals)(dirent.name, f)))
                    .map(dirent => path.join(currentFolder.path, dirent.name));
                result.push(...childrenFolders);
                foldersToTravers.push(...childrenFolders.map(folder => {
                    return { path: folder, depth: currentFolder.depth + 1 };
                }));
            }
        }
        return result;
    }
    onPossibleGitRepositoryChange(uri) {
        const config = vscode_1.workspace.getConfiguration('git');
        const autoRepositoryDetection = config.get('autoRepositoryDetection');
        if (autoRepositoryDetection === false) {
            return;
        }
        this.eventuallyScanPossibleGitRepository(uri.fsPath.replace(/\.git.*$/, ''));
    }
    eventuallyScanPossibleGitRepository(path) {
        this.possibleGitRepositoryPaths.add(path);
        this.eventuallyScanPossibleGitRepositories();
    }
    eventuallyScanPossibleGitRepositories() {
        for (const path of this.possibleGitRepositoryPaths) {
            this.openRepository(path);
        }
        this.possibleGitRepositoryPaths.clear();
    }
    async onDidChangeWorkspaceFolders({ added, removed }) {
        const possibleRepositoryFolders = added
            .filter(folder => !this.getOpenRepository(folder.uri));
        const activeRepositoriesList = vscode_1.window.visibleTextEditors
            .map(editor => this.getRepository(editor.document.uri))
            .filter(repository => !!repository);
        const activeRepositories = new Set(activeRepositoriesList);
        const openRepositoriesToDispose = removed
            .map(folder => this.getOpenRepository(folder.uri))
            .filter(r => !!r)
            .filter(r => !activeRepositories.has(r.repository))
            .filter(r => !(vscode_1.workspace.workspaceFolders || []).some(f => (0, util_1.isDescendant)(f.uri.fsPath, r.repository.root)));
        openRepositoriesToDispose.forEach(r => r.dispose());
        this.outputChannelLogger.logTrace(`[swf] Scan workspace folders: [${possibleRepositoryFolders.map(p => p.uri.fsPath).join(', ')}]`);
        await Promise.all(possibleRepositoryFolders.map(p => this.openRepository(p.uri.fsPath)));
    }
    onDidChangeConfiguration() {
        const possibleRepositoryFolders = (vscode_1.workspace.workspaceFolders || [])
            .filter(folder => vscode_1.workspace.getConfiguration('git', folder.uri).get('enabled') === true)
            .filter(folder => !this.getOpenRepository(folder.uri));
        const openRepositoriesToDispose = this.openRepositories
            .map(repository => ({ repository, root: vscode_1.Uri.file(repository.repository.root) }))
            .filter(({ root }) => vscode_1.workspace.getConfiguration('git', root).get('enabled') !== true)
            .map(({ repository }) => repository);
        this.outputChannelLogger.logTrace(`[swf] Scan workspace folders: [${possibleRepositoryFolders.map(p => p.uri.fsPath).join(', ')}]`);
        possibleRepositoryFolders.forEach(p => this.openRepository(p.uri.fsPath));
        openRepositoriesToDispose.forEach(r => r.dispose());
    }
    async onDidChangeVisibleTextEditors(editors) {
        if (!vscode_1.workspace.isTrusted) {
            this.outputChannelLogger.logTrace('[svte] Workspace is not trusted.');
            return;
        }
        const config = vscode_1.workspace.getConfiguration('git');
        const autoRepositoryDetection = config.get('autoRepositoryDetection');
        this.outputChannelLogger.logTrace(`[svte] Scan visible text editors. autoRepositoryDetection=${autoRepositoryDetection}`);
        if (autoRepositoryDetection !== true && autoRepositoryDetection !== 'openEditors') {
            return;
        }
        await Promise.all(editors.map(async (editor) => {
            const uri = editor.document.uri;
            if (uri.scheme !== 'file') {
                return;
            }
            const repository = this.getRepository(uri);
            if (repository) {
                this.outputChannelLogger.logTrace(`[svte] Repository for editor resource ${uri.fsPath} already exists: ${repository.root}`);
                return;
            }
            this.outputChannelLogger.logTrace(`[svte] Open repository for editor resource ${uri.fsPath}`);
            await this.openRepository(path.dirname(uri.fsPath));
        }));
    }
    async openRepository(repoPath) {
        var _a;
        this.outputChannelLogger.logTrace(`Opening repository: ${repoPath}`);
        if (this.getRepository(repoPath)) {
            this.outputChannelLogger.logTrace(`Repository for path ${repoPath} already exists`);
            return;
        }
        const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(repoPath));
        const enabled = config.get('enabled') === true;
        if (!enabled) {
            this.outputChannelLogger.logTrace('Git is not enabled');
            return;
        }
        if (!vscode_1.workspace.isTrusted) {
            // Check if the folder is a bare repo: if it has a file named HEAD && `rev-parse --show -cdup` is empty
            try {
                fs.accessSync(path.join(repoPath, 'HEAD'), fs.constants.F_OK);
                const result = await this.git.exec(repoPath, ['-C', repoPath, 'rev-parse', '--show-cdup']);
                if (result.stderr.trim() === '' && result.stdout.trim() === '') {
                    this.outputChannelLogger.logTrace(`Bare repository: ${repoPath}`);
                    return;
                }
            }
            catch (_b) {
                // If this throw, we should be good to open the repo (e.g. HEAD doesn't exist)
            }
        }
        try {
            const rawRoot = await this.git.getRepositoryRoot(repoPath);
            // This can happen whenever `path` has the wrong case sensitivity in
            // case insensitive file systems
            // https://github.com/microsoft/vscode/issues/33498
            const repositoryRoot = vscode_1.Uri.file(rawRoot).fsPath;
            this.outputChannelLogger.logTrace(`Repository root: ${repositoryRoot}`);
            if (this.getRepository(repositoryRoot)) {
                this.outputChannelLogger.logTrace(`Repository for path ${repositoryRoot} already exists`);
                return;
            }
            if (this.shouldRepositoryBeIgnored(rawRoot)) {
                this.outputChannelLogger.logTrace(`Repository for path ${repositoryRoot} is ignored`);
                return;
            }
            // On Window, opening a git repository from the root of the HOMEDRIVE poses a security risk.
            // We will only a open git repository from the root of the HOMEDRIVE if the user explicitly
            // opens the HOMEDRIVE as a folder. Only show the warning once during repository discovery.
            if (process.platform === 'win32' && process.env.HOMEDRIVE && (0, util_1.pathEquals)(`${process.env.HOMEDRIVE}\\`, repositoryRoot)) {
                const isRepoInWorkspaceFolders = ((_a = vscode_1.workspace.workspaceFolders) !== null && _a !== void 0 ? _a : []).find(f => (0, util_1.pathEquals)(f.uri.fsPath, repositoryRoot));
                if (!isRepoInWorkspaceFolders) {
                    if (this.showRepoOnHomeDriveRootWarning) {
                        vscode_1.window.showWarningMessage(localize('repoOnHomeDriveRootWarning', "Unable to automatically open the git repository at '{0}'. To open that git repository, open it directly as a folder in VS Code.", repositoryRoot));
                        this.showRepoOnHomeDriveRootWarning = false;
                    }
                    this.outputChannelLogger.logTrace(`Repository for path ${repositoryRoot} is on the root of the HOMEDRIVE`);
                    return;
                }
            }
            const dotGit = await this.git.getRepositoryDotGit(repositoryRoot);
            const repository = new repository_1.Repository(this.git.open(repositoryRoot, dotGit), this, this, this.globalState, this.outputChannelLogger, this.telemetryReporter);
            this.open(repository);
            repository.status(); // do not await this, we want SCM to know about the repo asap
        }
        catch (ex) {
            // noop
            this.outputChannelLogger.logTrace(`Opening repository for path='${repoPath}' failed; ex=${ex}`);
        }
    }
    shouldRepositoryBeIgnored(repositoryRoot) {
        const config = vscode_1.workspace.getConfiguration('git');
        const ignoredRepos = config.get('ignoredRepositories') || [];
        for (const ignoredRepo of ignoredRepos) {
            if (path.isAbsolute(ignoredRepo)) {
                if ((0, util_1.pathEquals)(ignoredRepo, repositoryRoot)) {
                    return true;
                }
            }
            else {
                for (const folder of vscode_1.workspace.workspaceFolders || []) {
                    if ((0, util_1.pathEquals)(path.join(folder.uri.fsPath, ignoredRepo), repositoryRoot)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    open(repository) {
        this.outputChannelLogger.logInfo(`Open repository: ${repository.root}`);
        const onDidDisappearRepository = (0, util_1.filterEvent)(repository.onDidChangeState, state => state === 1 /* RepositoryState.Disposed */);
        const disappearListener = onDidDisappearRepository(() => dispose());
        const changeListener = repository.onDidChangeRepository(uri => this._onDidChangeRepository.fire({ repository, uri }));
        const originalResourceChangeListener = repository.onDidChangeOriginalResource(uri => this._onDidChangeOriginalResource.fire({ repository, uri }));
        const shouldDetectSubmodules = vscode_1.workspace
            .getConfiguration('git', vscode_1.Uri.file(repository.root))
            .get('detectSubmodules');
        const submodulesLimit = vscode_1.workspace
            .getConfiguration('git', vscode_1.Uri.file(repository.root))
            .get('detectSubmodulesLimit');
        const checkForSubmodules = () => {
            if (!shouldDetectSubmodules) {
                return;
            }
            if (repository.submodules.length > submodulesLimit) {
                vscode_1.window.showWarningMessage(localize('too many submodules', "The '{0}' repository has {1} submodules which won't be opened automatically. You can still open each one individually by opening a file within.", path.basename(repository.root), repository.submodules.length));
                statusListener.dispose();
            }
            repository.submodules
                .slice(0, submodulesLimit)
                .map(r => path.join(repository.root, r.path))
                .forEach(p => this.eventuallyScanPossibleGitRepository(p));
        };
        const statusListener = repository.onDidRunGitStatus(checkForSubmodules);
        checkForSubmodules();
        const dispose = () => {
            disappearListener.dispose();
            changeListener.dispose();
            originalResourceChangeListener.dispose();
            statusListener.dispose();
            repository.dispose();
            this.openRepositories = this.openRepositories.filter(e => e !== openRepository);
            this._onDidCloseRepository.fire(repository);
        };
        const openRepository = { repository, dispose };
        this.openRepositories.push(openRepository);
        this._onDidOpenRepository.fire(repository);
    }
    close(repository) {
        const openRepository = this.getOpenRepository(repository);
        if (!openRepository) {
            return;
        }
        this.outputChannelLogger.logInfo(`Close repository: ${repository.root}`);
        openRepository.dispose();
    }
    async pickRepository() {
        if (this.openRepositories.length === 0) {
            throw new Error(localize('no repositories', "There are no available repositories"));
        }
        const picks = this.openRepositories.map((e, index) => new RepositoryPick(e.repository, index));
        const active = vscode_1.window.activeTextEditor;
        const repository = active && this.getRepository(active.document.fileName);
        const index = picks.findIndex(pick => pick.repository === repository);
        // Move repository pick containing the active text editor to appear first
        if (index > -1) {
            picks.unshift(...picks.splice(index, 1));
        }
        const placeHolder = localize('pick repo', "Choose a repository");
        const pick = await vscode_1.window.showQuickPick(picks, { placeHolder });
        return pick && pick.repository;
    }
    getRepository(hint) {
        const liveRepository = this.getOpenRepository(hint);
        return liveRepository && liveRepository.repository;
    }
    getOpenRepository(hint) {
        if (!hint) {
            return undefined;
        }
        if (hint instanceof repository_1.Repository) {
            return this.openRepositories.filter(r => r.repository === hint)[0];
        }
        if (typeof hint === 'string') {
            hint = vscode_1.Uri.file(hint);
        }
        if (hint instanceof vscode_1.Uri) {
            let resourcePath;
            if (hint.scheme === 'git') {
                resourcePath = (0, uri_1.fromGitUri)(hint).path;
            }
            else {
                resourcePath = hint.fsPath;
            }
            outer: for (const liveRepository of this.openRepositories.sort((a, b) => b.repository.root.length - a.repository.root.length)) {
                if (!(0, util_1.isDescendant)(liveRepository.repository.root, resourcePath)) {
                    continue;
                }
                for (const submodule of liveRepository.repository.submodules) {
                    const submoduleRoot = path.join(liveRepository.repository.root, submodule.path);
                    if ((0, util_1.isDescendant)(submoduleRoot, resourcePath)) {
                        continue outer;
                    }
                }
                return liveRepository;
            }
            return undefined;
        }
        for (const liveRepository of this.openRepositories) {
            const repository = liveRepository.repository;
            if (hint === repository.sourceControl) {
                return liveRepository;
            }
            if (hint === repository.mergeGroup || hint === repository.indexGroup || hint === repository.workingTreeGroup) {
                return liveRepository;
            }
        }
        return undefined;
    }
    getRepositoryForSubmodule(submoduleUri) {
        for (const repository of this.repositories) {
            for (const submodule of repository.submodules) {
                const submodulePath = path.join(repository.root, submodule.path);
                if (submodulePath === submoduleUri.fsPath) {
                    return repository;
                }
            }
        }
        return undefined;
    }
    registerRemoteSourcePublisher(publisher) {
        this.remoteSourcePublishers.add(publisher);
        this._onDidAddRemoteSourcePublisher.fire(publisher);
        return (0, util_1.toDisposable)(() => {
            this.remoteSourcePublishers.delete(publisher);
            this._onDidRemoveRemoteSourcePublisher.fire(publisher);
        });
    }
    getRemoteSourcePublishers() {
        return [...this.remoteSourcePublishers.values()];
    }
    registerCredentialsProvider(provider) {
        return this.askpass.registerCredentialsProvider(provider);
    }
    registerPushErrorHandler(handler) {
        this.pushErrorHandlers.add(handler);
        return (0, util_1.toDisposable)(() => this.pushErrorHandlers.delete(handler));
    }
    getPushErrorHandlers() {
        return [...this.pushErrorHandlers];
    }
    dispose() {
        const openRepositories = [...this.openRepositories];
        openRepositories.forEach(r => r.dispose());
        this.openRepositories = [];
        this.possibleGitRepositoryPaths.clear();
        this.disposables = (0, util_1.dispose)(this.disposables);
    }
}
__decorate([
    decorators_1.memoize
], Model.prototype, "isInitialized", null);
__decorate([
    (0, decorators_1.debounce)(500)
], Model.prototype, "eventuallyScanPossibleGitRepositories", null);
__decorate([
    decorators_1.sequentialize
], Model.prototype, "openRepository", null);
exports.Model = Model;
//# sourceMappingURL=model.js.map