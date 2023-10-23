/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace"], function (require, exports, errors_1, environment_1, extensionStorage_1, files_1, log_1, storage_1, uriIdentity_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateExtensionStorage = void 0;
    /**
     * An extension storage has following
     * 	- State: Stored using storage service with extension id as key and state as value.
     *  - Resources: Stored under a location scoped to the extension.
     */
    async function migrateExtensionStorage(fromExtensionId, toExtensionId, global, instantionService) {
        return instantionService.invokeFunction(async (serviceAccessor) => {
            const environmentService = serviceAccessor.get(environment_1.IEnvironmentService);
            const extensionStorageService = serviceAccessor.get(extensionStorage_1.IExtensionStorageService);
            const storageService = serviceAccessor.get(storage_1.IStorageService);
            const uriIdentityService = serviceAccessor.get(uriIdentity_1.IUriIdentityService);
            const fileService = serviceAccessor.get(files_1.IFileService);
            const workspaceContextService = serviceAccessor.get(workspace_1.IWorkspaceContextService);
            const logService = serviceAccessor.get(log_1.ILogService);
            const storageMigratedKey = `extensionStorage.migrate.${fromExtensionId}-${toExtensionId}`;
            const migrateLowerCaseStorageKey = fromExtensionId.toLowerCase() === toExtensionId.toLowerCase() ? `extension.storage.migrateFromLowerCaseKey.${fromExtensionId.toLowerCase()}` : undefined;
            if (fromExtensionId === toExtensionId) {
                return;
            }
            const getExtensionStorageLocation = (extensionId, global) => {
                if (global) {
                    return uriIdentityService.extUri.joinPath(environmentService.globalStorageHome, extensionId.toLowerCase() /* Extension id is lower cased for global storage */);
                }
                return uriIdentityService.extUri.joinPath(environmentService.workspaceStorageHome, workspaceContextService.getWorkspace().id, extensionId);
            };
            const storageScope = global ? 0 /* StorageScope.GLOBAL */ : 1 /* StorageScope.WORKSPACE */;
            if (!storageService.getBoolean(storageMigratedKey, storageScope, false) && !(migrateLowerCaseStorageKey && storageService.getBoolean(migrateLowerCaseStorageKey, storageScope, false))) {
                logService.info(`Migrating ${global ? 'global' : 'workspace'} extension storage from ${fromExtensionId} to ${toExtensionId}...`);
                // Migrate state
                const value = extensionStorageService.getExtensionState(fromExtensionId, global);
                if (value) {
                    extensionStorageService.setExtensionState(toExtensionId, value, global);
                    extensionStorageService.setExtensionState(fromExtensionId, undefined, global);
                }
                // Migrate stored files
                const fromPath = getExtensionStorageLocation(fromExtensionId, global);
                const toPath = getExtensionStorageLocation(toExtensionId, global);
                if (!uriIdentityService.extUri.isEqual(fromPath, toPath)) {
                    try {
                        await fileService.move(fromPath, toPath, true);
                    }
                    catch (error) {
                        if (error.code !== files_1.FileSystemProviderErrorCode.FileNotFound) {
                            logService.info(`Error while migrating ${global ? 'global' : 'workspace'} file storage from '${fromExtensionId}' to '${toExtensionId}'`, (0, errors_1.getErrorMessage)(error));
                        }
                    }
                }
                logService.info(`Migrated ${global ? 'global' : 'workspace'} extension storage from ${fromExtensionId} to ${toExtensionId}`);
                storageService.store(storageMigratedKey, true, storageScope, 1 /* StorageTarget.MACHINE */);
            }
        });
    }
    exports.migrateExtensionStorage = migrateExtensionStorage;
});
//# sourceMappingURL=extensionStorageMigration.js.map