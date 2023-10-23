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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, platform_1, contributions_1, workspace_1, configuration_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = void 0;
    exports.Extensions = {
        ConfigurationMigration: 'base.contributions.configuration.migration'
    };
    class ConfigurationMigrationRegistry {
        constructor() {
            this.migrations = [];
            this._onDidRegisterConfigurationMigrations = new event_1.Emitter();
            this.onDidRegisterConfigurationMigration = this._onDidRegisterConfigurationMigrations.event;
        }
        registerConfigurationMigrations(configurationMigrations) {
            this.migrations.push(...configurationMigrations);
        }
    }
    const configurationMigrationRegistry = new ConfigurationMigrationRegistry();
    platform_1.Registry.add(exports.Extensions.ConfigurationMigration, configurationMigrationRegistry);
    let ConfigurationMigrationWorkbenchContribution = class ConfigurationMigrationWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(configurationService, workspaceService) {
            super();
            this.configurationService = configurationService;
            this.workspaceService = workspaceService;
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(async (e) => {
                for (const folder of e.added) {
                    await this.migrateConfigurationsForFolder(folder, configurationMigrationRegistry.migrations);
                }
            }));
            this.migrateConfigurations(configurationMigrationRegistry.migrations);
            this._register(configurationMigrationRegistry.onDidRegisterConfigurationMigration(migration => this.migrateConfigurations(migration)));
        }
        async migrateConfigurations(migrations) {
            await this.migrateConfigurationsForFolder(undefined, migrations);
            for (const folder of this.workspaceService.getWorkspace().folders) {
                await this.migrateConfigurationsForFolder(folder, migrations);
            }
        }
        async migrateConfigurationsForFolder(folder, migrations) {
            await Promise.all(migrations.map(migration => this.migrateConfigurationsForFolderAndOverride(migration, { resource: folder === null || folder === void 0 ? void 0 : folder.uri })));
        }
        async migrateConfigurationsForFolderAndOverride(migration, overrides) {
            const data = this.configurationService.inspect(migration.key, overrides);
            await this.migrateConfigurationForFolderOverrideAndTarget(migration, overrides, data, 'userValue', 1 /* ConfigurationTarget.USER */);
            await this.migrateConfigurationForFolderOverrideAndTarget(migration, overrides, data, 'userLocalValue', 2 /* ConfigurationTarget.USER_LOCAL */);
            await this.migrateConfigurationForFolderOverrideAndTarget(migration, overrides, data, 'userRemoteValue', 3 /* ConfigurationTarget.USER_REMOTE */);
            await this.migrateConfigurationForFolderOverrideAndTarget(migration, overrides, data, 'workspaceFolderValue', 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            await this.migrateConfigurationForFolderOverrideAndTarget(migration, overrides, data, 'workspaceValue', 4 /* ConfigurationTarget.WORKSPACE */);
            if (typeof overrides.overrideIdentifier === 'undefined' && typeof data.overrideIdentifiers !== 'undefined') {
                for (const overrideIdentifier of data.overrideIdentifiers) {
                    await this.migrateConfigurationsForFolderAndOverride(migration, { resource: overrides.resource, overrideIdentifier });
                }
            }
        }
        async migrateConfigurationForFolderOverrideAndTarget(migration, overrides, data, dataKey, target) {
            const value = data[dataKey];
            if (typeof value === 'undefined') {
                return;
            }
            const valueAccessor = (key) => this.configurationService.inspect(key, overrides)[dataKey];
            const result = await migration.migrateFn(value, valueAccessor);
            const keyValuePairs = Array.isArray(result) ? result : [[migration.key, result]];
            await Promise.allSettled(keyValuePairs.map(async ([key, value]) => this.configurationService.updateValue(key, value.value, overrides, target)));
        }
    };
    ConfigurationMigrationWorkbenchContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ConfigurationMigrationWorkbenchContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ConfigurationMigrationWorkbenchContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=configurationMigration.js.map