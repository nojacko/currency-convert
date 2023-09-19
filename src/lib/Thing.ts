import Rate from "$lib/Rate";
export interface ThingJson {
    id: string;
    name: string;
    description: string;
    value: number;
    currency: string;
    custom: boolean;
}

export default class Thing {
    id: string;
    name: string;
    description: string = "";
    currency: string;
    _value: number = 0;
    custom: boolean = false;

    constructor() {
        this.id = crypto.randomUUID();
    }

    static fromJson(json: ThingJson) {
        const thing = new Thing();
        thing.id = json.id;
        thing.name = json.name;
        thing.description = json.description;
        thing.value = json.value;
        thing.custom = json.custom;
        thing.currency = json.currency;
        return thing;
    }

    static thingsForCurrency(things: Thing[], currency: string) {
        const results = [];

        for (const thing of things) {
            if (thing.currency === currency) {
                results.push(thing);
            }
        }

        return results;
    }

    set value(value: number) {
        this._value = (Number.isNaN(this._value) || this._value < 0) ? 0 : value;
    }

    get value() : number {
        return this._value;
    }

    valueConverted(rate: Rate|null) {
        if (rate && this.currency !== rate.to) {
            return rate.convert(this.value);
        }

        return this.value;
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            value: this.value,
            currency: this.currency,
            custom: this.custom,
        }
    }
}