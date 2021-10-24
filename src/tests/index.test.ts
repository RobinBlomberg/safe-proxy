import { Router } from '@robinblomberg/safe-express';
import { strictEqual } from 'assert';
import express from 'express';
import { z } from 'zod';
import { SafeProxy } from '..';

type Api = {
  '/api/v1/health': HealthApi;
};

type HealthApi = typeof healthApi;

const healthApi = {
  '/': {
    get: {
      responseBody: z.string(),
    },
  },
};

const app = express();

const healthRouter = new Router<HealthApi>(healthApi);

healthRouter.get('/', (req, res) => {
  res.json('Hello world!');
});

app.use('/api/v1/health', healthRouter.router);

app.listen(3000);

(async () => {
  const proxy = new SafeProxy<Api>('http://localhost:3000');

  const response = await proxy.request('get', '/api/v1/health');

  strictEqual(response.body, 'Hello world!');
  strictEqual(response.headers.connection, 'close');
  strictEqual(response.headers['content-length'], '14');
  strictEqual(
    response.headers['content-type'],
    'application/json; charset=utf-8',
  );
  strictEqual(response.headers.etag, 'W/"e-nkbG/vEV8ab/vH4HRSEWq+7z/MU"');
  strictEqual(response.headers['x-powered-by'], 'Express');
  strictEqual(response.ok, true);
  strictEqual(response.redirected, false);
  strictEqual(response.status, 200);
  strictEqual(response.statusText, 'OK');
  strictEqual(response.url, 'http://localhost:3000/api/v1/health');

  // eslint-disable-next-line no-console
  console.log('All tests passed.');
})();
