<script lang="ts">
	import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import Api, { KEY_THINGS } from "$lib/Api";
    import Currency from "$lib/Currency";
    import LocalStorage from "$lib/LocalStorage";
    import Rate from "$lib/Rate";
    import Thing, { type ThingHash } from "$lib/Thing";

    const DEFAULT_FROM_CODE = "GBP";
    const DEFAULT_TO_CODE = "THB";

    let customise = false;

    let things: ThingHash = {};
    let fromCode = LocalStorage.getItem("DEFAULT_FROM_CODE") || DEFAULT_FROM_CODE;
    let toCode = LocalStorage.getItem("DEFAULT_TO_CODE") || DEFAULT_TO_CODE;
    let from: Currency|null;
    let to: Currency|null;
    let currencies: Currency[] = [];
    let rate: Rate|null;

    // For default "Things", relative to USD
    const BASE = "USD";
    const baseDefaultValues = [1, 10, 50, 100, 500, 1000];
    const baseModifierOpts = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    let baseRate: Rate|null;

    $: fromCode, toCode, updateRate();

    const generateDefaultThings = (rate: Rate) => {
        // Find multipler that gets first default value closest to $1
        const multiplier = baseModifierOpts.reduce((prev, curr) => {
            if (!baseRate) {
                return 1;
            }
            return Math.abs(baseRate.convert(curr) - baseDefaultValues[0]) < Math.abs(baseRate.convert(prev) - baseDefaultValues[0])
                ? curr
                : prev;
        });

        return baseDefaultValues.map((value) => {
            value = value * multiplier;

            const thing = new Thing();
            thing.name = from ? formatCurrency(value, from.code, 0) : value.toString();
            thing.value = value;
            return thing;
        });
    }

    const updateRate = async() => {
        rate = null;

        if (fromCode && toCode) {
            from = Currency.getByCode(currencies, fromCode);
            to = Currency.getByCode(currencies, toCode);
            if (from?.code && to?.code) {
                rate = await Api.getRate(from.code, to.code);
                baseRate = await Api.getRate(from.code, BASE);

                if (rate && baseRate && !things[rate.from]) {
                    things[rate.from] = await Api.getThings(rate.from);

                    if (things[rate.from].length === 0) {
                        things[rate.from] = generateDefaultThings(rate);
                    }
                }

                LocalStorage.setItem("DEFAULT_FROM_CODE", from.code);
                LocalStorage.setItem("DEFAULT_TO_CODE", to.code);
            }
        }
        things = things;
    }

    const formatCurrency = function(num: number, currency: string, maximumFractionDigits = 2) {
        const locale = navigator.language || "en";
        const numFormat = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits,
        });

        return numFormat.format(num);
    }

    const roundCurrency = function(num: number, currency: string) {
        let i = 100000000;
        let onePercent = num * 0.01;

        while (i > 1) {
            const newNum = Math.round(num / i) * i;
            const percent = 1 - ((newNum / num) * 100);

            if (Math.abs(num-newNum) < onePercent) {
                num = newNum;
                break;
            }
            i = i / 10;
        }

        return formatCurrency(num, currency, (num >= 10) ? 0 : 2);
    }

    const addThing = function(code: string) {
        things[code].push(new Thing());
        things = things;
    }

    const deleteThing = function(thing: Thing) {
        const remove = (browser) ? window.confirm(`Delete${thing.name ? ` "${thing.name}"` : ""}?`) : true;
        if (remove) {
            things[fromCode] = things[fromCode].filter((currentThing) => currentThing.id != thing.id);
            things = things;
        }
    }

    const storeThings = function() {
        const key = `${KEY_THINGS}-${fromCode}`;
        LocalStorage.setItem(key, JSON.stringify(things[fromCode].map((item) => item.toJson())));
    }

    const saveThings = function() {
        things[fromCode].sort((a, b) => a.value - b.value);
        storeThings();
        things = things;
    }

    const resetThings = function() {
        if (rate) {
            things[rate.from] = generateDefaultThings(rate);
            things = things;
            storeThings();
        }
    }

    const swap = function() {
        const tempFromCode = fromCode;
        fromCode = toCode;
        toCode = tempFromCode;
    }

    onMount(async () => {
        currencies = await Api.getCurrencies();
        await updateRate();
    });
</script>

<svelte:head>
    <title>Currency Converter</title>
    <meta name="description" content="" />
</svelte:head>

