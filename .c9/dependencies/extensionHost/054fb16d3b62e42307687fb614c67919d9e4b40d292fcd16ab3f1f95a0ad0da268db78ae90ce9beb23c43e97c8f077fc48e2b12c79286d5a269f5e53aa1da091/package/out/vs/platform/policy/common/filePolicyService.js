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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/types", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/policy/common/policy"], function (require, exports, async_1, event_1, iterator_1, types_1, files_1, log_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilePolicyService = void 0;
    function keysDiff(a, b) {
        const result = [];
        for (const key of iterator_1.Iterable.concat(a.keys(), b.keys())) {
            if (a.get(key) !== b.get(key)) {
                result.push(key);
            }
        }
        return result;
    }
    let FilePolicyService = class FilePolicyService extends policy_1.AbstractPolicyService {
        constructor(file, fileService, logService) {
            super();
            this.file = file;
            this.fileService = fileService;
            this.logService = logService;
            this.throttledDelayer = this._register(new async_1.ThrottledDelayer(500));
            const onDidChangePolicyFile = event_1.Event.filter(fileService.onDidFilesChange, e => e.affects(file));
            this._register(fileService.watch(file));
            this._register(onDidChangePolicyFile(() => this.throttledDelayer.trigger(() => this.refresh())));
        }
        async initializePolicies(policyDefinitions) {
            await this.refresh();
        }
        async read() {
            const policies = new Map();
            try {
                const content = await this.fileService.readFile(this.file);
                const raw = JSON.parse(content.value.toString());
                if (!(0, types_1.isObject)(raw)) {
                    throw new Error('Policy file isn\'t a JSON object');
                }
                for (const key of Object.keys(raw)) {
                    if (this.policyDefinitions[key]) {
                        policies.set(key, raw[key]);
                    }
                }
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(`[FilePolicyService] Failed to read policies`, error);
                }
            }
            return policies;
        }
        async refresh() {
            const policies = await this.read();
            const diff = keysDiff(this.policies, policies);
            this.policies = policies;
            if (diff.length > 0) {
                this._onDidChange.fire(diff);
            }
        }
    };
    FilePolicyService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], FilePolicyService);
    exports.FilePolicyService = FilePolicyService;
});
//# sourceMappingURL=filePolicyService.js.map