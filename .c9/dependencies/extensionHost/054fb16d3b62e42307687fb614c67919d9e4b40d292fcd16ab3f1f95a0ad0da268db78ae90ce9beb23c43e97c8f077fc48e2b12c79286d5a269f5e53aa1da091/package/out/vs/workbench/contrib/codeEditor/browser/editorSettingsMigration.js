/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/editor/browser/config/migrateOptions", "vs/workbench/common/configurationMigration"], function (require, exports, platform_1, migrateOptions_1, configurationMigration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(configurationMigration_1.Extensions.ConfigurationMigration)
        .registerConfigurationMigrations(migrateOptions_1.EditorSettingMigration.items.map(item => ({
        key: `editor.${item.key}`,
        migrateFn: (value, accessor) => {
            const configurationKeyValuePairs = [];
            const writer = (key, value) => configurationKeyValuePairs.push([`editor.${key}`, { value }]);
            item.migrate(value, key => accessor(`editor.${key}`), writer);
            return configurationKeyValuePairs;
        }
    })));
});
//# sourceMappingURL=editorSettingsMigration.js.map