<div class="container-fluid mx-auto px-0" style="max-width: 40rem;">
    <h1 class="text-center display-4 text-light mx-1 my-2">Currency Cheatsheet</h1>

    {#if customise && Array.isArray(things[fromCode])}
        <table class="table table-hover table-striped">
            <thead>
                <tr>
                    <td class="col-3 align-top">
                        <strong>Amount</strong><br>
                        <small>or usual price</small>
                    </td>
                    <td class="col-3 align-top">
                        <strong>Name</strong><br>
                        <small>Try emojis! 🍺 🍔</small>
                    </td>
                    <td class="col-5 align-top">
                        <strong>Description</strong><br>
                        <small>Small text shown below name</small>
                    </td>
                    <td class="col-1">&nbsp;</td>
                </tr>
            </thead>
            <tbody>
                {#each things[fromCode] as thing (thing.id)}
                    <tr class="mb-4 text-center">
                        <td class="px-1">
                            <div class="input-group input-group-sm">
                                <span class="input-group-text" id="thing-value-{thing.id}">{fromCode}</span>
                                <input
                                    id="thing-value-{thing.id}" type="number" class="form-control form-control-sm text-end"
                                    min="0" placeholder=""
                                    bind:value={thing.value}
                                >
                            </div>
                        </td>
                        <td class="px-1">
                            <input
                                id="thing-name-{thing.id}" type="text" class="form-control form-control-sm"
                                placeholder="optional"
                                bind:value={thing.name}
                            >
                        </td>
                        <td class="px-1">
                            <input id="thing-description-{thing.id}" type="text" class="form-control form-control-sm"
                                placeholder="optional"
                                bind:value={thing.description}
                            >
                        </td>
                        <td class="px-1 text-end">
                            <button
                                id="delete-{thing.id}" class="btn btn-sm btn-outline-danger" type="button" title="Delete"
                                on:click={() => deleteThing(thing)}
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <table class="table table-hover table-striped text-center">
            <thead>
                <tr>
                    <td class="col-12 px-0 py-3" colspan="3">
                        <div class="input-group input-group-sm">
                            <select bind:value={fromCode} class="form-select" id="currency-from">
                                {#each currencies as currency}
                                    <option value={currency.code}>{currency.code} {currency.name}</option>
                                {/each}
                            </select>

                            <button on:click={swap} class="btn btn-outline-secondary btn-sm mx-auto" type="button" title="Swap">
                                <i class="fa-solid fa-shuffle"></i>
                            </button>

                            <select bind:value={toCode} class="form-select" id="currency-to">
                                {#each currencies as currency}
                                    <option value={currency.code}>{currency.code} {currency.name}</option>
                                {/each}
                            </select>
                        </div>
                    </td>
                </tr>
            </thead>

            {#if rate && things && Array.isArray(things[fromCode])}
                <tbody>
                    {#each things[fromCode] as thing (thing.id)}
                        <tr>
                            <td class="col-5 align-middle p-1">
                                <div class="fs-6">
                                    {#if thing.name}
                                        {thing.name}
                                    {:else}
                                        {formatCurrency(thing.value, fromCode)}
                                    {/if}
                                </div>
                                {#if thing.description && thing.description.length}
                                    <small>{thing.description}</small>
                                {/if}

                                <p class="text-secondary mb-0">
                                    <small>{formatCurrency(thing.value, fromCode)}</small>
                                </p>
                            </td>
                            <td class="col-1 align-middle p-1">
                                <i class="fa-solid fa-arrows-left-right"></i>
                            </td>
                            <td class="col-5 align-middle p-1">
                                <p class="fs-6 mb-1">
                                    {roundCurrency(rate.convert(thing.value), toCode)}
                                </p>
                                <p class="text-secondary mb-0">
                                    <small>{formatCurrency(rate.convert(thing.value), toCode)}</small>
                                </p>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            {/if}
        </table>
    {/if}

    <div class="row">
        <div class="col-12 text-center">
            {#if customise}
                <button on:click={() => addThing(fromCode)}
                    class="btn btn-outline-primary m-1" type="button" title="Save">
                    <i class="fa-solid fa-plus"></i> Add
                </button>
                <button on:click={() => { saveThings(); customise = false; }}
                    class="btn btn-outline-primary m-1" type="button" title="Save">
                    <i class="fa-solid fa-save"></i> Save
                </button>
                <br>
                <button on:click={() => { window.confirm("Reset?") && resetThings(); customise = false; }}
                    class="btn btn-outline-warning m-1" type="button" title="Save">
                    <i class="fa-solid fa-arrows-rotate"></i> Reset
                </button>
            {:else}
                <button on:click={() => customise = true}
                    class="btn btn-outline-secondary m-1" type="button" title="Customise">
                    <i class="fa-solid fa-gear"></i> Customise
                </button>
            {/if}
        </div>
    </div>
</div>
