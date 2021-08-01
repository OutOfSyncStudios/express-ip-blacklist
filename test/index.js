// test/index.js

// Dependancies
const assign = require('lodash.assign');
const lolex = require('lolex');
const chai = require('chai');
const expect = chai.expect;
const IPBlacklist = require('..');

const req = { headers: {}, connection: { remoteAddress: '127.0.0.1' } };

const res = {
  _status: 0,
  _message: '',
  _headers: {},
  status: function(status) {
    this._status = status;
  },
  send: function(data) {
    this._message = data;
  },
  set: function(key, value) {
    if (!this._headers) {
      this._headers = {};
    }
    this._headers[key] = value;
  }
};

describe('IPBlacklist', () => {
  let clock;
  let ipBlacklist;
  before(() => {
    ipBlacklist = new IPBlacklist('test', { count: 1, expire: 10 });
    clock = lolex.install();
  });

  it('constructor', () => {
    expect(ipBlacklist).to.be.instanceof(IPBlacklist);
  });

  it('calcLookups', () => {
    const looks = ipBlacklist.calcLookups(req, res);
    expect(looks).to.have.string(req.connection.remoteAddress);
  });

  it('calcLookups (noip)', () => {
    ipBlacklist.config.noip = true;
    const looks = ipBlacklist.calcLookups(req, res);
    expect(looks).to.not.have.string(req.connection.remoteAddress);
    ipBlacklist.config.noip = false;
  });

  it('checkWhitelist (function) default', () => {
    const test = ipBlacklist.checkWhitelist(req);
    expect(test).to.be.equal(false);
  });

  it('checkWhitelist (function) good', () => {
    ipBlacklist.config.whitelist = (_req) => {
      return _req.connection.remoteAddress === '127.0.0.1';
    };
    const test = ipBlacklist.checkWhitelist(req);
    expect(test).to.be.equal(true);
  });

  it('checkWhitelist (array) good', () => {
    ipBlacklist.config.whitelist = ['127.0.0.1'];
    const test = ipBlacklist.checkWhitelist(req);
    expect(test).to.be.equal(true);
  });

  it('checkWhitelist (array) bad', () => {
    ipBlacklist.config.whitelist = [];
    const test = ipBlacklist.checkWhitelist(req);
    expect(test).to.be.equal(false);
  });

  it('checkWhitelist (other)', () => {
    ipBlacklist.config.whitelist = 12345;
    const test = ipBlacklist.checkWhitelist(req);
    expect(test).to.be.equal(false);
  });

  it('increment', (done) => {
    ipBlacklist.increment(req, res, null, () => {
      const val = JSON.parse(ipBlacklist.cache.cache.cache.test.value['ipblacklist:127.0.0.1']);
      expect(val.remaining).to.be.equal(0);
      done();
    });
  }).timeout(5000);

  it('checkBlacklist', (done) => {
    const newRes = assign(res);
    ipBlacklist.checkBlacklist(req, newRes, (err) => {
      expect(newRes._status).to.be.equal(0);
      expect(newRes._message).to.be.equal('');
      done(err);
    });
  });

  it('checkBlacklist blacklisted', (done) => {
    ipBlacklist.config.onBlacklist = (_req, _res, _next) => {
      _res.status(403);
      _res.send(null);
      _next();
    };
    ipBlacklist.increment(req, res, null, () => {
      const newRes = assign(res);
      ipBlacklist.checkBlacklist(req, newRes, (err) => {
        expect(newRes._status).to.be.equal(403);
        expect(newRes._message).to.be.equal(null);
        done(err);
      });
    });
  });

  it('checkBlacklist blacklist expired', (done) => {
    clock.tick(10000);
    const newRes = assign(res);
    newRes._status = 0;
    newRes._message = '';
    ipBlacklist.checkBlacklist(req, newRes, (err) => {
      expect(newRes._status).to.be.equal(0);
      expect(newRes._message).to.be.equal('');
      done(err);
    });
  });

  it('increment after blacklist expire', (done) => {
    ipBlacklist.increment(req, res, null, () => {
      const val = JSON.parse(ipBlacklist.cache.cache.cache.test.value['ipblacklist:127.0.0.1']);
      expect(val.remaining).to.be.equal(0);
      done();
    });
  }).timeout(5000);
});
