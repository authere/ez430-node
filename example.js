"use strict";
var Accelerometer = require('./').Accelerometer,
  acc;

try {
  acc = new Accelerometer({freeFallDetection: true});
} catch (e) {
  console.error('error', e);
  process.exit(1);
}

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

