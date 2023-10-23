/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "./extHost.protocol", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/base/common/errors", "vs/base/common/arrays", "vs/base/common/severity", "vs/platform/theme/common/themeService"], function (require, exports, cancellation_1, event_1, lifecycle_1, extHost_protocol_1, uri_1, extHostTypes_1, errors_1, arrays_1, severity_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createExtHostQuickOpen = void 0;
    function createExtHostQuickOpen(mainContext, workspace, commands) {
        const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadQuickOpen);
        class ExtHostQuickOpenImpl {
            constructor(workspace, commands) {
                this._sessions = new Map();
                this._instances = 0;
                this._workspace = workspace;
                this._commands = commands;
            }
            showQuickPick(itemsOrItemsPromise, options, token = cancellation_1.CancellationToken.None) {
                // clear state from last invocation
                this._onDidSelectItem = undefined;
                const itemsPromise = Promise.resolve(itemsOrItemsPromise);
                const instance = ++this._instances;
                const quickPickWidget = proxy.$show(instance, {
                    title: options === null || options === void 0 ? void 0 : options.title,
                    placeHolder: options === null || options === void 0 ? void 0 : options.placeHolder,
                    matchOnDescription: options === null || options === void 0 ? void 0 : options.matchOnDescription,
                    matchOnDetail: options === null || options === void 0 ? void 0 : options.matchOnDetail,
                    ignoreFocusLost: options === null || options === void 0 ? void 0 : options.ignoreFocusOut,
                    canPickMany: options === null || options === void 0 ? void 0 : options.canPickMany,
                }, token);
                const widgetClosedMarker = {};
                const widgetClosedPromise = quickPickWidget.then(() => widgetClosedMarker);
                return Promise.race([widgetClosedPromise, itemsPromise]).then(result => {
                    if (result === widgetClosedMarker) {
                        return undefined;
                    }
                    return itemsPromise.then(items => {
                        const pickItems = [];
                        for (let handle = 0; handle < items.length; handle++) {
                            const item = items[handle];
                            if (typeof item === 'string') {
                                pickItems.push({ label: item, handle });
                            }
                            else if (item.kind === extHostTypes_1.QuickPickItemKind.Separator) {
                                pickItems.push({ type: 'separator', label: item.label });
                            }
                            else {
                                pickItems.push({
                                    label: item.label,
                                    description: item.description,
                                    detail: item.detail,
                                    picked: item.picked,
                                    alwaysShow: item.alwaysShow,
                                    handle
                                });
                            }
                        }
                        // handle selection changes
                        if (options && typeof options.onDidSelectItem === 'function') {
                            this._onDidSelectItem = (handle) => {
                                options.onDidSelectItem(items[handle]);
                            };
                        }
                        // show items
                        proxy.$setItems(instance, pickItems);
                        return quickPickWidget.then(handle => {
                            if (typeof handle === 'number') {
                                return items[handle];
                            }
                            else if (Array.isArray(handle)) {
                                return handle.map(h => items[h]);
                            }
                            return undefined;
                        });
                    });
                }).then(undefined, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        return undefined;
                    }
                    proxy.$setError(instance, err);
                    return Promise.reject(err);
                });
            }
            $onItemSelected(handle) {
                if (this._onDidSelectItem) {
                    this._onDidSelectItem(handle);
                }
            }
            // ---- input
            showInput(options, token = cancellation_1.CancellationToken.None) {
                // global validate fn used in callback below
                this._validateInput = options === null || options === void 0 ? void 0 : options.validateInput;
                return proxy.$input(options, typeof this._validateInput === 'function', token)
                    .then(undefined, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        return undefined;
                    }
                    return Promise.reject(err);
                });
            }
            async $validateInput(input) {
                if (!this._validateInput) {
                    return;
                }
                const result = await this._validateInput(input);
                if (!result || typeof result === 'string') {
                    return result;
                }
                let severity;
                switch (result.severity) {
                    case extHostTypes_1.InputBoxValidationSeverity.Info:
                        severity = severity_1.default.Info;
                        break;
                    case extHostTypes_1.InputBoxValidationSeverity.Warning:
                        severity = severity_1.default.Warning;
                        break;
                    case extHostTypes_1.InputBoxValidationSeverity.Error:
                        severity = severity_1.default.Error;
                        break;
                    default:
                        severity = result.message ? severity_1.default.Error : severity_1.default.Ignore;
                        break;
                }
                return {
                    content: result.message,
                    severity
                };
            }
            // ---- workspace folder picker
            async showWorkspaceFolderPick(options, token = cancellation_1.CancellationToken.None) {
                const selectedFolder = await this._commands.executeCommand('_workbench.pickWorkspaceFolder', [options]);
                if (!selectedFolder) {
                    return undefined;
                }
                const workspaceFolders = await this._workspace.getWorkspaceFolders2();
                if (!workspaceFolders) {
                    return undefined;
                }
                return workspaceFolders.find(folder => folder.uri.toString() === selectedFolder.uri.toString());
            }
            // ---- QuickInput
            createQuickPick(extension) {
                const session = new ExtHostQuickPick(extension, () => this._sessions.delete(session._id));
                this._sessions.set(session._id, session);
                return session;
            }
            createInputBox(extension) {
                const session = new ExtHostInputBox(extension, () => this._sessions.delete(session._id));
                this._sessions.set(session._id, session);
                return session;
            }
            $onDidChangeValue(sessionId, value) {
                const session = this._sessions.get(sessionId);
                if (session) {
                    session._fireDidChangeValue(value);
                }
            }
            $onDidAccept(sessionId) {
                const session = this._sessions.get(sessionId);
                if (session) {
                    session._fireDidAccept();
                }
            }
            $onDidChangeActive(sessionId, handles) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidChangeActive(handles);
                }
            }
            $onDidChangeSelection(sessionId, handles) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidChangeSelection(handles);
                }
            }
            $onDidTriggerButton(sessionId, handle) {
                const session = this._sessions.get(sessionId);
                if (session) {
                    session._fireDidTriggerButton(handle);
                }
            }
            $onDidTriggerItemButton(sessionId, itemHandle, buttonHandle) {
                const session = this._sessions.get(sessionId);
                if (session instanceof ExtHostQuickPick) {
                    session._fireDidTriggerItemButton(itemHandle, buttonHandle);
                }
            }
            $onDidHide(sessionId) {
                const session = this._sessions.get(sessionId);
                if (session) {
                    session._fireDidHide();
                }
            }
        }
        class ExtHostQuickInput {
            constructor(_extensionId, _onDidDispose) {
                this._extensionId = _extensionId;
                this._onDidDispose = _onDidDispose;
                this._id = ExtHostQuickPick._nextId++;
                this._visible = false;
                this._expectingHide = false;
                this._enabled = true;
                this._busy = false;
                this._ignoreFocusOut = true;
                this._value = '';
                this._buttons = [];
                this._handlesToButtons = new Map();
                this._onDidAcceptEmitter = new event_1.Emitter();
                this._onDidChangeValueEmitter = new event_1.Emitter();
                this._onDidTriggerButtonEmitter = new event_1.Emitter();
                this._onDidHideEmitter = new event_1.Emitter();
                this._pendingUpdate = { id: this._id };
                this._disposed = false;
                this._disposables = [
                    this._onDidTriggerButtonEmitter,
                    this._onDidHideEmitter,
                    this._onDidAcceptEmitter,
                    this._onDidChangeValueEmitter
                ];
                this.onDidChangeValue = this._onDidChangeValueEmitter.event;
                this.onDidAccept = this._onDidAcceptEmitter.event;
                this.onDidTriggerButton = this._onDidTriggerButtonEmitter.event;
                this.onDidHide = this._onDidHideEmitter.event;
            }
            get title() {
                return this._title;
            }
            set title(title) {
                this._title = title;
                this.update({ title });
            }
            get step() {
                return this._steps;
            }
            set step(step) {
                this._steps = step;
                this.update({ step });
            }
            get totalSteps() {
                return this._totalSteps;
            }
            set totalSteps(totalSteps) {
                this._totalSteps = totalSteps;
                this.update({ totalSteps });
            }
            get enabled() {
                return this._enabled;
            }
            set enabled(enabled) {
                this._enabled = enabled;
                this.update({ enabled });
            }
            get busy() {
                return this._busy;
            }
            set busy(busy) {
                this._busy = busy;
                this.update({ busy });
            }
            get ignoreFocusOut() {
                return this._ignoreFocusOut;
            }
            set ignoreFocusOut(ignoreFocusOut) {
                this._ignoreFocusOut = ignoreFocusOut;
                this.update({ ignoreFocusOut });
            }
            get value() {
                return this._value;
            }
            set value(value) {
                this._value = value;
                this.update({ value });
            }
            get placeholder() {
                return this._placeholder;
            }
            set placeholder(placeholder) {
                this._placeholder = placeholder;
                this.update({ placeholder });
            }
            get buttons() {
                return this._buttons;
            }
            set buttons(buttons) {
                this._buttons = buttons.slice();
                this._handlesToButtons.clear();
                buttons.forEach((button, i) => {
                    const handle = button === extHostTypes_1.QuickInputButtons.Back ? -1 : i;
                    this._handlesToButtons.set(handle, button);
                });
                this.update({
                    buttons: buttons.map((button, i) => {
                        return Object.assign(Object.assign({}, getIconPathOrClass(button)), { tooltip: button.tooltip, handle: button === extHostTypes_1.QuickInputButtons.Back ? -1 : i });
                    })
                });
            }
            show() {
                this._visible = true;
                this._expectingHide = true;
                this.update({ visible: true });
            }
            hide() {
                this._visible = false;
                this.update({ visible: false });
            }
            _fireDidAccept() {
                this._onDidAcceptEmitter.fire();
            }
            _fireDidChangeValue(value) {
                this._value = value;
                this._onDidChangeValueEmitter.fire(value);
            }
            _fireDidTriggerButton(handle) {
                const button = this._handlesToButtons.get(handle);
                if (button) {
                    this._onDidTriggerButtonEmitter.fire(button);
                }
            }
            _fireDidHide() {
                if (this._expectingHide) {
                    // if this._visible is true, it means that .show() was called between
                    // .hide() and .onDidHide. To ensure the correct number of onDidHide events
                    // are emitted, we set this._expectingHide to this value so that
                    // the next time .hide() is called, we can emit the event again.
                    // Example:
                    // .show() -> .hide() -> .show() -> .hide() should emit 2 onDidHide events.
                    // .show() -> .hide() -> .hide() should emit 1 onDidHide event.
                    // Fixes #135747
                    this._expectingHide = this._visible;
                    this._onDidHideEmitter.fire();
                }
            }
            dispose() {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                this._fireDidHide();
                this._disposables = (0, lifecycle_1.dispose)(this._disposables);
                if (this._updateTimeout) {
                    clearTimeout(this._updateTimeout);
                    this._updateTimeout = undefined;
                }
                this._onDidDispose();
                proxy.$dispose(this._id);
            }
            update(properties) {
                if (this._disposed) {
                    return;
                }
                for (const key of Object.keys(properties)) {
                    const value = properties[key];
                    this._pendingUpdate[key] = value === undefined ? null : value;
                }
                if ('visible' in this._pendingUpdate) {
                    if (this._updateTimeout) {
                        clearTimeout(this._updateTimeout);
                        this._updateTimeout = undefined;
                    }
                    this.dispatchUpdate();
                }
                else if (this._visible && !this._updateTimeout) {
                    // Defer the update so that multiple changes to setters dont cause a redraw each
                    this._updateTimeout = setTimeout(() => {
                        this._updateTimeout = undefined;
                        this.dispatchUpdate();
                    }, 0);
                }
            }
            dispatchUpdate() {
                proxy.$createOrUpdate(this._pendingUpdate);
                this._pendingUpdate = { id: this._id };
            }
        }
        ExtHostQuickInput._nextId = 1;
        function getIconUris(iconPath) {
            if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                return { id: iconPath.id };
            }
            const dark = getDarkIconUri(iconPath);
            const light = getLightIconUri(iconPath);
            // Tolerate strings: https://github.com/microsoft/vscode/issues/110432#issuecomment-726144556
            return {
                dark: typeof dark === 'string' ? uri_1.URI.file(dark) : dark,
                light: typeof light === 'string' ? uri_1.URI.file(light) : light
            };
        }
        function getLightIconUri(iconPath) {
            return typeof iconPath === 'object' && 'light' in iconPath ? iconPath.light : iconPath;
        }
        function getDarkIconUri(iconPath) {
            return typeof iconPath === 'object' && 'dark' in iconPath ? iconPath.dark : iconPath;
        }
        function getIconPathOrClass(button) {
            const iconPathOrIconClass = getIconUris(button.iconPath);
            let iconPath;
            let iconClass;
            if ('id' in iconPathOrIconClass) {
                iconClass = themeService_1.ThemeIcon.asClassName(iconPathOrIconClass);
            }
            else {
                iconPath = iconPathOrIconClass;
            }
            return {
                iconPath,
                iconClass
            };
        }
        class ExtHostQuickPick extends ExtHostQuickInput {
            constructor(extension, onDispose) {
                super(extension.identifier, onDispose);
                this._items = [];
                this._handlesToItems = new Map();
                this._itemsToHandles = new Map();
                this._canSelectMany = false;
                this._matchOnDescription = true;
                this._matchOnDetail = true;
                this._sortByLabel = true;
                this._keepScrollPosition = false;
                this._activeItems = [];
                this._onDidChangeActiveEmitter = new event_1.Emitter();
                this._selectedItems = [];
                this._onDidChangeSelectionEmitter = new event_1.Emitter();
                this._onDidTriggerItemButtonEmitter = new event_1.Emitter();
                this.onDidChangeActive = this._onDidChangeActiveEmitter.event;
                this.onDidChangeSelection = this._onDidChangeSelectionEmitter.event;
                this.onDidTriggerItemButton = this._onDidTriggerItemButtonEmitter.event;
                this._disposables.push(this._onDidChangeActiveEmitter, this._onDidChangeSelectionEmitter, this._onDidTriggerItemButtonEmitter);
                this.update({ type: 'quickPick' });
            }
            get items() {
                return this._items;
            }
            set items(items) {
                var _a;
                this._items = items.slice();
                this._handlesToItems.clear();
                this._itemsToHandles.clear();
                items.forEach((item, i) => {
                    this._handlesToItems.set(i, item);
                    this._itemsToHandles.set(item, i);
                });
                const pickItems = [];
                for (let handle = 0; handle < items.length; handle++) {
                    const item = items[handle];
                    if (item.kind === extHostTypes_1.QuickPickItemKind.Separator) {
                        pickItems.push({ type: 'separator', label: item.label });
                    }
                    else {
                        pickItems.push({
                            handle,
                            label: item.label,
                            description: item.description,
                            detail: item.detail,
                            picked: item.picked,
                            alwaysShow: item.alwaysShow,
                            buttons: (_a = item.buttons) === null || _a === void 0 ? void 0 : _a.map((button, i) => {
                                return Object.assign(Object.assign({}, getIconPathOrClass(button)), { tooltip: button.tooltip, handle: i });
                            }),
                        });
                    }
                }
                this.update({
                    items: pickItems,
                });
            }
            get canSelectMany() {
                return this._canSelectMany;
            }
            set canSelectMany(canSelectMany) {
                this._canSelectMany = canSelectMany;
                this.update({ canSelectMany });
            }
            get matchOnDescription() {
                return this._matchOnDescription;
            }
            set matchOnDescription(matchOnDescription) {
                this._matchOnDescription = matchOnDescription;
                this.update({ matchOnDescription });
            }
            get matchOnDetail() {
                return this._matchOnDetail;
            }
            set matchOnDetail(matchOnDetail) {
                this._matchOnDetail = matchOnDetail;
                this.update({ matchOnDetail });
            }
            get sortByLabel() {
                return this._sortByLabel;
            }
            set sortByLabel(sortByLabel) {
                this._sortByLabel = sortByLabel;
                this.update({ sortByLabel });
            }
            get keepScrollPosition() {
                return this._keepScrollPosition;
            }
            set keepScrollPosition(keepScrollPosition) {
                this._keepScrollPosition = keepScrollPosition;
                this.update({ keepScrollPosition });
            }
            get activeItems() {
                return this._activeItems;
            }
            set activeItems(activeItems) {
                this._activeItems = activeItems.filter(item => this._itemsToHandles.has(item));
                this.update({ activeItems: this._activeItems.map(item => this._itemsToHandles.get(item)) });
            }
            get selectedItems() {
                return this._selectedItems;
            }
            set selectedItems(selectedItems) {
                this._selectedItems = selectedItems.filter(item => this._itemsToHandles.has(item));
                this.update({ selectedItems: this._selectedItems.map(item => this._itemsToHandles.get(item)) });
            }
            _fireDidChangeActive(handles) {
                const items = (0, arrays_1.coalesce)(handles.map(handle => this._handlesToItems.get(handle)));
                this._activeItems = items;
                this._onDidChangeActiveEmitter.fire(items);
            }
            _fireDidChangeSelection(handles) {
                const items = (0, arrays_1.coalesce)(handles.map(handle => this._handlesToItems.get(handle)));
                this._selectedItems = items;
                this._onDidChangeSelectionEmitter.fire(items);
            }
            _fireDidTriggerItemButton(itemHandle, buttonHandle) {
                const item = this._handlesToItems.get(itemHandle);
                if (!item || !item.buttons || !item.buttons.length) {
                    return;
                }
                const button = item.buttons[buttonHandle];
                if (button) {
                    this._onDidTriggerItemButtonEmitter.fire({
                        button,
                        item
                    });
                }
            }
        }
        class ExtHostInputBox extends ExtHostQuickInput {
            constructor(extension, onDispose) {
                super(extension.identifier, onDispose);
                this._password = false;
                this.update({ type: 'inputBox' });
            }
            get password() {
                return this._password;
            }
            set password(password) {
                this._password = password;
                this.update({ password });
            }
            get prompt() {
                return this._prompt;
            }
            set prompt(prompt) {
                this._prompt = prompt;
                this.update({ prompt });
            }
            get validationMessage() {
                return this._validationMessage;
            }
            set validationMessage(validationMessage) {
                var _a;
                this._validationMessage = validationMessage;
                if (!validationMessage) {
                    this.update({ validationMessage: undefined, severity: severity_1.default.Ignore });
                }
                else if (typeof validationMessage === 'string') {
                    this.update({ validationMessage, severity: severity_1.default.Error });
                }
                else {
                    this.update({ validationMessage: validationMessage.message, severity: (_a = validationMessage.severity) !== null && _a !== void 0 ? _a : severity_1.default.Error });
                }
            }
        }
        return new ExtHostQuickOpenImpl(workspace, commands);
    }
    exports.createExtHostQuickOpen = createExtHostQuickOpen;
});
//# sourceMappingURL=extHostQuickOpen.js.map