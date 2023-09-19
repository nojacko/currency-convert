export function formatCurrency (num: number, currency: string, maximumFractionDigits = 2) {
    const locale = navigator.language || "en";
    const numFormat = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits,
    });

    return numFormat.format(num);
}

export function roundCurrency (num: number, currency: string) {
    let i = 100000000;
    const onePercent = num * 0.01;

    while (i > 1) {
        const newNum = Math.round(num / i) * i;

        if (Math.abs(num-newNum) < onePercent) {
            num = newNum;
            break;
        }

        i = i / 10;
    }

    return formatCurrency(num, currency, (num >= 10) ? 0 : 2);
}