export class Asset {
    constructor(info) {
        this.info = info;

        this.head = (new Element()).find('head');
    }

    attr() {
        return (this.info.attributes['href']) ? 'href' : 'src';
    }

    selector() {
        return `${this.info.tag}[${this.attr()}="${this.info.attributes[this.attr()]}"]`
    }

    exists() {
        return this.head.find(this.selector(), false)
    }

    load() {
        return new Promise((resolve, reject) => {
            const name = this.info.name;
            this.info.events = {
                onload() {
                    resolve(name);
                }
            }

            if (!this.exists()) {
                this.head.append(this.info.tag, this.info.attributes, this.info.events);

                return this;
            }

            resolve();
        });
    }
};

export class Element {
    constructor(node) {
        if (typeof node == 'string') {
            node = (new Element(document).find(node)).node;
        }

        this.node = node || document;

        return this;
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

    create(tag, properties, events) {
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

    sub(evName, callback) {
        this.node.addEventListener(evName, (ev) => {
            callback.call(this, ev, this)
        });
    }

    pub(evName, data = {}) {
        const event = new CustomEvent(evName, { detail: data });

        this.node.dispatchEvent(event);
    }
}
