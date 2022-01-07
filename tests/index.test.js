import fetch from 'isomorphic-fetch';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { request } from '../src/index';
import { FormData, File } from './text-utils';

describe('request', () => {
	const server = setupServer(
		// Describe the requests to mock.
		rest.get('http://mocked-server/text', (req, res, ctx) => {
			return res(ctx.body('some example content'));
		}),
		rest.get('http://mocked-server/json', (req, res, ctx) => {
			return res(ctx.json({ message: 'some example content' }));
		}),
		rest.get('http://mocked-server/404', (req, res, ctx) => {
			return res(ctx.status(404));
		}),
		rest.get('http://foo/bar', (req, res, ctx) => {
			return res(ctx.body('some example content'));
		}),
	);

	beforeAll(() => {
		server.listen();
	});

	afterAll(() => {
		server.close();
	});

	describe('basic requests', () => {
		it('should return text and a 200 status for a simple GET request', async () => {
			const req = request('http://mocked-server/text');
			expect(req).toBeInstanceOf(Promise);
			const res = await req;
			expect(res).toBeInstanceOf(Object);
			expect(res.status).toEqual(200);
			expect(res.data).toEqual('some example content');
		});

		it('should return a rejected promise for 404 responses', async () => {
			const req = request('http://mocked-server/404');
			expect(req).toBeInstanceOf(Promise);
			const spy = jest.fn();
			await req.catch(spy);
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(
				expect.objectContaining({ status: 404 }),
			);
		});

		it('should return json and a 200 status for a simple GET request', async () => {
			const req = request('http://mocked-server/json');
			expect(req).toBeInstanceOf(Promise);
			const res = await req;
			expect(res).toBeInstanceOf(Object);
			expect(res.status).toEqual(200);
			expect(res.data).toEqual({ message: 'some example content' });
		});
	});

	describe('options.responseType', () => {
		it('should parse responses as JSON by default', async () => {
			const res = await request.get('http://mocked-server/json');
			expect(res.data).toEqual({ message: 'some example content' });
		});

		it('should fall back to text for non-JSON by default', async () => {
			const res = await request.get('http://mocked-server/text');
			expect(res.data).toEqual('some example content');
		});

		it('should force JSON for responseType:json', async () => {
			const res = await request.get('http://mocked-server/json', {
				responseType: 'json',
			});
			expect(res.data).toEqual({ message: 'some example content' });
		});

		it('should fall back to undefined for failed JSON parse', async () => {
			const res = await request.get('http://mocked-server/text', {
				responseType: 'json',
			});
			expect(res.data).toEqual(undefined);
		});

		it('should still parse JSON when responseType:text', async () => {
			// this is just how axios works
			const res = await request.get('http://mocked-server/json', {
				responseType: 'text',
			});
			expect(res.data).toEqual({ message: 'some example content' });
		});
	});

	//////////////////////////////////////////////////////////////////////////////
	// options.baseURL

	describe('options.baseURL', () => {
		it('should resolve URLs relative to baseURL if provided', async () => {
			const res = await request.get('/bar', {
				baseURL: 'http://foo',
			});
			expect(res.url).toEqual('http://foo/bar');
			expect(res.status).toEqual(200);
		});

		it('should resolve baseURL for relative URIs', async () => {
			// NOTE(joel): Custom fetch mock  needed because node-fetch doesn't support
			// relative URIs.
			const oldFetch = global.fetch;
			try {
				global.fetch = jest.fn().mockReturnValue(
					Promise.resolve({
						ok: true,
						status: 200,
						text: () => Promise.resolve(''),
					}),
				);
				const req = request.get('/bar', {
					baseURL: '/foo',
				});
				expect(global.fetch).toHaveBeenCalledTimes(1);
				expect(global.fetch).toHaveBeenCalledWith(
					'/foo/bar',
					expect.objectContaining({
						method: 'GET',
						headers: {},
						body: undefined,
					}),
				);
				const res = await req;
				expect(res.status).toEqual(200);
			} finally {
				global.fetch = oldFetch;
			}
		});
	});

	describe('options.headers', () => {
		it('should merge headers case-insensitively', async () => {
			const oldFetch = global.fetch;
			try {
				global.fetch = jest.fn().mockReturnValue(
					Promise.resolve({
						ok: true,
						status: 200,
						text: () => Promise.resolve('hello'),
					}),
				);

				await request('/', { headers: { 'x-foo': '2' } });
				expect(global.fetch.mock.calls[0][1].headers).toEqual({ 'x-foo': '2' });

				global.fetch.mockClear();

				await request('/', { headers: { 'x-foo': '2', 'X-Foo': '4' } });
				expect(global.fetch.mock.calls[0][1].headers).toEqual({ 'x-foo': '4' });

				global.fetch.mockClear();

				await request('/', {
					headers: {
						'Base-Upper': 'base',
						'base-lower': 'base',
					},
				});
				expect(global.fetch.mock.calls[0][1].headers).toEqual({
					'base-upper': 'base',
					'base-lower': 'base',
				});

				global.fetch.mockClear();

				await request('/', {
					headers: {
						'base-upper': 'replaced',
						'BASE-LOWER': 'replaced',
					},
				});
				expect(global.fetch.mock.calls[0][1].headers).toEqual({
					'base-upper': 'replaced',
					'base-lower': 'replaced',
				});
			} finally {
				global.fetch = oldFetch;
			}
		});

		it('should merge headers and overwrite internal ones', async () => {
			const oldFetch = global.fetch;
			try {
				global.fetch = jest.fn().mockReturnValue(
					Promise.resolve({
						ok: true,
						status: 200,
						text: () => Promise.resolve('hello'),
					}),
				);

				// NOTE(joel): Make sure we're actually setting an internal header here.
				await request('/', { data: { some: 'data' } });
				expect(global.fetch.mock.calls[0][1].headers).toEqual({
					'content-type': 'application/json',
				});

				global.fetch.mockClear();

				await request('/', {
					data: { some: 'data' },
					headers: {
						'content-type': 'not-application/json',
					},
				});
				expect(global.fetch.mock.calls[0][1].headers).toEqual({
					'content-type': 'not-application/json',
				});
			} finally {
				global.fetch = oldFetch;
			}
		});

		it('should not set content-type for files', async () => {
			const oldFetch = global.fetch;
			try {
				global.fetch = jest.fn().mockReturnValue(
					Promise.resolve({
						ok: true,
						status: 200,
						text: () => Promise.resolve('hello'),
					}),
				);

				await request('/', { data: new File([], 'test-file') });
				expect(global.fetch.mock.calls[0][1].headers).toEqual({});
			} finally {
				global.fetch = oldFetch;
			}
		});
	});

	describe('request bodies', () => {
		let oldFetch, fetchMock;

		beforeEach(() => {
			oldFetch = global.fetch;
			fetchMock = global.fetch = jest.fn().mockReturnValue(
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve('hello'),
				}),
			);
		});

		afterEach(() => {
			global.fetch = oldFetch;
		});

		it('should issue POST requests (with JSON body)', async () => {
			const res = await request.post('http://mocked-server/post-json', {
				hello: 'world',
			});
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/post-json',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'content-type': 'application/json',
					},
					body: '{"hello":"world"}',
				}),
			);
			expect(res.status).toEqual(200);
			expect(res.data).toEqual('hello');
		});

		it('should not send JSON content-type when data contains FormData', async () => {
			const formData = new FormData();
			await request.post('http://mocked-server/post-formdata', formData);
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/post-formdata',
				expect.objectContaining({
					body: formData,
					headers: {},
				}),
			);
		});

		it('should preserve global content-type option when using FormData', async () => {
			const data = new FormData();
			data.append('hello', 'world');
			const res = await request.post(
				'http://mocked-server/post-formdata',
				data,
				{
					headers: { 'content-type': 'multipart/form-data' },
				},
			);
			expect(fetchMock).toHaveBeenCalledTimes(1);
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/post-formdata',
				expect.objectContaining({
					method: 'POST',
					headers: {
						'content-type': 'multipart/form-data',
					},
					body: data,
				}),
			);
			expect(res.status).toEqual(200);
			expect(res.data).toEqual('hello');
		});
	});

	describe('options.fetch', () => {
		it('should accept a custom fetch implementation', async () => {
			const req = request.get('http://mocked-server/json', { fetch });
			expect(req).toBeInstanceOf(Promise);
			const res = await req;
			expect(res).toBeInstanceOf(Object);
			expect(res.status).toEqual(200);
			expect(res.data).toEqual({ message: 'some example content' });
		});
	});

	describe('options.params & options.paramsSerializer', () => {
		let oldFetch, fetchMock;

		beforeEach(() => {
			oldFetch = global.fetch;
			fetchMock = global.fetch = jest.fn().mockReturnValue(
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(''),
				}),
			);
		});

		afterEach(() => {
			global.fetch = oldFetch;
		});

		it('should not serialize missing params', async () => {
			await request.get('http://mocked-server/foo');
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/foo',
				expect.any(Object),
			);
		});

		it('should serialize numeric and boolean params', async () => {
			const params = { a: 1, b: true };
			await request.get('http://mocked-server/foo', { params });
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/foo?a=1&b=true',
				expect.any(Object),
			);
		});

		it('should merge params into existing url querystring', async () => {
			const params = { a: 1, b: true };
			await request.get('http://mocked-server/foo?c=42', { params });
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/foo?c=42&a=1&b=true',
				expect.any(Object),
			);
		});

		it('should accept a URLSearchParams instance', async () => {
			const params = new URLSearchParams({ d: 'test' });
			await request.get('http://mocked-server/foo', { params });
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/foo?d=test',
				expect.any(Object),
			);
		});

		it('should accept a custom paramsSerializer function', async () => {
			const params = { a: 1, b: true };
			const paramsSerializer = params => 'e=iserializehere';
			await request.get('http://mocked-server/foo', {
				params,
				paramsSerializer,
			});
			expect(fetchMock).toHaveBeenCalledWith(
				'http://mocked-server/foo?e=iserializehere',
				expect.any(Object),
			);
		});
	});

	describe('missing request URL', () => {
		const errorMsg = `Missing required 'options.url'.`;

		it('should throw a TypeError of no request URL is present (no options)', async () => {
			try {
				await request.get(null);
			} catch (e) {
				expect(e instanceof TypeError).toBe(true);
				expect(e.message).toBe(errorMsg);
			}
		});

		it('should throw a TypeError of no request URL is given (missing options.url)', async () => {
			try {
				await request.get(null, {});
			} catch (e) {
				expect(e instanceof TypeError).toBe(true);
				expect(e.message).toBe(errorMsg);
			}
		});

		it('should throw a TypeError of no request URL is given (invalid options.url)', async () => {
			try {
				await request.get(null, { url: 1 });
			} catch (e) {
				expect(e instanceof TypeError).toBe(true);
				expect(e.message).toBe(errorMsg);
			}
		});
	});
});
