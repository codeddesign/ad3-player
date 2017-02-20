class Scrolling {
    constructor() {
        this.last = false;

        this.direction = 'down';

        this.last = window.pageYOffset;

        document.addEventListener('scroll', () => {
            this.direction = (window.pageYOffset < this.last) ? 'up' : 'down';

            this.last = window.pageYOffset;
        });
    }

    /**
     * @return {Boolean}
     */
    up() {
        return this.direction == 'up';
    }

    /**
     * @return {Boolean}
     */
    down() {
        return this.direction == 'down';
    }
}

export default (() => {
    return new Scrolling;
})();
