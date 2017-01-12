import Campaign from './campaign/campaign';

class Player {
    constructor(campaign, source) {
        this.$campaign = new Campaign(campaign);

        console.log(this);
    }
}

export default Player;
