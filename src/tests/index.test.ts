import { Router } from '@robinblomberg/safe-express';
import { deepStrictEqual, rejects, strictEqual } from 'assert';
import express from 'express';
import qs from 'qs';
import { z } from 'zod';
import { RequestError, SafeProxy } from '..';

type Api = {
  '/api/v1/health': HealthApi;
};

type HealthApi = typeof healthApi;

const companyRequestSchema = z.strictObject({
  companies: z.strictObject({
    employees: z.array(
      z.strictObject({
        email: z.string().email(),
        name: z.string().nonempty(),
        projects: z.array(
          z.strictObject({
            createdAt: z.date(),
            title: z.string().nonempty(),
          }),
        ),
      }),
    ),
    name: z.string().nonempty(),
  }),
});

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
  '/echo': {
    post: {
      responseBody: companyRequestSchema,
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

healthRouter.post('/echo', (req, res) => {
  const data: any = qs.parse(req.query);
  res.json(data);
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

  // Test queries:
  {
    const query = {
      company: {
        employees: [
          {
            email: 'frank@example.com',
            name: 'Frank',
            projects: [
              {
                createdAt: new Date('2021-12-03T09:58:55.483Z'),
                title: 'Untitled Project',
              },
            ],
          },
        ],
        name: "Frank's Company",
      },
    };

    const response = await proxy.request('post', '/api/v1/health/echo', {
      query,
    });

    deepStrictEqual(query, response.body);
  }

  // eslint-disable-next-line no-console
  console.log('All tests passed.');
});
