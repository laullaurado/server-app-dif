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
define(["require", "exports", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/localization/common/locale"], function (require, exports, platform_1, environment_1, extensions_1, notification_1, jsonEditing_1, locale_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLocaleService = void 0;
    let NativeLocaleService = class NativeLocaleService {
        constructor(jsonEditingService, environmentService, notificationService) {
            this.jsonEditingService = jsonEditingService;
            this.environmentService = environmentService;
            this.notificationService = notificationService;
        }
        async setLocale(locale) {
            try {
                if (locale === platform_1.language || (!locale && platform_1.language === 'en')) {
                    return false;
                }
                await this.jsonEditingService.write(this.environmentService.argvResource, [{ path: ['locale'], value: locale }], true);
                return true;
            }
            catch (err) {
                this.notificationService.error(err);
                return false;
            }
        }
    };
    NativeLocaleService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, notification_1.INotificationService)
    ], NativeLocaleService);
    exports.NativeLocaleService = NativeLocaleService;
    (0, extensions_1.registerSingleton)(locale_1.ILocaleService, NativeLocaleService, true);
});
//# sourceMappingURL=localeService.js.map