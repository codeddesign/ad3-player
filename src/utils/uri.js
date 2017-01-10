/**
 * Returns file name.
 *
 * Note: Condition is that the last piece of the path contains a 'dot'.
 *
 * @param {String} path
 *
 * @return {String} [description]
 */
let path_file_name = (path) => {
    const name = path.split('/').pop();

    if (name.includes('.')) {
        return name;
    }

    return '';
}

/**
 * Transforms link's query to object in format: "key: value".
 *
 * @param {String} query
 *
 * @return {Object}
 */
let query_to_object = (query) => {
    const data = {};

    query = query.replace('?', '').split('&');

    query.forEach((pair) => {
        if (!pair.length) return false;

        pair = pair.split('=');
        data[pair[0]] = pair[1];
    });

    return data;
}

/**
 * Transforms given object to a link query.
 *
 * @param {Object} obj
 *
 * @return {String}
 */
export const object_to_query = (obj) => {
    const inline = [];

    Object.keys(obj).forEach((key) => {
        inline.push(`${key}=${obj[key]}`);
    });

    if (!inline.length) {
        return '';
    }

    return inline.join('&');
}

/**
 * Returns information about a link.
 *
 * @param {String} path
 *
 * @return {Object}
 */
export const parse_uri = (path) => {
    const virtual = document.createElement('a');

    virtual.href = path;

    const base = `${virtual.protocol}//${virtual.host}`,
        simple = `${base}${virtual.pathname}`,
        complete = `${simple}${virtual.search}${virtual.hash}`,
        file_name = path_file_name(complete),
        domain = base.replace(/https?:\/\//, ''),
        data = query_to_object(virtual.search);

    return {
        virtual,
        base,
        simple,
        complete,
        file_name,
        domain,
        data
    };
};

/**
 * Decodes html entities of an URI.
 *
 * @param {String} uri
 *
 * @return {String}
 */
export const decode_uri = (uri) => {
    const virtual = document.createElement('textarea');

    virtual.innerHTML = uri;

    return virtual.value;
};

/**
 * Current referrer information.
 *
 * @return {Object}
 */
export const referrer = (() => {
    return parse_uri(location.href);
})();
