/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/actions", "vs/platform/actions/common/actions"], function (require, exports, nls_1, keybinding_1, editorService_1, actions_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class InspectKeyMap extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectKeyMappings',
                title: { value: (0, nls_1.localize)('workbench.action.inspectKeyMap', "Inspect Key Mappings"), original: 'Inspect Key Mappings' },
                category: actions_1.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor, editor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor({ resource: undefined, contents: keybindingService._dumpDebugInfo(), options: { pinned: true } });
        }
    }
    (0, actions_2.registerAction2)(InspectKeyMap);
    class InspectKeyMapJSON extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.inspectKeyMappingsJSON',
                title: { value: (0, nls_1.localize)('workbench.action.inspectKeyMapJSON', "Inspect Key Mappings (JSON)"), original: 'Inspect Key Mappings (JSON)' },
                category: actions_1.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            await editorService.openEditor({ resource: undefined, contents: keybindingService._dumpDebugInfoJSON(), options: { pinned: true } });
        }
    }
    (0, actions_2.registerAction2)(InspectKeyMapJSON);
});
//# sourceMappingURL=inspectKeybindings.js.map