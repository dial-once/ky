export declare type Primitive = null | undefined | string | number | boolean | symbol | bigint;
export declare type LiteralUnion<LiteralType extends BaseType, BaseType extends Primitive> = LiteralType | (BaseType & {
    _?: never;
});
export declare type Input = Request | URL | string;
export declare type Headers = {
    [key: string]: string;
};
export declare type BeforeRequestHook = (request: Request, options: NormalizedOptions) => Request | Response | void | Promise<Request | Response | void>;
export declare type BeforeRetryHook = (options: {
    request: Request;
    response: Response;
    options: NormalizedOptions;
    error: Error;
    retryCount: number;
}) => void | Promise<void>;
export declare type AfterResponseHook = (request: Request, options: NormalizedOptions, response: Response) => Response | void | Promise<Response | void>;
export interface DownloadProgress {
    percent: number;
    transferredBytes: number;
    totalBytes: number;
}
export interface Hooks {
    beforeRequest?: BeforeRequestHook[];
    beforeRetry?: BeforeRetryHook[];
    afterResponse?: AfterResponseHook[];
}
export interface RetryOptions {
    limit?: number;
    methods?: string[];
    statusCodes?: number[];
    afterStatusCodes?: number[];
    maxRetryAfter?: number;
}
export interface Options extends Omit<RequestInit, "headers"> {
    method?: LiteralUnion<"get" | "post" | "put" | "delete" | "patch" | "head", string>;
    headers?: HeadersInit | {
        [key: string]: undefined;
    };
    json?: unknown;
    searchParams?: string | {
        [key: string]: string | number | boolean;
    } | Array<Array<string | number | boolean>> | URLSearchParams;
    prefixUrl?: URL | string;
    retry?: RetryOptions | number;
    timeout?: number | false;
    hooks?: Hooks;
    throwHttpErrors?: boolean;
    onDownloadProgress?: (progress: DownloadProgress, chunk: Uint8Array) => void;
}
export interface GivenOptions extends Options {
}
export interface NormalizedOptions extends RequestInit {
    method: RequestInit["method"];
    credentials: RequestInit["credentials"];
    retry: Options["retry"];
    prefixUrl: Options["prefixUrl"];
    onDownloadProgress: Options["onDownloadProgress"];
}
export interface ResponsePromise extends Promise<Response> {
    arrayBuffer: () => Promise<ArrayBuffer>;
    blob: () => Promise<Blob>;
    formData: () => Promise<FormData>;
    json: <T>() => Promise<T>;
    text: () => Promise<string>;
}
