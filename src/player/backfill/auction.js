import config from './config';
import device from '../../utils/device';

class Auction {
    /**
     * @param {Backfill} backfill
     *
     * @return {Auction}
     */
    constructor(backfill) {
        this.__backfill = backfill;

        this.$pbjs = window.pbjs = window.pbjs || {};
        this.$pbjs.que = this.$pbjs.que || [];

        this.$adUnits = [];

        this.determineUnits()
            .addUnits();
    }

    /**
     * Request bids
     *
     * @return {Auction}
     */
    addUnits() {
        const device_key = device.mobile() ? 'mobile' : 'desktop',
            timeout = config.timeout[device_key] * 1000;

        pbjs.que.push(() => {
            pbjs.addAdUnits(this.$adUnits);

            pbjs.requestBids({
                timeout: timeout,
                bidsBackHandler: (codes) => {
                    this.__backfill.auctionListener(codes);
                }
            });
        });

        return this;
    }

    /**
     * @return {Auction}
     */
    determineUnits() {
        const units = {};
        const added = {
            sizes: [],
            bidders: []
        };
        let reference_key;

        // units: create as object for uniqueness
        this.__backfill.providers().forEach((provider) => {
            if (!device.mobile() && provider.device == 'mobile') {
                return false;
            }

            for (const target_id in this.__backfill.targets()) {
                this.__backfill.targets()[target_id].forEach((size) => {
                    if (provider.available_sizes !== true && provider.available_sizes.indexOf(size) === -1) {
                        return false;
                    }

                    // console.info('option', provider, size);

                    if (!units[target_id]) {
                        units[target_id] = {
                            code: target_id
                        };
                    }

                    reference_key = `${target_id}_${size}`;
                    if (added.sizes.indexOf(reference_key) === -1) {
                        added.sizes.push(reference_key);

                        if (!units[target_id].sizes) {
                            units[target_id].sizes = [];
                        }

                        units[target_id].sizes.push(size.split('x'));
                    }

                    reference_key = `${target_id}_${provider.bidder}`;
                    if (added.bidders.indexOf(reference_key) === -1) {
                        added.bidders.push(reference_key);

                        if (!units[target_id].bids) {
                            units[target_id].bids = [];
                        }

                        const cleanedProvider = Object.assign({}, provider);
                        delete cleanedProvider.available_sizes;

                        units[target_id].bids.push(cleanedProvider);
                    }
                });
            }
        });

        // units: to array
        for (const target_id in units) {
            this.$adUnits.push(units[target_id]);
        }

        return this;
    }
}

export default Auction;
