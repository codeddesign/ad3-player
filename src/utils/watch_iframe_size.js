/**
 * Watch iframe's body height and width.
 *
 * $source - iframe's document
 * $target - iframe element
 * callback - gets called after size becomes unchanged
 * settings:
 *  - delay - interval's delay in mls that checks for changes
 *  - waitFor - number of seconds that the interval runs.
 *
 * @param {DOMElement} $source
 * @param {DOMElement} $target
 * @param {function} callback
 * @param {Object} settings
 */
export default ($source, $target, callback = () => {}, settings = { delay: 100, waitFor: 10 }) => {
    const _current = { width: 0, height: 0 };

    let _waitFor = 0;
    const interval = setInterval(() => {
        if (!$source || !$source.body) {
            return false;
        }

        const _size = {
            width: $source.body.scrollWidth,
            height: $source.body.scrollHeight
        };

        if ($target.style.width) {
            _size.width = parseInt($target.style.width);
        }

        if ($target.style.height) {
            _size.height = parseInt($target.style.height);
        }

        if (_current.width != _size.width || _current.height != _size.height) {
            _current.width = _size.width;
            _current.height = _size.height;

            $target.setAttribute('width', _current.width);
            $target.setAttribute('height', _current.height);

            return false;
        }

        _waitFor += settings.delay;

        callback(_current);

        if (_waitFor >= settings.waitFor * 1000) {
            clearInterval(interval);

            callback(_current);
        }
    }, settings.delay);
};
