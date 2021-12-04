import { ApiSchema } from '@robinblomberg/safe-express';
import fetch from 'isomorphic-unfetch';
import JSON5 from 'json5';
import { MethodOf, PathOf, RequestBodyOf, ResponseBodyOf } from '.';
import { RequestError } from './request-error';
import { RequestPayload } from './types';

/**
 * Naïve but simple date regex.
 * Will also match incorrect dates such as 2021-19-39T29:69:99.123Z.
 */
const DATE_REGEX =
  /^[0-9]{4}-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-6][0-9]:[0-9]{2}\.[0-9]{3}Z$/;

export type ErrorResponseBody = {
  code: string;
};

export class SafeProxy<TApi extends ApiSchema> {
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

  async request<
    TPath extends PathOf<TApi>,
    TMethod extends MethodOf<TApi, TPath>,
    TBody extends RequestBodyOf<TApi, TPath, TMethod>,
  >(method: TMethod, path: TPath, payload: RequestPayload<TBody> = {}) {
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
}
