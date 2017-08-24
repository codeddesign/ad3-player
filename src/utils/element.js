const CSS_CLASSES = {
    hidden: 'hidden',
    none: 'none'
};

/**
 * Minimal jQuery-like custom class.
 */
export class Element {
    constructor(node) {
        if (typeof node == 'string') {
            node = (new Element(document).find(node)).node;
        }

        this.node = node || document;

        return this;
    }

    addAssets(assets = []) {
        const promises = [];

        const head = this.find('head');

        assets.forEach((asset) => {
            const promise = new Promise((resolve, reject) => {
                asset.events = {
                    onload() {
                        resolve(asset.name);
                    }
                }

                const asset_source = (asset.attributes['href']) ? 'href' : 'src',
                    selector = `${asset.tag}[${asset_source}="${asset.attributes[asset_source]}"]`;

                if (!head.find(selector, false)) {
                    head.append(asset.tag, asset.attributes, asset.events);

                    return this;
                }

                resolve();
            });

            promises.push(promise);
        });

        Promise.all(promises)
            .then((names) => {})
            .catch((e) => {});

        return new Promise((resolve, reject) => {
            resolve()
        });
    }

    find(selector, hasWarning = true) {
        const found = this.node.querySelector(selector);

        if (!found) {
            if (hasWarning) {
                console.warn('Failed to find: ' + selector);
            }

            return false;
        }

        return new Element(found);
    }

    findId(id) {
        return this.find('#' + id);
    }

    findAll(selector) {
        const els = this.node.querySelectorAll(selector);
        let list = [],
            i;

        for (i = 0; i < els.length; i++) {
            list.push(new Element(els[i]));
        }

        return list;
    }

    data(key = false, value = false) {
        if (key === false) {
            return this.node.dataset;
        }

        if (value === false) {
            return this.node.dataset[key];
        }

        this.node.dataset[key] = value;

        return this;
    }

    html(content = false) {
        if (content === false) {
            return this.node.innerHTML;
        }

        this.node.innerHTML = content.trim();

        return new Element(this.node.firstChild);
    }

    htmlOuter() {
        return this.node.outerHTML.trim();
    }

    css(property, value) {
        this.node.style[property] = value;

        return this;
    }

    hasClass(_class) {
        return this.classes().contains(_class);
    }

    addClass(_class, delayed = false) {
        if (delayed) {
            this._delayed(() => {
                this.addClass(_class);
            });

            return this;
        }

        _class.split(' ').forEach((_class) => {
            _class = _class.trim();
            if (_class.length && !this.hasClass(_class)) {
                this.classes().add(_class);
            }
        })

        return this;
    }

    removeClass(_class, delayed = false) {
        if (delayed) {
            this._delayed(() => {
                this.removeClass(_class);
            });

            return this;
        }

        _class.split(' ').forEach((_class) => {
            _class = _class.trim();
            if (_class.length && this.hasClass(_class)) {
                this.classes().remove(_class);
            }
        })

        return this;
    }

    classes() {
        return this.node.classList;
    }

    toggleClasses(first, second) {
        let temp;

        if (this.hasClass(first)) {
            temp = first;
            first = second;
            second = temp;
        }

        this.addClass(first);
        this.removeClass(second);

        return this;
    }

    attr(name, value = false) {
        if (value === false) {
            return this.node.getAttribute(name);
        }

        this.node.setAttribute(name, value);

        return this;
    }

    attrRemove(name) {
        this.node.removeAttribute(name);

        return this;
    }

    remove() {
        this.parent().node.removeChild(this.node);

        return this;
    }

    parent() {
        return new Element(this.node.parentNode);
    }

    style(key, value, metric = false) {
        if (value === null) {
            this.node.style[key] = value;

            return this;
        }

        metric = (metric === true) ? 'px' : (!metric) ? '' : metric;

        this.node.style[key] = `${value}${metric}`;

        return this;
    }

    create(tag, properties = {}, events = {}) {
        let virtual = document.createElement(tag);

        Object.keys(properties).forEach((key) => {
            if (key.includes('data')) {
                Object.keys(properties[key]).forEach((_key) => {
                    virtual.dataset[_key] = properties[key][_key];
                });

                return false;
            }

            virtual[key] = properties[key];
        });

        Object.keys(events).forEach((key) => {
            virtual[key] = () => {
                events[key].apply(virtual)
            };
        });

        return virtual;
    }

    append(tag, properties, events) {
        let virtual = this.create(tag, properties, events);

        this.node.appendChild(virtual);

        return new Element(virtual);
    }

    after(tag, properties, events, remove = false) {
        let virtual = this.create(tag, properties, events);

        this.parent().node.insertBefore(virtual, this.node.nextSibling);

        if (remove) {
            this.remove();
        }

        return new Element(virtual);
    }

    replace(tag, properties, events) {
        return this.after(tag, properties, events, true);
    }

    replaceHtml(content) {
        let virtual = this.create('div'),
            fresh;

        virtual.innerHTML = content.trim();

        this.parent().node.insertBefore(virtual.firstChild, this.node.nextSibling);

        fresh = this.node.nextSibling;

        this.node.remove();

        return new Element(fresh);
    }

    select() {
        this.node.select();

        return this;
    }

    bounds() {
        return this.node.getBoundingClientRect();
    }

    /**
     * Returns how much of the element's height
     * is in view as percentage (0-100)
     *
     * @return {Object}
     */
    visible() {
        const bounds = this.bounds(),
            height = this.data().height || this.size().height;

        let percentage = 0;

        if (bounds.top <= 0 && Math.abs(bounds.top) <= height) {
            percentage = 100 - Math.abs(bounds.top) * 100 / height;
        }

        if (bounds.top > 0 && (window.innerHeight - bounds.top) > 0) {
            percentage = (window.innerHeight - bounds.top) * 100 / height;
            if (percentage > 100) {
                percentage = 100;
            }
        }

        return Math.round(percentage);
    }

    sizeAsData(_size = false) {
        _size = _size || this.size();

        this.data('width', _size.width);
        this.data('height', _size.height);

        return this;
    }

    offset() {
        return {
            left: this.node.offsetLeft,
            right: this.node.offsetRight
        };
    }

    size(size = false) {
        if (size) {
            Object.keys(size).forEach((key) => {
                this.style(key, size[key], true);
            });
        }

        return {
            width: this.node.offsetWidth,
            height: this.node.offsetHeight
        };
    }

    sub(evName, callback, once = false) {
        const f = (ev) => {
            callback.call(this, ev, this)

            if (once) {
                this.node.removeEventListener(evName, f);
            }
        };

        this.node.addEventListener(evName, f);

        return this;
    }

    pub(evName, data = {}) {
        const event = new CustomEvent(evName, { detail: data });

        this.node.dispatchEvent(event);

        return this;
    }

    show(noneToo = false) {
        this.removeClass(CSS_CLASSES.hidden);

        if (noneToo) {
            this.removeClass(CSS_CLASSES.none);
        }

        return this;
    }

    hide(noneToo = false) {
        this.addClass(CSS_CLASSES.hidden);

        if (noneToo) {
            this.addClass(CSS_CLASSES.none);
        }

        return this;
    }

    _delayed(callback) {
        setTimeout(callback, 10);

        return this;
    }
}

export default (node) => new Element(node);
