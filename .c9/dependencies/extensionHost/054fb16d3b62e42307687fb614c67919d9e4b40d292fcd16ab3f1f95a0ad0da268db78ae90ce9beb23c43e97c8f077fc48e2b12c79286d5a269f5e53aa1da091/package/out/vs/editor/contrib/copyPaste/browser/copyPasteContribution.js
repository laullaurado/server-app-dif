/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/contrib/copyPaste/browser/copyPasteController", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, editorExtensions_1, editorConfigurationSchema_1, copyPasteController_1, nls, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(copyPasteController_1.CopyPasteController.ID, copyPasteController_1.CopyPasteController);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(Object.assign(Object.assign({}, editorConfigurationSchema_1.editorConfigurationBaseNode), { properties: {
            'editor.experimental.pasteActions.enabled': {
                type: 'boolean',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('pasteActions', "Enable/disable running edits from extensions on paste."),
                default: false,
            },
        } }));
});
//# sourceMappingURL=copyPasteContribution.js.map