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
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, nls_1, platform_1, editor_1, editorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBySideEditorInputSerializer = exports.AbstractSideBySideEditorInputSerializer = exports.SideBySideEditorInput = void 0;
    /**
     * Side by side editor inputs that have a primary and secondary side.
     */
    let SideBySideEditorInput = class SideBySideEditorInput extends editorInput_1.EditorInput {
        constructor(preferredName, preferredDescription, secondary, primary, editorService) {
            super();
            this.preferredName = preferredName;
            this.preferredDescription = preferredDescription;
            this.secondary = secondary;
            this.primary = primary;
            this.editorService = editorService;
            this.hasIdenticalSides = this.primary.matches(this.secondary);
            this.registerListeners();
        }
        get typeId() {
            return SideBySideEditorInput.ID;
        }
        get capabilities() {
            // Use primary capabilities as main capabilities...
            let capabilities = this.primary.capabilities;
            // ...with the exception of `CanSplitInGroup` which
            // is only relevant to single editors.
            capabilities &= ~32 /* EditorInputCapabilities.CanSplitInGroup */;
            // Trust: should be considered for both sides
            if (this.secondary.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */)) {
                capabilities |= 16 /* EditorInputCapabilities.RequiresTrust */;
            }
            // Singleton: should be considered for both sides
            if (this.secondary.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            }
            return capabilities;
        }
        get resource() {
            if (this.hasIdenticalSides) {
                // pretend to be just primary side when being asked for a resource
                // in case both sides are the same. this can help when components
                // want to identify this input among others (e.g. in history).
                return this.primary.resource;
            }
            return undefined;
        }
        registerListeners() {
            // When the primary or secondary input gets disposed, dispose this diff editor input
            this._register(event_1.Event.once(event_1.Event.any(this.primary.onWillDispose, this.secondary.onWillDispose))(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Re-emit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            // Re-emit some events from both sides to the outside
            this._register(this.primary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
            this._register(this.secondary.onDidChangeCapabilities(() => this._onDidChangeCapabilities.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
            this._register(this.secondary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
        }
        getName() {
            const preferredName = this.getPreferredName();
            if (preferredName) {
                return preferredName;
            }
            if (this.hasIdenticalSides) {
                return this.primary.getName(); // keep name concise when same editor is opened side by side
            }
            return (0, nls_1.localize)('sideBySideLabels', "{0} - {1}", this.secondary.getName(), this.primary.getName());
        }
        getPreferredName() {
            return this.preferredName;
        }
        getDescription(verbosity) {
            const preferredDescription = this.getPreferredDescription();
            if (preferredDescription) {
                return preferredDescription;
            }
            if (this.hasIdenticalSides) {
                return this.primary.getDescription(verbosity);
            }
            return super.getDescription(verbosity);
        }
        getPreferredDescription() {
            return this.preferredDescription;
        }
        getTitle(verbosity) {
            var _a;
            if (this.hasIdenticalSides) {
                return (_a = this.primary.getTitle(verbosity)) !== null && _a !== void 0 ? _a : this.getName();
            }
            return super.getTitle(verbosity);
        }
        getLabelExtraClasses() {
            if (this.hasIdenticalSides) {
                return this.primary.getLabelExtraClasses();
            }
            return super.getLabelExtraClasses();
        }
        getAriaLabel() {
            if (this.hasIdenticalSides) {
                return this.primary.getAriaLabel();
            }
            return super.getAriaLabel();
        }
        getTelemetryDescriptor() {
            const descriptor = this.primary.getTelemetryDescriptor();
            return Object.assign(Object.assign({}, descriptor), super.getTelemetryDescriptor());
        }
        isDirty() {
            return this.primary.isDirty();
        }
        isSaving() {
            return this.primary.isSaving();
        }
        async save(group, options) {
            const primarySaveResult = await this.primary.save(group, options);
            return this.saveResultToEditor(primarySaveResult);
        }
        async saveAs(group, options) {
            const primarySaveResult = await this.primary.saveAs(group, options);
            return this.saveResultToEditor(primarySaveResult);
        }
        saveResultToEditor(primarySaveResult) {
            if (!primarySaveResult || !this.hasIdenticalSides) {
                return primarySaveResult;
            }
            if (this.primary.matches(primarySaveResult)) {
                return this;
            }
            if (primarySaveResult instanceof editorInput_1.EditorInput) {
                return new SideBySideEditorInput(this.preferredName, this.preferredDescription, primarySaveResult, primarySaveResult, this.editorService);
            }
            if (!(0, editor_1.isResourceDiffEditorInput)(primarySaveResult) && !(0, editor_1.isResourceSideBySideEditorInput)(primarySaveResult)) {
                return {
                    primary: primarySaveResult,
                    secondary: primarySaveResult,
                    label: this.preferredName,
                    description: this.preferredDescription
                };
            }
            return undefined;
        }
        revert(group, options) {
            return this.primary.revert(group, options);
        }
        async rename(group, target) {
            if (!this.hasIdenticalSides) {
                return; // currently only enabled when both sides are identical
            }
            // Forward rename to primary side
            const renameResult = await this.primary.rename(group, target);
            if (!renameResult) {
                return undefined;
            }
            // Build a side-by-side result from the rename result
            if ((0, editor_1.isEditorInput)(renameResult.editor)) {
                return {
                    editor: new SideBySideEditorInput(this.preferredName, this.preferredDescription, renameResult.editor, renameResult.editor, this.editorService),
                    options: Object.assign(Object.assign({}, renameResult.options), { viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService) })
                };
            }
            if ((0, editor_1.isResourceEditorInput)(renameResult.editor)) {
                return {
                    editor: {
                        label: this.preferredName,
                        description: this.preferredDescription,
                        primary: renameResult.editor,
                        secondary: renameResult.editor,
                        options: Object.assign(Object.assign({}, renameResult.options), { viewState: (0, editor_1.findViewStateForEditor)(this, group, this.editorService) })
                    }
                };
            }
            return undefined;
        }
        toUntyped(options) {
            const primaryResourceEditorInput = this.primary.toUntyped(options);
            const secondaryResourceEditorInput = this.secondary.toUntyped(options);
            // Prevent nested side by side editors which are unsupported
            if (primaryResourceEditorInput && secondaryResourceEditorInput &&
                !(0, editor_1.isResourceDiffEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceDiffEditorInput)(secondaryResourceEditorInput) &&
                !(0, editor_1.isResourceSideBySideEditorInput)(primaryResourceEditorInput) && !(0, editor_1.isResourceSideBySideEditorInput)(secondaryResourceEditorInput)) {
                const untypedInput = {
                    label: this.preferredName,
                    description: this.preferredDescription,
                    primary: primaryResourceEditorInput,
                    secondary: secondaryResourceEditorInput
                };
                if (typeof (options === null || options === void 0 ? void 0 : options.preserveViewState) === 'number') {
                    untypedInput.options = {
                        viewState: (0, editor_1.findViewStateForEditor)(this, options.preserveViewState, this.editorService)
                    };
                }
                return untypedInput;
            }
            return undefined;
        }
        matches(otherInput) {
            if (this === otherInput) {
                return true;
            }
            if ((0, editor_1.isDiffEditorInput)(otherInput) || (0, editor_1.isResourceDiffEditorInput)(otherInput)) {
                return false; // prevent subclass from matching
            }
            if (otherInput instanceof SideBySideEditorInput) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            if ((0, editor_1.isResourceSideBySideEditorInput)(otherInput)) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            return false;
        }
    };
    SideBySideEditorInput.ID = 'workbench.editorinputs.sidebysideEditorInput';
    SideBySideEditorInput = __decorate([
        __param(4, editorService_1.IEditorService)
    ], SideBySideEditorInput);
    exports.SideBySideEditorInput = SideBySideEditorInput;
    class AbstractSideBySideEditorInputSerializer {
        canSerialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(input.secondary.typeId, input.primary.typeId);
                return !!((secondaryInputSerializer === null || secondaryInputSerializer === void 0 ? void 0 : secondaryInputSerializer.canSerialize(input.secondary)) && (primaryInputSerializer === null || primaryInputSerializer === void 0 ? void 0 : primaryInputSerializer.canSerialize(input.primary)));
            }
            return false;
        }
        serialize(editorInput) {
            const input = editorInput;
            if (input.primary && input.secondary) {
                const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(input.secondary.typeId, input.primary.typeId);
                if (primaryInputSerializer && secondaryInputSerializer) {
                    const primarySerialized = primaryInputSerializer.serialize(input.primary);
                    const secondarySerialized = secondaryInputSerializer.serialize(input.secondary);
                    if (primarySerialized && secondarySerialized) {
                        const serializedEditorInput = {
                            name: input.getPreferredName(),
                            description: input.getPreferredDescription(),
                            primarySerialized: primarySerialized,
                            secondarySerialized: secondarySerialized,
                            primaryTypeId: input.primary.typeId,
                            secondaryTypeId: input.secondary.typeId
                        };
                        return JSON.stringify(serializedEditorInput);
                    }
                }
            }
            return undefined;
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            const [secondaryInputSerializer, primaryInputSerializer] = this.getSerializers(deserialized.secondaryTypeId, deserialized.primaryTypeId);
            if (primaryInputSerializer && secondaryInputSerializer) {
                const primaryInput = primaryInputSerializer.deserialize(instantiationService, deserialized.primarySerialized);
                const secondaryInput = secondaryInputSerializer.deserialize(instantiationService, deserialized.secondarySerialized);
                if (primaryInput instanceof editorInput_1.EditorInput && secondaryInput instanceof editorInput_1.EditorInput) {
                    return this.createEditorInput(instantiationService, deserialized.name, deserialized.description, secondaryInput, primaryInput);
                }
            }
            return undefined;
        }
        getSerializers(secondaryEditorInputTypeId, primaryEditorInputTypeId) {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            return [registry.getEditorSerializer(secondaryEditorInputTypeId), registry.getEditorSerializer(primaryEditorInputTypeId)];
        }
    }
    exports.AbstractSideBySideEditorInputSerializer = AbstractSideBySideEditorInputSerializer;
    class SideBySideEditorInputSerializer extends AbstractSideBySideEditorInputSerializer {
        createEditorInput(instantiationService, name, description, secondaryInput, primaryInput) {
            return instantiationService.createInstance(SideBySideEditorInput, name, description, secondaryInput, primaryInput);
        }
    }
    exports.SideBySideEditorInputSerializer = SideBySideEditorInputSerializer;
});
//# sourceMappingURL=sideBySideEditorInput.js.map