/* jshint unused: false, expr: true */
/* global beforeEach, describe, it */
"use strict";

var util = require('util'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    proxyquire = require('proxyquire');

chai.should();
chai.use(sinonChai);

var setStub,
    expressProxy,
    res,
    cacheControl,
    header;


beforeEach(function() {
  header = 'header was not set';

  setStub = sinon.spy(function(name, value) {
    header = value;
  });

  expressProxy = {
    response: {
      set: setStub
    },
    '@noCallThru': true
  };

  cacheControl = proxyquire('../', {
    'express': expressProxy,
  });

  res = expressProxy.response;

  res.cacheControl = 
    res.cacheControl.bind(res);
});

function withargs() {
  res.cacheControl.apply(res, arguments);
  expect(setStub, 'header was never set').to.have.been.calledOnce;
  return { header: header };
}

describe('cacheControl', function() {
  it('should add `cacheControl` function to response prototype', function() {
    res.should.respondTo('cacheControl');
  });
  
  it('should not change `cacheControl` function if it exists already', function() {
    var func = function() {};

    res.cacheControl = func;

    res.cacheControl.should.equal(func);
  });

  it('should set proper Cache-Control header name', function() {
    res.cacheControl('1m');

    setStub.should.have.been.calledWith('Cache-Control', sinon.match.any);
  });

  it('should not set header with no directive', function() {
    res.cacheControl();

    setStub.should.not.have.been.called;
  });

  describe('with single object parameter', function() {
    it('should convert public:true to public header', function() {
      withargs({ public: true }).header.should.contain('public');
    });

    it('should convert private:true to private header', function() {
      withargs({ private: true }).header.should.contain('private');
    });

    it('should convert noTransform:true to no-transform header', function() {
      withargs({ noTransform: true }).header.should.contain('no-transform');
    });

    it('should convert mustRevalidate:true to must-revalidate header', function() {
      withargs({ mustRevalidate: true }).header.should.contain('must-revalidate');
    });

    it('should convert proxyRevalidate:true to proxy-revalidate header', function() {
      withargs({ proxyRevalidate: true }).header.should.contain('proxy-revalidate');
    });

    it('should add no-cache when no-store is set', function() {
      withargs({ noStore: true }).header.should.contain('no-cache');
    });

    it('should not add no-cache when no-store is set if noCache is set explicity false', function() {
      withargs({ noStore: true, noCache: false }).header.should.not.contain('no-cache');
    });

    it('should not set or throw on unknown directive', function() {
      withargs({ public: true, unknown: true, whatisthis: '300' }).header.should.equal('public');
    });

    it('should not set header with all falsy directives', function() {
      res.cacheControl({ private: false, public: false, noTransform: false });

      setStub.should.not.have.been.called;
    });

    it('should not set header with no directives', function() {
      res.cacheControl({ });

      setStub.should.not.have.been.called;
    });
  });

  describe('with optional field directives', function() {
    it('should set private token value', function() {
      withargs({ private: 'X-Private' }).header.should.contain('private="X-Private"');
    });

    it('should set private token array value', function() {
      withargs({ private: ['X-Private', 'X-Private-2']})
        .header.should.contain('private="X-Private, X-Private-2"');
    });

    it('should set no-cache token value', function() {
      withargs({ noCache: 'X-Uncached' }).header.should.contain('no-cache="X-Uncached"');
    });

    it('should set no-cache token array value', function() {
      withargs({ noCache: ['X-Uncached', 'X-Uncached-2']})
        .header.should.contain('no-cache="X-Uncached, X-Uncached-2"');
    });

    it('should throw on no-string token', function() {
      expect(function() {
        withargs({ private: 100 });
      }).to.throw(/Invalid value `100` for the private field directive/);
    });

    it('should throw on invalid token in array', function() {
      expect(function() {
        withargs({ private: ['X-Valid', 100] });
      }).to.throw(/Invalid value `100` for the private field directive/);
    });

    it('should throw on malformed string token', function() {
      expect(function() {
        withargs({ private: 'So invalid' });
      }).to.throw(/Invalid token "So invalid" for the private field directive/);
    });
  });

  describe('with mutually exlusive directives', function() {
    it('should throw with public and private', function() {
      expect(function() {
        withargs({ public: true, private: true });
      }).to.throw(/The public, private:true, and no-cache:true\/no-store directives are exclusive, you cannot define more than one of them/);
    });

    it('should throw with public and noCache', function() {
      expect(function() {
        withargs({ public: true, noCache: true });
      }).to.throw(/The public, private:true, and no-cache:true\/no-store directives are exclusive, you cannot define more than one of them/);
    });

    it('should throw with private and noCache', function() {
      expect(function() {
        withargs({ private: true, noCache: true });
      }).to.throw(/The public, private:true, and no-cache:true\/no-store directives are exclusive, you cannot define more than one of them/);
    });

    it('should throw with public and noStore', function() {
      expect(function() {
        withargs({ public: true, noStore: true });
      }).to.throw(/The public, private:true, and no-cache:true\/no-store directives are exclusive, you cannot define more than one of them/);
    });

    it('should throw with private and noStore', function() {
      expect(function() {
        withargs({ private: true, noStore: true });
      }).to.throw(/The public, private:true, and no-cache:true\/no-store directives are exclusive, you cannot define more than one of them/);
    });
  });

  describe('with maxAge', function() {
    it('should convert maxAge number to public max-age header', function() {
      withargs({ maxAge: 100 }).header.should.contain('max-age=100');
    });

    it('should convert maxAge time string to public max-age header', function() {
      withargs({ maxAge: '1m' }).header.should.contain('max-age=60');
    });

    it('should add public directive by default with max-age', function() {
      withargs({ maxAge: '1m' }).header.should.contain('public');
    });

    it('should be able to set public directive with max-age', function() {
      withargs({ maxAge: 100, public: true })
        .header.should.contain('public')
        .and.contain('max-age=100');
    });

    it('should be able to set private directive with max-age', function() {
      withargs({ maxAge: 100, private: true })
        .header.should.contain('private')
        .and.contain('max-age=100');
    });

    it('should be able to set no-cache directive with max-age', function() {
      withargs({ maxAge: 100, noCache: true })
        .header.should.contain('no-cache')
        .and.contain('max-age=100');
    });

    it('should be able to set no-store directive with max-age', function() {
      withargs({ maxAge: 100, noStore: true })
        .header.should.contain('no-store')
        .and.contain('max-age=100');
    });

    it('should throw on maxAge:"unknown"', function() {
      expect(function() {
        withargs({ maxAge: 'unknown' });
      }).to.throw(/Invalid value `unknown` for the max-age delta directive/);
    });
  });

  describe('with sMaxAge', function() {
    it('should convert sMaxage number to s-maxage header ', function() {
      withargs({ sMaxage: 100 }).header.should.contain('s-maxage=100');
    });

    it('should convert sMaxAge time string to s-maxage header ', function() {
      withargs({ sMaxAge: '1m'}).header.should.contain('s-maxage=60');
    });

    it('should throw on sMaxAge:"unknown"', function() {
      expect(function() {
        withargs({ sMaxAge: 'unknown' });
      }).to.throw(/Invalid value `unknown` for the s-maxage delta directive/);
    });

    it('should not set s-maxage if private is set', function() {
      withargs({ sMaxAge: 100, private: true }).header.should.not.contain('s-maxage');
    });

    it('should not set s-maxage if no-cache is set', function() {
      withargs({ sMaxAge: 100, noCache: true }).header.should.not.contain('s-maxage');
    });

    it('should not set s-maxage if no-store is set', function() {
      withargs({ sMaxAge: 100, noStore: true }).header.should.not.contain('s-maxage');
    });
  });

  describe('with single string or number parameter', function() {
    it('should convert a time string to a public max-age header', function() {
      withargs('1m').header.should.equal('public, max-age=60');
    });

    it('should convert a number to a public max-age header', function() {
      withargs(300).header.should.equal('public, max-age=300');
    });

    it('should convert "public" to public header', function() {
      withargs('public').header.should.equal('public');
    });

    it('should convert "private" to private header', function() {
      withargs('private').header.should.equal('private');
    });

    it('should convert "no-cache" to no-cache header', function() {
      withargs('no-cache').header.should.equal('no-cache');
    });

    it('should convert "no-store" to no-store header', function() {
      withargs('no-store').header.should.contain('no-store');
    });

    it('should throw on "unknown"', function() {
      expect(function() {
        withargs('unknown');
      }).to.throw(/Invalid value `unknown` for the max-age delta directive/);
    });

    it('should not set header with empty directive', function() {
      res.cacheControl('');

      setStub.should.not.have.been.called;
    });
  });

  describe('when chained', function() {
    it('should return the response object for chaining', function() {
      res.cacheControl('public', { maxAge: '1m' }).should.equal(res);
    });
  });

  describe('when middleware', function() {
    it('should return middleware function', function() {
      cacheControl('public').should.be.a.function;
    });

    it('should call `res.cacheControl` with args then `next`', function() {
      res.cacheControl = sinon.stub();
      var next = sinon.stub();
      var objArg = { maxAge: '1d' };

      cacheControl('public', objArg)(null, res, next);

      res.cacheControl.should.have.been.calledWith('public', objArg);

      next.should.have.been.calledOnce;
      next.should.have.been.calledWith();
      next.should.have.been.calledAfter(res.cacheControl);
    });
  });
});
