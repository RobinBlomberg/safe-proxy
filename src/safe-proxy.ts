import { RouterSchema } from '@robinblomberg/safe-express';
import fetch from 'isomorphic-unfetch';
import JSON5 from 'json5';
import { PathOf, PathWithMethodOf } from '.';
import { RequestError } from './request-error';
import {
  MethodOf,
  RequestBodyOf,
  RequestPayload,
  ResponseBodyOf,
} from './types';

/**
 * Naïve but simple date regex.
 * Will also match incorrect dates such as 2021-19-39T29:69:99.123Z.
 */
const DATE_REGEX =
  /^[0-9]{4}-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-6][0-9]:[0-9]{2}\.[0-9]{3}Z$/;

export class SafeProxy<TApi extends RouterSchema> {
  /**
   * TODO: Use a Zod schema to identify specified dates in order to avoid accidental conversions.
   */
  private static parseJson(string: string) {
    return JSON.parse(string, (key, value) => {
      return DATE_REGEX.test(value) ? new Date(value) : value;
    });
  }

  readonly #baseUrl: string;

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl;
  }

  async #request<
    TPath extends PathOf<TApi>,
    TMethod extends MethodOf<TApi, TPath>,
    TBody extends RequestBodyOf<TApi, TPath, TMethod>,
  >(
    method: TMethod,
    path: TPath,
    payload: RequestPayload<TApi, TPath, TMethod, TBody> = {},
  ) {
    const headers = { ...(payload.headers ?? {}) };
    const requestInit: RequestInit = {
      headers,
      method: method.toUpperCase(),
    };
    let url = `${this.#baseUrl}${path}`;

    if (payload.body !== undefined) {
      requestInit.body = JSON.stringify(payload.body);
      headers['Content-Type'] = 'application/json';
    }

    if (payload.credentials) {
      requestInit.credentials = 'include';
    }

    if (payload.params) {
      for (const param in payload.params) {
        if (Object.prototype.hasOwnProperty.call(payload.params, param)) {
          const regex = new RegExp(`:${param}`, 'g');
          const value = String(payload.params[param]);
          url = url.replace(regex, value);
        }
      }
    }

    if (payload.query !== undefined) {
      url += `?${encodeURIComponent(JSON5.stringify(payload.query))}`;
    }

    const response = await fetch(url, requestInit);
    const responseText = await response.text();
    const responseBody = SafeProxy.parseJson(responseText);

    if (!response.ok) {
      const message =
        responseBody instanceof Object
          ? responseBody.message ?? responseBody.code ?? ''
          : '';
      throw new RequestError(message, responseBody);
    }

    return {
      body: responseBody as ResponseBodyOf<TApi, TPath, TMethod>,
      headers: Object.fromEntries(response.headers.entries()),
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    };
  }

  delete<
    TPath extends PathWithMethodOf<TApi, 'delete'>,
    TBody extends RequestBodyOf<TApi, TPath, 'delete'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'delete', TBody> = {}) {
    return this.#request('delete', path, payload);
  }

  get<
    TPath extends PathWithMethodOf<TApi, 'get'>,
    TBody extends RequestBodyOf<TApi, TPath, 'get'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'get', TBody> = {}) {
    return this.#request('get', path, payload);
  }

  head<
    TPath extends PathWithMethodOf<TApi, 'head'>,
    TBody extends RequestBodyOf<TApi, TPath, 'head'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'head', TBody> = {}) {
    return this.#request('head', path, payload);
  }

  options<
    TPath extends PathWithMethodOf<TApi, 'options'>,
    TBody extends RequestBodyOf<TApi, TPath, 'options'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'options', TBody> = {}) {
    return this.#request('options', path, payload);
  }

  patch<
    TPath extends PathWithMethodOf<TApi, 'patch'>,
    TBody extends RequestBodyOf<TApi, TPath, 'patch'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'patch', TBody> = {}) {
    return this.#request('patch', path, payload);
  }

  post<
    TPath extends PathWithMethodOf<TApi, 'post'>,
    TBody extends RequestBodyOf<TApi, TPath, 'post'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'post', TBody> = {}) {
    return this.#request('post', path, payload);
  }

  put<
    TPath extends PathWithMethodOf<TApi, 'put'>,
    TBody extends RequestBodyOf<TApi, TPath, 'put'>,
  >(path: TPath, payload: RequestPayload<TApi, TPath, 'put', TBody> = {}) {
    return this.#request('put', path, payload);
  }
}
