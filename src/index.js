import { deepMerge } from './deep-merge';

////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef Headers
 * @type {{[name: string]: string}}
 */

/**
 * @typedef Options
 * @prop {string} [url]
 * @prop {'get'|'post'|'put'|'patch'|'delete'|'options'|'head'|'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS'|'HEAD'} [method='get']
 * @prop {Headers} [headers]
 * @prop {FormData|string|object} [body]
 * @prop {'text'|'json'|'stream'|'blob'|'arrayBuffer'|'formData'|'stream'} [responseType='text']
 * @prop {Record<string,any>|URLSearchParams} [params]
 * @prop {(params: Options['params']) => string} [paramsSerializer]
 * @prop {boolean} [withCredentials]
 * @prop {string} [auth]
 * @prop {string} [csrf]
 * @prop {(status: number) => boolean} [validateStatus]
 * @prop {string} [baseURL]
 * @prop {typeof window.fetch} [fetch]
 * @prop {any} [data]
 */

/**
 * @typedef Response
 * @prop {number} status
 * @prop {string} statusText
 * @prop {Options} config
 * @prop {T} data
 * @prop {Headers} headers
 * @prop {boolean} redirect
 * @prop {string} url
 * @prop {ResponseType} type
 * @prop {ReadableStream<Uint8Array> | null} body
 * @prop {boolean} bodyUsed
 * @template T
 */

/**
 * request
 * @param {string | Options} url
 * @param {Options} [options={}]
 * @returns {Promise<Response<T>>}
 * @template T
 */
export function request(url, options = {}) {
	if (typeof url !== 'string') {
		if (typeof options.url !== 'string') {
			throw new TypeError(`Missing required 'options.url'.`);
		}
		options = url;
		url = options.url;
	}

	/** @type {Options} */
	options = {
		method: 'get',
		fetch,
		responseType: 'text',
		...options,
	};

	// NOTE(joel): Make sure HTTP methods are uppercased
	options.method = options.method.toUpperCase();

	/** @type {Response<any>} */
	let response = { config: options };

	/** @type {Headers} */
	let customHeaders = {};
	let data = options.data;

	if (
		data &&
		typeof data === 'object' &&
		typeof data.append !== 'function' &&
		toString.call(data) !== '[object File]'
	) {
		data = JSON.stringify(data);
		customHeaders['content-type'] = 'application/json';
	}

	if (options.csrf) {
		customHeaders['x-xsrf-token'] = options.csrf;
	}

	if (options.auth) {
		customHeaders.authorization = options.auth;
	}

	if (options.baseURL) {
		url = url.replace(/^(?!.*\/\/)\/?(.*)$/, options.baseURL + '/$1');
	}

	if (options.params) {
		const divider = ~url.indexOf('?') ? '&' : '?';
		const query = options.paramsSerializer
			? options.paramsSerializer(options.params)
			: new URLSearchParams(options.params);
		url += divider + query;
	}

	const _fetch = options.fetch;

	return _fetch(url, {
		method: options.method,
		body: data,
		headers: deepMerge(customHeaders, options.headers, true),
		credentials: options.withCredentials ? 'include' : 'same-origin',
	}).then(res => {
		for (const i in res) {
			if (typeof res[i] != 'function') response[i] = res[i];
		}

		const ok = options.validateStatus
			? options.validateStatus(res.status)
			: res.ok;

		if (options.responseType === 'stream') {
			response.data = res.body;
			return response;
		}

		return res[options.responseType]()
			.then(parsed => {
				response.data = parsed;
				// NOTE(joel): It is okay if this fails: response.data will be the
				// unparsed value:
				response.data = JSON.parse(parsed);
			})
			.catch(Object)
			.then(() => (ok ? response : Promise.reject(response)));
	});
}

////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef BodylessMethod
 * @type {<T=any>(url: string, config?: Options) => Promise<Response<T>>}
 */

/**
 * @typedef BodyMethod
 * @type {<T=any>(url: string, body?: any, config?: Options) => Promise<Response<T>>}
 */

/** @type {BodylessMethod} */
request.get = (url, config) =>
	request(url, {
		...config,
		method: 'get',
	});

/** @type {BodylessMethod} */
request.delete = (url, config) =>
	request(url, {
		...config,
		method: 'delete',
	});

/** @type {BodylessMethod} */
request.head = (url, config) =>
	request(url, {
		...config,
		method: 'head',
	});

/** @type {BodylessMethod} */
request.options = (url, config) =>
	request(url, {
		...config,
		method: 'options',
	});

/** @type {BodyMethod} */
request.post = (url, data, config) =>
	request(url, {
		...config,
		data,
		method: 'post',
	});

/** @type {BodyMethod} */
request.put = (url, data, config) =>
	request(url, {
		...config,
		data,
		method: 'put',
	});

/** @type {BodyMethod} */
request.patch = (url, data, config) =>
	request(url, {
		...config,
		data,
		method: 'patch',
	});

/** @type {AbortController | Object} */
request.CancelToken =
	typeof AbortController == 'function' ? AbortController : Object;
