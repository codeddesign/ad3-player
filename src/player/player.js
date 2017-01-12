import Campaign from './campaign/campaign';

class Player {
    constructor(campaign, source) {
        this.$campaign = new Campaign(campaign);

        this.$campaign.requestTags().then((tags) => {
            console.log(tags);
        });
    }
}

export default Player;
