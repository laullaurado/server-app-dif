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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/workbench/common/editor/editorInput", "vs/workbench/services/preferences/common/preferences"], function (require, exports, network_1, uri_1, nls, editorInput_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsEditor2Input = void 0;
    let SettingsEditor2Input = class SettingsEditor2Input extends editorInput_1.EditorInput {
        constructor(_preferencesService) {
            super();
            this.resource = uri_1.URI.from({
                scheme: network_1.Schemas.vscodeSettings,
                path: `settingseditor`
            });
            this._settingsModel = _preferencesService.createSettings2EditorModel();
        }
        matches(otherInput) {
            return super.matches(otherInput) || otherInput instanceof SettingsEditor2Input;
        }
        get typeId() {
            return SettingsEditor2Input.ID;
        }
        getName() {
            return nls.localize('settingsEditor2InputName', "Settings");
        }
        async resolve() {
            return this._settingsModel;
        }
        dispose() {
            this._settingsModel.dispose();
            super.dispose();
        }
    };
    SettingsEditor2Input.ID = 'workbench.input.settings2';
    SettingsEditor2Input = __decorate([
        __param(0, preferences_1.IPreferencesService)
    ], SettingsEditor2Input);
    exports.SettingsEditor2Input = SettingsEditor2Input;
});
//# sourceMappingURL=preferencesEditorInput.js.map