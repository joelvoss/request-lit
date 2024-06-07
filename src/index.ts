/**
 * isPlainObject checks if a value is a plain object.
 */
function isPlainObject(value: unknown) {
	return value?.constructor === Object;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * ResponseError is an error type that includes the response object.
 */
export class ResponseError extends Error {
	response: Response;

	constructor(message: string, res: Response) {
		super(message);
		this.response = res;
	}
}

////////////////////////////////////////////////////////////////////////////////

interface ExtendedRequestInit extends RequestInit {
	json?: Record<string, unknown>;
	validateStatus?: (status: number) => boolean;
}

/**
 * request is a wrapper around fetch that serializes JSON bodies and throws an
 * error on non-2xx responses.
 */
export async function request(
	input: RequestInfo | URL,
	_init?: ExtendedRequestInit,
) {
	let { validateStatus, json, ...init } = _init || {};

	// NOTE(joel): If the body is an object or an array, we are able to serialize
	// it as JSON. If it's something else, it's up to the user to serialize it.
	if (json) {
		if (Array.isArray(json) || isPlainObject(json)) {
			// Create a new options object serializing the body and ensuring we
			// have a content-type header
			init = {
				...init,
				body: JSON.stringify(json),
				headers: {
					'Content-Type': 'application/json',
					...init.headers,
				},
			};
		}
	}

	// If the method is a string and is lowercased, convert it to uppercase
	if (init?.method) {
		init.method = init.method.toUpperCase();
	}

	const res = await fetch(input, init);

	const ok =
		typeof validateStatus == 'function' ? validateStatus(res.status) : res.ok;
	if (!ok) {
		throw new ResponseError('Bad fetch response', res);
	}
	return res;
}

////////////////////////////////////////////////////////////////////////////////

request.get = (input: RequestInfo | URL, init?: ExtendedRequestInit) => {
	return request(input, { ...init, method: 'GET' });
};

request.post = (input: RequestInfo | URL, init?: ExtendedRequestInit) => {
	return request(input, { ...init, method: 'POST' });
};

request.put = (input: RequestInfo | URL, init?: ExtendedRequestInit) => {
	return request(input, { ...init, method: 'PUT' });
};

request.patch = (input: RequestInfo | URL, init?: ExtendedRequestInit) => {
	return request(input, { ...init, method: 'PATCH' });
};

request.delete = (input: RequestInfo | URL, init?: ExtendedRequestInit) => {
	return request(input, { ...init, method: 'DELETE' });
};

request.options = (input: RequestInfo | URL, init?: ExtendedRequestInit) => {
	return request(input, { ...init, method: 'OPTIONS' });
};
