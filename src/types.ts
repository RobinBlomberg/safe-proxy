import { ApiSchema } from '@robinblomberg/safe-express';
import { z } from 'zod';

export type FlattenedApi<TApi extends ApiSchema> = UnionToIntersection<
  {
    [K1 in keyof TApi & string]: {
      [K2 in keyof TApi[K1] & string]: {
        [K in InputPath<`${K1}${K2}`>]: TApi[K1][K2];
      };
    }[keyof TApi[K1] & string];
  }[keyof TApi & string]
>;

export type InputPath<T extends string> = RemoveInterpolation<
  RemoveTrailingSlash<T>
>;

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

export type RequestPayload = {
  body?: unknown;
  credentials?: 'include';
  headers?: Record<string, string>;
};

export type ResponseBodyOf<T> = T extends { responseBody: any }
  ? T['responseBody'] extends z.ZodType<any, any, any>
    ? z.infer<T['responseBody']>
    : never
  : never;

/**
 * @see https://stackoverflow.com/questions/51435783/pick-and-flatten-a-type-signature-in-typescript
 */
export type UnionToIntersection<T> = (
  T extends unknown ? (K: T) => void : never
) extends (K: infer I) => void
  ? I
  : never;
