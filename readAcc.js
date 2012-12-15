"use strict";
var serialport = require("serialport"),
  SerialPort = serialport.SerialPort, // localize object constructor
  osType = require('os').type(); 

var startAccessPoint = new Buffer([0xff, 0x7, 0x03]),
  stopAccessPoint = new Buffer([0xff, 0x9, 0x03]),
  accDataRequest = new Buffer([0xFF, 0x08, 0x07, 0x00, 0x00, 0x00, 0x00]),
  deviceName;

if (osType === 'Linux') {
  deviceName = '/dev/ttyACM0';
} else if (osType === 'Darwin') {
  deviceName = '/dev/tty.usbmodem001';
}

var sp = new SerialPort(deviceName, { 
  baudRate: 115200,
});

console.log("start ap..", startAccessPoint);
sp.write(startAccessPoint);

function requestData() {
  //console.log("writing..", accDataRequest);
  sp.write(accDataRequest);
}

setTimeout(requestData, 100);

sp.on("data", function (data) {
  var x, y, z, on;
  var buf = new Buffer(data);
  if (data.length >= 7) {
    x = buf.readInt8(5);
    y = buf.readInt8(4);
    z = buf.readInt8(6);
    on = (buf[3] === 1);
    if (on) {
      console.log("x:" + x + " y:" + y + " z:" + z);
    }
  }
  requestData();
});

sp.on('close', function (err) {
  console.log('port closed');
});

sp.on('error', function (err) {
  console.error("error", err);
});

process.on('uncaughtException', function (err) {
  console.error('[uncaughtException] ' + err.stack);
  setTimeout(function () {
    process.exit(1);
  }, 500);
});
process.on('exit', function (err) {
  console.error('Got SIGTERM');
  process.exit(0);
});
