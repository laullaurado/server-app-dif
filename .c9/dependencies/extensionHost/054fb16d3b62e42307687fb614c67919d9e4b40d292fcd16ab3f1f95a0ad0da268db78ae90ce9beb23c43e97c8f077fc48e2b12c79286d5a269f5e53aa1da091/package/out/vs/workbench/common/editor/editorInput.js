/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/arrays", "vs/workbench/common/editor", "vs/base/common/resources"], function (require, exports, event_1, arrays_1, editor_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorInput = void 0;
    /**
     * Editor inputs are lightweight objects that can be passed to the workbench API to open inside the editor part.
     * Each editor input is mapped to an editor that is capable of opening it through the Platform facade.
     */
    class EditorInput extends editor_1.AbstractEditorInput {
        constructor() {
            super(...arguments);
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this._onWillDispose = this._register(new event_1.Emitter());
            /**
             * Triggered when this input changes its dirty state.
             */
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            /**
             * Triggered when this input changes its label
             */
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            /**
             * Triggered when this input changes its capabilities.
             */
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            /**
             * Triggered when this input is about to be disposed.
             */
            this.onWillDispose = this._onWillDispose.event;
            this.disposed = false;
        }
        /**
         * Identifies the type of editor this input represents
         * This ID is registered with the {@link EditorResolverService} to allow
         * for resolving an untyped input to a typed one
         */
        get editorId() {
            return undefined;
        }
        /**
         * The capabilities of the input.
         */
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */;
        }
        /**
         * Figure out if the input has the provided capability.
         */
        hasCapability(capability) {
            if (capability === 0 /* EditorInputCapabilities.None */) {
                return this.capabilities === 0 /* EditorInputCapabilities.None */;
            }
            return (this.capabilities & capability) !== 0;
        }
        /**
         * Returns the display name of this input.
         */
        getName() {
            return `Editor ${this.typeId}`;
        }
        /**
         * Returns the display description of this input.
         */
        getDescription(verbosity) {
            return undefined;
        }
        /**
         * Returns the display title of this input.
         */
        getTitle(verbosity) {
            return this.getName();
        }
        /**
         * Returns the extra classes to apply to the label of this input.
         */
        getLabelExtraClasses() {
            return [];
        }
        /**
         * Returns the aria label to be read out by a screen reader.
         */
        getAriaLabel() {
            return this.getTitle(0 /* Verbosity.SHORT */);
        }
        /**
         * Returns a descriptor suitable for telemetry events.
         *
         * Subclasses should extend if they can contribute.
         */
        getTelemetryDescriptor() {
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "typeId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return { typeId: this.typeId };
        }
        /**
         * Returns if this input is dirty or not.
         */
        isDirty() {
            return false;
        }
        /**
         * Returns if this input is currently being saved or soon to be
         * saved. Based on this assumption the editor may for example
         * decide to not signal the dirty state to the user assuming that
         * the save is scheduled to happen anyway.
         */
        isSaving() {
            return false;
        }
        /**
         * Returns a type of `IEditorModel` that represents the resolved input.
         * Subclasses should override to provide a meaningful model or return
         * `null` if the editor does not require a model.
         */
        async resolve() {
            return null;
        }
        /**
         * Saves the editor. The provided groupId helps implementors
         * to e.g. preserve view state of the editor and re-open it
         * in the correct group after saving.
         *
         * @returns the resulting editor input (typically the same) of
         * this operation or `undefined` to indicate that the operation
         * failed or was canceled.
         */
        async save(group, options) {
            return this;
        }
        /**
         * Saves the editor to a different location. The provided `group`
         * helps implementors to e.g. preserve view state of the editor
         * and re-open it in the correct group after saving.
         *
         * @returns the resulting editor input (typically a different one)
         * of this operation or `undefined` to indicate that the operation
         * failed or was canceled.
         */
        async saveAs(group, options) {
            return this;
        }
        /**
         * Reverts this input from the provided group.
         */
        async revert(group, options) { }
        /**
         * Called to determine how to handle a resource that is renamed that matches
         * the editors resource (or is a child of).
         *
         * Implementors are free to not implement this method to signal no intent
         * to participate. If an editor is returned though, it will replace the
         * current one with that editor and optional options.
         */
        async rename(group, target) {
            return undefined;
        }
        /**
         * Returns a copy of the current editor input. Used when we can't just reuse the input
         */
        copy() {
            return this;
        }
        /**
         * Returns if the other object matches this input.
         */
        matches(otherInput) {
            var _a;
            // Typed inputs: via  === check
            if ((0, editor_1.isEditorInput)(otherInput)) {
                return this === otherInput;
            }
            // Untyped inputs: go into properties
            const otherInputEditorId = (_a = otherInput.options) === null || _a === void 0 ? void 0 : _a.override;
            if (this.editorId === undefined) {
                return false; // untyped inputs can only match for editors that have adopted `editorId`
            }
            if (this.editorId !== otherInputEditorId) {
                return false; // untyped input uses another `editorId`
            }
            return (0, resources_1.isEqual)(this.resource, editor_1.EditorResourceAccessor.getCanonicalUri(otherInput));
        }
        /**
         * If a editor was registered onto multiple editor panes, this method
         * will be asked to return the preferred one to use.
         *
         * @param editorPanes a list of editor pane descriptors that are candidates
         * for the editor to open in.
         */
        prefersEditorPane(editorPanes) {
            return (0, arrays_1.firstOrDefault)(editorPanes);
        }
        /**
         * Returns a representation of this typed editor input as untyped
         * resource editor input that e.g. can be used to serialize the
         * editor input into a form that it can be restored.
         *
         * May return `undefined` if an untyped representation is not supported.
         *
         * @param options additional configuration for the expected return type.
         * When `preserveViewState` is provided, implementations should try to
         * preserve as much view state as possible from the typed input based on
         * the group the editor is opened.
         */
        toUntyped(options) {
            return undefined;
        }
        /**
         * Returns if this editor is disposed.
         */
        isDisposed() {
            return this.disposed;
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true;
                this._onWillDispose.fire();
            }
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
});
//# sourceMappingURL=editorInput.js.map