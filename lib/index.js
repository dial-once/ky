/*! MIT License © Arthur Yeti */
import { __assign, __awaiter, __extends, __generator, __spreadArrays } from "tslib";
var globals = {};
var getGlobal = function (property) {
    if (typeof self !== 'undefined' && self && property in self) {
        return self;
    }
    if (typeof window !== 'undefined' && window && property in window) {
        return window;
    }
    if (typeof global !== 'undefined' && global && property in global) {
        return global;
    }
    if (typeof globalThis !== 'undefined' && globalThis) {
        return globalThis;
    }
};
var globalProperties = [
    'Headers',
    'Request',
    'Response',
    'ReadableStream',
    'fetch',
    'AbortController',
    'FormData'
];
var _loop_1 = function (property) {
    Object.defineProperty(globals, property, {
        get: function () {
            var globalObject = getGlobal(property);
            var value = globalObject && globalObject[property];
            return typeof value === 'function' ? value.bind(globalObject) : value;
        }
    });
};
for (var _i = 0, globalProperties_1 = globalProperties; _i < globalProperties_1.length; _i++) {
    var property = globalProperties_1[_i];
    _loop_1(property);
}
function isObject(value) {
    return value !== null && typeof value === 'object';
}
var supportsAbortController = typeof globals.AbortController === 'function';
var supportsStreams = typeof globals.ReadableStream === 'function';
var supportsFormData = typeof globals.FormData === 'function';
function mergeHeaders(source1, source2) {
    var result = new globals.Headers(source1);
    var isHeadersInstance = source2 instanceof globals.Headers;
    var source = new globals.Headers(source2);
    for (var _i = 0, source_1 = source; _i < source_1.length; _i++) {
        var _a = source_1[_i], key = _a[0], value = _a[1];
        if ((isHeadersInstance && value === 'undefined') || value === undefined) {
            result.delete(key);
        }
        else {
            result.set(key, value);
        }
    }
    return result;
}
;
function deepMerge() {
    var _a;
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var returnValue = {};
    var headers = {};
    for (var _b = 0, sources_1 = sources; _b < sources_1.length; _b++) {
        var source = sources_1[_b];
        if (Array.isArray(source)) {
            if (!(Array.isArray(returnValue))) {
                returnValue = [];
            }
            returnValue = __spreadArrays(returnValue, source);
        }
        else if (isObject(source)) {
            for (var _c = 0, _d = Object.entries(source); _c < _d.length; _c++) {
                var _e = _d[_c], key = _e[0], value = _e[1];
                if (isObject(value) && Reflect.has(returnValue, key)) {
                    value = deepMerge(returnValue[key], value);
                }
                returnValue = __assign(__assign({}, returnValue), (_a = {}, _a[key] = value, _a));
            }
            if (isObject(source.headers)) {
                headers = mergeHeaders(headers, source.headers);
            }
        }
        returnValue.headers = headers;
    }
    return returnValue;
}
;
var requestMethods = [
    'get',
    'post',
    'put',
    'patch',
    'head',
    'delete'
];
var responseTypes = {
    json: 'application/json',
    text: 'text/*',
    formData: 'multipart/form-data',
    arrayBuffer: '*/*',
    blob: '*/*'
};
var retryMethods = [
    'get',
    'put',
    'head',
    'delete',
    'options',
    'trace'
];
var retryStatusCodes = [
    408,
    413,
    429,
    500,
    502,
    503,
    504
];
var retryAfterStatusCodes = [
    413,
    429,
    503
];
var stop = Symbol('stop');
var HTTPError = (function (_super) {
    __extends(HTTPError, _super);
    function HTTPError(response) {
        var _this = _super.call(this, response.statusText ||
            String((response.status === 0 || response.status) ?
                response.status : 'Unknown response error')) || this;
        _this.name = 'HTTPError';
        _this.response = response;
        return _this;
    }
    return HTTPError;
}(Error));
var TimeoutError = (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError() {
        var _this = _super.call(this, 'Request timed out') || this;
        _this.name = 'TimeoutError';
        return _this;
    }
    return TimeoutError;
}(Error));
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var timeout = function (promise, ms, abortController) {
    return new Promise(function (resolve, reject) {
        var timeoutID = setTimeout(function () {
            if (abortController) {
                abortController.abort();
            }
            reject(new TimeoutError());
        }, ms);
        promise
            .then(resolve)
            .catch(reject)
            .then(function () {
            clearTimeout(timeoutID);
        });
    });
};
function normalizeRequestMethod(input) {
    return requestMethods.includes(input) ? input.toUpperCase() : input;
}
var defaultRetryOptions = {
    limit: 2,
    methods: retryMethods,
    statusCodes: retryStatusCodes,
    afterStatusCodes: retryAfterStatusCodes
};
var normalizeRetryOptions = function (retry) {
    if (retry === void 0) { retry = {}; }
    if (typeof retry === 'number') {
        return __assign(__assign({}, defaultRetryOptions), { limit: retry });
    }
    if (retry.methods && !Array.isArray(retry.methods)) {
        throw new Error('retry.methods must be an array');
    }
    if (retry.statusCodes && !Array.isArray(retry.statusCodes)) {
        throw new Error('retry.statusCodes must be an array');
    }
    return __assign(__assign(__assign({}, defaultRetryOptions), retry), { afterStatusCodes: retryAfterStatusCodes });
};
var maxSafeTimeout = 2147483647;
var Ky = (function () {
    function Ky(input, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var _a, _b;
        this._retryCount = 0;
        this._input = input;
        this._options = __assign(__assign({ credentials: this._input.credentials || 'same-origin' }, options), { headers: mergeHeaders(this._input.headers || {}, options.headers || {}), hooks: deepMerge({
                beforeRequest: [],
                beforeRetry: [],
                afterResponse: []
            }, options.hooks), method: normalizeRequestMethod(options.method || this._input.method), prefixUrl: String(options.prefixUrl || ''), retry: normalizeRetryOptions(options.retry), throwHttpErrors: options.throwHttpErrors !== false, timeout: typeof options.timeout === 'undefined' ? 10000 : options.timeout });
        if (typeof this._input !== 'string' && !(this._input instanceof URL || this._input instanceof globals.Request)) {
            throw new TypeError('`input` must be a string, URL, or Request');
        }
        if (this._options.prefixUrl && typeof this._input === 'string') {
            if (this._input.startsWith('/')) {
                throw new Error('`input` must not begin with a slash when using `prefixUrl`');
            }
            if (!this._options.prefixUrl.endsWith('/')) {
                this._options.prefixUrl += '/';
            }
            this._input = this._options.prefixUrl + this._input;
        }
        if (supportsAbortController) {
            this.abortController = new globals.AbortController();
            if (this._options.signal) {
                this._options.signal.addEventListener('abort', function () {
                    var _a;
                    (_a = _this.abortController) === null || _a === void 0 ? void 0 : _a.abort();
                });
            }
            this._options.signal = (_a = this.abortController) === null || _a === void 0 ? void 0 : _a.signal;
        }
        this.request = new globals.Request(this._input, this._options);
        if (this._options.searchParams) {
            var url = new URL((_b = this.request) === null || _b === void 0 ? void 0 : _b.url);
            url.search = new URLSearchParams(this._options.searchParams).toString();
            if (((supportsFormData && this._options.body instanceof globals.FormData) || this._options.body instanceof URLSearchParams) && !(this._options.headers && this._options.headers['content-type'])) {
                this.request.headers.delete('content-type');
            }
            this.request = new globals.Request(new globals.Request(url, this.request), this._options);
        }
        if (this._options.json !== undefined) {
            this._options.body = JSON.stringify(this._options.json);
            this.request.headers.set('content-type', 'application/json');
            this.request = new globals.Request(this.request, { body: this._options.body });
        }
        var fn = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, _i, _a, hook, modifiedResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this._options.timeout > maxSafeTimeout) {
                            throw new RangeError("The `timeout` option cannot be greater than " + maxSafeTimeout);
                        }
                        return [4, delay(1)];
                    case 1:
                        _b.sent();
                        return [4, this._fetch()];
                    case 2:
                        response = _b.sent();
                        _i = 0, _a = this._options.hooks.afterResponse;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3, 6];
                        hook = _a[_i];
                        return [4, hook(this.request, this._options, response.clone())];
                    case 4:
                        modifiedResponse = _b.sent();
                        if (modifiedResponse instanceof globals.Response) {
                            response = modifiedResponse;
                        }
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3, 3];
                    case 6:
                        if (!response.ok && this._options.throwHttpErrors) {
                            throw new HTTPError(response);
                        }
                        if (this._options.onDownloadProgress) {
                            if (typeof this._options.onDownloadProgress !== 'function') {
                                throw new TypeError('The `onDownloadProgress` option must be a function');
                            }
                            if (!supportsStreams) {
                                throw new Error('Streams are not supported in your environment. `ReadableStream` is missing.');
                            }
                            return [2, this._stream(response.clone(), this._options.onDownloadProgress)];
                        }
                        return [2, response];
                }
            });
        }); };
        var isRetriableMethod = this._options.retry.methods.includes(this.request.method.toLowerCase());
        var result = isRetriableMethod ? this._retry(fn) : fn();
        var _loop_2 = function (type, mimeType) {
            result[type] = function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.request.headers.set('accept', this.request.headers.get('accept') || mimeType);
                            return [4, result];
                        case 1:
                            response = (_a.sent()).clone();
                            return [2, (type === 'json' && response.status === 204) ? '' : response[type]()];
                    }
                });
            }); };
        };
        for (var _i = 0, _c = Object.entries(responseTypes); _i < _c.length; _i++) {
            var _d = _c[_i], type = _d[0], mimeType = _d[1];
            _loop_2(type, mimeType);
        }
        return result;
    }
    Ky.prototype._calculateRetryDelay = function (error) {
        this._retryCount++;
        if (this._retryCount < this._options.retry.limit && !(error instanceof TimeoutError)) {
            if (error instanceof HTTPError) {
                if (!this._options.retry.statusCodes.includes(error.response.status)) {
                    return 0;
                }
                var retryAfter = error.response.headers.get('Retry-After');
                if (retryAfter && this._options.retry.afterStatusCodes.includes(error.response.status)) {
                    var after = Number(retryAfter);
                    if (Number.isNaN(after)) {
                        after = Date.parse(retryAfter) - Date.now();
                    }
                    else {
                        after *= 1000;
                    }
                    if (typeof this._options.retry.maxRetryAfter !== 'undefined' && after > this._options.retry.maxRetryAfter) {
                        return 0;
                    }
                    return after;
                }
                if (error.response.status === 413) {
                    return 0;
                }
            }
            var BACKOFF_FACTOR = 0.3;
            return BACKOFF_FACTOR * (Math.pow(2, (this._retryCount - 1))) * 1000;
        }
        return 0;
    };
    Ky.prototype._retry = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1, ms, _i, _a, hook, hookResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 9]);
                        return [4, fn()];
                    case 1: return [2, _b.sent()];
                    case 2:
                        error_1 = _b.sent();
                        ms = Math.min(this._calculateRetryDelay(error_1), maxSafeTimeout);
                        if (!(ms !== 0 && this._retryCount > 0)) return [3, 8];
                        return [4, delay(ms)];
                    case 3:
                        _b.sent();
                        _i = 0, _a = this._options.hooks.beforeRetry;
                        _b.label = 4;
                    case 4:
                        if (!(_i < _a.length)) return [3, 7];
                        hook = _a[_i];
                        return [4, hook({
                                request: this.request,
                                options: this._options,
                                error: error_1,
                                response: error_1.response.clone(),
                                retryCount: this._retryCount
                            })];
                    case 5:
                        hookResult = _b.sent();
                        if (hookResult === stop) {
                            return [2];
                        }
                        _b.label = 6;
                    case 6:
                        _i++;
                        return [3, 4];
                    case 7: return [2, this._retry(fn)];
                    case 8:
                        if (this._options.throwHttpErrors) {
                            throw error_1;
                        }
                        return [3, 9];
                    case 9: return [2];
                }
            });
        });
    };
    Ky.prototype._fetch = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _i, _c, hook, result;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _i = 0, _c = this._options.hooks.beforeRequest;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _c.length)) return [3, 4];
                        hook = _c[_i];
                        return [4, hook(this.request, this._options)];
                    case 2:
                        result = _d.sent();
                        if (result instanceof Request) {
                            this.request = result;
                            return [3, 4];
                        }
                        if (result instanceof Response) {
                            return [2, result];
                        }
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4:
                        if (this._options.timeout === false) {
                            return [2, globals.fetch((_a = this.request) === null || _a === void 0 ? void 0 : _a.clone())];
                        }
                        return [2, timeout(globals.fetch((_b = this.request) === null || _b === void 0 ? void 0 : _b.clone()), this._options.timeout, this.abortController)];
                }
            });
        });
    };
    Ky.prototype._stream = function (response, onDownloadProgress) {
        var totalBytes = Number(response.headers.get('content-length')) || 0;
        var transferredBytes = 0;
        return new globals.Response(new globals.ReadableStream({
            start: function (controller) {
                var reader = response.body.getReader();
                if (onDownloadProgress) {
                    onDownloadProgress({ percent: 0, transferredBytes: 0, totalBytes: totalBytes }, new Uint8Array());
                }
                function read() {
                    return __awaiter(this, void 0, void 0, function () {
                        var _a, done, value, percent;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4, reader.read()];
                                case 1:
                                    _a = _b.sent(), done = _a.done, value = _a.value;
                                    if (done) {
                                        controller.close();
                                        return [2];
                                    }
                                    if (onDownloadProgress) {
                                        transferredBytes += value.byteLength;
                                        percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
                                        onDownloadProgress({ percent: percent, transferredBytes: transferredBytes, totalBytes: totalBytes }, value);
                                    }
                                    controller.enqueue(value);
                                    read();
                                    return [2];
                            }
                        });
                    });
                }
                read();
            }
        }));
    };
    return Ky;
}());
var validateAndMerge = function () {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    for (var _a = 0, sources_2 = sources; _a < sources_2.length; _a++) {
        var source = sources_2[_a];
        if ((!isObject(source) || Array.isArray(source)) && typeof source !== 'undefined') {
            throw new TypeError('The `options` argument must be an object');
        }
    }
    return deepMerge.apply(void 0, __spreadArrays([{}], sources));
};
var createInstance = function (defaults) {
    var ky = function (input, options) { return new Ky(input, validateAndMerge(defaults, options)); };
    var _loop_3 = function (method) {
        ky[method] = function (input, options) { return new Ky(input, validateAndMerge(defaults, options, { method: method })); };
    };
    for (var _i = 0, requestMethods_1 = requestMethods; _i < requestMethods_1.length; _i++) {
        var method = requestMethods_1[_i];
        _loop_3(method);
    }
    ky.HTTPError = HTTPError;
    ky.TimeoutError = TimeoutError;
    ky.create = function (newDefaults) { return createInstance(validateAndMerge(newDefaults)); };
    ky.extend = function (newDefaults) { return createInstance(validateAndMerge(defaults, newDefaults)); };
    ky.stop = stop;
    return ky;
};
export default createInstance();
