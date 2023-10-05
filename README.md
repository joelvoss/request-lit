# request-lit

Small Promise based HTTP client using the browser's native [Fetch API][fetch],
which is [supported in all modern browsers](https://caniuse.com/#feat=fetch)
and polyfilled by most tools including Next.js or Create React App.

## Install

```bash
# Using npm
$ npm install request-lit

# Using yarn
$ yarn add request-lit
```

## Example

### GET request

```js
import { request } from 'request-lit';

(async () => {
  const response = await request.get('https://jsonplaceholder.typicode.com/todos/1');

  console.log(response);
  /* {
    ok: true,
    statusText: 'OK',
    data: { userId: 1, id: 1, title: 'delectus aut autem', completed: false }
    ...
  } */
})();
```

### POST request

```js
import { request } from 'request-lit';

(async () => {
   const response = await request.post('https://jsonplaceholder.typicode.com/todos', {
    userId: 1, title: 'delectus aut autem', completed: false
  });
})();
```

## API

### `request(url, config?)`

#### `url`

Type: `string`

The target URL of the request.

#### `config?`

Type: `Object`

The optional request configuration.

```js
{
  // `auth` sets the `Authorization` header with the given value
  auth: 'Bearer eyJhbGc...iOiJIUzI',

  // `baseURL` will be prepended to `url` unless `url` is absolute.
  baseURL: 'https://some-domain.com/api/',
  
  // `csrf` sets the `X-XSRF-TOKEN` header with the given value
  csrf: 'xrUE1n...hgAF80',

  // `data` is the data to be sent as the request body
  // Only applicable for request methods 'PUT', 'POST', 'DELETE , and 'PATCH'
  // Must be of one of the following types:
  // - string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
  // - Browser only: FormData, File, Blob
  // - Node only: Stream, Buffer
  data: {
    firstName: 'Fred'
  },

  // `fetch` is an optional fetch implementation. 
  // (e.g. https://www.npmjs.com/package/isomorphic-fetch)
  fetch: require('isomorphic-fetch').fetch,

  // `headers` are custom headers to be sent
  headers: {'X-Requested-With': 'XMLHttpRequest'},

  // `method` is the request method to be used when making the request
  method: 'get', // default

  // `params` are the URL parameters to be sent with the request
  // Must be a plain object or a URLSearchParams object
  params: {
    ID: 12345
  },

  // `paramsSerializer` is an optional function in charge of serializing
  // `params` (e.g. https://www.npmjs.com/package/qs,
  //  http://api.jquery.com/jquery.param/)
  paramsSerializer: function (params) {
    return Qs.stringify(params, {arrayFormat: 'brackets'})
  },

  // `responseType` indicates the type of data that the server will respond
  // with. Options are: 'arraybuffer', 'document', 'json', 'text', 'stream'
  // Browser only: 'blob'
  responseType: 'text', // default

  // `url` is the server URL that will be used for the request
  url: '/user',

  // `validateStatus` defines whether to resolve or reject the promise for a
  // given HTTP response status code. If `validateStatus` returns `true`
  // (or is set to `null` or `undefined`), the promise will be resolved;
  // otherwise, the promise will be rejected.
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },

  // `withCredentials` indicates whether or not cross-site Access-Control
  // requests should be made using credentials.
  withCredentials: false, // default
}
```

## Request Method Alias

This library also provides pre-bound method aliases.

- `request.get(url, config?)`
- `request.delete(url, config?)`
- `request.head(url, config?)`
- `request.options(url, config?)`
- `request.post(url, data?, config?)`
- `request.put(url, data?, config?)`
- `request.patch(url, data?, config?)`

## Development

[1] Install dependencies

```bash
# Using npm
$ npm install

# Using yarn
$ yarn
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

This project was bootstrapped with [@jvdx/core](https://github.com/joelvoss/jvdx-core).

[node+npm]: https://nodejs.org
[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch