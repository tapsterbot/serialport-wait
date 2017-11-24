'use strict';

var serialport_wait = require('./index.js');
var serialport = new serialport_wait();

serialport.connect('COM3', 9600);

console.log('serialport.isOpen:', serialport.isOpen());

serialport.sendln();
serialport.wait('User', 60);
if (serialport.get_wait_result()) {
    serialport.sendln('admin');
    serialport.wait('Password');
    if (serialport.get_wait_result()) {
        serialport.sendln();
        serialport.wait('>');
        serialport.sendln('quit');
    }
}

console.log('=== all buffer start ===');
console.log(serialport.get_buffer_all());
console.log('=== all buffer end ===');

serialport.close();
