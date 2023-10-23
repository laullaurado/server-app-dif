/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/nls", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, DOM, simpleIconLabel_1, nls_1, settingsMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIndicatorsLabelAriaLabel = exports.SettingsTreeIndicatorsLabel = void 0;
    const $ = DOM.$;
    /**
     * Renders the indicators next to a setting, such as Sync Ignored, Also Modified In, etc.
     */
    class SettingsTreeIndicatorsLabel {
        constructor(container) {
            this.labelElement = DOM.append(container, $('.misc-label'));
            this.labelElement.style.display = 'inline';
            this.scopeOverridesElement = this.createScopeOverridesElement();
            this.syncIgnoredElement = this.createSyncIgnoredElement();
            const { element: defaultOverrideElement, label: defaultOverrideLabel } = this.createDefaultOverrideIndicator();
            this.defaultOverrideIndicatorElement = defaultOverrideElement;
            this.defaultOverrideIndicatorLabel = defaultOverrideLabel;
        }
        createScopeOverridesElement() {
            const otherOverridesElement = $('span.setting-item-overrides');
            return otherOverridesElement;
        }
        createSyncIgnoredElement() {
            const syncIgnoredElement = $('span.setting-item-ignored');
            const syncIgnoredLabel = new simpleIconLabel_1.SimpleIconLabel(syncIgnoredElement);
            syncIgnoredLabel.text = `$(sync-ignored) ${(0, nls_1.localize)('extensionSyncIgnoredLabel', 'Sync: Ignored')}`;
            syncIgnoredLabel.title = (0, nls_1.localize)('syncIgnoredTitle', "Settings sync does not sync this setting");
            return syncIgnoredElement;
        }
        createDefaultOverrideIndicator() {
            const defaultOverrideIndicator = $('span.setting-item-default-overridden');
            const defaultOverrideLabel = new simpleIconLabel_1.SimpleIconLabel(defaultOverrideIndicator);
            return { element: defaultOverrideIndicator, label: defaultOverrideLabel };
        }
        render() {
            const elementsToShow = [this.scopeOverridesElement, this.syncIgnoredElement, this.defaultOverrideIndicatorElement].filter(element => {
                return element.style.display !== 'none';
            });
            this.labelElement.innerText = '';
            this.labelElement.style.display = 'none';
            if (elementsToShow.length) {
                this.labelElement.style.display = 'inline';
                DOM.append(this.labelElement, $('span', undefined, '('));
                for (let i = 0; i < elementsToShow.length - 1; i++) {
                    DOM.append(this.labelElement, elementsToShow[i]);
                    DOM.append(this.labelElement, $('span.comma', undefined, ', '));
                }
                DOM.append(this.labelElement, elementsToShow[elementsToShow.length - 1]);
                DOM.append(this.labelElement, $('span', undefined, ')'));
            }
        }
        updateSyncIgnored(element, ignoredSettings) {
            this.syncIgnoredElement.style.display = ignoredSettings.includes(element.setting.key) ? 'inline' : 'none';
            this.render();
        }
        updateScopeOverrides(element, elementDisposables, onDidClickOverrideElement) {
            this.scopeOverridesElement.innerText = '';
            this.scopeOverridesElement.style.display = 'none';
            if (element.overriddenScopeList.length) {
                this.scopeOverridesElement.style.display = 'inline';
                const otherOverridesLabel = element.isConfigured ?
                    (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                    (0, nls_1.localize)('configuredIn', "Modified in");
                DOM.append(this.scopeOverridesElement, $('span', undefined, `${otherOverridesLabel}: `));
                for (let i = 0; i < element.overriddenScopeList.length; i++) {
                    const view = DOM.append(this.scopeOverridesElement, $('a.modified-scope', undefined, element.overriddenScopeList[i]));
                    if (i !== element.overriddenScopeList.length - 1) {
                        DOM.append(this.scopeOverridesElement, $('span', undefined, ', '));
                    }
                    elementDisposables.add(DOM.addStandardDisposableListener(view, DOM.EventType.CLICK, (e) => {
                        onDidClickOverrideElement.fire({
                            targetKey: element.setting.key,
                            scope: element.overriddenScopeList[i]
                        });
                        e.preventDefault();
                        e.stopPropagation();
                    }));
                }
            }
            this.render();
        }
        updateDefaultOverrideIndicator(element) {
            var _a, _b;
            this.defaultOverrideIndicatorElement.style.display = 'none';
            const defaultValueSource = element.defaultValueSource;
            if (defaultValueSource) {
                this.defaultOverrideIndicatorElement.style.display = 'inline';
                if (typeof defaultValueSource !== 'string' && defaultValueSource.id !== ((_a = element.setting.extensionInfo) === null || _a === void 0 ? void 0 : _a.id)) {
                    const extensionSource = (_b = defaultValueSource.displayName) !== null && _b !== void 0 ? _b : defaultValueSource.id;
                    this.defaultOverrideIndicatorLabel.title = (0, nls_1.localize)('defaultOverriddenDetails', "Default setting value overridden by {0}", extensionSource);
                    this.defaultOverrideIndicatorLabel.text = (0, nls_1.localize)('defaultOverrideLabelText', "$(replace) {0}", extensionSource);
                }
                else if (typeof defaultValueSource === 'string') {
                    this.defaultOverrideIndicatorLabel.title = (0, nls_1.localize)('defaultOverriddenDetails', "Default setting value overridden by {0}", defaultValueSource);
                    this.defaultOverrideIndicatorLabel.text = (0, nls_1.localize)('defaultOverrideLabelText', "$(replace) {0}", defaultValueSource);
                }
            }
            this.render();
        }
    }
    exports.SettingsTreeIndicatorsLabel = SettingsTreeIndicatorsLabel;
    function getIndicatorsLabelAriaLabel(element, configurationService) {
        var _a, _b;
        const ariaLabelSections = [];
        // Add other overrides text
        const otherOverridesStart = element.isConfigured ?
            (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
            (0, nls_1.localize)('configuredIn', "Modified in");
        const otherOverridesList = element.overriddenScopeList.join(', ');
        if (element.overriddenScopeList.length) {
            ariaLabelSections.push(`${otherOverridesStart} ${otherOverridesList}`);
        }
        // Add sync ignored text
        const ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), configurationService);
        if (ignoredSettings.includes(element.setting.key)) {
            ariaLabelSections.push((0, nls_1.localize)('syncIgnoredTitle', "Settings sync does not sync this setting"));
        }
        // Add default override indicator text
        if (element.defaultValueSource) {
            const defaultValueSource = element.defaultValueSource;
            if (typeof defaultValueSource !== 'string' && defaultValueSource.id !== ((_a = element.setting.extensionInfo) === null || _a === void 0 ? void 0 : _a.id)) {
                const extensionSource = (_b = defaultValueSource.displayName) !== null && _b !== void 0 ? _b : defaultValueSource.id;
                ariaLabelSections.push((0, nls_1.localize)('defaultOverriddenDetails', "Default setting value overridden by {0}", extensionSource));
            }
            else if (typeof defaultValueSource === 'string') {
                ariaLabelSections.push((0, nls_1.localize)('defaultOverriddenDetails', "Default setting value overridden by {0}", defaultValueSource));
            }
        }
        const ariaLabel = ariaLabelSections.join('. ');
        return ariaLabel;
    }
    exports.getIndicatorsLabelAriaLabel = getIndicatorsLabelAriaLabel;
});
//# sourceMappingURL=settingsEditorSettingIndicators.js.map