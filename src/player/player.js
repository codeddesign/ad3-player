import Macro from './macro';
import Tracker from './tracker/tracker';
import Campaign from './campaign/campaign';
import View from './view/view';
import Backfill from './view/backfill';
import device from '../utils/device';
import $ from '../utils/element';

class Player {
    constructor(campaign, source) {
        this.macro = new Macro(this);
        this.tracker = new Tracker(this);

        this.campaign = new Campaign(this, campaign);
        this.view = new View(this, source);
        this.backfill = new Backfill(this);

        this.campaign.requestTags()
            .then((tags) => {
                this.tags = tags;

                // console.log(this);

                // Don't wait for user events
                this.play();
            });

        this.$selected = false;

        this._addWindowListeners();
    }

    /**
     * @return {Slot|Boolean}
     */
    selected() {
        if (this.$selected && (!this.$selected.isDone() || this.$selected.isPlaying())) {
            return this.$selected;
        }

        this.$selected = false;

        (this.tags || []).forEach((tag) => {
            tag.slots().forEach((slot) => {
                if (this.$selected || !slot.isLoaded()) {
                    return false;
                }

                if (!slot.ad()._used && !slot.media().isVPAID()) {
                    this.$selected = slot;

                    slot.mark('got-selected');
                }
            })
        });

        (this.tags || []).some((tag) => {
            return tag.slots().some((slot) => {
                if (this.$selected || !slot.isLoaded()) {
                    return false;
                }

                if (!slot.ad()._used) {
                    this.$selected = slot;

                    slot.mark('got-selected');

                    return true;
                }

                return false;
            });
        });

        return this.$selected;
    }

    /**
     * Listener method.
     *
     * Gets called when a tag gets updated.
     *
     * @param {Tag} tag
     *
     * @return {Player}
     */
    tagListener(tag) {
        console.info(`Tag with id #${tag.id()} updated.`);

        // Don't wait for user events
        this.play();

        return this;
    }

    /**
     * Listener method.
     *
     * @param {Slot} slot
     * @param {String} name
     * @param {Mixed} data
     *
     * @return {Player}
     */
    slotListener(slot, name, data) {
        // if (!name.includes('timeupdate')) {
        //     console.log('event:', name, data);
        // }

        this.tracker.video(slot, name, data);

        const view_control = (!this.$selected || this.$selected == slot);

        switch (name) {
            case 'loaded':
                this.play();
                break;
            case 'started':
                if (view_control) {
                    slot.video().volume(
                        this.campaign.startsWithSound()
                    );
                }
                break;
            case 'videostart':
                if (view_control) {
                    this.view.soundControl();
                    this.view.transition();
                }
                break;
            case 'skipped':
            case 'stopped':
            case 'complete':
            case 'error':
                if (view_control) {
                    this.view.soundControl(true);

                    this.view.transition(false);
                }

                this.play();
                break;
        }
    }

    /**
     * Start video.
     *
     * @param {Boolean} byUser
     *
     * @return {Player}
     */
    play(byUser = false) {
        // transition: if none selected
        if (!this.selected()) {
            this.view.transition(false);
        }

        if (!this.tags || !this.selected()) {
            return this;
        }

        if (device.mobile() && this.selected().media().isVPAID() && !byUser) {
            if (!device.igadget() || !device.iphoneInline()) {
                return this;
            }
        }

        // video: pause/resume
        if (this.selected().isPlaying()) {
            // Note: order of conditions matters
            if (this.view.mustPause() && this.selected() && !this.selected().isPaused()) {
                this.selected().video().pause();

                return this;
            }

            // Note: order of conditions matters
            if (this.view.mustResume() && this.selected() && this.selected().isPaused()) {
                this.selected().video().resume();

                return this;
            }
        }

        // video: start
        if (this.view.mustStart() && this.selected() && !this.selected().gotStarted() && !this.selected().isStarted()) {
            this.selected().video().start();

            // Add fallback, because 'started' event normally gets triggered immediately
            this.selected().mark('got-started');
        }

        return this;
    }


    /**
     * Add DOM event listeners.
     *
     * @return {Player}
     */
    _addWindowListeners() {
        const _isPlaying = () => {
            return this.selected() && this.selected().isPlaying();
        }

        const _isPaused = () => {
            return this.selected() && this.selected().isPaused();
        }

        /**
         * Events
         */

        this.view.container().sub('transitionend', (ev, $el) => {
            //
        });

        $().sub('touchend', () => {
            this.play(true);
        });

        this.view.sound()
            .sub('click', (ev, $el) => {
                if (_isPlaying()) {
                    this.selected().video().volume(
                        $el.hasClass('off')
                    );

                    $el.toggleClasses('on', 'off');
                }
            });

        $().sub('scroll', () => {
            this.play(device.mobile());
        });

        if (!device.mobile()) {
            this.view.container()
                .sub('mouseover', () => {
                    if (_isPlaying()) {
                        this.selected().video().volume(true);
                    }
                })
                .sub('mouseout', () => {
                    if (_isPlaying()) {
                        this.selected().video().volume(false);
                    }
                });
        }

        return this;
    }
}

export default Player;
