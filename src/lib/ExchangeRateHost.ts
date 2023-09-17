import Currency from "./Currency";
import Rate from "./Rate";

const BASE = "https://api.exchangerate.host";

export default class ExchangeRateHost {
    static async getCurrencies() {
        const resp = await fetch(`${BASE}/symbols`);
        const json = await resp.json();

        const currencies: Currency[] = [];

        if (json.symbols) {
            for (const code of Object.keys(json.symbols)) {
                const symbol: JSONObject = ((json.symbols as JSONObject)[code] as JSONObject);
                if (symbol) {
                    const currency = new Currency();
                    currency.code = (symbol.code) ? symbol.code.toString() : "";
                    currency.name = (symbol.description) ? symbol.description.toString() : "";
                    currencies.push(currency);
                }
            }
        }

        return currencies;
    }

    static async getRate(from: string, to: string) {
        const resp = await fetch(`${BASE}/convert?from=${from}&to=${to}`);
        const json = await resp.json();
        return Rate.fromJson({
            from,
            to,
            rate: json.result,
            updatedAt: Date.now(),
        });
    }
}