var config = require('../../config');

var VERSION_DIR = config.root.repo + '/data/versions/';

var glob = require('glob');
var C = require('continue.js');
var async = require('async');
var jsyaml = require('js-yaml');
var fs = require('fs');

var cache;

var readYamlFile = function(fpath, done) {
  C().then(function(c) {
    fs.readFile(fpath, c.assign('$err', 'content'));
  }).then(function(c) {
    this.obj = jsyaml.load(this.content);
    c();
  }).stdend('obj', done);
};

exports.prepare = function(done) {
  C().then(function(c) {
    glob(VERSION_DIR + '**/*.yaml', c.assign('err', 'files'));
  }).then(function(c) {
    async.map(this.files, readYamlFile, c.assign('err', 'versions'));
  }).then(function(c) {
    this.versions.sort(function(a, b) {
      if (a.version < b.version) {
        return 1;
      } else if (a.version > b.version) {
        return -1;
      } else {
        return 0;
      }
    });
    cache = this.versions;
    c();
  }).end(done);
};

exports.all = function(done) {
  done(null, cache);
};
