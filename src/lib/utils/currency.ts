import Rate from "$lib/Rate";
import Thing from "$lib/Thing";

const baseValues = [1, 10, 50, 100, 500, 1000];
const baseModifiers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

export function generateDefaultThings(rate: Rate, baseRate: Rate) {
    if (rate.from) {
        // Find multipler that gets first default value closest to $1
        const multiplier = baseModifiers.reduce((prev, curr) => {
            if (!baseRate) {
                return 1;
            }
            return Math.abs(baseRate.convert(curr) - baseValues[0]) < Math.abs(baseRate.convert(prev) - baseValues[0])
                ? curr
                : prev;
        });

        return baseValues.map((value) => {
            value = value * multiplier;

            const thing = new Thing();
            thing.value = value;
            thing.currency = rate.from;
            thing.custom = false;
            return thing;
        });
    }

    return [];
}