import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { ResponseError, request } from '../src/index';

describe('request', () => {
	const server = setupServer(
		// Describe the requests to mock.
		http.get('http://mocked-server/text', () => {
			return new HttpResponse('some example content');
		}),
		http.get('http://mocked-server/json', () => {
			return HttpResponse.json({ message: 'some example content' });
		}),
		http.post('http://mocked-server/json', async ({ request }) => {
			const body = await request.json();
			return HttpResponse.json({ message: body });
		}),
		http.get('http://mocked-server/404', () => {
			return new HttpResponse('Not found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});
		}),
		http.all('http://mocked-server/all', async ({ request }) => {
			const method = request.method;
			if (method === 'GET' || method === 'DELETE' || method === 'OPTIONS') {
				return new HttpResponse(`method: ${method}`);
			}
			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
				const body = await request.json();
				return HttpResponse.json({ method, body });
			}

			const body = await request.json();
			return new HttpResponse(
				`method: ${method}, body: ${JSON.stringify(body)}`,
			);
		}),
		http.get('http://foo/bar', () => {
			return new HttpResponse('some example content');
		}),
	);

	beforeAll(() => {
		server.listen();
	});

	afterAll(() => {
		server.close();
	});

	describe('request', () => {
		test('should serialize JSON bodies', async () => {
			const req = request('http://mocked-server/json', {
				method: 'POST',
				json: { hello: 'world' },
			});
			const res = await (await req).json();
			expect(res).toEqual({ message: { hello: 'world' } });
		});

		test('should convert method to uppercase', async () => {
			const oldFetch = global.fetch;
			global.fetch = vi.fn(() => Promise.resolve(new Response()));
			request('http://mocked-server/text', {
				method: 'get',
			});
			expect(global.fetch).toHaveBeenCalledWith('http://mocked-server/text', {
				method: 'GET',
			});
			global.fetch = oldFetch;
		});

		test('should throw for non-2xx responses', async () => {
			try {
				await request('http://mocked-server/404');
			} catch (err) {
				expect(err).toBeInstanceOf(ResponseError);
				expect(err.response).toBeInstanceOf(Response);
				expect(err.response.status).toEqual(404);
			}
		});
	});

	describe('request methods', () => {
		test('get', async () => {
			const req = request.get('http://mocked-server/all');
			const res = await (await req).text();
			expect(res).toEqual('method: GET');
		});

		test('post', async () => {
			const req = request.post('http://mocked-server/all', {
				json: { hello: 'world' },
			});
			const res = await (await req).json();
			expect(res).toEqual({ method: 'POST', body: { hello: 'world' } });
		});

		test('put', async () => {
			const req = request.put('http://mocked-server/all', {
				json: { hello: 'world' },
			});
			const res = await (await req).json();
			expect(res).toEqual({ method: 'PUT', body: { hello: 'world' } });
		});

		test('patch', async () => {
			const req = request.patch('http://mocked-server/all', {
				json: { hello: 'world' },
			});
			const res = await (await req).json();
			expect(res).toEqual({ method: 'PATCH', body: { hello: 'world' } });
		});

		test('delete', async () => {
			const req = request.delete('http://mocked-server/all');
			const res = await (await req).text();
			expect(res).toEqual('method: DELETE');
		});

		test('options', async () => {
			const req = request.options('http://mocked-server/all');
			const res = await (await req).text();
			expect(res).toEqual('method: OPTIONS');
		});
	});

	describe('AbortController', () => {
		test('abort', async () => {
			const controller = new AbortController();
			const req = request('http://mocked-server/text', {
				signal: controller.signal,
			});
			controller.abort();
			await expect(req).rejects.toThrow('This operation was aborted');
		});
	});

	describe('options', () => {
		test('validateStatus', async () => {
			try {
				await request.get('http://mocked-server/text', {
					validateStatus: () => false,
				});
			} catch (err) {
				expect(err).toBeInstanceOf(ResponseError);
				expect(err.message).toEqual('Bad fetch response');
			}
		});
	});
});
