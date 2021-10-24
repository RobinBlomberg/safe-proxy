import { ApiSchema } from '@robinblomberg/safe-express';
import fetch from 'isomorphic-unfetch';
import { RequestError } from './request-error';
import { FlattenedApi, RequestPayload, ResponseBodyOf } from './types';

export class SafeProxy<TApi extends ApiSchema> {
  readonly #baseUrl: string;

  constructor(baseUrl: string) {
    this.#baseUrl = baseUrl;
  }

  async request<
    TPath extends keyof FlattenedApi<TApi>,
    TMethod extends keyof FlattenedApi<TApi>[TPath] & string,
  >(method: TMethod, path: TPath, payload: RequestPayload = {}) {
    const headers = { ...(payload.headers ?? {}) };
    const requestInit: RequestInit = {
      headers,
      method,
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
      throw new RequestError(errorDto.code);
    }

    const body: ResponseBodyOf<FlattenedApi<TApi>[TPath][TMethod]> =
      await response.json();

    return {
      body,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    };
  }
}
