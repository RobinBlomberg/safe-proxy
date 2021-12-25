import { ESON } from '@robinblomberg/eson';
import { RouterSchema } from '@robinblomberg/safe-express';
import fetch from 'isomorphic-unfetch';
import { PathOf, PathWithMethodOf } from '.';
import { RequestError } from './request-error';
import {
  MethodOf,
  RequestBodyOf,
  RequestPayload,
  ResponseBodyOf,
} from './types';

export class SafeProxy<TApi extends RouterSchema> {
  readonly #baseUrl: string;

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl;
  }

  #parseResponseBody(contentType: string, text: string) {
    const mediaType = contentType.slice(0, contentType.indexOf(';'));
    switch (mediaType) {
      case 'application/javascript':
      case 'text/javascript':
        return ESON.parse(text);
      case 'application/json':
      case 'text/json':
        return JSON.parse(text);
      default:
        return text;
    }
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
      requestInit.body = ESON.stringify(payload.body);
      headers['Content-Type'] = 'application/javascript';
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
      url += `?${encodeURIComponent(ESON.stringify(payload.query))}`;
    }

    const response = await fetch(url, requestInit);
    const responseText = await response.text();

    const contentType = response.headers.get('Content-Type');
    const responseBody = this.#parseResponseBody(
      contentType ?? '',
      responseText,
    );

    if (!response.ok) {
      const code =
        responseBody instanceof Object ? responseBody.code : '' ?? '';
      const message =
        responseBody instanceof Object ? responseBody.message : '' ?? code;
      throw new RequestError(code, message, responseBody);
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
