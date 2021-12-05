import { ApiSchema, Method, RequestShape } from '@robinblomberg/safe-express';
import { RouteParameters } from 'express-serve-static-core';
import { z } from 'zod';

export type InputPath<T extends string> = RemoveInterpolation<
  RemoveTrailingSlash<T>
>;

export type MethodOf<
  TApi extends ApiSchema,
  TPath extends PathOf<TApi>,
> = keyof FlattenedApiSchema<TApi>[TPath] & Method;

export type ParamsOf<
  TApi extends ApiSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
> = {
  [K in keyof RouteParameters<TPath>]: string | number;
} & RequestShape<FlattenedApiSchema<TApi>[TPath][TMethod]>['params'];

export type PathOf<TApi extends ApiSchema> = keyof FlattenedApiSchema<TApi> &
  string;

/**
 * @example
 * type Path = RemoveInterpolation<'/user/:userId/absence/:absenceId'>;
 * `/user/${string}/absence/${string}`
 */
export type RemoveInterpolation<T extends string> =
  T extends `${infer T1}:${string}/${infer T2}`
    ? `${T1}${string}/${RemoveInterpolation<T2>}`
    : T extends `${infer T1}:${string}`
    ? `${T1}${string}`
    : T;

/**
 * @example
 * type Path = RemoveTrailingSlash<'/user/'>;
 * '/user'
 */
export type RemoveTrailingSlash<T extends string> = T extends `${infer S}/`
  ? S
  : T;

export type RequestBodyOf<
  TApi extends ApiSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
> = RequestShape<FlattenedApiSchema<TApi>[TPath][TMethod]>['requestBody'];

export type RequestPayload<
  TApi extends ApiSchema,
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
  TApi extends ApiSchema,
  TPath extends PathOf<TApi>,
  TMethod extends MethodOf<TApi, TPath>,
> = FlattenedApiSchema<TApi>[TPath][TMethod] extends { responseBody: any }
  ? FlattenedApiSchema<TApi>[TPath][TMethod]['responseBody'] extends z.ZodType<
      any,
      any,
      any
    >
    ? z.infer<FlattenedApiSchema<TApi>[TPath][TMethod]['responseBody']>
    : never
  : never;

export type FlattenedApiSchema<TApi extends ApiSchema> = UnionToIntersection<
  {
    [K1 in keyof TApi & string]: {
      [K2 in keyof TApi[K1] & string]: {
        [K in InputPath<`${K1}${K2}`>]: TApi[K1][K2];
      };
    }[keyof TApi[K1] & string];
  }[keyof TApi & string]
>;

/**
 * @see https://stackoverflow.com/questions/51435783/pick-and-flatten-a-type-signature-in-typescript
 */
export type UnionToIntersection<T> = (
  T extends unknown ? (K: T) => void : never
) extends (K: infer I) => void
  ? I
  : never;
