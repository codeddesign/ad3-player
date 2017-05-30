var my_lzma = require("lzma");
var fs = require('fs');

var contents = fs.readFileSync(__dirname + '/../dist/assets/js/player.js', 'utf8');

function convert_to_formated_hex(byte_arr) {
    var hex_str = "",
        i,
        len,
        tmp_hex;

    if (!(typeof byte_arr !== 'array')) {
        return false;
    }

    len = byte_arr.length;

    for (i = 0; i < len; ++i) {
        if (byte_arr[i] < 0) {
            byte_arr[i] = byte_arr[i] + 256;
        }
        if (byte_arr[i] === undefined) {
            console.log("Boom " + i);
            byte_arr[i] = 0;
        }
        tmp_hex = byte_arr[i].toString(16);

        // Add leading zero.
        if (tmp_hex.length == 1) tmp_hex = "0" + tmp_hex;

        hex_str += tmp_hex + '';
    }

    return hex_str.trim();
}

function convert_formated_hex_to_bytes(hex_str) {
    var count = 0,
        hex_arr,
        hex_data = [],
        hex_len,
        i;

    if (hex_str.trim() == "") return [];

    /// Check for invalid hex characters.
    if (/[^0-9a-fA-F]{2}/.test(hex_str)) {
        return false;
    }

    hex_arr = hex_str.split(/([0-9a-fA-F]{2})/g);
    hex_len = hex_arr.length;

    for (i = 0; i < hex_len; ++i) {
        if (hex_arr[i].trim() == "") {
            continue;
        }

        hex_data[count++] = parseInt(hex_arr[i], 16);
    }

    return hex_data;
}

my_lzma.compress(contents, 1, function(bytes) {
    var bytes = convert_to_formated_hex(bytes);

    fs.writeFileSync(__dirname + '/packed.txt', bytes, 'utf8');

    // console.log(bytes);
    // console.log('length', bytes.length);

    // my_lzma.decompress(convert_formated_hex_to_bytes(bytes), function(r) {
    //     console.log(r)
    // });

}, function(percent) {});
