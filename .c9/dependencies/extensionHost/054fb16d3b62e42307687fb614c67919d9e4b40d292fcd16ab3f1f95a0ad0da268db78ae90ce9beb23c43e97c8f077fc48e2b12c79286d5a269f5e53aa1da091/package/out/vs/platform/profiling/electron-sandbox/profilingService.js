/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/ipc/electron-sandbox/services", "vs/platform/profiling/common/profiling"], function (require, exports, services_1, profiling_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerSharedProcessRemoteService)(profiling_1.IV8InspectProfilingService, 'v8InspectProfiling', { supportsDelayedInstantiation: true });
});
//# sourceMappingURL=profilingService.js.map