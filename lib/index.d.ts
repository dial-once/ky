/*! MIT License © Arthur Yeti */
import type { Input, Options, GivenOptions } from './types';
declare const stop: unique symbol;
declare class HTTPError extends Error {
    response: Response;
    constructor(response: Response);
}
declare class TimeoutError extends Error {
    constructor();
}
declare class Ky {
    protected _retryCount: number;
    protected _input: Input;
    protected _options: Options;
    abortController?: AbortController;
    request?: Request;
    constructor(input: Input, options?: GivenOptions);
    _calculateRetryDelay(error: any): number;
    _retry(fn: any): Promise<any>;
    _fetch(): Promise<any>;
    _stream(response: any, onDownloadProgress: any): any;
}
declare const _default: {
    (input: any, options: any): Ky;
    HTTPError: typeof HTTPError;
    TimeoutError: typeof TimeoutError;
    create(newDefaults: any): any;
    extend(newDefaults: any): any;
    stop: typeof stop;
};
export default _default;
