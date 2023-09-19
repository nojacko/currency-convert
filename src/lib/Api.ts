
import Currency, { type CurrencyJson } from "$lib/Currency";
import ExchangeRateHost from "$lib/ExchangeRateHost";
import LocalStorage from "$lib/LocalStorage";
import Rate from "$lib/Rate";
import Thing, { type ThingJson } from "$lib/Thing";

export const KEY_CURRENCIES = "currencies";
export const KEY_RATE = "rate";
export const KEY_THINGS = "things";

export default class CurrecyApi {
    static async getCurrencies() {
        let currencies: Currency[] = [];

        // Read cache
        const cachedStr = LocalStorage.getItem(KEY_CURRENCIES);
        if (cachedStr) {
            const cachedJson: CurrencyJson[] = JSON.parse(cachedStr);
            currencies = cachedJson.map((item) => Currency.fromJson(item));
        }

        // Load API
        if (currencies.length === 0) {
            currencies = await ExchangeRateHost.getCurrencies();

            // Write cache
            const json = JSON.stringify(currencies.map((item) => item.toJson()));
            LocalStorage.setItem(KEY_CURRENCIES, json);
        }

        currencies.sort((a, b) => a.name.localeCompare(b.name));

        return currencies;
    }

    static async getRate(from: string, to: string) {
        const key = `${KEY_RATE}-${from}-${to}`;

        // Read cache
        let cachedRate: Rate|null = null;
        const cachedStr = LocalStorage.getItem(key) || null;
        if (cachedStr) {
            cachedRate = Rate.fromJson(JSON.parse(cachedStr));

            const age = (Date.now() - cachedRate.updatedAt) / 1000;
            if (age < 60 * 60) {
                return cachedRate;
            }
        }

        // Load API
        try {
            const rate = await ExchangeRateHost.getRate(from, to);

            // Write cache
            LocalStorage.setItem(key, JSON.stringify(rate.toJson()));

            return rate;
        } catch (err) {
            console.error("getRate", err);
        }

        return cachedRate;
    }

    static async getThings() {
        // Read cache
        const cachedStr = LocalStorage.getItem(KEY_THINGS);
        if (cachedStr) {
            const cachedJson: ThingJson[] = JSON.parse(cachedStr);
            return cachedJson.map((item) => Thing.fromJson(item));
        }

        return [];
    }
}