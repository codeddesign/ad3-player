import '../../node_modules/lzma/src/lzma-d.js';
import packed from '../../bin/packed.txt';

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

// Decompress LZMA packed player
LZMA.decompress(convert_formated_hex_to_bytes(packed), (d) => {
    eval(d);
});
