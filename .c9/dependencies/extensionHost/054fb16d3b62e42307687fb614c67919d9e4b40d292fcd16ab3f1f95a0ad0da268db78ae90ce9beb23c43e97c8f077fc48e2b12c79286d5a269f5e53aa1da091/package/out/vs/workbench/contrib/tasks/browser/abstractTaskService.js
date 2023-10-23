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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/json", "vs/base/common/uri", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/types", "vs/base/common/parsers", "vs/base/common/glob", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/map", "vs/platform/markers/common/markers", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/storage/common/storage", "vs/platform/progress/common/progress", "vs/platform/opener/common/opener", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/model", "vs/workbench/contrib/markers/common/markers", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/tasks/common/taskSystem", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/taskTemplates", "../common/taskConfiguration", "./terminalTaskSystem", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/browser/runAutomaticTasks", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService", "vs/base/common/jsonFormatter", "vs/editor/common/services/resolverService", "vs/workbench/common/editor", "vs/workbench/services/preferences/common/preferences", "vs/base/common/cancellation", "vs/workbench/common/views", "vs/workbench/contrib/tasks/browser/taskQuickPick", "vs/platform/log/common/log", "vs/base/common/functional", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/contextkeys", "vs/base/common/network", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, nls, severity_1, Objects, resources, json, uri_1, actions_1, lifecycle_1, event_1, Types, parsers_1, glob, UUID, Platform, map_1, markers_1, telemetry_1, configuration_1, files_1, extensions_1, commands_1, problemMatcher_1, storage_1, progress_1, opener_1, notification_1, dialogs_1, model_1, markers_2, editorService_1, configurationResolver_1, workspace_1, textfiles_1, output_1, terminal_1, terminal_2, taskSystem_1, tasks_1, taskService_1, taskTemplates_1, TaskConfig, terminalTaskSystem_1, quickInput_1, taskDefinitionRegistry_1, contextkey_1, runAutomaticTasks_1, environmentService_1, pathService_1, jsonFormatter_1, resolverService_1, editor_1, preferences_1, cancellation_1, views_1, taskQuickPick_1, log_1, functional_1, themeService_1, workspaceTrust_1, contextkeys_1, network_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTaskService = exports.ConfigureTaskAction = void 0;
    const QUICKOPEN_HISTORY_LIMIT_CONFIG = 'task.quickOpen.history';
    const PROBLEM_MATCHER_NEVER_CONFIG = 'task.problemMatchers.neverPrompt';
    const USE_SLOW_PICKER = 'task.quickOpen.showAll';
    var ConfigureTaskAction;
    (function (ConfigureTaskAction) {
        ConfigureTaskAction.ID = 'workbench.action.tasks.configureTaskRunner';
        ConfigureTaskAction.TEXT = nls.localize('ConfigureTaskRunnerAction.label', "Configure Task");
    })(ConfigureTaskAction = exports.ConfigureTaskAction || (exports.ConfigureTaskAction = {}));
    class ProblemReporter {
        constructor(_outputChannel) {
            this._outputChannel = _outputChannel;
            this._validationStatus = new parsers_1.ValidationStatus();
        }
        info(message) {
            this._validationStatus.state = 1 /* ValidationState.Info */;
            this._outputChannel.append(message + '\n');
        }
        warn(message) {
            this._validationStatus.state = 2 /* ValidationState.Warning */;
            this._outputChannel.append(message + '\n');
        }
        error(message) {
            this._validationStatus.state = 3 /* ValidationState.Error */;
            this._outputChannel.append(message + '\n');
        }
        fatal(message) {
            this._validationStatus.state = 4 /* ValidationState.Fatal */;
            this._outputChannel.append(message + '\n');
        }
        get status() {
            return this._validationStatus;
        }
    }
    class TaskMap {
        constructor() {
            this._store = new Map();
        }
        forEach(callback) {
            this._store.forEach(callback);
        }
        static getKey(workspaceFolder) {
            let key;
            if (Types.isString(workspaceFolder)) {
                key = workspaceFolder;
            }
            else {
                const uri = (0, taskQuickPick_1.isWorkspaceFolder)(workspaceFolder) ? workspaceFolder.uri : workspaceFolder.configuration;
                key = uri ? uri.toString() : '';
            }
            return key;
        }
        get(workspaceFolder) {
            const key = TaskMap.getKey(workspaceFolder);
            let result = this._store.get(key);
            if (!result) {
                result = [];
                this._store.set(key, result);
            }
            return result;
        }
        add(workspaceFolder, ...task) {
            const key = TaskMap.getKey(workspaceFolder);
            let values = this._store.get(key);
            if (!values) {
                values = [];
                this._store.set(key, values);
            }
            values.push(...task);
        }
        all() {
            let result = [];
            this._store.forEach((values) => result.push(...values));
            return result;
        }
    }
    let AbstractTaskService = class AbstractTaskService extends lifecycle_1.Disposable {
        constructor(configurationService, markerService, outputService, paneCompositeService, viewsService, commandService, editorService, fileService, contextService, telemetryService, textFileService, modelService, extensionService, quickInputService, configurationResolverService, terminalService, terminalGroupService, storageService, progressService, openerService, dialogService, notificationService, contextKeyService, environmentService, terminalProfileResolverService, pathService, textModelResolverService, preferencesService, viewDescriptorService, workspaceTrustRequestService, workspaceTrustManagementService, logService) {
            super();
            this.configurationService = configurationService;
            this.markerService = markerService;
            this.outputService = outputService;
            this.paneCompositeService = paneCompositeService;
            this.viewsService = viewsService;
            this.commandService = commandService;
            this.editorService = editorService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.textFileService = textFileService;
            this.modelService = modelService;
            this.extensionService = extensionService;
            this.quickInputService = quickInputService;
            this.configurationResolverService = configurationResolverService;
            this.terminalService = terminalService;
            this.terminalGroupService = terminalGroupService;
            this.storageService = storageService;
            this.progressService = progressService;
            this.openerService = openerService;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.contextKeyService = contextKeyService;
            this.environmentService = environmentService;
            this.terminalProfileResolverService = terminalProfileResolverService;
            this.pathService = pathService;
            this.textModelResolverService = textModelResolverService;
            this.preferencesService = preferencesService;
            this.viewDescriptorService = viewDescriptorService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.logService = logService;
            this._onDidRegisterSupportedExecutions = new event_1.Emitter();
            this._onDidChangeTaskSystemInfo = new event_1.Emitter();
            this.onDidChangeTaskSystemInfo = this._onDidChangeTaskSystemInfo.event;
            this._workspaceTasksPromise = undefined;
            this._taskSystem = undefined;
            this._taskSystemListener = undefined;
            this._outputChannel = this.outputService.getChannel(AbstractTaskService.OutputChannelId);
            this._providers = new Map();
            this._providerTypes = new Map();
            this._taskSystemInfos = new Map();
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                let folderSetup = this.computeWorkspaceFolderSetup();
                if (this.executionEngine !== folderSetup[2]) {
                    this.disposeTaskSystemListeners();
                    this._taskSystem = undefined;
                }
                this.updateSetup(folderSetup);
                return this.updateWorkspaceTasks(2 /* TaskRunSource.FolderOpen */);
            }));
            this._register(this.configurationService.onDidChangeConfiguration(() => {
                if (!this._taskSystem && !this._workspaceTasksPromise) {
                    return;
                }
                if (!this._taskSystem || this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                    this._outputChannel.clear();
                }
                this.setTaskLRUCacheLimit();
                return this.updateWorkspaceTasks(3 /* TaskRunSource.ConfigurationChange */);
            }));
            this._taskRunningState = tasks_1.TASK_RUNNING_STATE.bindTo(contextKeyService);
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.registerCommands();
            this.configurationResolverService.contributeVariable('defaultBuildTask', async () => {
                let tasks = await this.getTasksForGroup(tasks_1.TaskGroup.Build);
                if (tasks.length > 0) {
                    let { none, defaults } = this.splitPerGroupType(tasks);
                    if (defaults.length === 1) {
                        return defaults[0]._label;
                    }
                    else if (defaults.length + none.length > 0) {
                        tasks = defaults.concat(none);
                    }
                }
                let entry;
                if (tasks && tasks.length > 0) {
                    entry = await this.showQuickPick(tasks, nls.localize('TaskService.pickBuildTaskForLabel', 'Select the build task (there is no default build task defined)'));
                }
                let task = entry ? entry.task : undefined;
                if (!task) {
                    return undefined;
                }
                return task._label;
            });
            this._waitForSupportedExecutions = new Promise(resolve => {
                (0, functional_1.once)(this._onDidRegisterSupportedExecutions.event)(() => resolve());
            });
            this.upgrade();
        }
        registerSupportedExecutions(custom, shell, process) {
            if (custom !== undefined) {
                const customContext = taskService_1.CustomExecutionSupportedContext.bindTo(this.contextKeyService);
                customContext.set(custom);
            }
            const isVirtual = !!contextkeys_1.VirtualWorkspaceContext.getValue(this.contextKeyService);
            if (shell !== undefined) {
                const shellContext = taskService_1.ShellExecutionSupportedContext.bindTo(this.contextKeyService);
                shellContext.set(shell && !isVirtual);
            }
            if (process !== undefined) {
                const processContext = taskService_1.ProcessExecutionSupportedContext.bindTo(this.contextKeyService);
                processContext.set(process && !isVirtual);
            }
            this._onDidRegisterSupportedExecutions.fire();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        get supportsMultipleTaskExecutions() {
            return this.inTerminal();
        }
        registerCommands() {
            commands_1.CommandsRegistry.registerCommand({
                id: 'workbench.action.tasks.runTask',
                handler: async (accessor, arg) => {
                    if (await this.trust()) {
                        this.runTaskCommand(arg);
                    }
                },
                description: {
                    description: 'Run Task',
                    args: [{
                            name: 'args',
                            schema: {
                                'type': 'string',
                            }
                        }]
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.reRunTask', async (accessor, arg) => {
                if (await this.trust()) {
                    this.reRunTaskCommand();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.restartTask', async (accessor, arg) => {
                if (await this.trust()) {
                    this.runRestartTaskCommand(arg);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.terminate', async (accessor, arg) => {
                if (await this.trust()) {
                    this.runTerminateCommand(arg);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showLog', () => {
                if (!this.canRunCommand()) {
                    return;
                }
                this.showOutput();
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.build', async () => {
                if (!this.canRunCommand()) {
                    return;
                }
                if (await this.trust()) {
                    this.runBuildCommand();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.test', async () => {
                if (!this.canRunCommand()) {
                    return;
                }
                if (await this.trust()) {
                    this.runTestCommand();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureTaskRunner', async () => {
                if (await this.trust()) {
                    this.runConfigureTasks();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultBuildTask', async () => {
                if (await this.trust()) {
                    this.runConfigureDefaultBuildTask();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultTestTask', async () => {
                if (await this.trust()) {
                    this.runConfigureDefaultTestTask();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showTasks', async () => {
                if (await this.trust()) {
                    return this.runShowTasks();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.toggleProblems', () => this.commandService.executeCommand(markers_2.Markers.TOGGLE_MARKERS_VIEW_ACTION_ID));
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.openUserTasks', async () => {
                const resource = this.getResourceForKind(tasks_1.TaskSourceKind.User);
                if (resource) {
                    this.openTaskFile(resource, tasks_1.TaskSourceKind.User);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.openWorkspaceFileTasks', async () => {
                const resource = this.getResourceForKind(tasks_1.TaskSourceKind.WorkspaceFile);
                if (resource) {
                    this.openTaskFile(resource, tasks_1.TaskSourceKind.WorkspaceFile);
                }
            });
        }
        get workspaceFolders() {
            if (!this._workspaceFolders) {
                this.updateSetup();
            }
            return this._workspaceFolders;
        }
        get ignoredWorkspaceFolders() {
            if (!this._ignoredWorkspaceFolders) {
                this.updateSetup();
            }
            return this._ignoredWorkspaceFolders;
        }
        get executionEngine() {
            if (this._executionEngine === undefined) {
                this.updateSetup();
            }
            return this._executionEngine;
        }
        get schemaVersion() {
            if (this._schemaVersion === undefined) {
                this.updateSetup();
            }
            return this._schemaVersion;
        }
        get showIgnoreMessage() {
            if (this._showIgnoreMessage === undefined) {
                this._showIgnoreMessage = !this.storageService.getBoolean(AbstractTaskService.IgnoreTask010DonotShowAgain_key, 1 /* StorageScope.WORKSPACE */, false);
            }
            return this._showIgnoreMessage;
        }
        _getActivationEvents(type) {
            const result = [];
            result.push('onCommand:workbench.action.tasks.runTask');
            if (type) {
                // send a specific activation event for this task type
                result.push(`onTaskType:${type}`);
            }
            else {
                // send activation events for all task types
                for (const definition of taskDefinitionRegistry_1.TaskDefinitionRegistry.all()) {
                    result.push(`onTaskType:${definition.taskType}`);
                }
            }
            return result;
        }
        async _activateTaskProviders(type) {
            // We need to first wait for extensions to be registered because we might read
            // the `TaskDefinitionRegistry` in case `type` is `undefined`
            await this.extensionService.whenInstalledExtensionsRegistered();
            await Promise.all(this._getActivationEvents(type).map(activationEvent => this.extensionService.activateByEvent(activationEvent)));
        }
        updateSetup(setup) {
            if (!setup) {
                setup = this.computeWorkspaceFolderSetup();
            }
            this._workspaceFolders = setup[0];
            if (this._ignoredWorkspaceFolders) {
                if (this._ignoredWorkspaceFolders.length !== setup[1].length) {
                    this._showIgnoreMessage = undefined;
                }
                else {
                    let set = new Set();
                    this._ignoredWorkspaceFolders.forEach(folder => set.add(folder.uri.toString()));
                    for (let folder of setup[1]) {
                        if (!set.has(folder.uri.toString())) {
                            this._showIgnoreMessage = undefined;
                            break;
                        }
                    }
                }
            }
            this._ignoredWorkspaceFolders = setup[1];
            this._executionEngine = setup[2];
            this._schemaVersion = setup[3];
            this._workspace = setup[4];
        }
        showOutput(runSource = 1 /* TaskRunSource.User */) {
            if (!contextkeys_1.VirtualWorkspaceContext.getValue(this.contextKeyService) && ((runSource === 1 /* TaskRunSource.User */) || (runSource === 3 /* TaskRunSource.ConfigurationChange */))) {
                this.notificationService.prompt(severity_1.default.Warning, nls.localize('taskServiceOutputPrompt', 'There are task errors. See the output for details.'), [{
                        label: nls.localize('showOutput', "Show output"),
                        run: () => {
                            this.outputService.showChannel(this._outputChannel.id, true);
                        }
                    }]);
            }
        }
        disposeTaskSystemListeners() {
            if (this._taskSystemListener) {
                this._taskSystemListener.dispose();
            }
        }
        registerTaskProvider(provider, type) {
            if (!provider) {
                return {
                    dispose: () => { }
                };
            }
            let handle = AbstractTaskService.nextHandle++;
            this._providers.set(handle, provider);
            this._providerTypes.set(handle, type);
            return {
                dispose: () => {
                    this._providers.delete(handle);
                    this._providerTypes.delete(handle);
                }
            };
        }
        get hasTaskSystemInfo() {
            let infosCount = Array.from(this._taskSystemInfos.values()).flat().length;
            // If there's a remoteAuthority, then we end up with 2 taskSystemInfos,
            // one for each extension host.
            if (this.environmentService.remoteAuthority) {
                return infosCount > 1;
            }
            return infosCount > 0;
        }
        registerTaskSystem(key, info) {
            // Ideally the Web caller of registerRegisterTaskSystem would use the correct key.
            // However, the caller doesn't know about the workspace folders at the time of the call, even though we know about them here.
            if (info.platform === 0 /* Platform.Platform.Web */) {
                key = this.workspaceFolders.length ? this.workspaceFolders[0].uri.scheme : key;
            }
            if (!this._taskSystemInfos.has(key)) {
                this._taskSystemInfos.set(key, [info]);
            }
            else {
                const infos = this._taskSystemInfos.get(key);
                if (info.platform === 0 /* Platform.Platform.Web */) {
                    // Web infos should be pushed last.
                    infos.push(info);
                }
                else {
                    infos.unshift(info);
                }
            }
            if (this.hasTaskSystemInfo) {
                this._onDidChangeTaskSystemInfo.fire();
            }
        }
        getTaskSystemInfo(key) {
            const infos = this._taskSystemInfos.get(key);
            return (infos && infos.length) ? infos[0] : undefined;
        }
        extensionCallbackTaskComplete(task, result) {
            if (!this._taskSystem) {
                return Promise.resolve();
            }
            return this._taskSystem.customExecutionComplete(task, result);
        }
        /**
         * Get a subset of workspace tasks that match a certain predicate.
         */
        async _findWorkspaceTasks(predicate) {
            const result = [];
            const tasks = await this.getWorkspaceTasks();
            for (const [, workspaceTasks] of tasks) {
                if (workspaceTasks.configurations) {
                    for (const taskName in workspaceTasks.configurations.byIdentifier) {
                        const task = workspaceTasks.configurations.byIdentifier[taskName];
                        if (predicate(task, workspaceTasks.workspaceFolder)) {
                            result.push(task);
                        }
                    }
                }
                if (workspaceTasks.set) {
                    for (const task of workspaceTasks.set.tasks) {
                        if (predicate(task, workspaceTasks.workspaceFolder)) {
                            result.push(task);
                        }
                    }
                }
            }
            return result;
        }
        async _findWorkspaceTasksInGroup(group, isDefault) {
            return this._findWorkspaceTasks((task) => {
                const taskGroup = task.configurationProperties.group;
                if (taskGroup && typeof taskGroup !== 'string') {
                    return (taskGroup._id === group._id && (!isDefault || !!taskGroup.isDefault));
                }
                return false;
            });
        }
        async getTask(folder, identifier, compareId = false) {
            if (!(await this.trust())) {
                return;
            }
            const name = Types.isString(folder) ? folder : (0, taskQuickPick_1.isWorkspaceFolder)(folder) ? folder.name : folder.configuration ? resources.basename(folder.configuration) : undefined;
            if (this.ignoredWorkspaceFolders.some(ignored => ignored.name === name)) {
                return Promise.reject(new Error(nls.localize('TaskServer.folderIgnored', 'The folder {0} is ignored since it uses task version 0.1.0', name)));
            }
            const key = !Types.isString(identifier)
                ? tasks_1.TaskDefinition.createTaskIdentifier(identifier, console)
                : identifier;
            if (key === undefined) {
                return Promise.resolve(undefined);
            }
            // Try to find the task in the workspace
            const requestedFolder = TaskMap.getKey(folder);
            const matchedTasks = await this._findWorkspaceTasks((task, workspaceFolder) => {
                const taskFolder = TaskMap.getKey(workspaceFolder);
                if (taskFolder !== requestedFolder && taskFolder !== tasks_1.USER_TASKS_GROUP_KEY) {
                    return false;
                }
                return task.matches(key, compareId);
            });
            matchedTasks.sort(task => task._source.kind === tasks_1.TaskSourceKind.Extension ? 1 : -1);
            if (matchedTasks.length > 0) {
                // Nice, we found a configured task!
                const task = matchedTasks[0];
                if (tasks_1.ConfiguringTask.is(task)) {
                    return this.tryResolveTask(task);
                }
                else {
                    return task;
                }
            }
            // We didn't find the task, so we need to ask all resolvers about it
            return this.getGroupedTasks().then((map) => {
                let values = map.get(folder);
                values = values.concat(map.get(tasks_1.USER_TASKS_GROUP_KEY));
                if (!values) {
                    return undefined;
                }
                values = values.filter(task => task.matches(key, compareId)).sort(task => task._source.kind === tasks_1.TaskSourceKind.Extension ? 1 : -1);
                return values.length > 0 ? values[0] : undefined;
            });
        }
        async tryResolveTask(configuringTask) {
            if (!(await this.trust())) {
                return;
            }
            await this._activateTaskProviders(configuringTask.type);
            let matchingProvider;
            let matchingProviderUnavailable = false;
            for (const [handle, provider] of this._providers) {
                const providerType = this._providerTypes.get(handle);
                if (configuringTask.type === providerType) {
                    if (providerType && !this.isTaskProviderEnabled(providerType)) {
                        matchingProviderUnavailable = true;
                        continue;
                    }
                    matchingProvider = provider;
                    break;
                }
            }
            if (!matchingProvider) {
                if (matchingProviderUnavailable) {
                    this._outputChannel.append(nls.localize('TaskService.providerUnavailable', 'Warning: {0} tasks are unavailable in the current environment.\n', configuringTask.configures.type));
                }
                return;
            }
            // Try to resolve the task first
            try {
                const resolvedTask = await matchingProvider.resolveTask(configuringTask);
                if (resolvedTask && (resolvedTask._id === configuringTask._id)) {
                    return TaskConfig.createCustomTask(resolvedTask, configuringTask);
                }
            }
            catch (error) {
                // Ignore errors. The task could not be provided by any of the providers.
            }
            // The task couldn't be resolved. Instead, use the less efficient provideTask.
            const tasks = await this.tasks({ type: configuringTask.type });
            for (const task of tasks) {
                if (task._id === configuringTask._id) {
                    return TaskConfig.createCustomTask(task, configuringTask);
                }
            }
            return;
        }
        async tasks(filter) {
            if (!(await this.trust())) {
                return [];
            }
            if (!this.versionAndEngineCompatible(filter)) {
                return Promise.resolve([]);
            }
            return this.getGroupedTasks(filter ? filter.type : undefined).then((map) => {
                if (!filter || !filter.type) {
                    return map.all();
                }
                let result = [];
                map.forEach((tasks) => {
                    for (let task of tasks) {
                        if (tasks_1.ContributedTask.is(task) && ((task.defines.type === filter.type) || (task._source.label === filter.type))) {
                            result.push(task);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            if (task.type === filter.type) {
                                result.push(task);
                            }
                            else {
                                let customizes = task.customizes();
                                if (customizes && customizes.type === filter.type) {
                                    result.push(task);
                                }
                            }
                        }
                    }
                });
                return result;
            });
        }
        taskTypes() {
            const types = [];
            if (this.isProvideTasksEnabled()) {
                for (const definition of taskDefinitionRegistry_1.TaskDefinitionRegistry.all()) {
                    if (this.isTaskProviderEnabled(definition.taskType)) {
                        types.push(definition.taskType);
                    }
                }
            }
            return types;
        }
        createSorter() {
            return new tasks_1.TaskSorter(this.contextService.getWorkspace() ? this.contextService.getWorkspace().folders : []);
        }
        isActive() {
            if (!this._taskSystem) {
                return Promise.resolve(false);
            }
            return this._taskSystem.isActive();
        }
        async getActiveTasks() {
            if (!this._taskSystem) {
                return [];
            }
            return this._taskSystem.getActiveTasks();
        }
        async getBusyTasks() {
            if (!this._taskSystem) {
                return [];
            }
            return this._taskSystem.getBusyTasks();
        }
        getRecentlyUsedTasksV1() {
            if (this._recentlyUsedTasksV1) {
                return this._recentlyUsedTasksV1;
            }
            const quickOpenHistoryLimit = this.configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            this._recentlyUsedTasksV1 = new map_1.LRUCache(quickOpenHistoryLimit);
            let storageValue = this.storageService.get(AbstractTaskService.RecentlyUsedTasks_Key, 1 /* StorageScope.WORKSPACE */);
            if (storageValue) {
                try {
                    let values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (let value of values) {
                            this._recentlyUsedTasksV1.set(value, value);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._recentlyUsedTasksV1;
        }
        getRecentlyUsedTasks() {
            if (this._recentlyUsedTasks) {
                return this._recentlyUsedTasks;
            }
            const quickOpenHistoryLimit = this.configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            this._recentlyUsedTasks = new map_1.LRUCache(quickOpenHistoryLimit);
            let storageValue = this.storageService.get(AbstractTaskService.RecentlyUsedTasks_KeyV2, 1 /* StorageScope.WORKSPACE */);
            if (storageValue) {
                try {
                    let values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (let value of values) {
                            this._recentlyUsedTasks.set(value[0], value[1]);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._recentlyUsedTasks;
        }
        getFolderFromTaskKey(key) {
            var _a;
            const keyValue = JSON.parse(key);
            return {
                folder: keyValue.folder, isWorkspaceFile: (_a = keyValue.id) === null || _a === void 0 ? void 0 : _a.endsWith(tasks_1.TaskSourceKind.WorkspaceFile)
            };
        }
        async readRecentTasks() {
            const folderMap = Object.create(null);
            this.workspaceFolders.forEach(folder => {
                folderMap[folder.uri.toString()] = folder;
            });
            const folderToTasksMap = new Map();
            const workspaceToTaskMap = new Map();
            const recentlyUsedTasks = this.getRecentlyUsedTasks();
            const tasks = [];
            function addTaskToMap(map, folder, task) {
                if (folder && !map.has(folder)) {
                    map.set(folder, []);
                }
                if (folder && (folderMap[folder] || (folder === tasks_1.USER_TASKS_GROUP_KEY)) && task) {
                    map.get(folder).push(task);
                }
            }
            for (const entry of recentlyUsedTasks.entries()) {
                const key = entry[0];
                const task = JSON.parse(entry[1]);
                const folderInfo = this.getFolderFromTaskKey(key);
                addTaskToMap(folderInfo.isWorkspaceFile ? workspaceToTaskMap : folderToTasksMap, folderInfo.folder, task);
            }
            const readTasksMap = new Map();
            async function readTasks(that, map, isWorkspaceFile) {
                var _a;
                for (const key of map.keys()) {
                    let custom = [];
                    let customized = Object.create(null);
                    const taskConfigSource = (folderMap[key]
                        ? (isWorkspaceFile
                            ? TaskConfig.TaskConfigSource.WorkspaceFile : TaskConfig.TaskConfigSource.TasksJson)
                        : TaskConfig.TaskConfigSource.User);
                    await that.computeTasksForSingleConfig((_a = folderMap[key]) !== null && _a !== void 0 ? _a : await that.getAFolder(), {
                        version: '2.0.0',
                        tasks: map.get(key)
                    }, 0 /* TaskRunSource.System */, custom, customized, taskConfigSource, true);
                    custom.forEach(task => {
                        const taskKey = task.getRecentlyUsedKey();
                        if (taskKey) {
                            readTasksMap.set(taskKey, task);
                        }
                    });
                    for (const configuration in customized) {
                        const taskKey = customized[configuration].getRecentlyUsedKey();
                        if (taskKey) {
                            readTasksMap.set(taskKey, customized[configuration]);
                        }
                    }
                }
            }
            await readTasks(this, folderToTasksMap, false);
            await readTasks(this, workspaceToTaskMap, true);
            for (const key of recentlyUsedTasks.keys()) {
                if (readTasksMap.has(key)) {
                    tasks.push(readTasksMap.get(key));
                }
            }
            return tasks;
        }
        removeRecentlyUsedTask(taskRecentlyUsedKey) {
            if (this.getRecentlyUsedTasks().has(taskRecentlyUsedKey)) {
                this.getRecentlyUsedTasks().delete(taskRecentlyUsedKey);
                this.saveRecentlyUsedTasks();
            }
        }
        setTaskLRUCacheLimit() {
            const quickOpenHistoryLimit = this.configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            if (this._recentlyUsedTasks) {
                this._recentlyUsedTasks.limit = quickOpenHistoryLimit;
            }
        }
        async setRecentlyUsedTask(task) {
            var _a;
            let key = task.getRecentlyUsedKey();
            if (!tasks_1.InMemoryTask.is(task) && key) {
                const customizations = this.createCustomizableTask(task);
                if (tasks_1.ContributedTask.is(task) && customizations) {
                    let custom = [];
                    let customized = Object.create(null);
                    await this.computeTasksForSingleConfig((_a = task._source.workspaceFolder) !== null && _a !== void 0 ? _a : this.workspaceFolders[0], {
                        version: '2.0.0',
                        tasks: [customizations]
                    }, 0 /* TaskRunSource.System */, custom, customized, TaskConfig.TaskConfigSource.TasksJson, true);
                    for (const configuration in customized) {
                        key = customized[configuration].getRecentlyUsedKey();
                    }
                }
                this.getRecentlyUsedTasks().set(key, JSON.stringify(customizations));
                this.saveRecentlyUsedTasks();
            }
        }
        saveRecentlyUsedTasks() {
            if (!this._recentlyUsedTasks) {
                return;
            }
            const quickOpenHistoryLimit = this.configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            // setting history limit to 0 means no LRU sorting
            if (quickOpenHistoryLimit === 0) {
                return;
            }
            let keys = [...this._recentlyUsedTasks.keys()];
            if (keys.length > quickOpenHistoryLimit) {
                keys = keys.slice(0, quickOpenHistoryLimit);
            }
            const keyValues = [];
            for (const key of keys) {
                keyValues.push([key, this._recentlyUsedTasks.get(key, 0 /* Touch.None */)]);
            }
            this.storageService.store(AbstractTaskService.RecentlyUsedTasks_KeyV2, JSON.stringify(keyValues), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        openDocumentation() {
            this.openerService.open(uri_1.URI.parse('https://code.visualstudio.com/docs/editor/tasks#_defining-a-problem-matcher'));
        }
        async _findSingleWorkspaceTaskOfGroup(group) {
            var _a;
            const tasksOfGroup = await this._findWorkspaceTasksInGroup(group, true);
            if ((tasksOfGroup.length === 1) && (typeof tasksOfGroup[0].configurationProperties.group !== 'string') && ((_a = tasksOfGroup[0].configurationProperties.group) === null || _a === void 0 ? void 0 : _a.isDefault)) {
                let resolvedTask;
                if (tasks_1.ConfiguringTask.is(tasksOfGroup[0])) {
                    resolvedTask = await this.tryResolveTask(tasksOfGroup[0]);
                }
                else {
                    resolvedTask = tasksOfGroup[0];
                }
                if (resolvedTask) {
                    return this.run(resolvedTask, undefined, 1 /* TaskRunSource.User */);
                }
            }
            return undefined;
        }
        async build() {
            const tryBuildShortcut = await this._findSingleWorkspaceTaskOfGroup(tasks_1.TaskGroup.Build);
            if (tryBuildShortcut) {
                return tryBuildShortcut;
            }
            return this.getGroupedTasks().then((tasks) => {
                let runnable = this.createRunnableTask(tasks, tasks_1.TaskGroup.Build);
                if (!runnable || !runnable.task) {
                    if (this.schemaVersion === 1 /* JsonSchemaVersion.V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask1', 'No build task defined. Mark a task with \'isBuildCommand\' in the tasks.json file.'), 2 /* TaskErrors.NoBuildTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask2', 'No build task defined. Mark a task with as a \'build\' group in the tasks.json file.'), 2 /* TaskErrors.NoBuildTask */);
                    }
                }
                return this.executeTask(runnable.task, runnable.resolver, 1 /* TaskRunSource.User */);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        async runTest() {
            const tryTestShortcut = await this._findSingleWorkspaceTaskOfGroup(tasks_1.TaskGroup.Test);
            if (tryTestShortcut) {
                return tryTestShortcut;
            }
            return this.getGroupedTasks().then((tasks) => {
                let runnable = this.createRunnableTask(tasks, tasks_1.TaskGroup.Test);
                if (!runnable || !runnable.task) {
                    if (this.schemaVersion === 1 /* JsonSchemaVersion.V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask1', 'No test task defined. Mark a task with \'isTestCommand\' in the tasks.json file.'), 3 /* TaskErrors.NoTestTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask2', 'No test task defined. Mark a task with as a \'test\' group in the tasks.json file.'), 3 /* TaskErrors.NoTestTask */);
                    }
                }
                return this.executeTask(runnable.task, runnable.resolver, 1 /* TaskRunSource.User */);
            }).then(value => value, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        async run(task, options, runSource = 0 /* TaskRunSource.System */) {
            if (!(await this.trust())) {
                return;
            }
            if (!task) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskServer.noTask', 'Task to execute is undefined'), 5 /* TaskErrors.TaskNotFound */);
            }
            return new Promise((resolve) => {
                let resolver = this.createResolver();
                if (options && options.attachProblemMatcher && this.shouldAttachProblemMatcher(task) && !tasks_1.InMemoryTask.is(task)) {
                    this.attachProblemMatcher(task).then(toExecute => {
                        if (toExecute) {
                            resolve(this.executeTask(toExecute, resolver, runSource));
                        }
                        else {
                            resolve(undefined);
                        }
                    });
                }
                else {
                    resolve(this.executeTask(task, resolver, runSource));
                }
            }).then((value) => {
                if (runSource === 1 /* TaskRunSource.User */) {
                    this.getWorkspaceTasks().then(workspaceTasks => {
                        runAutomaticTasks_1.RunAutomaticTasks.promptForPermission(this, this.storageService, this.notificationService, this.workspaceTrustManagementService, this.openerService, workspaceTasks);
                    });
                }
                return value;
            }, (error) => {
                this.handleError(error);
                return Promise.reject(error);
            });
        }
        isProvideTasksEnabled() {
            const settingValue = this.configurationService.getValue('task.autoDetect');
            return settingValue === 'on';
        }
        isProblemMatcherPromptEnabled(type) {
            const settingValue = this.configurationService.getValue(PROBLEM_MATCHER_NEVER_CONFIG);
            if (Types.isBoolean(settingValue)) {
                return !settingValue;
            }
            if (type === undefined) {
                return true;
            }
            const settingValueMap = settingValue;
            return !settingValueMap[type];
        }
        getTypeForTask(task) {
            let type;
            if (tasks_1.CustomTask.is(task)) {
                let configProperties = task._source.config.element;
                type = configProperties.type;
            }
            else {
                type = task.getDefinition().type;
            }
            return type;
        }
        shouldAttachProblemMatcher(task) {
            const enabled = this.isProblemMatcherPromptEnabled(this.getTypeForTask(task));
            if (enabled === false) {
                return false;
            }
            if (!this.canCustomize(task)) {
                return false;
            }
            if (task.configurationProperties.group !== undefined && task.configurationProperties.group !== tasks_1.TaskGroup.Build) {
                return false;
            }
            if (task.configurationProperties.problemMatchers !== undefined && task.configurationProperties.problemMatchers.length > 0) {
                return false;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !task.hasDefinedMatchers && !!task.configurationProperties.problemMatchers && (task.configurationProperties.problemMatchers.length === 0);
            }
            if (tasks_1.CustomTask.is(task)) {
                let configProperties = task._source.config.element;
                return configProperties.problemMatcher === undefined && !task.hasDefinedMatchers;
            }
            return false;
        }
        async updateNeverProblemMatcherSetting(type) {
            const current = this.configurationService.getValue(PROBLEM_MATCHER_NEVER_CONFIG);
            if (current === true) {
                return;
            }
            let newValue;
            if (current !== false) {
                newValue = current;
            }
            else {
                newValue = Object.create(null);
            }
            newValue[type] = true;
            return this.configurationService.updateValue(PROBLEM_MATCHER_NEVER_CONFIG, newValue);
        }
        attachProblemMatcher(task) {
            let entries = [];
            for (let key of problemMatcher_1.ProblemMatcherRegistry.keys()) {
                let matcher = problemMatcher_1.ProblemMatcherRegistry.get(key);
                if (matcher.deprecated) {
                    continue;
                }
                if (matcher.name === matcher.label) {
                    entries.push({ label: matcher.name, matcher: matcher });
                }
                else {
                    entries.push({
                        label: matcher.label,
                        description: `$${matcher.name}`,
                        matcher: matcher
                    });
                }
            }
            if (entries.length > 0) {
                entries = entries.sort((a, b) => {
                    if (a.label && b.label) {
                        return a.label.localeCompare(b.label);
                    }
                    else {
                        return 0;
                    }
                });
                entries.unshift({ type: 'separator', label: nls.localize('TaskService.associate', 'associate') });
                let taskType;
                if (tasks_1.CustomTask.is(task)) {
                    let configProperties = task._source.config.element;
                    taskType = configProperties.type;
                }
                else {
                    taskType = task.getDefinition().type;
                }
                entries.unshift({ label: nls.localize('TaskService.attachProblemMatcher.continueWithout', 'Continue without scanning the task output'), matcher: undefined }, { label: nls.localize('TaskService.attachProblemMatcher.never', 'Never scan the task output for this task'), matcher: undefined, never: true }, { label: nls.localize('TaskService.attachProblemMatcher.neverType', 'Never scan the task output for {0} tasks', taskType), matcher: undefined, setting: taskType }, { label: nls.localize('TaskService.attachProblemMatcher.learnMoreAbout', 'Learn more about scanning the task output'), matcher: undefined, learnMore: true });
                return this.quickInputService.pick(entries, {
                    placeHolder: nls.localize('selectProblemMatcher', 'Select for which kind of errors and warnings to scan the task output'),
                }).then(async (selected) => {
                    if (selected) {
                        if (selected.learnMore) {
                            this.openDocumentation();
                            return undefined;
                        }
                        else if (selected.never) {
                            this.customize(task, { problemMatcher: [] }, true);
                            return task;
                        }
                        else if (selected.matcher) {
                            let newTask = task.clone();
                            let matcherReference = `$${selected.matcher.name}`;
                            let properties = { problemMatcher: [matcherReference] };
                            newTask.configurationProperties.problemMatchers = [matcherReference];
                            let matcher = problemMatcher_1.ProblemMatcherRegistry.get(selected.matcher.name);
                            if (matcher && matcher.watching !== undefined) {
                                properties.isBackground = true;
                                newTask.configurationProperties.isBackground = true;
                            }
                            this.customize(task, properties, true);
                            return newTask;
                        }
                        else if (selected.setting) {
                            await this.updateNeverProblemMatcherSetting(selected.setting);
                            return task;
                        }
                        else {
                            return task;
                        }
                    }
                    else {
                        return undefined;
                    }
                });
            }
            return Promise.resolve(task);
        }
        getTasksForGroup(group) {
            return this.getGroupedTasks().then((groups) => {
                let result = [];
                groups.forEach((tasks) => {
                    for (let task of tasks) {
                        let configTaskGroup = tasks_1.TaskGroup.from(task.configurationProperties.group);
                        if ((configTaskGroup === null || configTaskGroup === void 0 ? void 0 : configTaskGroup._id) === group._id) {
                            result.push(task);
                        }
                    }
                });
                return result;
            });
        }
        needsFolderQualification() {
            return this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
        }
        canCustomize(task) {
            if (this.schemaVersion !== 2 /* JsonSchemaVersion.V2_0_0 */) {
                return false;
            }
            if (tasks_1.CustomTask.is(task)) {
                return true;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !!task.getWorkspaceFolder();
            }
            return false;
        }
        async formatTaskForJson(resource, task) {
            let reference;
            let stringValue = '';
            try {
                reference = await this.textModelResolverService.createModelReference(resource);
                const model = reference.object.textEditorModel;
                const { tabSize, insertSpaces } = model.getOptions();
                const eol = model.getEOL();
                let stringified = (0, jsonFormatter_1.toFormattedString)(task, { eol, tabSize, insertSpaces });
                const regex = new RegExp(eol + (insertSpaces ? ' '.repeat(tabSize) : '\\t'), 'g');
                stringified = stringified.replace(regex, eol + (insertSpaces ? ' '.repeat(tabSize * 3) : '\t\t\t'));
                const twoTabs = insertSpaces ? ' '.repeat(tabSize * 2) : '\t\t';
                stringValue = twoTabs + stringified.slice(0, stringified.length - 1) + twoTabs + stringified.slice(stringified.length - 1);
            }
            finally {
                if (reference) {
                    reference.dispose();
                }
            }
            return stringValue;
        }
        openEditorAtTask(resource, task, configIndex = -1) {
            if (resource === undefined) {
                return Promise.resolve(false);
            }
            let selection;
            return this.fileService.readFile(resource).then(content => content.value).then(async (content) => {
                if (!content) {
                    return false;
                }
                if (task) {
                    const contentValue = content.toString();
                    let stringValue;
                    if (configIndex !== -1) {
                        const json = this.configurationService.getValue('tasks', { resource });
                        if (json.tasks && (json.tasks.length > configIndex)) {
                            stringValue = await this.formatTaskForJson(resource, json.tasks[configIndex]);
                        }
                    }
                    if (!stringValue) {
                        if (typeof task === 'string') {
                            stringValue = task;
                        }
                        else {
                            stringValue = await this.formatTaskForJson(resource, task);
                        }
                    }
                    const index = contentValue.indexOf(stringValue);
                    let startLineNumber = 1;
                    for (let i = 0; i < index; i++) {
                        if (contentValue.charAt(i) === '\n') {
                            startLineNumber++;
                        }
                    }
                    let endLineNumber = startLineNumber;
                    for (let i = 0; i < stringValue.length; i++) {
                        if (stringValue.charAt(i) === '\n') {
                            endLineNumber++;
                        }
                    }
                    selection = startLineNumber > 1 ? { startLineNumber, startColumn: startLineNumber === endLineNumber ? 4 : 3, endLineNumber, endColumn: startLineNumber === endLineNumber ? undefined : 4 } : undefined;
                }
                return this.editorService.openEditor({
                    resource,
                    options: {
                        pinned: false,
                        forceReload: true,
                        selection,
                        selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */
                    }
                }).then(() => !!selection);
            });
        }
        createCustomizableTask(task) {
            let toCustomize;
            let taskConfig = tasks_1.CustomTask.is(task) || tasks_1.ConfiguringTask.is(task) ? task._source.config : undefined;
            if (taskConfig && taskConfig.element) {
                toCustomize = Object.assign({}, (taskConfig.element));
            }
            else if (tasks_1.ContributedTask.is(task)) {
                toCustomize = {};
                let identifier = Object.assign(Object.create(null), task.defines);
                delete identifier['_key'];
                Object.keys(identifier).forEach(key => toCustomize[key] = identifier[key]);
                if (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length > 0 && Types.isStringArray(task.configurationProperties.problemMatchers)) {
                    toCustomize.problemMatcher = task.configurationProperties.problemMatchers;
                }
                if (task.configurationProperties.group) {
                    toCustomize.group = TaskConfig.GroupKind.to(task.configurationProperties.group);
                }
            }
            if (!toCustomize) {
                return undefined;
            }
            if (toCustomize.problemMatcher === undefined && task.configurationProperties.problemMatchers === undefined || (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length === 0)) {
                toCustomize.problemMatcher = [];
            }
            if (task._source.label !== 'Workspace') {
                toCustomize.label = task.configurationProperties.identifier;
            }
            else {
                toCustomize.label = task._label;
            }
            toCustomize.detail = task.configurationProperties.detail;
            return toCustomize;
        }
        async customize(task, properties, openConfig) {
            if (!(await this.trust())) {
                return;
            }
            const workspaceFolder = task.getWorkspaceFolder();
            if (!workspaceFolder) {
                return Promise.resolve(undefined);
            }
            let configuration = this.getConfiguration(workspaceFolder, task._source.kind);
            if (configuration.hasParseErrors) {
                this.notificationService.warn(nls.localize('customizeParseErrors', 'The current task configuration has errors. Please fix the errors first before customizing a task.'));
                return Promise.resolve(undefined);
            }
            let fileConfig = configuration.config;
            const toCustomize = this.createCustomizableTask(task);
            if (!toCustomize) {
                return Promise.resolve(undefined);
            }
            const index = tasks_1.CustomTask.is(task) ? task._source.config.index : undefined;
            if (properties) {
                for (let property of Object.getOwnPropertyNames(properties)) {
                    let value = properties[property];
                    if (value !== undefined && value !== null) {
                        toCustomize[property] = value;
                    }
                }
            }
            let promise;
            if (!fileConfig) {
                let value = {
                    version: '2.0.0',
                    tasks: [toCustomize]
                };
                let content = [
                    '{',
                    nls.localize('tasksJsonComment', '\t// See https://go.microsoft.com/fwlink/?LinkId=733558 \n\t// for the documentation about the tasks.json format'),
                ].join('\n') + JSON.stringify(value, null, '\t').substr(1);
                let editorConfig = this.configurationService.getValue();
                if (editorConfig.editor.insertSpaces) {
                    content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + ' '.repeat(s2.length * editorConfig.editor.tabSize));
                }
                promise = this.textFileService.create([{ resource: workspaceFolder.toResource('.vscode/tasks.json'), value: content }]).then(() => { });
            }
            else {
                // We have a global task configuration
                if ((index === -1) && properties) {
                    if (properties.problemMatcher !== undefined) {
                        fileConfig.problemMatcher = properties.problemMatcher;
                        promise = this.writeConfiguration(workspaceFolder, 'tasks.problemMatchers', fileConfig.problemMatcher, task._source.kind);
                    }
                    else if (properties.group !== undefined) {
                        fileConfig.group = properties.group;
                        promise = this.writeConfiguration(workspaceFolder, 'tasks.group', fileConfig.group, task._source.kind);
                    }
                }
                else {
                    if (!Array.isArray(fileConfig.tasks)) {
                        fileConfig.tasks = [];
                    }
                    if (index === undefined) {
                        fileConfig.tasks.push(toCustomize);
                    }
                    else {
                        fileConfig.tasks[index] = toCustomize;
                    }
                    promise = this.writeConfiguration(workspaceFolder, 'tasks.tasks', fileConfig.tasks, task._source.kind);
                }
            }
            if (!promise) {
                return Promise.resolve(undefined);
            }
            return promise.then(() => {
                if (openConfig) {
                    this.openEditorAtTask(this.getResourceForTask(task), toCustomize);
                }
            });
        }
        writeConfiguration(workspaceFolder, key, value, source) {
            let target = undefined;
            switch (source) {
                case tasks_1.TaskSourceKind.User:
                    target = 1 /* ConfigurationTarget.USER */;
                    break;
                case tasks_1.TaskSourceKind.WorkspaceFile:
                    target = 4 /* ConfigurationTarget.WORKSPACE */;
                    break;
                default: if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    target = 4 /* ConfigurationTarget.WORKSPACE */;
                }
                else if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                    target = 5 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            if (target) {
                return this.configurationService.updateValue(key, value, { resource: workspaceFolder.uri }, target);
            }
            else {
                return undefined;
            }
        }
        getResourceForKind(kind) {
            this.updateSetup();
            switch (kind) {
                case tasks_1.TaskSourceKind.User: {
                    return resources.joinPath(resources.dirname(this.preferencesService.userSettingsResource), 'tasks.json');
                }
                case tasks_1.TaskSourceKind.WorkspaceFile: {
                    if (this._workspace && this._workspace.configuration) {
                        return this._workspace.configuration;
                    }
                }
                default: {
                    return undefined;
                }
            }
        }
        getResourceForTask(task) {
            if (tasks_1.CustomTask.is(task)) {
                let uri = this.getResourceForKind(task._source.kind);
                if (!uri) {
                    const taskFolder = task.getWorkspaceFolder();
                    if (taskFolder) {
                        uri = taskFolder.toResource(task._source.config.file);
                    }
                    else {
                        uri = this.workspaceFolders[0].uri;
                    }
                }
                return uri;
            }
            else {
                return task.getWorkspaceFolder().toResource('.vscode/tasks.json');
            }
        }
        async openConfig(task) {
            let resource;
            if (task) {
                resource = this.getResourceForTask(task);
            }
            else {
                resource = (this._workspaceFolders && (this._workspaceFolders.length > 0)) ? this._workspaceFolders[0].toResource('.vscode/tasks.json') : undefined;
            }
            return this.openEditorAtTask(resource, task ? task._label : undefined, task ? task._source.config.index : -1);
        }
        createRunnableTask(tasks, group) {
            let resolverData = new Map();
            let workspaceTasks = [];
            let extensionTasks = [];
            tasks.forEach((tasks, folder) => {
                let data = resolverData.get(folder);
                if (!data) {
                    data = {
                        id: new Map(),
                        label: new Map(),
                        identifier: new Map()
                    };
                    resolverData.set(folder, data);
                }
                for (let task of tasks) {
                    data.id.set(task._id, task);
                    data.label.set(task._label, task);
                    if (task.configurationProperties.identifier) {
                        data.identifier.set(task.configurationProperties.identifier, task);
                    }
                    if (group && task.configurationProperties.group === group) {
                        if (task._source.kind === tasks_1.TaskSourceKind.Workspace) {
                            workspaceTasks.push(task);
                        }
                        else {
                            extensionTasks.push(task);
                        }
                    }
                }
            });
            let resolver = {
                resolve: async (uri, alias) => {
                    let data = resolverData.get(typeof uri === 'string' ? uri : uri.toString());
                    if (!data) {
                        return undefined;
                    }
                    return data.id.get(alias) || data.label.get(alias) || data.identifier.get(alias);
                }
            };
            if (workspaceTasks.length > 0) {
                if (workspaceTasks.length > 1) {
                    this._outputChannel.append(nls.localize('moreThanOneBuildTask', 'There are many build tasks defined in the tasks.json. Executing the first one.\n'));
                }
                return { task: workspaceTasks[0], resolver };
            }
            if (extensionTasks.length === 0) {
                return undefined;
            }
            // We can only have extension tasks if we are in version 2.0.0. Then we can even run
            // multiple build tasks.
            if (extensionTasks.length === 1) {
                return { task: extensionTasks[0], resolver };
            }
            else {
                let id = UUID.generateUuid();
                let task = new tasks_1.InMemoryTask(id, { kind: tasks_1.TaskSourceKind.InMemory, label: 'inMemory' }, id, 'inMemory', { reevaluateOnRerun: true }, {
                    identifier: id,
                    dependsOn: extensionTasks.map((extensionTask) => { return { uri: extensionTask.getWorkspaceFolder().uri, task: extensionTask._id }; }),
                    name: id,
                });
                return { task, resolver };
            }
        }
        createResolver(grouped) {
            let resolverData;
            async function quickResolve(that, uri, identifier) {
                const foundTasks = await that._findWorkspaceTasks((task) => {
                    var _a;
                    const taskUri = ((tasks_1.ConfiguringTask.is(task) || tasks_1.CustomTask.is(task)) ? (_a = task._source.config.workspaceFolder) === null || _a === void 0 ? void 0 : _a.uri : undefined);
                    const originalUri = (typeof uri === 'string' ? uri : uri.toString());
                    if ((taskUri === null || taskUri === void 0 ? void 0 : taskUri.toString()) !== originalUri) {
                        return false;
                    }
                    if (Types.isString(identifier)) {
                        return ((task._label === identifier) || (task.configurationProperties.identifier === identifier));
                    }
                    else {
                        const keyedIdentifier = task.getDefinition(true);
                        const searchIdentifier = tasks_1.TaskDefinition.createTaskIdentifier(identifier, console);
                        return (searchIdentifier && keyedIdentifier) ? (searchIdentifier._key === keyedIdentifier._key) : false;
                    }
                });
                if (foundTasks.length === 0) {
                    return undefined;
                }
                const task = foundTasks[0];
                if (tasks_1.ConfiguringTask.is(task)) {
                    return that.tryResolveTask(task);
                }
                return task;
            }
            async function getResolverData(that) {
                if (resolverData === undefined) {
                    resolverData = new Map();
                    (grouped || await that.getGroupedTasks()).forEach((tasks, folder) => {
                        let data = resolverData.get(folder);
                        if (!data) {
                            data = { label: new Map(), identifier: new Map(), taskIdentifier: new Map() };
                            resolverData.set(folder, data);
                        }
                        for (let task of tasks) {
                            data.label.set(task._label, task);
                            if (task.configurationProperties.identifier) {
                                data.identifier.set(task.configurationProperties.identifier, task);
                            }
                            let keyedIdentifier = task.getDefinition(true);
                            if (keyedIdentifier !== undefined) {
                                data.taskIdentifier.set(keyedIdentifier._key, task);
                            }
                        }
                    });
                }
                return resolverData;
            }
            async function fullResolve(that, uri, identifier) {
                const allResolverData = await getResolverData(that);
                let data = allResolverData.get(typeof uri === 'string' ? uri : uri.toString());
                if (!data) {
                    return undefined;
                }
                if (Types.isString(identifier)) {
                    return data.label.get(identifier) || data.identifier.get(identifier);
                }
                else {
                    let key = tasks_1.TaskDefinition.createTaskIdentifier(identifier, console);
                    return key !== undefined ? data.taskIdentifier.get(key._key) : undefined;
                }
            }
            return {
                resolve: async (uri, identifier) => {
                    var _a;
                    if (!identifier) {
                        return undefined;
                    }
                    if ((resolverData === undefined) && (grouped === undefined)) {
                        return (_a = (await quickResolve(this, uri, identifier))) !== null && _a !== void 0 ? _a : fullResolve(this, uri, identifier);
                    }
                    else {
                        return fullResolve(this, uri, identifier);
                    }
                }
            };
        }
        async saveBeforeRun() {
            let SaveBeforeRunConfigOptions;
            (function (SaveBeforeRunConfigOptions) {
                SaveBeforeRunConfigOptions["Always"] = "always";
                SaveBeforeRunConfigOptions["Never"] = "never";
                SaveBeforeRunConfigOptions["Prompt"] = "prompt";
            })(SaveBeforeRunConfigOptions || (SaveBeforeRunConfigOptions = {}));
            const saveBeforeRunTaskConfig = this.configurationService.getValue('task.saveBeforeRun');
            if (saveBeforeRunTaskConfig === SaveBeforeRunConfigOptions.Never) {
                return false;
            }
            else if (saveBeforeRunTaskConfig === SaveBeforeRunConfigOptions.Prompt) {
                const dialogOptions = await this.dialogService.show(severity_1.default.Info, nls.localize('TaskSystem.saveBeforeRun.prompt.title', 'Save all editors?'), [nls.localize('saveBeforeRun.save', 'Save'), nls.localize('saveBeforeRun.dontSave', 'Don\'t save')], {
                    detail: nls.localize('detail', "Do you want to save all editors before running the task?"),
                    cancelId: 1
                });
                if (dialogOptions.choice !== 0) {
                    return false;
                }
            }
            await this.editorService.saveAll({ reason: 2 /* SaveReason.AUTO */ });
            return true;
        }
        async executeTask(task, resolver, runSource) {
            var _a;
            let taskToRun = task;
            if (await this.saveBeforeRun()) {
                await this.configurationService.reloadConfiguration();
                await this.updateWorkspaceTasks();
                const taskFolder = task.getWorkspaceFolder();
                const taskIdentifier = task.configurationProperties.identifier;
                // Since we save before running tasks, the task may have changed as part of the save.
                // However, if the TaskRunSource is not User, then we shouldn't try to fetch the task again
                // since this can cause a new'd task to get overwritten with a provided task.
                taskToRun = (_a = ((taskFolder && taskIdentifier && (runSource === 1 /* TaskRunSource.User */))
                    ? await this.getTask(taskFolder, taskIdentifier) : task)) !== null && _a !== void 0 ? _a : task;
            }
            await problemMatcher_1.ProblemMatcherRegistry.onReady();
            let executeResult = this.getTaskSystem().run(taskToRun, resolver);
            return this.handleExecuteResult(executeResult, runSource);
        }
        async handleExecuteResult(executeResult, runSource) {
            var _a, _b, _c;
            if (runSource === 1 /* TaskRunSource.User */) {
                await this.setRecentlyUsedTask(executeResult.task);
            }
            if (executeResult.kind === 2 /* TaskExecuteKind.Active */) {
                let active = executeResult.active;
                if (active && active.same) {
                    if ((_a = this._taskSystem) === null || _a === void 0 ? void 0 : _a.isTaskVisible(executeResult.task)) {
                        const message = nls.localize('TaskSystem.activeSame.noBackground', 'The task \'{0}\' is already active.', executeResult.task.getQualifiedLabel());
                        let lastInstance = (_b = this.getTaskSystem().getLastInstance(executeResult.task)) !== null && _b !== void 0 ? _b : executeResult.task;
                        this.notificationService.prompt(severity_1.default.Warning, message, [{
                                label: nls.localize('terminateTask', "Terminate Task"),
                                run: () => this.terminate(lastInstance)
                            },
                            {
                                label: nls.localize('restartTask', "Restart Task"),
                                run: () => this.restart(lastInstance)
                            }], { sticky: true });
                    }
                    else {
                        (_c = this._taskSystem) === null || _c === void 0 ? void 0 : _c.revealTask(executeResult.task);
                    }
                }
                else {
                    throw new taskSystem_1.TaskError(severity_1.default.Warning, nls.localize('TaskSystem.active', 'There is already a task running. Terminate it first before executing another task.'), 1 /* TaskErrors.RunningTask */);
                }
            }
            return executeResult.promise;
        }
        restart(task) {
            if (!this._taskSystem) {
                return;
            }
            this._taskSystem.terminate(task).then((response) => {
                if (response.success) {
                    this.run(task).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
                else {
                    this.notificationService.warn(nls.localize('TaskSystem.restartFailed', 'Failed to terminate and restart task {0}', Types.isString(task) ? task : task.configurationProperties.name));
                }
                return response;
            });
        }
        async terminate(task) {
            if (!(await this.trust())) {
                return { success: true, task: undefined };
            }
            if (!this._taskSystem) {
                return { success: true, task: undefined };
            }
            return this._taskSystem.terminate(task);
        }
        terminateAll() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return this._taskSystem.terminateAll();
        }
        createTerminalTaskSystem() {
            return new terminalTaskSystem_1.TerminalTaskSystem(this.terminalService, this.terminalGroupService, this.outputService, this.paneCompositeService, this.viewsService, this.markerService, this.modelService, this.configurationResolverService, this.contextService, this.environmentService, AbstractTaskService.OutputChannelId, this.fileService, this.terminalProfileResolverService, this.pathService, this.viewDescriptorService, this.logService, this.configurationService, this.notificationService, this, (workspaceFolder) => {
                if (workspaceFolder) {
                    return this.getTaskSystemInfo(workspaceFolder.uri.scheme);
                }
                else if (this._taskSystemInfos.size > 0) {
                    const infos = Array.from(this._taskSystemInfos.entries());
                    const notFile = infos.filter(info => info[0] !== network_1.Schemas.file);
                    if (notFile.length > 0) {
                        return notFile[0][1][0];
                    }
                    return infos[0][1][0];
                }
                else {
                    return undefined;
                }
            });
        }
        isTaskProviderEnabled(type) {
            const definition = taskDefinitionRegistry_1.TaskDefinitionRegistry.get(type);
            return !definition || !definition.when || this.contextKeyService.contextMatchesRules(definition.when);
        }
        getGroupedTasks(type) {
            const needsRecentTasksMigration = this.needsRecentTasksMigration();
            return this._activateTaskProviders(type).then(() => {
                let validTypes = Object.create(null);
                taskDefinitionRegistry_1.TaskDefinitionRegistry.all().forEach(definition => validTypes[definition.taskType] = true);
                validTypes['shell'] = true;
                validTypes['process'] = true;
                return new Promise(resolve => {
                    let result = [];
                    let counter = 0;
                    let done = (value) => {
                        if (value) {
                            result.push(value);
                        }
                        if (--counter === 0) {
                            resolve(result);
                        }
                    };
                    let error = (error) => {
                        try {
                            if (error && Types.isString(error.message)) {
                                this._outputChannel.append('Error: ');
                                this._outputChannel.append(error.message);
                                this._outputChannel.append('\n');
                                this.showOutput();
                            }
                            else {
                                this._outputChannel.append('Unknown error received while collecting tasks from providers.\n');
                                this.showOutput();
                            }
                        }
                        finally {
                            if (--counter === 0) {
                                resolve(result);
                            }
                        }
                    };
                    if (this.isProvideTasksEnabled() && (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) && (this._providers.size > 0)) {
                        let foundAnyProviders = false;
                        for (const [handle, provider] of this._providers) {
                            const providerType = this._providerTypes.get(handle);
                            if ((type === undefined) || (type === providerType)) {
                                if (providerType && !this.isTaskProviderEnabled(providerType)) {
                                    continue;
                                }
                                foundAnyProviders = true;
                                counter++;
                                provider.provideTasks(validTypes).then((taskSet) => {
                                    // Check that the tasks provided are of the correct type
                                    for (const task of taskSet.tasks) {
                                        if (task.type !== this._providerTypes.get(handle)) {
                                            this._outputChannel.append(nls.localize('unexpectedTaskType', "The task provider for \"{0}\" tasks unexpectedly provided a task of type \"{1}\".\n", this._providerTypes.get(handle), task.type));
                                            if ((task.type !== 'shell') && (task.type !== 'process')) {
                                                this.showOutput();
                                            }
                                            break;
                                        }
                                    }
                                    return done(taskSet);
                                }, error);
                            }
                        }
                        if (!foundAnyProviders) {
                            resolve(result);
                        }
                    }
                    else {
                        resolve(result);
                    }
                });
            }).then((contributedTaskSets) => {
                let result = new TaskMap();
                let contributedTasks = new TaskMap();
                for (let set of contributedTaskSets) {
                    for (let task of set.tasks) {
                        let workspaceFolder = task.getWorkspaceFolder();
                        if (workspaceFolder) {
                            contributedTasks.add(workspaceFolder, task);
                        }
                    }
                }
                return this.getWorkspaceTasks().then(async (customTasks) => {
                    const customTasksKeyValuePairs = Array.from(customTasks);
                    const customTasksPromises = customTasksKeyValuePairs.map(async ([key, folderTasks]) => {
                        let contributed = contributedTasks.get(key);
                        if (!folderTasks.set) {
                            if (contributed) {
                                result.add(key, ...contributed);
                            }
                            return;
                        }
                        if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                            result.add(key, ...folderTasks.set.tasks);
                        }
                        else {
                            let configurations = folderTasks.configurations;
                            let legacyTaskConfigurations = folderTasks.set ? this.getLegacyTaskConfigurations(folderTasks.set) : undefined;
                            let customTasksToDelete = [];
                            if (configurations || legacyTaskConfigurations) {
                                let unUsedConfigurations = new Set();
                                if (configurations) {
                                    Object.keys(configurations.byIdentifier).forEach(key => unUsedConfigurations.add(key));
                                }
                                for (let task of contributed) {
                                    if (!tasks_1.ContributedTask.is(task)) {
                                        continue;
                                    }
                                    if (configurations) {
                                        let configuringTask = configurations.byIdentifier[task.defines._key];
                                        if (configuringTask) {
                                            unUsedConfigurations.delete(task.defines._key);
                                            result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                        }
                                        else {
                                            result.add(key, task);
                                        }
                                    }
                                    else if (legacyTaskConfigurations) {
                                        let configuringTask = legacyTaskConfigurations[task.defines._key];
                                        if (configuringTask) {
                                            result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                            customTasksToDelete.push(configuringTask);
                                        }
                                        else {
                                            result.add(key, task);
                                        }
                                    }
                                    else {
                                        result.add(key, task);
                                    }
                                }
                                if (customTasksToDelete.length > 0) {
                                    let toDelete = customTasksToDelete.reduce((map, task) => {
                                        map[task._id] = true;
                                        return map;
                                    }, Object.create(null));
                                    for (let task of folderTasks.set.tasks) {
                                        if (toDelete[task._id]) {
                                            continue;
                                        }
                                        result.add(key, task);
                                    }
                                }
                                else {
                                    result.add(key, ...folderTasks.set.tasks);
                                }
                                const unUsedConfigurationsAsArray = Array.from(unUsedConfigurations);
                                const unUsedConfigurationPromises = unUsedConfigurationsAsArray.map(async (value) => {
                                    let configuringTask = configurations.byIdentifier[value];
                                    if (type && (type !== configuringTask.configures.type)) {
                                        return;
                                    }
                                    let requiredTaskProviderUnavailable = false;
                                    for (const [handle, provider] of this._providers) {
                                        const providerType = this._providerTypes.get(handle);
                                        if (configuringTask.type === providerType) {
                                            if (providerType && !this.isTaskProviderEnabled(providerType)) {
                                                requiredTaskProviderUnavailable = true;
                                                continue;
                                            }
                                            try {
                                                const resolvedTask = await provider.resolveTask(configuringTask);
                                                if (resolvedTask && (resolvedTask._id === configuringTask._id)) {
                                                    result.add(key, TaskConfig.createCustomTask(resolvedTask, configuringTask));
                                                    return;
                                                }
                                            }
                                            catch (error) {
                                                // Ignore errors. The task could not be provided by any of the providers.
                                            }
                                        }
                                    }
                                    if (requiredTaskProviderUnavailable) {
                                        this._outputChannel.append(nls.localize('TaskService.providerUnavailable', 'Warning: {0} tasks are unavailable in the current environment.\n', configuringTask.configures.type));
                                    }
                                    else {
                                        this._outputChannel.append(nls.localize('TaskService.noConfiguration', 'Error: The {0} task detection didn\'t contribute a task for the following configuration:\n{1}\nThe task will be ignored.\n', configuringTask.configures.type, JSON.stringify(configuringTask._source.config.element, undefined, 4)));
                                        this.showOutput();
                                    }
                                });
                                await Promise.all(unUsedConfigurationPromises);
                            }
                            else {
                                result.add(key, ...folderTasks.set.tasks);
                                result.add(key, ...contributed);
                            }
                        }
                    });
                    await Promise.all(customTasksPromises);
                    if (needsRecentTasksMigration) {
                        // At this point we have all the tasks and can migrate the recently used tasks.
                        await this.migrateRecentTasks(result.all());
                    }
                    return result;
                }, () => {
                    // If we can't read the tasks.json file provide at least the contributed tasks
                    let result = new TaskMap();
                    for (let set of contributedTaskSets) {
                        for (let task of set.tasks) {
                            const folder = task.getWorkspaceFolder();
                            if (folder) {
                                result.add(folder, task);
                            }
                        }
                    }
                    return result;
                });
            });
        }
        getLegacyTaskConfigurations(workspaceTasks) {
            let result;
            function getResult() {
                if (result) {
                    return result;
                }
                result = Object.create(null);
                return result;
            }
            for (let task of workspaceTasks.tasks) {
                if (tasks_1.CustomTask.is(task)) {
                    let commandName = task.command && task.command.name;
                    // This is for backwards compatibility with the 0.1.0 task annotation code
                    // if we had a gulp, jake or grunt command a task specification was a annotation
                    if (commandName === 'gulp' || commandName === 'grunt' || commandName === 'jake') {
                        let identifier = tasks_1.KeyedTaskIdentifier.create({
                            type: commandName,
                            task: task.configurationProperties.name
                        });
                        getResult()[identifier._key] = task;
                    }
                }
            }
            return result;
        }
        async getWorkspaceTasks(runSource = 1 /* TaskRunSource.User */) {
            if (!(await this.trust())) {
                return new Map();
            }
            await this._waitForSupportedExecutions;
            if (this._workspaceTasksPromise) {
                return this._workspaceTasksPromise;
            }
            return this.updateWorkspaceTasks(runSource);
        }
        updateWorkspaceTasks(runSource = 1 /* TaskRunSource.User */) {
            this._workspaceTasksPromise = this.computeWorkspaceTasks(runSource);
            return this._workspaceTasksPromise;
        }
        async getAFolder() {
            let folder = this.workspaceFolders.length > 0 ? this.workspaceFolders[0] : undefined;
            if (!folder) {
                const userhome = await this.pathService.userHome();
                folder = new workspace_1.WorkspaceFolder({ uri: userhome, name: resources.basename(userhome), index: 0 });
            }
            return folder;
        }
        computeWorkspaceTasks(runSource = 1 /* TaskRunSource.User */) {
            let promises = [];
            for (let folder of this.workspaceFolders) {
                promises.push(this.computeWorkspaceFolderTasks(folder, runSource).then((value) => value, () => undefined));
            }
            return Promise.all(promises).then(async (values) => {
                let result = new Map();
                for (let value of values) {
                    if (value) {
                        result.set(value.workspaceFolder.uri.toString(), value);
                    }
                }
                const folder = await this.getAFolder();
                if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */) {
                    const workspaceFileTasks = await this.computeWorkspaceFileTasks(folder, runSource).then((value) => value, () => undefined);
                    if (workspaceFileTasks && this._workspace && this._workspace.configuration) {
                        result.set(this._workspace.configuration.toString(), workspaceFileTasks);
                    }
                }
                const userTasks = await this.computeUserTasks(folder, runSource).then((value) => value, () => undefined);
                if (userTasks) {
                    result.set(tasks_1.USER_TASKS_GROUP_KEY, userTasks);
                }
                return result;
            });
        }
        get jsonTasksSupported() {
            return !!taskService_1.ShellExecutionSupportedContext.getValue(this.contextKeyService) && !!taskService_1.ProcessExecutionSupportedContext.getValue(this.contextKeyService);
        }
        computeWorkspaceFolderTasks(workspaceFolder, runSource = 1 /* TaskRunSource.User */) {
            return (this.executionEngine === tasks_1.ExecutionEngine.Process
                ? this.computeLegacyConfiguration(workspaceFolder)
                : this.computeConfiguration(workspaceFolder)).
                then((workspaceFolderConfiguration) => {
                if (!workspaceFolderConfiguration || !workspaceFolderConfiguration.config || workspaceFolderConfiguration.hasErrors) {
                    return Promise.resolve({ workspaceFolder, set: undefined, configurations: undefined, hasErrors: workspaceFolderConfiguration ? workspaceFolderConfiguration.hasErrors : false });
                }
                return problemMatcher_1.ProblemMatcherRegistry.onReady().then(async () => {
                    let taskSystemInfo = this.getTaskSystemInfo(workspaceFolder.uri.scheme);
                    let problemReporter = new ProblemReporter(this._outputChannel);
                    let parseResult = TaskConfig.parse(workspaceFolder, undefined, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, workspaceFolderConfiguration.config, problemReporter, TaskConfig.TaskConfigSource.TasksJson, this.contextKeyService);
                    let hasErrors = false;
                    if (!parseResult.validationStatus.isOK() && (parseResult.validationStatus.state !== 1 /* ValidationState.Info */)) {
                        hasErrors = true;
                        this.showOutput(runSource);
                    }
                    if (problemReporter.status.isFatal()) {
                        problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                        return { workspaceFolder, set: undefined, configurations: undefined, hasErrors };
                    }
                    let customizedTasks;
                    if (parseResult.configured && parseResult.configured.length > 0) {
                        customizedTasks = {
                            byIdentifier: Object.create(null)
                        };
                        for (let task of parseResult.configured) {
                            customizedTasks.byIdentifier[task.configures._key] = task;
                        }
                    }
                    if (!this.jsonTasksSupported && (parseResult.custom.length > 0)) {
                        console.warn('Custom workspace tasks are not supported.');
                    }
                    return { workspaceFolder, set: { tasks: this.jsonTasksSupported ? parseResult.custom : [] }, configurations: customizedTasks, hasErrors };
                });
            });
        }
        testParseExternalConfig(config, location) {
            if (!config) {
                return { config: undefined, hasParseErrors: false };
            }
            let parseErrors = config.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._outputChannel.append(nls.localize({ key: 'TaskSystem.invalidTaskJsonOther', comment: ['Message notifies of an error in one of several places there is tasks related json, not necessarily in a file named tasks.json'] }, 'Error: The content of the tasks json in {0} has syntax errors. Please correct them before executing a task.\n', location));
                    this.showOutput();
                    return { config, hasParseErrors: true };
                }
            }
            return { config, hasParseErrors: false };
        }
        async computeWorkspaceFileTasks(workspaceFolder, runSource = 1 /* TaskRunSource.User */) {
            if (this.executionEngine === tasks_1.ExecutionEngine.Process) {
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            const workspaceFileConfig = this.getConfiguration(workspaceFolder, tasks_1.TaskSourceKind.WorkspaceFile);
            const configuration = this.testParseExternalConfig(workspaceFileConfig.config, nls.localize('TasksSystem.locationWorkspaceConfig', 'workspace file'));
            let customizedTasks = {
                byIdentifier: Object.create(null)
            };
            const custom = [];
            await this.computeTasksForSingleConfig(workspaceFolder, configuration.config, runSource, custom, customizedTasks.byIdentifier, TaskConfig.TaskConfigSource.WorkspaceFile);
            const engine = configuration.config ? TaskConfig.ExecutionEngine.from(configuration.config) : tasks_1.ExecutionEngine.Terminal;
            if (engine === tasks_1.ExecutionEngine.Process) {
                this.notificationService.warn(nls.localize('TaskSystem.versionWorkspaceFile', 'Only tasks version 2.0.0 permitted in workspace configuration files.'));
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            return { workspaceFolder, set: { tasks: custom }, configurations: customizedTasks, hasErrors: configuration.hasParseErrors };
        }
        async computeUserTasks(workspaceFolder, runSource = 1 /* TaskRunSource.User */) {
            if (this.executionEngine === tasks_1.ExecutionEngine.Process) {
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            const userTasksConfig = this.getConfiguration(workspaceFolder, tasks_1.TaskSourceKind.User);
            const configuration = this.testParseExternalConfig(userTasksConfig.config, nls.localize('TasksSystem.locationUserConfig', 'user settings'));
            let customizedTasks = {
                byIdentifier: Object.create(null)
            };
            const custom = [];
            await this.computeTasksForSingleConfig(workspaceFolder, configuration.config, runSource, custom, customizedTasks.byIdentifier, TaskConfig.TaskConfigSource.User);
            const engine = configuration.config ? TaskConfig.ExecutionEngine.from(configuration.config) : tasks_1.ExecutionEngine.Terminal;
            if (engine === tasks_1.ExecutionEngine.Process) {
                this.notificationService.warn(nls.localize('TaskSystem.versionSettings', 'Only tasks version 2.0.0 permitted in user settings.'));
                return this.emptyWorkspaceTaskResults(workspaceFolder);
            }
            return { workspaceFolder, set: { tasks: custom }, configurations: customizedTasks, hasErrors: configuration.hasParseErrors };
        }
        emptyWorkspaceTaskResults(workspaceFolder) {
            return { workspaceFolder, set: undefined, configurations: undefined, hasErrors: false };
        }
        async computeTasksForSingleConfig(workspaceFolder, config, runSource, custom, customized, source, isRecentTask = false) {
            if (!config) {
                return false;
            }
            let taskSystemInfo = workspaceFolder ? this.getTaskSystemInfo(workspaceFolder.uri.scheme) : undefined;
            let problemReporter = new ProblemReporter(this._outputChannel);
            let parseResult = TaskConfig.parse(workspaceFolder, this._workspace, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, config, problemReporter, source, this.contextKeyService, isRecentTask);
            let hasErrors = false;
            if (!parseResult.validationStatus.isOK() && (parseResult.validationStatus.state !== 1 /* ValidationState.Info */)) {
                this.showOutput(runSource);
                hasErrors = true;
            }
            if (problemReporter.status.isFatal()) {
                problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                return hasErrors;
            }
            if (parseResult.configured && parseResult.configured.length > 0) {
                for (let task of parseResult.configured) {
                    customized[task.configures._key] = task;
                }
            }
            if (!this.jsonTasksSupported && (parseResult.custom.length > 0)) {
                console.warn('Custom workspace tasks are not supported.');
            }
            else {
                for (let task of parseResult.custom) {
                    custom.push(task);
                }
            }
            return hasErrors;
        }
        computeConfiguration(workspaceFolder) {
            let { config, hasParseErrors } = this.getConfiguration(workspaceFolder);
            return Promise.resolve({ workspaceFolder, config, hasErrors: hasParseErrors });
        }
        computeWorkspaceFolderSetup() {
            let workspaceFolders = [];
            let ignoredWorkspaceFolders = [];
            let executionEngine = tasks_1.ExecutionEngine.Terminal;
            let schemaVersion = 2 /* JsonSchemaVersion.V2_0_0 */;
            let workspace;
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                let workspaceFolder = this.contextService.getWorkspace().folders[0];
                workspaceFolders.push(workspaceFolder);
                executionEngine = this.computeExecutionEngine(workspaceFolder);
                const telemetryData = {
                    executionEngineVersion: executionEngine
                };
                /* __GDPR__
                    "taskService.engineVersion" : {
                        "owner": "alexr00",
                        "comment": "The engine version of tasks. Used to determine if a user is using a deprecated version.",
                        "executionEngineVersion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "comment": "The engine version of tasks." }
                    }
                */
                this.telemetryService.publicLog('taskService.engineVersion', telemetryData);
                schemaVersion = this.computeJsonSchemaVersion(workspaceFolder);
            }
            else if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                workspace = this.contextService.getWorkspace();
                for (let workspaceFolder of this.contextService.getWorkspace().folders) {
                    if (schemaVersion === this.computeJsonSchemaVersion(workspaceFolder)) {
                        workspaceFolders.push(workspaceFolder);
                    }
                    else {
                        ignoredWorkspaceFolders.push(workspaceFolder);
                        this._outputChannel.append(nls.localize('taskService.ignoreingFolder', 'Ignoring task configurations for workspace folder {0}. Multi folder workspace task support requires that all folders use task version 2.0.0\n', workspaceFolder.uri.fsPath));
                    }
                }
            }
            return [workspaceFolders, ignoredWorkspaceFolders, executionEngine, schemaVersion, workspace];
        }
        computeExecutionEngine(workspaceFolder) {
            let { config } = this.getConfiguration(workspaceFolder);
            if (!config) {
                return tasks_1.ExecutionEngine._default;
            }
            return TaskConfig.ExecutionEngine.from(config);
        }
        computeJsonSchemaVersion(workspaceFolder) {
            let { config } = this.getConfiguration(workspaceFolder);
            if (!config) {
                return 2 /* JsonSchemaVersion.V2_0_0 */;
            }
            return TaskConfig.JsonSchemaVersion.from(config);
        }
        getConfiguration(workspaceFolder, source) {
            let result;
            if ((source !== tasks_1.TaskSourceKind.User) && (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */)) {
                result = undefined;
            }
            else {
                const wholeConfig = this.configurationService.inspect('tasks', { resource: workspaceFolder.uri });
                switch (source) {
                    case tasks_1.TaskSourceKind.User: {
                        if (wholeConfig.userValue !== wholeConfig.workspaceFolderValue) {
                            result = Objects.deepClone(wholeConfig.userValue);
                        }
                        break;
                    }
                    case tasks_1.TaskSourceKind.Workspace:
                        result = Objects.deepClone(wholeConfig.workspaceFolderValue);
                        break;
                    case tasks_1.TaskSourceKind.WorkspaceFile: {
                        if ((this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */)
                            && (wholeConfig.workspaceFolderValue !== wholeConfig.workspaceValue)) {
                            result = Objects.deepClone(wholeConfig.workspaceValue);
                        }
                        break;
                    }
                    default: result = Objects.deepClone(wholeConfig.workspaceFolderValue);
                }
            }
            if (!result) {
                return { config: undefined, hasParseErrors: false };
            }
            let parseErrors = result.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._outputChannel.append(nls.localize('TaskSystem.invalidTaskJson', 'Error: The content of the tasks.json file has syntax errors. Please correct them before executing a task.\n'));
                    this.showOutput();
                    return { config: undefined, hasParseErrors: true };
                }
            }
            return { config: result, hasParseErrors: false };
        }
        inTerminal() {
            if (this._taskSystem) {
                return this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem;
            }
            return this.executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
        configureAction() {
            const thisCapture = this;
            return new class extends actions_1.Action {
                constructor() {
                    super(ConfigureTaskAction.ID, ConfigureTaskAction.TEXT, undefined, true, () => { thisCapture.runConfigureTasks(); return Promise.resolve(undefined); });
                }
            };
        }
        handleError(err) {
            let showOutput = true;
            if (err instanceof taskSystem_1.TaskError) {
                let buildError = err;
                let needsConfig = buildError.code === 0 /* TaskErrors.NotConfigured */ || buildError.code === 2 /* TaskErrors.NoBuildTask */ || buildError.code === 3 /* TaskErrors.NoTestTask */;
                let needsTerminate = buildError.code === 1 /* TaskErrors.RunningTask */;
                if (needsConfig || needsTerminate) {
                    this.notificationService.prompt(buildError.severity, buildError.message, [{
                            label: needsConfig ? ConfigureTaskAction.TEXT : nls.localize('TerminateAction.label', "Terminate Task"),
                            run: () => {
                                if (needsConfig) {
                                    this.runConfigureTasks();
                                }
                                else {
                                    this.runTerminateCommand();
                                }
                            }
                        }]);
                }
                else {
                    this.notificationService.notify({ severity: buildError.severity, message: buildError.message });
                }
            }
            else if (err instanceof Error) {
                let error = err;
                this.notificationService.error(error.message);
                showOutput = false;
            }
            else if (Types.isString(err)) {
                this.notificationService.error(err);
            }
            else {
                this.notificationService.error(nls.localize('TaskSystem.unknownError', 'An error has occurred while running a task. See task log for details.'));
            }
            if (showOutput) {
                this.showOutput();
            }
        }
        canRunCommand() {
            return true;
        }
        showDetail() {
            return this.configurationService.getValue(taskQuickPick_1.QUICKOPEN_DETAIL_CONFIG);
        }
        async createTaskQuickPickEntries(tasks, group = false, sort = false, selectedEntry, includeRecents = true) {
            let encounteredTasks = {};
            if (tasks === undefined || tasks === null || tasks.length === 0) {
                return [];
            }
            const TaskQuickPickEntry = (task) => {
                const newEntry = { label: task._label, description: this.getTaskDescription(task), task, detail: this.showDetail() ? task.configurationProperties.detail : undefined };
                if (encounteredTasks[task._id]) {
                    if (encounteredTasks[task._id].length === 1) {
                        encounteredTasks[task._id][0].label += ' (1)';
                    }
                    newEntry.label = newEntry.label + ' (' + (encounteredTasks[task._id].length + 1).toString() + ')';
                }
                else {
                    encounteredTasks[task._id] = [];
                }
                encounteredTasks[task._id].push(newEntry);
                return newEntry;
            };
            function fillEntries(entries, tasks, groupLabel) {
                if (tasks.length) {
                    entries.push({ type: 'separator', label: groupLabel });
                }
                for (let task of tasks) {
                    let entry = TaskQuickPickEntry(task);
                    entry.buttons = [{ iconClass: themeService_1.ThemeIcon.asClassName(taskQuickPick_1.configureTaskIcon), tooltip: nls.localize('configureTask', "Configure Task") }];
                    if (selectedEntry && (task === selectedEntry.task)) {
                        entries.unshift(selectedEntry);
                    }
                    else {
                        entries.push(entry);
                    }
                }
            }
            let entries;
            if (group) {
                entries = [];
                if (tasks.length === 1) {
                    entries.push(TaskQuickPickEntry(tasks[0]));
                }
                else {
                    let recentlyUsedTasks = await this.readRecentTasks();
                    let recent = [];
                    let recentSet = new Set();
                    let configured = [];
                    let detected = [];
                    let taskMap = Object.create(null);
                    tasks.forEach(task => {
                        let key = task.getCommonTaskId();
                        if (key) {
                            taskMap[key] = task;
                        }
                    });
                    recentlyUsedTasks.reverse().forEach(recentTask => {
                        const key = recentTask.getCommonTaskId();
                        if (key) {
                            recentSet.add(key);
                            let task = taskMap[key];
                            if (task) {
                                recent.push(task);
                            }
                        }
                    });
                    for (let task of tasks) {
                        let key = task.getCommonTaskId();
                        if (!key || !recentSet.has(key)) {
                            if ((task._source.kind === tasks_1.TaskSourceKind.Workspace) || (task._source.kind === tasks_1.TaskSourceKind.User)) {
                                configured.push(task);
                            }
                            else {
                                detected.push(task);
                            }
                        }
                    }
                    const sorter = this.createSorter();
                    if (includeRecents) {
                        fillEntries(entries, recent, nls.localize('recentlyUsed', 'recently used tasks'));
                    }
                    configured = configured.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, configured, nls.localize('configured', 'configured tasks'));
                    detected = detected.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, detected, nls.localize('detected', 'detected tasks'));
                }
            }
            else {
                if (sort) {
                    const sorter = this.createSorter();
                    tasks = tasks.sort((a, b) => sorter.compare(a, b));
                }
                entries = tasks.map(task => TaskQuickPickEntry(task));
            }
            encounteredTasks = {};
            return entries;
        }
        async showTwoLevelQuickPick(placeHolder, defaultEntry) {
            return taskQuickPick_1.TaskQuickPick.show(this, this.configurationService, this.quickInputService, this.notificationService, this.dialogService, placeHolder, defaultEntry);
        }
        async showQuickPick(tasks, placeHolder, defaultEntry, group = false, sort = false, selectedEntry, additionalEntries) {
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const cancellationToken = tokenSource.token;
            let _createEntries = new Promise((resolve) => {
                if (Array.isArray(tasks)) {
                    resolve(this.createTaskQuickPickEntries(tasks, group, sort, selectedEntry));
                }
                else {
                    resolve(tasks.then((tasks) => this.createTaskQuickPickEntries(tasks, group, sort, selectedEntry)));
                }
            });
            const timeout = await Promise.race([new Promise((resolve) => {
                    _createEntries.then(() => resolve(false));
                }), new Promise((resolve) => {
                    const timer = setTimeout(() => {
                        clearTimeout(timer);
                        resolve(true);
                    }, 200);
                })]);
            if (!timeout && ((await _createEntries).length === 1) && this.configurationService.getValue(taskQuickPick_1.QUICKOPEN_SKIP_CONFIG)) {
                return (await _createEntries)[0];
            }
            const pickEntries = _createEntries.then((entries) => {
                if ((entries.length === 1) && this.configurationService.getValue(taskQuickPick_1.QUICKOPEN_SKIP_CONFIG)) {
                    tokenSource.cancel();
                }
                else if ((entries.length === 0) && defaultEntry) {
                    entries.push(defaultEntry);
                }
                else if (entries.length > 1 && additionalEntries && additionalEntries.length > 0) {
                    entries.push({ type: 'separator', label: '' });
                    entries.push(additionalEntries[0]);
                }
                return entries;
            });
            const picker = this.quickInputService.createQuickPick();
            picker.placeholder = placeHolder;
            picker.matchOnDescription = true;
            picker.onDidTriggerItemButton(context => {
                let task = context.item.task;
                this.quickInputService.cancel();
                if (tasks_1.ContributedTask.is(task)) {
                    this.customize(task, undefined, true);
                }
                else if (tasks_1.CustomTask.is(task)) {
                    this.openConfig(task);
                }
            });
            picker.busy = true;
            pickEntries.then(entries => {
                picker.busy = false;
                picker.items = entries;
            });
            picker.show();
            return new Promise(resolve => {
                this._register(picker.onDidAccept(async () => {
                    let selection = picker.selectedItems ? picker.selectedItems[0] : undefined;
                    if (cancellationToken.isCancellationRequested) {
                        // canceled when there's only one task
                        const task = (await pickEntries)[0];
                        if (task.task) {
                            selection = task;
                        }
                    }
                    picker.dispose();
                    if (!selection) {
                        resolve(undefined);
                    }
                    resolve(selection);
                }));
            });
        }
        needsRecentTasksMigration() {
            return (this.getRecentlyUsedTasksV1().size > 0) && (this.getRecentlyUsedTasks().size === 0);
        }
        async migrateRecentTasks(tasks) {
            if (!this.needsRecentTasksMigration()) {
                return;
            }
            let recentlyUsedTasks = this.getRecentlyUsedTasksV1();
            let taskMap = Object.create(null);
            tasks.forEach(task => {
                let key = task.getRecentlyUsedKey();
                if (key) {
                    taskMap[key] = task;
                }
            });
            const reversed = [...recentlyUsedTasks.keys()].reverse();
            for (const key in reversed) {
                let task = taskMap[key];
                if (task) {
                    await this.setRecentlyUsedTask(task);
                }
            }
            this.storageService.remove(AbstractTaskService.RecentlyUsedTasks_Key, 1 /* StorageScope.WORKSPACE */);
        }
        showIgnoredFoldersMessage() {
            if (this.ignoredWorkspaceFolders.length === 0 || !this.showIgnoreMessage) {
                return Promise.resolve(undefined);
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('TaskService.ignoredFolder', 'The following workspace folders are ignored since they use task version 0.1.0: {0}', this.ignoredWorkspaceFolders.map(f => f.name).join(', ')), [{
                    label: nls.localize('TaskService.notAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        this.storageService.store(AbstractTaskService.IgnoreTask010DonotShowAgain_key, true, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                        this._showIgnoreMessage = false;
                    }
                }]);
            return Promise.resolve(undefined);
        }
        async trust() {
            return (await this.workspaceTrustRequestService.requestWorkspaceTrust({
                message: nls.localize('TaskService.requestTrust', "Listing and running tasks requires that some of the files in this workspace be executed as code.")
            })) === true;
        }
        runTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let identifier = this.getTaskIdentifier(arg);
            if (identifier !== undefined) {
                this.getGroupedTasks().then(async (grouped) => {
                    let resolver = this.createResolver(grouped);
                    let folderURIs = this.contextService.getWorkspace().folders.map(folder => folder.uri);
                    if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                        folderURIs.push(this.contextService.getWorkspace().configuration);
                    }
                    folderURIs.push(tasks_1.USER_TASKS_GROUP_KEY);
                    for (let uri of folderURIs) {
                        let task = await resolver.resolve(uri, identifier);
                        if (task) {
                            this.run(task).then(undefined, reason => {
                                // eat the error, it has already been surfaced to the user and we don't care about it here
                            });
                            return;
                        }
                    }
                    this.doRunTaskCommand(grouped.all());
                }, () => {
                    this.doRunTaskCommand();
                });
            }
            else {
                this.doRunTaskCommand();
            }
        }
        tasksAndGroupedTasks(filter) {
            if (!this.versionAndEngineCompatible(filter)) {
                return { tasks: Promise.resolve([]), grouped: Promise.resolve(new TaskMap()) };
            }
            const grouped = this.getGroupedTasks(filter ? filter.type : undefined);
            const tasks = grouped.then((map) => {
                if (!filter || !filter.type) {
                    return map.all();
                }
                let result = [];
                map.forEach((tasks) => {
                    for (let task of tasks) {
                        if (tasks_1.ContributedTask.is(task) && task.defines.type === filter.type) {
                            result.push(task);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            if (task.type === filter.type) {
                                result.push(task);
                            }
                            else {
                                let customizes = task.customizes();
                                if (customizes && customizes.type === filter.type) {
                                    result.push(task);
                                }
                            }
                        }
                    }
                });
                return result;
            });
            return { tasks, grouped };
        }
        doRunTaskCommand(tasks) {
            const pickThen = (task) => {
                if (task === undefined) {
                    return;
                }
                if (task === null) {
                    this.runConfigureTasks();
                }
                else {
                    this.run(task, { attachProblemMatcher: true }, 1 /* TaskRunSource.User */).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
            };
            const placeholder = nls.localize('TaskService.pickRunTask', 'Select the task to run');
            this.showIgnoredFoldersMessage().then(() => {
                if (this.configurationService.getValue(USE_SLOW_PICKER)) {
                    let taskResult = undefined;
                    if (!tasks) {
                        taskResult = this.tasksAndGroupedTasks();
                    }
                    this.showQuickPick(tasks ? tasks : taskResult.tasks, placeholder, {
                        label: nls.localize('TaskService.noEntryToRunSlow', '$(plus) Configure a Task'),
                        task: null
                    }, true).
                        then((entry) => {
                        return pickThen(entry ? entry.task : undefined);
                    });
                }
                else {
                    this.showTwoLevelQuickPick(placeholder, {
                        label: nls.localize('TaskService.noEntryToRun', '$(plus) Configure a Task'),
                        task: null
                    }).
                        then(pickThen);
                }
            });
        }
        reRunTaskCommand() {
            if (!this.canRunCommand()) {
                return;
            }
            problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                return this.editorService.saveAll({ reason: 2 /* SaveReason.AUTO */ }).then(() => {
                    let executeResult = this.getTaskSystem().rerun();
                    if (executeResult) {
                        return this.handleExecuteResult(executeResult);
                    }
                    else {
                        this.doRunTaskCommand();
                        return Promise.resolve(undefined);
                    }
                });
            });
        }
        /**
         *
         * @param tasks - The tasks which need filtering from defaults and non-defaults
         * @param defaultType - If there are globs want globs in the default list, otherwise only tasks with true
         * @param taskGlobsInList - This tells splitPerGroupType to filter out globbed tasks (into default), otherwise fall back to boolean
         * @returns
         */
        splitPerGroupType(tasks, taskGlobsInList = false) {
            let none = [];
            let defaults = [];
            for (let task of tasks) {
                // At this point (assuming taskGlobsInList is true) there are tasks with matching globs, so only put those in defaults
                if (taskGlobsInList && typeof task.configurationProperties.group.isDefault === 'string') {
                    defaults.push(task);
                }
                else if (!taskGlobsInList && task.configurationProperties.group.isDefault === true) {
                    defaults.push(task);
                }
                else {
                    none.push(task);
                }
            }
            return { none, defaults };
        }
        runTaskGroupCommand(taskGroup, strings, configure, legacyCommand) {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 1 /* JsonSchemaVersion.V0_1_0 */) {
                legacyCommand();
                return;
            }
            let options = {
                location: 10 /* ProgressLocation.Window */,
                title: strings.fetching
            };
            let promise = (async () => {
                var _a;
                let taskGroupTasks = [];
                async function runSingleTask(task, problemMatcherOptions, that) {
                    that.run(task, problemMatcherOptions, 1 /* TaskRunSource.User */).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
                const chooseAndRunTask = (tasks) => {
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, strings.select, {
                            label: strings.notFoundConfigure,
                            task: null
                        }, true).then((entry) => {
                            let task = entry ? entry.task : undefined;
                            if (task === undefined) {
                                return;
                            }
                            if (task === null) {
                                configure();
                                return;
                            }
                            runSingleTask(task, { attachProblemMatcher: true }, this);
                        });
                    });
                };
                // First check for globs before checking for the default tasks of the task group
                const absoluteURI = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
                if (absoluteURI) {
                    const workspaceFolder = this.contextService.getWorkspaceFolder(absoluteURI);
                    // fallback to absolute path of the file if it is not in a workspace or relative path cannot be found
                    const relativePath = (workspaceFolder === null || workspaceFolder === void 0 ? void 0 : workspaceFolder.uri) ? ((_a = resources.relativePath(workspaceFolder.uri, absoluteURI)) !== null && _a !== void 0 ? _a : absoluteURI.path) : absoluteURI.path;
                    taskGroupTasks = await this._findWorkspaceTasks((task) => {
                        const taskGroup = task.configurationProperties.group;
                        if (taskGroup && typeof taskGroup !== 'string' && typeof taskGroup.isDefault === 'string') {
                            return (taskGroup._id === taskGroup._id && glob.match(taskGroup.isDefault, relativePath));
                        }
                        return false;
                    });
                }
                const handleMultipleTasks = (areGlobTasks) => {
                    return this.getTasksForGroup(taskGroup).then((tasks) => {
                        if (tasks.length > 0) {
                            // If we're dealing with tasks that were chosen because of a glob match,
                            // then put globs in the defaults and everything else in none
                            let { none, defaults } = this.splitPerGroupType(tasks, areGlobTasks);
                            if (defaults.length === 1) {
                                runSingleTask(defaults[0], undefined, this);
                                return;
                            }
                            else if (defaults.length + none.length > 0) {
                                tasks = defaults.concat(none);
                            }
                        }
                        // At this this point there are multiple tasks.
                        chooseAndRunTask(tasks);
                    });
                };
                const resolveTaskAndRun = (taskGroupTask) => {
                    if (tasks_1.ConfiguringTask.is(taskGroupTask)) {
                        this.tryResolveTask(taskGroupTask).then(resolvedTask => {
                            runSingleTask(resolvedTask, undefined, this);
                        });
                    }
                    else {
                        runSingleTask(taskGroupTask, undefined, this);
                    }
                };
                // A single default glob task was returned, just run it directly
                if (taskGroupTasks.length === 1) {
                    return resolveTaskAndRun(taskGroupTasks[0]);
                }
                // If there's multiple globs that match we want to show the quick picker for those tasks
                // We will need to call splitPerGroupType putting globs in defaults and the remaining tasks in none.
                // We don't need to carry on after here
                if (taskGroupTasks.length > 1) {
                    return handleMultipleTasks(true);
                }
                // If no globs are found or matched fallback to checking for default tasks of the task group
                if (!taskGroupTasks.length) {
                    taskGroupTasks = await this._findWorkspaceTasksInGroup(taskGroup, false);
                }
                // A single default task was returned, just run it directly
                if (taskGroupTasks.length === 1) {
                    return resolveTaskAndRun(taskGroupTasks[0]);
                }
                // Multiple default tasks returned, show the quickPicker
                return handleMultipleTasks(false);
            })();
            this.progressService.withProgress(options, () => promise);
        }
        runBuildCommand() {
            return this.runTaskGroupCommand(tasks_1.TaskGroup.Build, {
                fetching: nls.localize('TaskService.fetchingBuildTasks', 'Fetching build tasks...'),
                select: nls.localize('TaskService.pickBuildTask', 'Select the build task to run'),
                notFoundConfigure: nls.localize('TaskService.noBuildTask', 'No build task to run found. Configure Build Task...')
            }, this.runConfigureDefaultBuildTask, this.build);
        }
        runTestCommand() {
            return this.runTaskGroupCommand(tasks_1.TaskGroup.Test, {
                fetching: nls.localize('TaskService.fetchingTestTasks', 'Fetching test tasks...'),
                select: nls.localize('TaskService.pickTestTask', 'Select the test task to run'),
                notFoundConfigure: nls.localize('TaskService.noTestTaskTerminal', 'No test task to run found. Configure Tasks...')
            }, this.runConfigureDefaultTestTask, this.runTest);
        }
        runTerminateCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            if (arg === 'terminateAll') {
                this.terminateAll();
                return;
            }
            let runQuickPick = (promise) => {
                this.showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.taskToTerminate', 'Select a task to terminate'), {
                    label: nls.localize('TaskService.noTaskRunning', 'No task is currently running'),
                    task: undefined
                }, false, true, undefined, [{
                        label: nls.localize('TaskService.terminateAllRunningTasks', 'All Running Tasks'),
                        id: 'terminateAll',
                        task: undefined
                    }]).then(entry => {
                    if (entry && entry.id === 'terminateAll') {
                        this.terminateAll();
                    }
                    let task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.terminate(task);
                });
            };
            if (this.inTerminal()) {
                let identifier = this.getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (let task of tasks) {
                            if (task.matches(identifier)) {
                                this.terminate(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this.isActive().then((active) => {
                    if (active) {
                        this.terminateAll().then((responses) => {
                            // the output runner has only one task
                            let response = responses[0];
                            if (response.success) {
                                return;
                            }
                            if (response.code && response.code === 3 /* TerminateResponseCode.ProcessNotFound */) {
                                this.notificationService.error(nls.localize('TerminateAction.noProcess', 'The launched process doesn\'t exist anymore. If the task spawned background tasks exiting VS Code might result in orphaned processes.'));
                            }
                            else {
                                this.notificationService.error(nls.localize('TerminateAction.failed', 'Failed to terminate running task'));
                            }
                        });
                    }
                });
            }
        }
        runRestartTaskCommand(arg) {
            if (!this.canRunCommand()) {
                return;
            }
            let runQuickPick = (promise) => {
                this.showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.taskToRestart', 'Select the task to restart'), {
                    label: nls.localize('TaskService.noTaskToRestart', 'No task to restart'),
                    task: null
                }, false, true).then(entry => {
                    let task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.restart(task);
                });
            };
            if (this.inTerminal()) {
                let identifier = this.getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (let task of tasks) {
                            if (task.matches(identifier)) {
                                this.restart(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this.getActiveTasks().then((activeTasks) => {
                    if (activeTasks.length === 0) {
                        return;
                    }
                    let task = activeTasks[0];
                    this.restart(task);
                });
            }
        }
        getTaskIdentifier(arg) {
            let result = undefined;
            if (Types.isString(arg)) {
                result = arg;
            }
            else if (arg && Types.isString(arg.type)) {
                result = tasks_1.TaskDefinition.createTaskIdentifier(arg, console);
            }
            return result;
        }
        configHasTasks(taskConfig) {
            return !!taskConfig && !!taskConfig.tasks && taskConfig.tasks.length > 0;
        }
        openTaskFile(resource, taskSource) {
            let configFileCreated = false;
            this.fileService.stat(resource).then((stat) => stat, () => undefined).then(async (stat) => {
                const fileExists = !!stat;
                const configValue = this.configurationService.inspect('tasks');
                let tasksExistInFile;
                let target;
                switch (taskSource) {
                    case tasks_1.TaskSourceKind.User:
                        tasksExistInFile = this.configHasTasks(configValue.userValue);
                        target = 1 /* ConfigurationTarget.USER */;
                        break;
                    case tasks_1.TaskSourceKind.WorkspaceFile:
                        tasksExistInFile = this.configHasTasks(configValue.workspaceValue);
                        target = 4 /* ConfigurationTarget.WORKSPACE */;
                        break;
                    default:
                        tasksExistInFile = this.configHasTasks(configValue.workspaceFolderValue);
                        target = 5 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
                let content;
                if (!tasksExistInFile) {
                    const pickTemplateResult = await this.quickInputService.pick((0, taskTemplates_1.getTemplates)(), { placeHolder: nls.localize('TaskService.template', 'Select a Task Template') });
                    if (!pickTemplateResult) {
                        return Promise.resolve(undefined);
                    }
                    content = pickTemplateResult.content;
                    let editorConfig = this.configurationService.getValue();
                    if (editorConfig.editor.insertSpaces) {
                        content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + ' '.repeat(s2.length * editorConfig.editor.tabSize));
                    }
                    configFileCreated = true;
                }
                if (!fileExists && content) {
                    return this.textFileService.create([{ resource, value: content }]).then(result => {
                        return result[0].resource;
                    });
                }
                else if (fileExists && (tasksExistInFile || content)) {
                    if (content) {
                        this.configurationService.updateValue('tasks', json.parse(content), target);
                    }
                    return stat === null || stat === void 0 ? void 0 : stat.resource;
                }
                return undefined;
            }).then((resource) => {
                if (!resource) {
                    return;
                }
                this.editorService.openEditor({
                    resource,
                    options: {
                        pinned: configFileCreated // pin only if config file is created #8727
                    }
                });
            });
        }
        isTaskEntry(value) {
            let candidate = value;
            return candidate && !!candidate.task;
        }
        isSettingEntry(value) {
            let candidate = value;
            return candidate && !!candidate.settingType;
        }
        configureTask(task) {
            if (tasks_1.ContributedTask.is(task)) {
                this.customize(task, undefined, true);
            }
            else if (tasks_1.CustomTask.is(task)) {
                this.openConfig(task);
            }
            else if (tasks_1.ConfiguringTask.is(task)) {
                // Do nothing.
            }
        }
        handleSelection(selection) {
            if (!selection) {
                return;
            }
            if (this.isTaskEntry(selection)) {
                this.configureTask(selection.task);
            }
            else if (this.isSettingEntry(selection)) {
                const taskQuickPick = new taskQuickPick_1.TaskQuickPick(this, this.configurationService, this.quickInputService, this.notificationService, this.dialogService);
                taskQuickPick.handleSettingOption(selection.settingType);
            }
            else if (selection.folder && (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */)) {
                this.openTaskFile(selection.folder.toResource('.vscode/tasks.json'), tasks_1.TaskSourceKind.Workspace);
            }
            else {
                const resource = this.getResourceForKind(tasks_1.TaskSourceKind.User);
                if (resource) {
                    this.openTaskFile(resource, tasks_1.TaskSourceKind.User);
                }
            }
        }
        getTaskDescription(task) {
            let description;
            if (task._source.kind === tasks_1.TaskSourceKind.User) {
                description = nls.localize('taskQuickPick.userSettings', 'User');
            }
            else if (task._source.kind === tasks_1.TaskSourceKind.WorkspaceFile) {
                description = task.getWorkspaceFileName();
            }
            else if (this.needsFolderQualification()) {
                let workspaceFolder = task.getWorkspaceFolder();
                if (workspaceFolder) {
                    description = workspaceFolder.name;
                }
            }
            return description;
        }
        async runConfigureTasks() {
            if (!(await this.trust())) {
                return;
            }
            if (!this.canRunCommand()) {
                return undefined;
            }
            let taskPromise;
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                taskPromise = this.getGroupedTasks();
            }
            else {
                taskPromise = Promise.resolve(new TaskMap());
            }
            let stats = this.contextService.getWorkspace().folders.map((folder) => {
                return this.fileService.stat(folder.toResource('.vscode/tasks.json')).then(stat => stat, () => undefined);
            });
            let createLabel = nls.localize('TaskService.createJsonFile', 'Create tasks.json file from template');
            let openLabel = nls.localize('TaskService.openJsonFile', 'Open tasks.json file');
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const cancellationToken = tokenSource.token;
            let entries = Promise.all(stats).then((stats) => {
                return taskPromise.then((taskMap) => {
                    let entries = [];
                    let configuredCount = 0;
                    let tasks = taskMap.all();
                    if (tasks.length > 0) {
                        tasks = tasks.sort((a, b) => a._label.localeCompare(b._label));
                        for (let task of tasks) {
                            entries.push({ label: task._label, task, description: this.getTaskDescription(task), detail: this.showDetail() ? task.configurationProperties.detail : undefined });
                            if (!tasks_1.ContributedTask.is(task)) {
                                configuredCount++;
                            }
                        }
                    }
                    const needsCreateOrOpen = (configuredCount === 0);
                    // If the only configured tasks are user tasks, then we should also show the option to create from a template.
                    if (needsCreateOrOpen || (taskMap.get(tasks_1.USER_TASKS_GROUP_KEY).length === configuredCount)) {
                        let label = stats[0] !== undefined ? openLabel : createLabel;
                        if (entries.length) {
                            entries.push({ type: 'separator' });
                        }
                        entries.push({ label, folder: this.contextService.getWorkspace().folders[0] });
                    }
                    if ((entries.length === 1) && !needsCreateOrOpen) {
                        tokenSource.cancel();
                    }
                    return entries;
                });
            });
            const timeout = await Promise.race([new Promise((resolve) => {
                    entries.then(() => resolve(false));
                }), new Promise((resolve) => {
                    const timer = setTimeout(() => {
                        clearTimeout(timer);
                        resolve(true);
                    }, 200);
                })]);
            if (!timeout && ((await entries).length === 1) && this.configurationService.getValue(taskQuickPick_1.QUICKOPEN_SKIP_CONFIG)) {
                const entry = ((await entries)[0]);
                if (entry.task) {
                    this.handleSelection(entry);
                    return;
                }
            }
            const entriesWithSettings = entries.then(resolvedEntries => {
                resolvedEntries.push(...taskQuickPick_1.TaskQuickPick.allSettingEntries(this.configurationService));
                return resolvedEntries;
            });
            this.quickInputService.pick(entriesWithSettings, { placeHolder: nls.localize('TaskService.pickTask', 'Select a task to configure') }, cancellationToken).
                then(async (selection) => {
                if (cancellationToken.isCancellationRequested) {
                    // canceled when there's only one task
                    const task = (await entries)[0];
                    if (task.task) {
                        selection = task;
                    }
                }
                this.handleSelection(selection);
            });
        }
        runConfigureDefaultBuildTask() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this.runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (let task of tasks) {
                        let taskGroup = tasks_1.TaskGroup.from(task.configurationProperties.group);
                        if (taskGroup && taskGroup.isDefault && taskGroup._id === tasks_1.TaskGroup.Build._id) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultBuildTaskExists', '{0} is already marked as the default build task', selectedTask.getQualifiedLabel()),
                            task: selectedTask,
                            detail: this.showDetail() ? selectedTask.configurationProperties.detail : undefined
                        };
                    }
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, nls.localize('TaskService.pickDefaultBuildTask', 'Select the task to be used as the default build task'), undefined, true, false, selectedEntry).
                            then((entry) => {
                            let task = entry ? entry.task : undefined;
                            if ((task === undefined) || (task === null)) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'build', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'build' }, false);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this.runConfigureTasks();
            }
        }
        runConfigureDefaultTestTask() {
            if (!this.canRunCommand()) {
                return;
            }
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this.runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (let task of tasks) {
                        let taskGroup = tasks_1.TaskGroup.from(task.configurationProperties.group);
                        if (taskGroup && taskGroup.isDefault && taskGroup._id === tasks_1.TaskGroup.Test._id) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultTestTaskExists', '{0} is already marked as the default test task.', selectedTask.getQualifiedLabel()),
                            task: selectedTask,
                            detail: this.showDetail() ? selectedTask.configurationProperties.detail : undefined
                        };
                    }
                    this.showIgnoredFoldersMessage().then(() => {
                        this.showQuickPick(tasks, nls.localize('TaskService.pickDefaultTestTask', 'Select the task to be used as the default test task'), undefined, true, false, selectedEntry).then((entry) => {
                            let task = entry ? entry.task : undefined;
                            if (!task) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'test', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'test' }, false);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this.runConfigureTasks();
            }
        }
        async runShowTasks() {
            if (!this.canRunCommand()) {
                return;
            }
            const activeTasksPromise = this.getActiveTasks();
            const activeTasks = await activeTasksPromise;
            let group;
            if (activeTasks.length === 1) {
                this._taskSystem.revealTask(activeTasks[0]);
            }
            else if (activeTasks.length && activeTasks.every((task) => {
                var _a, _b;
                if (tasks_1.InMemoryTask.is(task)) {
                    return false;
                }
                if (!group) {
                    group = (_a = task.command.presentation) === null || _a === void 0 ? void 0 : _a.group;
                }
                return ((_b = task.command.presentation) === null || _b === void 0 ? void 0 : _b.group) && (task.command.presentation.group === group);
            })) {
                this._taskSystem.revealTask(activeTasks[0]);
            }
            else {
                this.showQuickPick(activeTasksPromise, nls.localize('TaskService.pickShowTask', 'Select the task to show its output'), {
                    label: nls.localize('TaskService.noTaskIsRunning', 'No task is running'),
                    task: null
                }, false, true).then((entry) => {
                    let task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this._taskSystem.revealTask(task);
                });
            }
        }
        async createTasksDotOld(folder) {
            const tasksFile = folder.toResource('.vscode/tasks.json');
            if (await this.fileService.exists(tasksFile)) {
                const oldFile = tasksFile.with({ path: `${tasksFile.path}.old` });
                await this.fileService.copy(tasksFile, oldFile, true);
                return [oldFile, tasksFile];
            }
            return undefined;
        }
        upgradeTask(task, suppressTaskName, globalConfig) {
            var _a, _b, _c, _d, _e, _f;
            if (!tasks_1.CustomTask.is(task)) {
                return;
            }
            const configElement = {
                label: task._label
            };
            const oldTaskTypes = new Set(['gulp', 'jake', 'grunt']);
            if (Types.isString(task.command.name) && oldTaskTypes.has(task.command.name)) {
                configElement.type = task.command.name;
                configElement.task = task.command.args[0];
            }
            else {
                if (task.command.runtime === tasks_1.RuntimeType.Shell) {
                    configElement.type = tasks_1.RuntimeType.toString(tasks_1.RuntimeType.Shell);
                }
                if (task.command.name && !suppressTaskName && !((_a = globalConfig.windows) === null || _a === void 0 ? void 0 : _a.command) && !((_b = globalConfig.osx) === null || _b === void 0 ? void 0 : _b.command) && !((_c = globalConfig.linux) === null || _c === void 0 ? void 0 : _c.command)) {
                    configElement.command = task.command.name;
                }
                else if (suppressTaskName) {
                    configElement.command = task._source.config.element.command;
                }
                if (task.command.args && (!Types.isArray(task.command.args) || (task.command.args.length > 0))) {
                    if (!((_d = globalConfig.windows) === null || _d === void 0 ? void 0 : _d.args) && !((_e = globalConfig.osx) === null || _e === void 0 ? void 0 : _e.args) && !((_f = globalConfig.linux) === null || _f === void 0 ? void 0 : _f.args)) {
                        configElement.args = task.command.args;
                    }
                    else {
                        configElement.args = task._source.config.element.args;
                    }
                }
            }
            if (task.configurationProperties.presentation) {
                configElement.presentation = task.configurationProperties.presentation;
            }
            if (task.configurationProperties.isBackground) {
                configElement.isBackground = task.configurationProperties.isBackground;
            }
            if (task.configurationProperties.problemMatchers) {
                configElement.problemMatcher = task._source.config.element.problemMatcher;
            }
            if (task.configurationProperties.group) {
                configElement.group = task.configurationProperties.group;
            }
            task._source.config.element = configElement;
            const tempTask = new tasks_1.CustomTask(task._id, task._source, task._label, task.type, task.command, task.hasDefinedMatchers, task.runOptions, task.configurationProperties);
            const configTask = this.createCustomizableTask(tempTask);
            if (configTask) {
                return configTask;
            }
            return;
        }
        async upgrade() {
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                return;
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                this._register(event_1.Event.once(this.workspaceTrustManagementService.onDidChangeTrust)(isTrusted => {
                    if (isTrusted) {
                        this.upgrade();
                    }
                }));
                return;
            }
            const tasks = await this.getGroupedTasks();
            const fileDiffs = [];
            for (const folder of this.workspaceFolders) {
                const diff = await this.createTasksDotOld(folder);
                if (diff) {
                    fileDiffs.push(diff);
                }
                if (!diff) {
                    continue;
                }
                const configTasks = [];
                const suppressTaskName = !!this.configurationService.getValue('tasks.suppressTaskName', { resource: folder.uri });
                const globalConfig = {
                    windows: this.configurationService.getValue('tasks.windows', { resource: folder.uri }),
                    osx: this.configurationService.getValue('tasks.osx', { resource: folder.uri }),
                    linux: this.configurationService.getValue('tasks.linux', { resource: folder.uri })
                };
                tasks.get(folder).forEach(task => {
                    const configTask = this.upgradeTask(task, suppressTaskName, globalConfig);
                    if (configTask) {
                        configTasks.push(configTask);
                    }
                });
                this._taskSystem = undefined;
                this._workspaceTasksPromise = undefined;
                await this.writeConfiguration(folder, 'tasks.tasks', configTasks);
                await this.writeConfiguration(folder, 'tasks.version', '2.0.0');
                if (this.configurationService.getValue('tasks.showOutput', { resource: folder.uri })) {
                    await this.configurationService.updateValue('tasks.showOutput', undefined, { resource: folder.uri });
                }
                if (this.configurationService.getValue('tasks.isShellCommand', { resource: folder.uri })) {
                    await this.configurationService.updateValue('tasks.isShellCommand', undefined, { resource: folder.uri });
                }
                if (this.configurationService.getValue('tasks.suppressTaskName', { resource: folder.uri })) {
                    await this.configurationService.updateValue('tasks.suppressTaskName', undefined, { resource: folder.uri });
                }
            }
            this.updateSetup();
            this.notificationService.prompt(severity_1.default.Warning, fileDiffs.length === 1 ?
                nls.localize('taskService.upgradeVersion', "The deprecated tasks version 0.1.0 has been removed. Your tasks have been upgraded to version 2.0.0. Open the diff to review the upgrade.")
                : nls.localize('taskService.upgradeVersionPlural', "The deprecated tasks version 0.1.0 has been removed. Your tasks have been upgraded to version 2.0.0. Open the diffs to review the upgrade."), [{
                    label: fileDiffs.length === 1 ? nls.localize('taskService.openDiff', "Open diff") : nls.localize('taskService.openDiffs', "Open diffs"),
                    run: async () => {
                        for (const upgrade of fileDiffs) {
                            await this.editorService.openEditor({
                                original: { resource: upgrade[0] },
                                modified: { resource: upgrade[1] }
                            });
                        }
                    }
                }]);
        }
    };
    // private static autoDetectTelemetryName: string = 'taskServer.autoDetect';
    AbstractTaskService.RecentlyUsedTasks_Key = 'workbench.tasks.recentlyUsedTasks';
    AbstractTaskService.RecentlyUsedTasks_KeyV2 = 'workbench.tasks.recentlyUsedTasks2';
    AbstractTaskService.IgnoreTask010DonotShowAgain_key = 'workbench.tasks.ignoreTask010Shown';
    AbstractTaskService.OutputChannelId = 'tasks';
    AbstractTaskService.OutputChannelLabel = nls.localize('tasks', "Tasks");
    AbstractTaskService.nextHandle = 0;
    AbstractTaskService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, markers_1.IMarkerService),
        __param(2, output_1.IOutputService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, views_1.IViewsService),
        __param(5, commands_1.ICommandService),
        __param(6, editorService_1.IEditorService),
        __param(7, files_1.IFileService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, model_1.IModelService),
        __param(12, extensions_1.IExtensionService),
        __param(13, quickInput_1.IQuickInputService),
        __param(14, configurationResolver_1.IConfigurationResolverService),
        __param(15, terminal_1.ITerminalService),
        __param(16, terminal_1.ITerminalGroupService),
        __param(17, storage_1.IStorageService),
        __param(18, progress_1.IProgressService),
        __param(19, opener_1.IOpenerService),
        __param(20, dialogs_1.IDialogService),
        __param(21, notification_1.INotificationService),
        __param(22, contextkey_1.IContextKeyService),
        __param(23, environmentService_1.IWorkbenchEnvironmentService),
        __param(24, terminal_2.ITerminalProfileResolverService),
        __param(25, pathService_1.IPathService),
        __param(26, resolverService_1.ITextModelService),
        __param(27, preferences_1.IPreferencesService),
        __param(28, views_1.IViewDescriptorService),
        __param(29, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(30, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(31, log_1.ILogService)
    ], AbstractTaskService);
    exports.AbstractTaskService = AbstractTaskService;
});
//# sourceMappingURL=abstractTaskService.js.map