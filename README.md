# express-cache-controlfreak

  [![NPM version](https://badge.fury.io/js/express-cache-controlfreak.svg)](http://badge.fury.io/js/express-cache-controlfreak)
  [![Build Status](https://travis-ci.org/prodatakey/express-cache-controlfreak.svg)](https://travis-ci.org/prodatakey/express-cache-controlfreak)
  [![Coverage Status](https://coveralls.io/repos/prodatakey/express-cache-controlfreak/badge.png)](https://coveralls.io/r/prodatakey/express-cache-controlfreak)
  [![dependencies](https://david-dm.org/prodatakey/express-cache-controlfreak/status.svg)](https://david-dm.org/prodatakey/express-cache-controlfreak)
  [![devDependencies](https://david-dm.org/prodatakey/express-cache-controlfreak/dev-status.svg)](https://david-dm.org/prodatakey/express-cache-controlfreak#info=devDependencies)
  [![peerDependencies](https://david-dm.org/prodatakey/express-cache-controlfreak/peer-status.svg)](https://david-dm.org/prodatakey/express-cache-controlfreak#info=peerDependencies)

Middleware for ExpressJS that defines a `cacheControl` method to set `Cache-Control` headers.

This middleware doesn't define legacy Expires headers. For compatibility with old HTTP/1.0 agents combine it with [express-legacy-expires](https://github.com/dantman/express-legacy-expires).

## Install

```bash
$ npm install express-cache-controlfreak
```

## Usage

```js
var cacheControl = require('express-cache-controlfreak');
```

### As Middleware

The function can be used as middleware to set cache control headers in your handler chains.

```js
// Set max age header for this route with the get verb
app.get('/', cacheControl({ maxAge: 300 }), function(req, res, next) {
    res.status(200).json({ success: true })
});
```

This means you can also easily set app-wide cache-control settings.

```js
// Set default no-cache header for the whole app
app.use(cacheControl('no-cache'));
```

### Chained

The headers can also be set with the chainable `cacheControl` function that is added to the response object.

```js
app.get('/', function(req, res, next) {
	res.cacheControl({maxAge: 300})
	   .status(200)
       .json({ success: true });
});
```

### res.cacheControl([pattern], [options])

The method added by the module accepts an optional string pattern and an object of Cache-Control options. Both are optional but at least one of them should be specified.

See the [HTTP/1.1 Standard's Cache-Control sections](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9) for information on the usage of Cache-Control directives.

#### Patterns

String patterns are defined for simple directives so you can simply write `res.cacheControl("public");` instead of having to always write `res.cacheControl({'public': true});`. Properties can be combined with options `res.cacheControl("public", {mustRevalidate: true});`.

##### "public"

```js
res.cacheControl("public");
// Cache-Control: public
```

##### "private"

```js
res.cacheControl("private");
// Cache-Control: private
```

##### "no-cache"

```js
res.cacheControl("no-cache");
// Cache-Control: no-cache
```

##### "no-store"

```js
res.cacheControl("no-store");
// Cache-Control: no-cache, no-store
```

##### Time Strings and Numbers

The max-age header can be set quickly in a similar manner, using a time string or explicit number. By default, the public directive is also added.

```js
res.cacheControl("1h");
// Cache-Control: public, max-age=3600
```

```js
res.cacheControl(60);
// Cache-Control: public, max-age=60
```

#### Time Strings

Simple time strings can be used for setting the `max-age` and `s-maxage` directives.
See the [ms](https://www.npmjs.org/package/ms) library, which is used to parse the time string, for the syntax.
This is the same library and syntax used by the express [sendFile](http://expressjs.com/api.html#res.sendFile) function.

#### Options

Each Cache-Control response directive defined in HTTP/1.1 has an option that can be defined.
  - Options for directives that use a delta time accept a number as a value.
  - Options that optionally accept field names accept `true` for the normal non-field directive and for the with field-name directive accept either a string or an array of strings for the field names.
  - The remaining directives that don't have a value simply accept a truthy value.

The public, private, no-cache, and no-store directives are exclusive only one may be specified. With the exception that no-cache and no-store may be defined together.

##### public:

```js
res.cacheControl({'public': true});
// Cache-Control: public
```

##### private:

```js
res.cacheControl({'private': true});
// Cache-Control: private
```

```js
res.cacheControl({'private': "X-Private"});
// Cache-Control: private="X-Private"
```

```js
res.cacheControl({'private': ["X-Private-1", "X-Private-2"]});
// Cache-Control: private="X-Private-1, X-Private-2"
```

##### no-cache:

```js
res.cacheControl({'no-cache': true});
res.cacheControl({noCache: true});
// Cache-Control: no-cache
```

```js
res.cacheControl({noCache: "X-Uncached"});
// Cache-Control: no-cache="X-Uncached"
```

```js
res.cacheControl({noCache: ["X-Uncached-1", "X-Uncached-2"]});
// Cache-Control: no-cache="X-Uncached-1, X-Uncached-2"
```

##### no-store:

```js
res.cacheControl({'no-store': true});
res.cacheControl({noStore: true});
// Cache-Control: no-cache, no-store
```

  - `no-store` also implies `no-cache` because some browsers have begone treating no-cache the same way they treat no-store.

##### max-age:

```js
res.cacheControl({'max-age': 300});
res.cacheControl({maxAge: 300});
// Cache-Control: public, max-age=300
```

  - `max-age` implies public if none of private, no-cache, or no-store is defined, so you can define it alone.

##### s-maxage:

```js
res.cacheControl({'s-maxage': 300});
res.cacheControl({sMaxage: 300});
res.cacheControl({sMaxAge: 300});
// Cache-Control: public, s-maxage=300
```

  - `s-maxage` supports `sMaxAge` in addition to the standard camel-case conversion `sMaxage` due to the potential confusion of the `max-age` to `maxAge` conversion.

##### must-revalidate:

```js
res.cacheControl({'must-revalidate': true});
res.cacheControl({mustRevalidate: true});
// Cache-Control: must-revalidate
```

##### proxy-revalidate:

```js
res.cacheControl({'proxy-revalidate': true});
res.cacheControl({proxyRevalidate: true});
// Cache-Control: proxy-revalidate
```

##### no-transform:

```js
res.cacheControl({noTransform: true});
res.cacheControl({'no-transform': true});
// Cache-Control: no-transform
```

## License

[MIT](LICENSE)
