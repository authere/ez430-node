'use strict';

var serialport = require('serialport'),
  SerialPort = serialport.SerialPort, // localize object constructor
  events = require('events'),
  fs = require('fs'),
  util = require('util'),
  logger = require('log4js').getLogger('ez430'),
  osType = require('os').type(); 

var startAccessPoint = new Buffer([0xff, 0x7, 0x03]),
  stopAccessPoint = new Buffer([0xff, 0x9, 0x03]),
  accDataRequest = new Buffer([0xFF, 0x08, 0x07, 0x00, 0x00, 0x00, 0x00]),
  devicePath;

var POLL_INTERVAL = 5000,
  FREE_FALL_THRESHOLD = 90,
  FREE_FALL_IGNORE_DURATION = 3000; //in ms

if (osType === 'Linux') {
  devicePath = '/dev/ttyACM1'; // temp fix
} else if (osType === 'Darwin') {
  devicePath = '/dev/tty.usbmodem001';
}

/*
319ms : free falling time from the height of 50cm.
h = 0.5 // height 0.5m
g = 9.8 // 9.8m/s^2
t = Math.sqrt(2*h/g);
*/
function Accelerometer(options) {
  var sp,
    self = this;

  options = options || {};
  events.EventEmitter.call(this);

  try {
    fs.statSync(devicePath);
  } catch (e) {
    throw new Error('device not found');
  }
  sp = new SerialPort(devicePath, {
    baudRate: 115200,
  });

  this.close = function () {
    sp.close();
  };

  sp.on('open', function () {
    logger.info('start ap..', startAccessPoint);

    sp.write(startAccessPoint);
    sp.write(accDataRequest);

    sp.on('data', function (data) {
      var x, y, z, on,
        timeout = 0,
        buf = new Buffer(data);
      if (data.length >= 7) {
        x = buf.readInt8(5);
        y = buf.readInt8(4);
        z = buf.readInt8(6);
        on = (buf[3] === 1);
        if (on) {
          if (options.freeFallDetection) {
          //logger.debug('x:' + x + ' y:' + y + ' z:' + z);
            if (Math.abs(x) > FREE_FALL_THRESHOLD && Math.abs(y) > FREE_FALL_THRESHOLD && 
              Math.abs(z) > FREE_FALL_THRESHOLD) {
                logger.debug('freefall: ' + ' x:' + x + ' y:' + y + ' z:' + z);
                self.emit('freefall');
                timeout = FREE_FALL_IGNORE_DURATION;
            } else {
              timeout = 0;
            }
          }
        } else {
          timeout = POLL_INTERVAL;
        }
      } else {
        //logger.debug((new Date()).getTime() + ' invalid data', buf);
      }
      if (timeout > 0) {
        setTimeout(function () {sp.write(accDataRequest);}, timeout);
      } else {
        sp.write(accDataRequest);
      }
    });
    sp.on('close', function (err) {
      logger.info('port closed');
      self.emit('close');
    });
    sp.on('error', function (err) {
      logger.error('error', err);
      self.emit('error', err);
    });
  });
}

util.inherits(Accelerometer, events.EventEmitter);
exports.Accelerometer = Accelerometer;
