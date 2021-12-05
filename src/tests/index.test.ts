import { Router } from '@robinblomberg/safe-express';
import { deepStrictEqual, rejects, strictEqual } from 'assert';
import express from 'express';
import { z } from 'zod';
import { RequestError, SafeProxy } from '..';

const companyRequestSchema = z.strictObject({
  company: z.strictObject({
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

const api = {
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
    get: {
      query: companyRequestSchema,
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
  '/post/:postId/comment/:commentId': {
    get: {
      params: {
        commentId: z.number(),
        postId: z.string(),
      },
      responseBody: z.strictObject({
        commentId: z.number(),
        postId: z.string(),
      }),
    },
  },
};

const app = express();

const router = new Router(api);

router.post('/', (req, res) => {
  res.json({
    date1: '2021-12-03T09:58:55.483Z',
    date2: new Date(1638525535483),
    message: `Hello ${req.body.name}!`,
    nonDate1: '1638525535483',
    nonDate2: 'December 17, 1995 03:24:00',
  });
});

router.get('/echo', (req, res) => {
  res.json(req.query);
});

router.get('/error/with-code', (req, res) => {
  res.status(400).json({
    code: 'custom_error_code',
  });
});

router.get('/error/without-code', (req, res) => {
  res.status(400).json(null);
});

router.get('/post/:postId/comment/:commentId', (req, res) => {
  res.json({
    commentId: req.params.commentId,
    postId: req.params.postId,
  });
});

app.use('/api/v1/health', router.router);

app.listen(3030, async () => {
  const proxy = new SafeProxy<typeof api>(
    'http://localhost:3030/api/v1/health',
  );

  // Test success responses:
  {
    const response = await proxy.post('/', {
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
    strictEqual(response.url, 'http://localhost:3030/api/v1/health/');
  }

  // Test error responses:
  {
    void rejects(
      () => {
        return proxy.get('/error/with-code');
      },
      new RequestError('custom_error_code', {
        code: 'custom_error_code',
      }),
    );

    void rejects(() => {
      return proxy.get('/error/without-code');
    }, new RequestError('', null));
  }

  // Test params:
  {
    const response = await proxy.get('/post/:postId/comment/:commentId', {
      params: {
        commentId: 13,
        postId: '5',
      },
    });

    deepStrictEqual(response.body, {
      commentId: 13,
      postId: '5',
    });
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

    const response = await proxy.get('/echo', { query });

    deepStrictEqual(query, response.body);
  }

  console.info('All tests passed.');
});
