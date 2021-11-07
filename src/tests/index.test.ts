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
    post: {
      requestBody: z.object({
        name: z.string(),
      }),
      responseBody: z.string(),
    },
  },
};

const app = express();

const healthRouter = new Router<HealthApi>(healthApi);

healthRouter.post('/', (req, res) => {
  res.json(`Hello ${req.body.name}!`);
});

app.use('/api/v1/health', healthRouter.router);

app.listen(3030, async () => {
  const proxy = new SafeProxy<Api>('http://localhost:3030');

  const response = await proxy.request('post', '/api/v1/health', {
    body: {
      name: 'Frank',
    },
  });

  strictEqual(response.body, 'Hello Frank!');
  strictEqual(response.headers.connection, 'close');
  strictEqual(response.headers['content-length'], '14');
  strictEqual(
    response.headers['content-type'],
    'application/json; charset=utf-8',
  );
  strictEqual(response.headers.etag, 'W/"e-60g0B+XmNKqrpbDcQt0+AkLUpmU"');
  strictEqual(response.headers['x-powered-by'], 'Express');
  strictEqual(response.redirected, false);
  strictEqual(response.status, 200);
  strictEqual(response.statusText, 'OK');
  strictEqual(response.url, 'http://localhost:3030/api/v1/health');

  // eslint-disable-next-line no-console
  console.log('All tests passed.');
});
