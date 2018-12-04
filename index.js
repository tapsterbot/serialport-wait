var serialport_wait = function() {
    var sleep = require('usleep').msleep
    var serialport = require('serialport');
    var port = {};
    var wait_result = false;
    var buffer = '', buffer_before = '', buffer_wait = '', buffer_all = '';
    var msec_tick = 10, wait_elapsed = 0, connection_start = 0;
    var debug = 0;

    this.list = this.listNames = async function() {
        var ports = await this.listAll();
        var names = ports.map(function(item) { return item.comName; });
        return names.sort();
    };

    this.listAll = async function() {
        var done = false;
        var list = [];
        await serialport.list(function (err, ports) {
          ports.forEach(function(port) {
            list.push(port);
          });

          done = true;
        });

        while(!done) await sleep(msec_tick);
        return list;
    };

    this.connect = async function(comport, baudrate) {
        var done = false;

        connection_start = new Date();
        port = new serialport(comport, { baudRate: baudrate }, function() {
            if (debug !== 0) console.log(port.path, 'serialport connectSync opened');
            done = true;
        });

        port.on('data', function(data) {
            if (typeof data === 'object') data = data.toString('utf8');
            buffer += data;
            buffer_wait += data;
            buffer_all += data;
        });

        port.on('error', function(error) {
            if (debug !== 0) console.log('--- serialport on error ---');
            if (debug !== 0) console.log(error);
        });

        while(!done) await sleep(msec_tick);
        return this;
    };

    this.update = async function(baudrate) {
        var done = false;

        port.update({ baudRate: baudrate }, function() {
            done = true;
        });

        while(!done) await sleep(msec_tick);
        return this;
    };

    this.close = async function() {
        var done = false;

        connection_start = 0;
        if (port.isOpen) {
            port.close(function() {
                done = true;
            });
        }

        while(!done) await sleep(msec_tick);
        return this;
    };

    this.send = async function(string) {
        if (debug !== 0) console.log(string);
        var done = false;
        string = string || '';

        port.write(string, function() {
            port.drain(function() {
                done = true;
            });
        });

        while(!done) await sleep(msec_tick);
        return this;
    };

    this.sendln = async function(string) {
        string = string || '';
        return this.send(string + '\n');
    };

    this.wait = async function(string, timeout) {
        var done = false;
        var ticks = 0, mtimeout;
        if (!string) return this;
        if (typeof timeout !== 'number') timeout = 0; /* 0 means forever */
        if (timeout < 0) timeout = 0;
        mtimeout = timeout * 1000;
        wait_elapsed = 0;

        while(!done) {
            ticks += msec_tick;
            if (buffer_wait.indexOf(string) > -1) {
                buffer_before = buffer_wait.substring(0, buffer_wait.indexOf(string) + string.length);
                buffer_wait = buffer_wait.substring(buffer_wait.indexOf(string) + string.length, buffer_wait.length);
                wait_result = true;
                done = true;
            }

            if (mtimeout < ticks && mtimeout > 0) {
                wait_result = false;
                done = true;
            }
            wait_elapsed = ticks;

            await sleep(msec_tick);
        }

        return this;
    };

    this.msleep = async function(mtimeout) {
        if (mtimeout && mtimeout > 0)
            await sleep(mtimeout);
        return this;
    };

    this.sleep = async function(timeout) {
        if (timeout && timeout > 0)
            await sleep(timeout * 1000);
        return this;
    };

    this.flushrecv = function() {
        buffer_wait = '';
        return this;
    };

    this.get_buffer = function() {
        var buf = buffer;
        buffer = '';
        return buf;
    };

    this.get_buffer_before = function() {
        return buffer_before;
    };

    this.get_buffer_wait = function() {
        return buffer_wait;
    };

    this.get_buffer_all = function() {
        return buffer_all;
    };

    this.get_wait_result = function() {
        var result = wait_result;
        /* read clear */
        wait_result = false;
        return result;
    };

    this.get_wait_elapsed = function() {
        return wait_elapsed;
    };

    this.get_connection_elapsed = function() {
        if (port.isOpen === true) {
            mseconds = new Date() - connection_start;
            return mseconds;
        }

        return 0;
    };

    this.getControlKey = function(chr) {
        if(!chr) {
            if (debug !== 0) console.error('chr must not be empty!!');
            return '';
        }

        var arr = [chr.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1];
        return new Buffer(arr);
    };

    function getKeyCode(keycode) {
        if(!keycode || keycode < 1 || keycode > 255) {
            if (debug !== 0) console.error('keycode must between 1 and 255!!');
            return '';
        }

        return new Buffer([keycode]);
    }

    this.getKeyCode = getKeyCode;

    this.keys = {
        'up': 94,
        'down': 113,
        'enter': 13,
        'esc': 27
    };

    this.isOpen = function() {
        return !!port.isOpen;
    };

    this.base = function() {
        return port;
    };

    return this;
};

module.exports = serialport_wait;
