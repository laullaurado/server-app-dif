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
define(["require", "exports", "fs", "path", "url", "cookie", "crypto", "vs/base/common/extpath", "vs/base/common/mime", "vs/base/common/platform", "vs/platform/log/common/log", "vs/server/node/serverEnvironmentService", "vs/base/common/path", "vs/base/common/network", "vs/base/common/uuid", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/common/buffer", "vs/base/common/types", "vs/platform/remote/common/remoteHosts"], function (require, exports, fs_1, path, url, cookie, crypto, extpath_1, mime_1, platform_1, log_1, serverEnvironmentService_1, path_1, network_1, uuid_1, productService_1, request_1, cancellation_1, uri_1, buffer_1, types_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebClientServer = exports.serveFile = exports.CacheControl = exports.serveError = void 0;
    const textMimeType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
    };
    /**
     * Return an error to the client.
     */
    async function serveError(req, res, errorCode, errorMessage) {
        res.writeHead(errorCode, { 'Content-Type': 'text/plain' });
        res.end(errorMessage);
    }
    exports.serveError = serveError;
    var CacheControl;
    (function (CacheControl) {
        CacheControl[CacheControl["NO_CACHING"] = 0] = "NO_CACHING";
        CacheControl[CacheControl["ETAG"] = 1] = "ETAG";
        CacheControl[CacheControl["NO_EXPIRY"] = 2] = "NO_EXPIRY";
    })(CacheControl = exports.CacheControl || (exports.CacheControl = {}));
    /**
     * Serve a file at a given path or 404 if the file is missing.
     */
    async function serveFile(filePath, cacheControl, logService, req, res, responseHeaders) {
        try {
            const stat = await fs_1.promises.stat(filePath); // throws an error if file doesn't exist
            if (cacheControl === 1 /* CacheControl.ETAG */) {
                // Check if file modified since
                const etag = `W/"${[stat.ino, stat.size, stat.mtime.getTime()].join('-')}"`; // weak validator (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
                if (req.headers['if-none-match'] === etag) {
                    res.writeHead(304);
                    return res.end();
                }
                responseHeaders['Etag'] = etag;
            }
            else if (cacheControl === 2 /* CacheControl.NO_EXPIRY */) {
                responseHeaders['Cache-Control'] = 'public, max-age=31536000';
            }
            else if (cacheControl === 0 /* CacheControl.NO_CACHING */) {
                responseHeaders['Cache-Control'] = 'no-store';
            }
            responseHeaders['Content-Type'] = textMimeType[(0, path_1.extname)(filePath)] || (0, mime_1.getMediaMime)(filePath) || 'text/plain';
            res.writeHead(200, responseHeaders);
            // Data
            (0, fs_1.createReadStream)(filePath).pipe(res);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                logService.error(error);
                console.error(error.toString());
            }
            else {
                console.error(`File not found: ${filePath}`);
            }
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
        }
    }
    exports.serveFile = serveFile;
    const APP_ROOT = (0, path_1.dirname)(network_1.FileAccess.asFileUri('', require).fsPath);
    let WebClientServer = class WebClientServer {
        constructor(_connectionToken, _environmentService, _logService, _requestService, _productService) {
            var _a;
            this._connectionToken = _connectionToken;
            this._environmentService = _environmentService;
            this._logService = _logService;
            this._requestService = _requestService;
            this._productService = _productService;
            this._webExtensionResourceUrlTemplate = ((_a = this._productService.extensionsGallery) === null || _a === void 0 ? void 0 : _a.resourceUrlTemplate) ? uri_1.URI.parse(this._productService.extensionsGallery.resourceUrlTemplate) : undefined;
            const serverRootPath = (0, remoteHosts_1.getRemoteServerRootPath)(_productService);
            this._staticRoute = `${serverRootPath}/static`;
            this._callbackRoute = `${serverRootPath}/callback`;
            this._webExtensionRoute = `${serverRootPath}/web-extension-resource`;
        }
        /**
         * Handle web resources (i.e. only needed by the web client).
         * **NOTE**: This method is only invoked when the server has web bits.
         * **NOTE**: This method is only invoked after the connection token has been validated.
         */
        async handle(req, res, parsedUrl) {
            try {
                const pathname = parsedUrl.pathname;
                if (pathname.startsWith(this._staticRoute) && pathname.charCodeAt(this._staticRoute.length) === 47 /* CharCode.Slash */) {
                    return this._handleStatic(req, res, parsedUrl);
                }
                if (pathname === '/') {
                    return this._handleRoot(req, res, parsedUrl);
                }
                if (pathname === this._callbackRoute) {
                    // callback support
                    return this._handleCallback(res);
                }
                if (pathname.startsWith(this._webExtensionRoute) && pathname.charCodeAt(this._webExtensionRoute.length) === 47 /* CharCode.Slash */) {
                    // extension resource support
                    return this._handleWebExtensionResource(req, res, parsedUrl);
                }
                return serveError(req, res, 404, 'Not found.');
            }
            catch (error) {
                this._logService.error(error);
                console.error(error.toString());
                return serveError(req, res, 500, 'Internal Server Error.');
            }
        }
        /**
         * Handle HTTP requests for /static/*
         */
        async _handleStatic(req, res, parsedUrl) {
            const headers = Object.create(null);
            // Strip the this._staticRoute from the path
            const normalizedPathname = decodeURIComponent(parsedUrl.pathname); // support paths that are uri-encoded (e.g. spaces => %20)
            const relativeFilePath = normalizedPathname.substring(this._staticRoute.length + 1);
            const filePath = (0, path_1.join)(APP_ROOT, relativeFilePath); // join also normalizes the path
            if (!(0, extpath_1.isEqualOrParent)(filePath, APP_ROOT, !platform_1.isLinux)) {
                return serveError(req, res, 400, `Bad request.`);
            }
            return serveFile(filePath, this._environmentService.isBuilt ? 2 /* CacheControl.NO_EXPIRY */ : 1 /* CacheControl.ETAG */, this._logService, req, res, headers);
        }
        _getResourceURLTemplateAuthority(uri) {
            const index = uri.authority.indexOf('.');
            return index !== -1 ? uri.authority.substring(index + 1) : undefined;
        }
        /**
         * Handle extension resources
         */
        async _handleWebExtensionResource(req, res, parsedUrl) {
            if (!this._webExtensionResourceUrlTemplate) {
                return serveError(req, res, 500, 'No extension gallery service configured.');
            }
            // Strip `/web-extension-resource/` from the path
            const normalizedPathname = decodeURIComponent(parsedUrl.pathname); // support paths that are uri-encoded (e.g. spaces => %20)
            const path = (0, path_1.normalize)(normalizedPathname.substring(this._webExtensionRoute.length + 1));
            const uri = uri_1.URI.parse(path).with({
                scheme: this._webExtensionResourceUrlTemplate.scheme,
                authority: path.substring(0, path.indexOf('/')),
                path: path.substring(path.indexOf('/') + 1)
            });
            if (this._getResourceURLTemplateAuthority(this._webExtensionResourceUrlTemplate) !== this._getResourceURLTemplateAuthority(uri)) {
                return serveError(req, res, 403, 'Request Forbidden');
            }
            const headers = {};
            const setRequestHeader = (header) => {
                const value = req.headers[header];
                if (value && ((0, types_1.isString)(value) || value[0])) {
                    headers[header] = (0, types_1.isString)(value) ? value : value[0];
                }
                else if (header !== header.toLowerCase()) {
                    setRequestHeader(header.toLowerCase());
                }
            };
            setRequestHeader('X-Client-Name');
            setRequestHeader('X-Client-Version');
            setRequestHeader('X-Machine-Id');
            setRequestHeader('X-Client-Commit');
            const context = await this._requestService.request({
                type: 'GET',
                url: uri.toString(true),
                headers
            }, cancellation_1.CancellationToken.None);
            const status = context.res.statusCode || 500;
            if (status !== 200) {
                let text = null;
                try {
                    text = await (0, request_1.asTextOrError)(context);
                }
                catch (error) { /* Ignore */ }
                return serveError(req, res, status, text || `Request failed with status ${status}`);
            }
            const responseHeaders = Object.create(null);
            const setResponseHeader = (header) => {
                const value = context.res.headers[header];
                if (value) {
                    responseHeaders[header] = value;
                }
                else if (header !== header.toLowerCase()) {
                    setResponseHeader(header.toLowerCase());
                }
            };
            setResponseHeader('Cache-Control');
            setResponseHeader('Content-Type');
            res.writeHead(200, responseHeaders);
            const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
            return res.end(buffer.buffer);
        }
        /**
         * Handle HTTP requests for /
         */
        async _handleRoot(req, res, parsedUrl) {
            var _a;
            const queryConnectionToken = parsedUrl.query[network_1.connectionTokenQueryName];
            if (typeof queryConnectionToken === 'string') {
                // We got a connection token as a query parameter.
                // We want to have a clean URL, so we strip it
                const responseHeaders = Object.create(null);
                responseHeaders['Set-Cookie'] = cookie.serialize(network_1.connectionTokenCookieName, queryConnectionToken, {
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 /* 1 week */
                });
                const newQuery = Object.create(null);
                for (let key in parsedUrl.query) {
                    if (key !== network_1.connectionTokenQueryName) {
                        newQuery[key] = parsedUrl.query[key];
                    }
                }
                const newLocation = url.format({ pathname: '/', query: newQuery });
                responseHeaders['Location'] = newLocation;
                res.writeHead(302, responseHeaders);
                return res.end();
            }
            let originalHost = req.headers['x-original-host'];
            if (Array.isArray(originalHost)) {
                originalHost = originalHost[0];
            }
            const remoteAuthority = originalHost || req.headers.host;
            if (!remoteAuthority) {
                return serveError(req, res, 400, `Bad request.`);
            }
            function asJSON(value) {
                return JSON.stringify(value).replace(/"/g, '&quot;');
            }
            let _wrapWebWorkerExtHostInIframe = undefined;
            if (this._environmentService.args['enable-smoke-test-driver']) {
                // integration tests run at a time when the built output is not yet published to the CDN
                // so we must disable the iframe wrapping because the iframe URL will give a 404
                _wrapWebWorkerExtHostInIframe = false;
            }
            const resolveWorkspaceURI = (defaultLocation) => defaultLocation && uri_1.URI.file(path.resolve(defaultLocation)).with({ scheme: network_1.Schemas.vscodeRemote, authority: remoteAuthority });
            const filePath = network_1.FileAccess.asFileUri(this._environmentService.isBuilt ? 'vs/code/browser/workbench/workbench.html' : 'vs/code/browser/workbench/workbench-dev.html', require).fsPath;
            const authSessionInfo = !this._environmentService.isBuilt && this._environmentService.args['github-auth'] ? {
                id: (0, uuid_1.generateUuid)(),
                providerId: 'github',
                accessToken: this._environmentService.args['github-auth'],
                scopes: [['user:email'], ['repo']]
            } : undefined;
            const workbenchWebConfiguration = {
                remoteAuthority,
                _wrapWebWorkerExtHostInIframe,
                developmentOptions: { enableSmokeTestDriver: this._environmentService.args['enable-smoke-test-driver'] ? true : undefined },
                settingsSyncOptions: !this._environmentService.isBuilt && this._environmentService.args['enable-sync'] ? { enabled: true } : undefined,
                enableWorkspaceTrust: !this._environmentService.args['disable-workspace-trust'],
                folderUri: resolveWorkspaceURI(this._environmentService.args['default-folder']),
                workspaceUri: resolveWorkspaceURI(this._environmentService.args['default-workspace']),
                productConfiguration: {
                    embedderIdentifier: 'server-distro',
                    extensionsGallery: this._webExtensionResourceUrlTemplate ? Object.assign(Object.assign({}, this._productService.extensionsGallery), { 'resourceUrlTemplate': this._webExtensionResourceUrlTemplate.with({
                            scheme: 'http',
                            authority: remoteAuthority,
                            path: `${this._webExtensionRoute}/${this._webExtensionResourceUrlTemplate.authority}${this._webExtensionResourceUrlTemplate.path}`
                        }).toString(true) }) : undefined
                },
                callbackRoute: this._callbackRoute
            };
            let nlsBaseUrl = (_a = this._productService.extensionsGallery) === null || _a === void 0 ? void 0 : _a.nlsBaseUrl;
            if (!(nlsBaseUrl === null || nlsBaseUrl === void 0 ? void 0 : nlsBaseUrl.endsWith('/'))) {
                nlsBaseUrl += '/';
            }
            const values = {
                WORKBENCH_WEB_CONFIGURATION: asJSON(workbenchWebConfiguration),
                WORKBENCH_AUTH_SESSION: authSessionInfo ? asJSON(authSessionInfo) : '',
                WORKBENCH_WEB_BASE_URL: this._staticRoute,
                WORKBENCH_NLS_BASE_URL: nlsBaseUrl ? `${nlsBaseUrl}${this._productService.commit}/${this._productService.version}/` : '',
            };
            let data;
            try {
                const workbenchTemplate = (await fs_1.promises.readFile(filePath)).toString();
                data = workbenchTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => { var _a; return (_a = values[key]) !== null && _a !== void 0 ? _a : 'undefined'; });
            }
            catch (e) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('Not found');
            }
            const cspDirectives = [
                'default-src \'self\';',
                'img-src \'self\' https: data: blob:;',
                'media-src \'self\';',
                `script-src 'self' 'unsafe-eval' ${this._getScriptCspHashes(data).join(' ')} 'sha256-fh3TwPMflhsEIpR8g1OYTIMVWhXTLcjQ9kh2tIpmv54=' http://${remoteAuthority} ${nlsBaseUrl !== null && nlsBaseUrl !== void 0 ? nlsBaseUrl : ''};`,
                'child-src \'self\';',
                `frame-src 'self' https://*.vscode-cdn.net data:;`,
                'worker-src \'self\' data:;',
                'style-src \'self\' \'unsafe-inline\';',
                'connect-src \'self\' ws: wss: https:;',
                'font-src \'self\' blob:;',
                'manifest-src \'self\';'
            ].join(' ');
            const headers = {
                'Content-Type': 'text/html',
                'Content-Security-Policy': cspDirectives
            };
            if (this._connectionToken.type !== 0 /* ServerConnectionTokenType.None */) {
                // At this point we know the client has a valid cookie
                // and we want to set it prolong it to ensure that this
                // client is valid for another 1 week at least
                headers['Set-Cookie'] = cookie.serialize(network_1.connectionTokenCookieName, this._connectionToken.value, {
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 /* 1 week */
                });
            }
            res.writeHead(200, headers);
            return res.end(data);
        }
        _getScriptCspHashes(content) {
            // Compute the CSP hashes for line scripts. Uses regex
            // which means it isn't 100% good.
            const regex = /<script>([\s\S]+?)<\/script>/img;
            const result = [];
            let match;
            while (match = regex.exec(content)) {
                const hasher = crypto.createHash('sha256');
                // This only works on Windows if we strip `\r` from `\r\n`.
                const script = match[1].replace(/\r\n/g, '\n');
                const hash = hasher
                    .update(Buffer.from(script))
                    .digest().toString('base64');
                result.push(`'sha256-${hash}'`);
            }
            return result;
        }
        /**
         * Handle HTTP requests for /callback
         */
        async _handleCallback(res) {
            const filePath = network_1.FileAccess.asFileUri('vs/code/browser/workbench/callback.html', require).fsPath;
            const data = (await fs_1.promises.readFile(filePath)).toString();
            const cspDirectives = [
                'default-src \'self\';',
                'img-src \'self\' https: data: blob:;',
                'media-src \'none\';',
                `script-src 'self' ${this._getScriptCspHashes(data).join(' ')};`,
                'style-src \'self\' \'unsafe-inline\';',
                'font-src \'self\' blob:;'
            ].join(' ');
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Content-Security-Policy': cspDirectives
            });
            return res.end(data);
        }
    };
    WebClientServer = __decorate([
        __param(1, serverEnvironmentService_1.IServerEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, request_1.IRequestService),
        __param(4, productService_1.IProductService)
    ], WebClientServer);
    exports.WebClientServer = WebClientServer;
});
//# sourceMappingURL=webClientServer.js.map