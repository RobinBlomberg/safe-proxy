import {
  Method,
  Path,
  RequestSchema,
  RequestShape,
  RouterSchema,
} from '@robinblomberg/safe-express';

export type MethodOf<
  TApi extends RouterSchema,
  TPath extends PathOf<TApi>,
> = keyof TApi[TPath] & Method;

export type ParamsOf<
  TApi extends RouterSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
> = RequestShape<TApi[TPath][TMethod]>['params'];

export type PathOf<TApi extends RouterSchema> = keyof TApi;

export type PathWithMethodOf<
  TApi extends RouterSchema,
  TMethod extends Method,
> = keyof {
  [K in keyof TApi as TApi[K] extends { [K2 in TMethod]: RequestSchema }
    ? K
    : never]: TApi[K];
} &
  Path;

export type RequestBodyOf<
  TApi extends RouterSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
> = RequestShape<TApi[TPath][TMethod]>['requestBody'];

export type RequestPayload<
  TApi extends RouterSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
  TBody extends RequestBodyOf<TApi, TPath, TMethod>,
> = {
  body?: TBody;
  credentials?: 'include';
  headers?: Record<string, string>;
  params?: ParamsOf<TApi, TPath, TMethod>;
  query?: unknown;
};

export type ResponseBodyOf<
  TApi extends RouterSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
> = RequestShape<TApi[TPath][TMethod]>['responseBody'];
