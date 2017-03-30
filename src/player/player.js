import Macro from './macro';
import Tracker from './tracker/tracker';
import Campaign from './campaign/campaign';
import View from './view/view';

class Player {
    constructor(campaign, source) {
        this.macro = new Macro(this);
        this.tracker = new Tracker(this);

        this.campaign = new Campaign(this, campaign);
        this.view = new View(this, source);

        this.view.setup();

        this.campaign.requestTags()
            .then((tags) => {
                this.tags = tags;

                // console.log(this);
            });

        this.$selected = false;
    }

    /**
     * @return {Slot|Boolean}
     */
    selected() {
        if (this.$selected && (!this.$selected.isDone() || this.$selected.isPlaying())) {
            return this.$selected;
        }

        this.$selected = false;

        (this.tags || []).some((tag) => {
            return tag.slots().some((slot) => {
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
    }
}

export default Player;
