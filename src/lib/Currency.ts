export interface CurrencyJson {
    code: string;
    name: string;
}

export default class Currency {
    code: string;
    name: string;

    static fromJson(json: CurrencyJson) {
        const currency = new Currency();
        currency.code = json.code;
        currency.name = json.name;
        return currency;
    }

    static getByCode(currencies: Currency[], code: string) {
        for (const currency of currencies) {
            if (currency.code === code) {
                return currency;
            }
        }

        return null;
    }

    toJson() {
        return {
            code: this.code,
            name: this.name,
        }
    }
}