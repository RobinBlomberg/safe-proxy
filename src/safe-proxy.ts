import { ApiSchema } from '@robinblomberg/safe-express';
import fetch from 'isomorphic-unfetch';
import { MethodOf, PathOf, RequestBodyOf } from '.';
import { RequestError } from './request-error';
import { RequestPayload, ResponseBodyOf } from './types';

export class SafeProxy<TApi extends ApiSchema> {
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

    if (payload.body !== undefined) {
      requestInit.body = JSON.stringify(payload.body);
      headers['Content-Type'] = 'application/json';
    }

    if (payload.credentials) {
      requestInit.credentials = 'include';
    }

    const response = await fetch(`${this.#baseUrl}${path}`, requestInit);

    if (!response.ok) {
      const errorDto = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw new RequestError(errorDto.code);
    }

    const body: ResponseBodyOf<TApi, TPath, TMethod> = await response.json();

    return {
      body,
      headers: Object.fromEntries(response.headers.entries()),
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    };
  }
}
