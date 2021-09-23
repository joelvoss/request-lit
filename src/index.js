import { deepMerge } from './deep-merge';

////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef Options
 * @prop {string} url
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
 * makeRequest
 * @param {string} url
 * @param {Options} [options={}]
 */
export function request(url, options = {}) {
	if (typeof url !== 'string') {
		options = url;
		url = options.url;
	}

	options = {
		method: 'get',
		fetch,
		responseType: 'text',
		...options,
	};

	// NOTE(joel): Make sure HTTP methods are uppercased
	options.method = options.method.toUpperCase();

	let response = { config: options };
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
		headers: deepMerge(options.headers, customHeaders, true),
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
 * get
 * @param {string} url
 * @param {Options} config
 */
request.get = (url, config) =>
	request(url, {
		...config,
		method: 'get',
	});

/**
 * delete
 * @param {string} url
 * @param {Options} config
 */
request.delete = (url, config) =>
	request(url, {
		...config,
		method: 'delete',
	});

/**
 * head
 * @param {string} url
 * @param {Options} config
 */
request.head = (url, config) =>
	request(url, {
		...config,
		method: 'head',
	});

/**
 * options
 * @param {string} url
 * @param {Options} config
 */
request.options = (url, config) =>
	request(url, {
		...config,
		method: 'options',
	});

/**
 * post
 * @param {string} url
 * @param {Object} data
 * @param {Options} config
 */
request.post = (url, data, config) =>
	request(url, {
		...config,
		data,
		method: 'post',
	});

/**
 * put
 * @param {string} url
 * @param {Object} data
 * @param {Options} config
 */
request.put = (url, data, config) =>
	request(url, {
		...config,
		data,
		method: 'put',
	});

/**
 * patch
 * @param {string} url
 * @param {Object} data
 * @param {Options} config
 */
request.patch = (url, data, config) =>
	request(url, {
		...config,
		data,
		method: 'patch',
	});

request.CancelToken =
	typeof AbortController == 'function' ? AbortController : Object;
