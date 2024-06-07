# request-lit

Small Promise based HTTP client using the browser's native [Fetch API][fetch],
which is [supported in all modern browsers](https://caniuse.com/#feat=fetch)
and polyfilled by most tools including Next.js or Create React App.

## Install

```bash
$ npm install request-lit
```

## Example

### GET request

```js
import { request } from 'request-lit';

(async () => {
	const res = await request.get('https://jsonplaceholder.typicode.com/todos/1');
	const data = await res.json();

	console.log(data);
	// => { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
})();
```

### POST request

```js
import { request } from 'request-lit';

(async () => {
	await request.post('https://jsonplaceholder.typicode.com/todos', {
		json: { userId: 1, title: 'delectus aut autem', completed: false },
	});
})();
```

### Error handling

If the server responds with an error status code, the promise will be rejected
with a `ResponseError` instance. The `ResponseError` instance has a `response`
property that contains the response object.

```js
import { request, ResponseError } from 'request-lit';

(async () => {
	try {
		const res = await request.get(
			'https://jsonplaceholder.typicode.com/todos/1',
		);
		const todo = await res.json();
	} catch (err) {
		if (err instanceof ResponseError) {
			switch (err.response.status) {
				case 400:
					/* Handle */ break;
				case 401:
					/* Handle */ break;
				case 404:
					/* Handle */ break;
				case 500:
					/* Handle */ break;
				default:
					/* Handle */ break;
			}
		}

		throw new Error('Unknown fetch error');
	}
})();
```

## API

The API is similar to the native `fetch` API, with some minor differences.<br>
Consult the native [fetch documentation](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
for more information.

The differences are:

- If you pass a `json` key in the `options` object, it will be stringified and
  set as the request body. In addition the `Content-Type` header will be set to
  `application/json`. See the [POST request example](#post-request) above.
- If you pass a `validateStatus` function in the `options` object, it will be
  used to determine if the status code is considered valid.

## Request Method Alias

This library also provides pre-bound method aliases:

- `request.get(resource, options?)`
- `request.post(resource, options?)`
- `request.put(resource, options?)`
- `request.patch(resource, options?)`
- `request.delete(resource, options?)`
- `request.options(resource, options?)`

## Development

[1] Install dependencies

```bash
$ npm install
```

[2] Validate setup

```bash
$ ./Taskfile.sh validate
```

[3] Start development by running tests in watch-mode

```bash
$ ./Taskfile.sh test -w
```

---

```

## License

[MIT](./LICENSE)
```
