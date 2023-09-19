export interface RateJson {
    from: string;
    to: string;
    rate: number;
    updatedAt: number;
}


export default class Rate {
    from: string;
    to: string;
    rate: number;
    updatedAt: number; // Timestamp in ms

    static fromJson(json: RateJson) {
        const rate = new Rate();
        rate.from = json.from;
        rate.to = json.to;
        rate.rate = json.rate;
        rate.updatedAt = json.updatedAt;
        return rate;
    }

    convert(amount: number) {
        return amount * this.rate;
    }

    toJson() {
        return {
            from: this.from,
            to: this.to,
            rate: this.rate,
            updatedAt: this.updatedAt,
        }
    }
}