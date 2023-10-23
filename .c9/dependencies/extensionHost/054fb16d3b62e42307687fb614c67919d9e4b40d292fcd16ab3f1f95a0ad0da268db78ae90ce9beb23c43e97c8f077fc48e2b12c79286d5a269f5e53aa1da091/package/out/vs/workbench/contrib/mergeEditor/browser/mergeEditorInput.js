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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/contrib/mergeEditor/browser/mergeEditorModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, lifecycle_1, resources_1, resolverService_1, nls_1, files_1, instantiation_1, label_1, textResourceEditorInput_1, mergeEditorModel_1, editorService_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorInput = exports.MergeEditorInputData = void 0;
    class MergeEditorInputData {
        constructor(uri, detail, description) {
            this.uri = uri;
            this.detail = detail;
            this.description = description;
        }
    }
    exports.MergeEditorInputData = MergeEditorInputData;
    let MergeEditorInput = class MergeEditorInput extends textResourceEditorInput_1.AbstractTextResourceEditorInput {
        constructor(_anchestor, _input1, _input2, _result, _instaService, _textModelService, editorService, textFileService, labelService, fileService) {
            super(_result, undefined, editorService, textFileService, labelService, fileService);
            this._anchestor = _anchestor;
            this._input1 = _input1;
            this._input2 = _input2;
            this._result = _result;
            this._instaService = _instaService;
            this._textModelService = _textModelService;
            this.mergeEditorModelFactory = this._instaService.createInstance(mergeEditorModel_1.MergeEditorModelFactory);
            const modelListener = new lifecycle_1.DisposableStore();
            const handleDidCreate = (model) => {
                // TODO@jrieken copied from fileEditorInput.ts
                if ((0, resources_1.isEqual)(_result, model.resource)) {
                    modelListener.clear();
                    this._outTextModel = model;
                    modelListener.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                    modelListener.add(model.onDidSaveError(() => this._onDidChangeDirty.fire()));
                    modelListener.add(model.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
                    modelListener.add(model.onWillDispose(() => {
                        this._outTextModel = undefined;
                        modelListener.clear();
                    }));
                }
            };
            textFileService.files.onDidCreate(handleDidCreate, this, modelListener);
            textFileService.files.models.forEach(handleDidCreate);
            this._store.add(modelListener);
        }
        dispose() {
            super.dispose();
        }
        get typeId() {
            return MergeEditorInput.ID;
        }
        getName() {
            return (0, nls_1.localize)('name', "Merging: {0}", super.getName());
        }
        get capabilities() {
            let result = 8 /* EditorInputCapabilities.Singleton */;
            if (!this.fileService.hasProvider(this._result) || this.fileService.hasCapability(this.resource, 2048 /* FileSystemProviderCapabilities.Readonly */)) {
                result |= 2 /* EditorInputCapabilities.Readonly */;
            }
            return result;
        }
        async resolve() {
            if (!this._model) {
                const anchestor = await this._textModelService.createModelReference(this._anchestor);
                const input1 = await this._textModelService.createModelReference(this._input1.uri);
                const input2 = await this._textModelService.createModelReference(this._input2.uri);
                const result = await this._textModelService.createModelReference(this._result);
                this._model = await this.mergeEditorModelFactory.create(anchestor.object.textEditorModel, input1.object.textEditorModel, this._input1.detail, this._input1.description, input2.object.textEditorModel, this._input2.detail, this._input2.description, result.object.textEditorModel);
                this._store.add(this._model);
                this._store.add(anchestor);
                this._store.add(input1);
                this._store.add(input2);
                this._store.add(result);
                // result.object.
            }
            return this._model;
        }
        matches(otherInput) {
            if (!(otherInput instanceof MergeEditorInput)) {
                return false;
            }
            return (0, resources_1.isEqual)(this._anchestor, otherInput._anchestor)
                && (0, resources_1.isEqual)(this._input1.uri, otherInput._input1.uri)
                && (0, resources_1.isEqual)(this._input2.uri, otherInput._input2.uri)
                && (0, resources_1.isEqual)(this._result, otherInput._result);
        }
        toJSON() {
            return {
                anchestor: this._anchestor,
                inputOne: this._input1,
                inputTwo: this._input2,
                result: this._result,
            };
        }
        // ---- FileEditorInput
        isDirty() {
            var _a;
            return Boolean((_a = this._outTextModel) === null || _a === void 0 ? void 0 : _a.isDirty());
        }
    };
    MergeEditorInput.ID = 'mergeEditor.Input';
    MergeEditorInput = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, editorService_1.IEditorService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, label_1.ILabelService),
        __param(9, files_1.IFileService)
    ], MergeEditorInput);
    exports.MergeEditorInput = MergeEditorInput;
});
//# sourceMappingURL=mergeEditorInput.js.map