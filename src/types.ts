import {
  ApiRequestSchema,
  ApiRequestShape,
  Method,
  Path,
  RouterSchema,
} from '@robinblomberg/safe-express';

export type Headers = Record<string, string>;

export type ParamsOf<
  TApi extends RouterSchema,
  TPath extends keyof TApi & Path,
  TMethod extends keyof TApi[TPath] & Method,
> = PropertyOf<TApi, TPath, TMethod, 'params'>;

export type PathWithMethodOf<
  TApi extends RouterSchema,
  TMethod extends Method,
> = keyof {
  [K in keyof TApi as TApi[K] extends { [K2 in TMethod]: ApiRequestSchema }
    ? K
    : never]: TApi[K];
} &
  Path;

export type RequestBodyOf<
  TApi extends RouterSchema,
  TPath extends keyof TApi & Path,
  TMethod extends keyof TApi[TPath] & Method,
> = PropertyOf<TApi, TPath, TMethod, 'requestBody'>;

export type RequestPayload<
  TApi extends RouterSchema,
  TPath extends keyof TApi & Path,
  TMethod extends keyof TApi[TPath] & Method,
> = {
  body?: RequestBodyOf<TApi, TPath, TMethod>;
  credentials?: 'include';
  headers?: Headers;
  params?: ParamsOf<TApi, TPath, TMethod>;
  query?: QueryOf<TApi, TPath, TMethod>;
};

export type ResponseBodyOf<
  TApi extends RouterSchema,
  TPath extends keyof TApi & Path,
  TMethod extends keyof TApi[TPath] & Method,
> = PropertyOf<TApi, TPath, TMethod, 'responseBody'>;

export type PropertyOf<
  TApi extends RouterSchema,
  TPath extends keyof TApi & Path,
  TMethod extends keyof TApi[TPath] & Method,
  TProperty extends keyof ApiRequestShape<TApi[TPath][TMethod]>,
> = ApiRequestShape<TApi[TPath][TMethod]>[TProperty];

export type QueryOf<
  TApi extends RouterSchema,
  TPath extends keyof TApi & Path,
  TMethod extends keyof TApi[TPath] & Method,
> = PropertyOf<TApi, TPath, TMethod, 'query'>;
