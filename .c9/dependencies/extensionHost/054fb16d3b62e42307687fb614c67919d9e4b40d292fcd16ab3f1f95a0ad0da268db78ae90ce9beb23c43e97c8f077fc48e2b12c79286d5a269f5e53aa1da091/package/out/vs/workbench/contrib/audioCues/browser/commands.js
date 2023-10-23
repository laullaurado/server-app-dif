/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/audioCues/browser/audioCueService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, codicons_1, nls_1, accessibility_1, actions_1, quickInput_1, audioCueService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowAudioCueHelp = void 0;
    class ShowAudioCueHelp extends actions_1.Action2 {
        constructor() {
            super({
                id: ShowAudioCueHelp.ID,
                title: {
                    value: (0, nls_1.localize)('audioCues.help', "Help: List Audio Cues"),
                    original: 'Help: List Audio Cues'
                },
                f1: true,
            });
        }
        async run(accessor) {
            const audioCueService = accessor.get(audioCueService_1.IAudioCueService);
            const quickPickService = accessor.get(quickInput_1.IQuickInputService);
            const preferencesService = accessor.get(preferences_1.IPreferencesService);
            const accessibilityService = accessor.get(accessibility_1.IAccessibilityService);
            const items = audioCueService_1.AudioCue.allAudioCues.map((cue, idx) => ({
                label: accessibilityService.isScreenReaderOptimized() ?
                    `${cue.name}${audioCueService.isEnabled(cue).get() ? '' : ' (' + (0, nls_1.localize)('disabled', "Disabled") + ')'}`
                    : `${audioCueService.isEnabled(cue).get() ? '$(check)' : '     '} ${cue.name}`,
                audioCue: cue,
                buttons: [{
                        iconClass: codicons_1.Codicon.settingsGear.classNames,
                        tooltip: (0, nls_1.localize)('audioCues.help.settings', 'Enable/Disable Audio Cue'),
                    }],
            }));
            const quickPick = quickPickService.pick(items, {
                activeItem: items[0],
                onDidFocus: (item) => {
                    audioCueService.playSound(item.audioCue.sound);
                },
                onDidTriggerItemButton: (context) => {
                    preferencesService.openSettings({ query: context.item.audioCue.settingsKey });
                },
                placeHolder: (0, nls_1.localize)('audioCues.help.placeholder', 'Select an audio cue to play'),
            });
            await quickPick;
        }
    }
    exports.ShowAudioCueHelp = ShowAudioCueHelp;
    ShowAudioCueHelp.ID = 'audioCues.help';
});
//# sourceMappingURL=commands.js.map