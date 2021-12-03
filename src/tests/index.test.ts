import { Router } from '@robinblomberg/safe-express';
import { deepStrictEqual, rejects, strictEqual } from 'assert';
import express from 'express';
import { z } from 'zod';
import { RequestError, SafeProxy } from '..';

type Api = {
  '/api/v1/health': HealthApi;
};

type HealthApi = typeof healthApi;

const healthApi = {
  '/': {
    post: {
      requestBody: z.strictObject({
        name: z.string(),
      }),
      responseBody: z.strictObject({
        date1: z.string(),
        date2: z.date(),
        message: z.string(),
        nonDate1: z.string(),
        nonDate2: z.string(),
      }),
    },
  },
  '/error/with-code': {
    get: {
      responseBody: z.strictObject({
        code: z.string(),
      }),
    },
  },
  '/error/without-code': {
    get: {
      responseBody: z.null(),
    },
  },
};

const app = express();

const healthRouter = new Router<HealthApi>(healthApi);

healthRouter.post('/', (req, res) => {
  res.json({
    date1: '2021-12-03T09:58:55.483Z',
    date2: new Date(1638525535483),
    message: `Hello ${req.body.name}!`,
    nonDate1: '1638525535483',
    nonDate2: 'December 17, 1995 03:24:00',
  });
});

healthRouter.get('/error/with-code', (req, res) => {
  res.status(400).json({
    code: 'SOMETHING_WENT_WRONG',
  });
});

healthRouter.get('/error/without-code', (req, res) => {
  res.status(400).json(null);
});

app.use('/api/v1/health', healthRouter.router);

app.listen(3030, async () => {
  const proxy = new SafeProxy<Api>('http://localhost:3030');

  // Test success responses:
  {
    const response = await proxy.request('post', '/api/v1/health', {
      body: {
        name: 'Frank',
      },
    });

    deepStrictEqual(response.body, {
      date1: new Date('2021-12-03T09:58:55.483Z'),
      date2: new Date('2021-12-03T09:58:55.483Z'),
      message: 'Hello Frank!',
      nonDate1: '1638525535483',
      nonDate2: 'December 17, 1995 03:24:00',
    });
    strictEqual(response.headers.connection, 'close');
    strictEqual(response.headers['content-length'], '163');
    strictEqual(
      response.headers['content-type'],
      'application/json; charset=utf-8',
    );
    strictEqual(response.headers.etag, 'W/"a3-2vi0zMGzcPS01CYE3seV9NvrEL8"');
    strictEqual(response.headers['x-powered-by'], 'Express');
    strictEqual(response.redirected, false);
    strictEqual(response.status, 200);
    strictEqual(response.statusText, 'OK');
    strictEqual(response.url, 'http://localhost:3030/api/v1/health');
  }

  // Test error responses:
  {
    void rejects(() => {
      return proxy.request('get', '/api/v1/health/error/with-code');
    }, new RequestError('SOMETHING_WENT_WRONG'));

    void rejects(() => {
      return proxy.request('get', '/api/v1/health/error/without-code');
    }, new RequestError(''));
  }

  // eslint-disable-next-line no-console
  console.log('All tests passed.');
});
