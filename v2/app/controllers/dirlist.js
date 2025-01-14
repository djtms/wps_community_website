var config = require('../../config');
var C = require('continue.js');
var fs = require('fs');
var async = require('async');
var execFile = require('child_process').execFile;
var filesize = require('filesize');

var cache = {};

// do not use buildin sha1, it's sync
var sha1 = function(fpath, mtime, done) {
  if (cache[fpath] && cache[fpath].mtime.getTime() === mtime.getTime()) {
    done(null, cache[fpath].sha1);
    return;
  }
  execFile('/usr/bin/sha1sum', [fpath], function(err, stdout, stderr) {
    if (err) {
      done(err);
    } else {
      var sha1 = stdout.split(' ')[0];
      cache[fpath] = {fpath: fpath, mtime: mtime, sha1: sha1};
      done(null, sha1);
    }
  });
};

exports.index = function(req, res) {
  var root = config.root.v1;
  var path = (root + req.url).replace(/\/$/, '');

  C().then(function(c) {
    fs.stat(path, c.assign(null, 'stats'));
  }).then(function(c, err) {
    if (err) {
      // passby if not exists, or throw
      if (err.code === 'ENOENT') {
        next();
        c.break();
      } else {
        throw err;
      }
    }
    if (this.stats.isFile()) {
      res.sendFile(path);
      c.break();
    } else {
      fs.readdir(path, c.assign('err', 'files'));
    }
  }).then(function(c) {
    var i = this.files.indexOf('README.md');
    if (i !== -1) {
      this.files.splice(i, 1); // hide README.md
      res.marked(path + '/README.md', c.assign('marked'));
    } else {
      c();
    }
  }).then(function(c) {
    async.map(this.files, function(fname, done) {
      fs.stat(path + '/' + fname, done);
    }, c.assign('err', 'files_stats'));
  }).then(function(c) {
    async.map(this.files, function(fname, done) {
      var i = c.ctx.files.indexOf(fname);
      if (c.ctx.files_stats[i].isDirectory()) {
        done(null, '-');
      } else {
        sha1(path + '/' + fname, c.ctx.files_stats[i].mtime, done);
      }
    }, c.assign('err', 'files_sha1'));
  }).then(function(c) {
    var fileInfos = [];
    var files = this.files;
    var files_stats = this.files_stats;
    for (var i = 0; i < this.files.length; ++i) {
      var info = {
        name: files[i],
        isDir: files_stats[i].isDirectory(),
        size: files_stats[i].isDirectory() ? '-' : filesize(files_stats[i].size),
        mtime: files_stats[i].mtime,
        sha1: this.files_sha1[i]
      };
      fileInfos.push(info);
    }
    this.fileInfos = fileInfos;
    this.title = req.url;
    this.levels = req.url.replace(/^\/|\/$/g, '').split('/');
    if (this.levels.length > 1) {
      fileInfos.unshift({
        name: '..',
        isDir: true,
        size: '-',
        mtime: '-',
        sha1: '-'
      });
    }
    res.render('listdir/index.jade', this);
  }).end();
};
