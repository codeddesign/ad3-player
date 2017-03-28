import Macro from './macro';
import Campaign from './campaign/campaign';
import View from './view/view';

class Player {
    constructor(campaign, source) {
        this.macro = new Macro(this);

        this.campaign = new Campaign(this, campaign);
        this.view = new View(this, source);

        this.view.setup();

        this.campaign.requestTags()
            .then((tags) => {
                this.tags = tags;

                // console.log(this);
            });
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
        if (!name.includes('timeupdate')) {
            console.log('event:', name, data);
        }
    }
}

export default Player;
