# express-ip-blacklist

[![NPM](https://nodei.co/npm/@outofsync/express-ip-blacklist.png?downloads=true)](https://nodei.co/npm/@outofsync/express-ip-blacklist/)

![Version](http://img.shields.io/npm/v/@outofsync/express-ip-blacklist.svg)
![Downloads](http://img.shields.io/npm/dt/@outofsync/express-ip-blacklist.svg)
[![Build and Test Master](https://github.com/OutOfSyncStudios/express-ip-blacklist/actions/workflows/build-master.yml/badge.svg)](https://github.com/OutOfSyncStudios/express-ip-blacklist/actions/workflows/build-master.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/00d912396e12481bafa5136f1378622e)](https://www.codacy.com/gh/OutOfSyncStudios/express-ip-blacklist/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=OutOfSyncStudios/express-ip-blacklist&amp;utm_campaign=Badge_Grade)
[![Codacy Coverage Badge](https://app.codacy.com/project/badge/Coverage/00d912396e12481bafa5136f1378622e)](https://www.codacy.com/gh/OutOfSyncStudios/express-ip-blacklist/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=OutOfSyncStudios/express-ip-blacklist&amp;utm_campaign=Badge_Coverage)
[![Dependencies](https://david-dm.org/OutOfSyncStudios/express-ip-blacklist/status.svg)](https://david-dm.org/OutOfSyncStudios/express-ip-blacklist)

`express-ip-blacklist` is a cache-based, automated IP blacklisting processor for use with [`expressJS`](https://www.npmjs.com/package/express). It caches a store of IP addresses that are used to make bad requests and then temporarily blocks all requests from those sources once a specified threshold of bad requests has been exceeded.

By default, the blacklist uses 250 attempts in a refreshing, 60-minute window. This means that if 250 bad requests are made, then 59 minutes and 59 seconds elapse, and then a 251st bad request is made, that the expiration of the blacklist will start at the moment of the 251st bad request.

If there are any unexpected errors during the cache retrieval process, then the blacklist checking process handles the error, writes a warning to the logger, and then handls the request as normal.

By default, any blacklisted ip will be sent an empty 403 response with HTTP Header `Retry-After` set to the number of seconds that must be waited.

# [Installation](#installation)
<a name="installation"></a>

```shell
npm install @outofsync/express-ip-blacklist
```

# [Usage](#usage)
<a name="usage"></a>

```js
const IPBlacklist = require('@outofsync/express-ip-blacklist');
ipBlacklist = new IPBlacklist('blacklist');

// Later in expressJS
app.use(ipBlacklist.checkBlacklist);

// Later still in the 404 handler or any other controller
app.use(ipBlacklist.increment);
```

# [API Reference](#api)
<a name="api"></a>

## constructor(cacheNamespace [, config] [, cache] [, log])
Create a new IP Blacklist client with the passed `cacheNamespace`, [`config`](#config-object), [`cache`](#cache-object), and [`log`](#logging-object).  A `cacheNamespace` is required to scope the IP Blacklist from other values which may be in use within the cache.

## checkBlacklist(req, res, next)
An express handler to check the current request against the blacklist. It is recommended that the handlers is attached early in the Express app stack.

```js
  app.use(ipBlacklist.checkBlacklist);
```

## increment(req, res [, next])
Increments the current cache using the lookups and IP. This should be added to the Express app stack whenever you handle a "bad request".

It may be called inline with an HTTPRequest and HTTPResponse parameter. For example:

```js
  handleBlacklist(req, res, next) {
    ipBlacklist.increment(req, res);
    next();
  }

  app.use(handleBlacklist);
```

Or, it may be used directly as an Express handler:
```js
  app.use(ipBlacklist.increment);
```

# [Appendix](#appendix)
<a name="appendix"></a>

## [Configuration Object](#config-object)
<a name="config-object"></a>

The configuration parameter expects and object that contains the following (with defaults provided below):
```js
{
  lookup: [],
  count: 250, // 250 request
  expire: 3600000 // every 60 minute window (in mSec)
  whitelist: () => {
    return false;
  },
  onBlacklist: null,
  noip: false
}
```

|parameter|type|description|
|---------|----|-----------|
|**`lookup`**|Function(req) &#x27fe; Array or Array| This is either a function which accepts an HTTPRequest parameter that returns an array, or an array. The array is then used to provide additional scoping criteria for the cache key to the blacklist. For example, if you wanted Blacklist based on API Key in addition to the IP Address, then you would create a function that returns an array with the API key as an element to include in the blacklist lookup. This array of values is then used by concatenateing all of the values with `:` between them together to form the cache lookup key. The IP Address is always appended to the cache key scope criteria unless `noip` is set to `true`.|
|**`count`**|Integer|The number of allowed bad request to be performed, based on the IP and lookup criteria, before blacklisting occurs.|
|**`expire`**|Integer|Number of milliseconds required befor the refreshing blacklist time period expires. When an additional attempt is made during the blacklist period, the timer is reset and client must wait the entire duration again.|
|**`whitelist`**|Function(req) &#x27fe; Boolean or Array|A function which accepts a HTTPRequest parameter and returns a boolean value or an Array of IP Addresses. When a function is set, it should return a boolean value to indicate whether the request is whitelisted. When an array is set, then the current IP address of the request is compared against all values in the array and is whitelisted if the array includes the current IP. **Note**: The `x-forwarded-for` Header is used instead of the physical IP address when it is included in the request.|
|**`onBlacklist`**|Function(req, res, next) or `null`|A function accepting a HTTPRequest, a HTTPResponse, and a closure(`next`) parameter. When a request tests true for being blacklisted, then this function is called blacklisting occurs. If the function is unset, then the IP Blacklist sends an HTTPResponse with a 403 Status Code, an empty body, and the `Retry-After` HTTP Header with the number of seconds that the client must wait before trying again. |
|**`noip`**|Boolean|Indicates that the IP Address from the HTTP Request should not be automatically added to the lookup scope. Without additional `lookup` criteria, this will cause all bad requests to check against the blacklist.|

## [Cache Object](#cache-object)
<a name="cache-object"></a>
The Cache object can be an active and [promisified Redis](https://www.npmjs.com/package/redis#promises) connect, or an active [Memory Cache](https://www.npmjs.com/package/@outofsync/memory-cache) connection, or an active [Object Key Cache](https://www.npmjs.com/package/@outofsync/object-key-cache). If no value is set, then IP Blacklist will create an internal Object Key Cache and use it.

## [Logging Object](#logging-object)
<a name="logging-object"></a>
The Logging object is an instance of any logging library, such as [Winston](https://www.npmjs.com/package/winston) or [Bunyan](https://www.npmjs.com/package/bunyan), which support the `.error(...)`, `.info(...)`, `.debug(...)`, and `.log(...)` methods. If this is not provided, then any debug or error messages are sent to `/dev/null` through the use of [`LogStub`](https://www.npmjs.com/package/logstub).


## [License](#license)
<a name="license"></a>

Copyright (c) 2018-2019 Jay Reardon
Copyright (c) 2019-2021 Out of Sync Studios LLC -- Licensed under the MIT license.
