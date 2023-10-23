/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/tasks/browser/taskTerminalStatus", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/terminal/browser/terminalStatusList"], function (require, exports, assert_1, event_1, testConfigurationService_1, instantiationServiceMock_1, taskTerminalStatus_1, tasks_1, terminalStatusList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTaskService {
        constructor() {
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        triggerStateChange(event) {
            this._onDidStateChange.fire(event);
        }
    }
    class TestTerminal {
        constructor() {
            this.statusList = new terminalStatusList_1.TerminalStatusList(new testConfigurationService_1.TestConfigurationService());
        }
    }
    class TestTask extends tasks_1.CommonTask {
        getFolderId() {
            throw new Error('Method not implemented.');
        }
        fromObject(object) {
            throw new Error('Method not implemented.');
        }
    }
    class TestProblemCollector {
    }
    suite('Task Terminal Status', () => {
        let instantiationService;
        let taskService;
        let taskTerminalStatus;
        let testTerminal;
        let testTask;
        let problemCollector;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            taskService = new TestTaskService();
            taskTerminalStatus = instantiationService.createInstance(taskTerminalStatus_1.TaskTerminalStatus, taskService);
            testTerminal = instantiationService.createInstance(TestTerminal);
            testTask = instantiationService.createInstance(TestTask);
            problemCollector = instantiationService.createInstance(TestProblemCollector);
        });
        test('Should add failed status when there is an exit code on task end', async () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "end" /* TaskEventKind.End */, exitCode: 2 });
            await poll(async () => Promise.resolve(), () => { var _a; return ((_a = testTerminal === null || testTerminal === void 0 ? void 0 : testTerminal.statusList.primary) === null || _a === void 0 ? void 0 : _a.id) === taskTerminalStatus_1.FAILED_TASK_STATUS.id; }, 'terminal status should be updated');
        });
        test('Should add active status when a non-background task is run for a second time in the same terminal', async () => {
            taskTerminalStatus.addTerminal(testTask, testTerminal, problemCollector);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
            taskService.triggerStateChange({ kind: "processStarted" /* TaskEventKind.ProcessStarted */, runType: "singleRun" /* TaskRunType.SingleRun */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.ACTIVE_TASK_STATUS);
            taskService.triggerStateChange({ kind: "inactive" /* TaskEventKind.Inactive */ });
            assertStatus(testTerminal.statusList, taskTerminalStatus_1.SUCCEEDED_TASK_STATUS);
        });
    });
    function assertStatus(actual, expected) {
        var _a, _b;
        (0, assert_1.ok)(actual.statuses.length === 1, '# of statuses');
        (0, assert_1.ok)(((_a = actual.primary) === null || _a === void 0 ? void 0 : _a.id) === expected.id, 'ID');
        (0, assert_1.ok)(((_b = actual.primary) === null || _b === void 0 ? void 0 : _b.severity) === expected.severity, 'Severity');
    }
    async function poll(fn, acceptFn, timeoutMessage, retryCount = 200, retryInterval = 10 // millis
    ) {
        let trial = 1;
        let lastError = '';
        while (true) {
            if (trial > retryCount) {
                throw new Error(`Timeout: ${timeoutMessage} after ${(retryCount * retryInterval) / 1000} seconds.\r${lastError}`);
            }
            let result;
            try {
                result = await fn();
                if (acceptFn(result)) {
                    return result;
                }
                else {
                    lastError = 'Did not pass accept function';
                }
            }
            catch (e) {
                lastError = Array.isArray(e.stack) ? e.stack.join('\n') : e.stack;
            }
            await new Promise(resolve => setTimeout(resolve, retryInterval));
            trial++;
        }
    }
});
//# sourceMappingURL=taskTerminalStatus.test.js.map