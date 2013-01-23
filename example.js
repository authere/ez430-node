"use strict";
var Accelerometer = require('./').Accelerometer;

var acc = new Accelerometer({freeFallDetection: true});

acc.on('freefall', function () {
  console.error('freefall');
  acc.close();
});
acc.on('error', function (err) {
  console.error('error', err);
});
acc.on('close', function (err) {
  console.error('close', err);
});

