<script lang="ts">
	import { onMount } from "svelte";
    import { browser } from "$app/environment";

    import { formatCurrency, roundCurrency } from "$lib/utils/maths";
    import { generateDefaultThings } from "$lib/utils/currency";
    import Api, { KEY_THINGS } from "$lib/Api";
    import Currency from "$lib/Currency";
    import LocalStorage from "$lib/LocalStorage";
    import Rate from "$lib/Rate";
    import Thing from "$lib/Thing";

    const DEFAULT_FROM_CODE = "GBP";
    const DEFAULT_TO_CODE = "THB";
    const FROM = "from";
    const TO = "to"

    let customise = false;

    let things: Thing[] = [];
    let fromCode = LocalStorage.getItem("DEFAULT_FROM_CODE") || DEFAULT_FROM_CODE;
    let toCode = LocalStorage.getItem("DEFAULT_TO_CODE") || DEFAULT_TO_CODE;
    let from: Currency|null;
    let to: Currency|null;
    let currencies: Currency[] = [];
    let rate: Rate|null;
    let rateInverse: Rate|null;

    let quickFrom = 1;
    let quickTo = 0;

    // For default "Things", relative to USD
    const BASE = "USD";
    let baseRate: Rate|null;
    let baseRateInverse: Rate|null;

    $: fromCode, toCode, updateRate();

    const updateRate = async() => {
        if (fromCode && toCode) {
            from = Currency.getByCode(currencies, fromCode);
            to = Currency.getByCode(currencies, toCode);

            if (from?.code && to?.code) {
                LocalStorage.setItem("DEFAULT_FROM_CODE", from.code);
                LocalStorage.setItem("DEFAULT_TO_CODE", to.code);

                rate = await Api.getRate(from.code, to.code);
                rateInverse = await Api.getRate(to.code, from.code);
                baseRate = await Api.getRate(from.code, BASE);
                baseRateInverse = await Api.getRate(to.code, BASE);

                // Generate defaults
                const thingsFrom = Thing.thingsForCurrency(things, fromCode);
                if (thingsFrom.length === 0) {
                    things.push(...generateDefaultThings(rate, baseRate));
                }

                const thingsTo = Thing.thingsForCurrency(things, toCode);
                if (thingsTo.length === 0) {
                    things.push(...generateDefaultThings(rateInverse, baseRateInverse));
                }

                saveThings();
            }
        }
    }

    const addThing = function(currency: string) {
        const thing = new Thing()
        thing.currency = currency;
        thing.custom = true;
        things.push(thing);
        things = things;
    }

    const deleteThing = function(thing: Thing) {
        const remove = (browser) ? window.confirm(`Delete${thing.name ? ` "${thing.name}"` : ""}?`) : true;
        if (remove) {
            things = things.filter((currentThing) => currentThing.id != thing.id);
        }
    }

    const saveThings = function() {
        things.sort((a, b) => a.valueConverted(rate) - b.valueConverted(rate) );
        things = things;

        const json = JSON.stringify(things.map((item) => item.toJson()));
        LocalStorage.setItem(KEY_THINGS, json);
    }

    const resetThings = function() {
        things = [];

        if (rate) {
            if (baseRate) {
                things.push(...generateDefaultThings(rate, baseRate));
            }

            if (baseRateInverse) {
                things.push(...generateDefaultThings(rate, baseRateInverse));
            }
        }

        things = things;
        saveThings();
    }

    const swap = function() {
        const tempFromCode = fromCode;
        fromCode = toCode;
        toCode = tempFromCode;

        const tempQuickFrom = quickFrom;
        quickFrom = quickTo;
        quickTo = tempQuickFrom;
    }

    const quick = function(side: string) {
        switch (side) {
            case FROM: quickTo = parseFloat((rate?.convert(quickFrom) || 0).toFixed(2)); break;
            case TO: quickFrom = parseFloat((rateInverse?.convert(quickTo) || 0).toFixed(2)); break;
        }

        return null;
    }

    onMount(async () => {
        things = await Api.getThings();
        currencies = await Api.getCurrencies();
        await updateRate();
        quick(FROM);
    });
</script>

<svelte:head>
    <title>Currency Cheatsheet</title>
    <meta name="description" content="" />
</svelte:head>

<div class="container-fluid mx-auto px-2" style="max-width: 40rem;">
    <h1 class="display-4 text-center text-light mx-1 my-2">Currency Cheatsheet</h1>

    {#if customise && Array.isArray(things)}
        {#each things as thing (thing.id)}
            <div class="card border-secondary mb-4">
                <div class="card-header">
                    <div class="row align-items-center">
                        <div class="col-10 col-sm-11">{thing.name ? `${thing.name} (${thing.currency})` : formatCurrency(thing.value, thing.currency)}</div>
                        <div class="col-2 col-sm-1">
                            <button
                                id="delete-{thing.id}" class="btn btn-sm btn-outline-danger float-end" type="button" title="Delete"
                                on:click={() => deleteThing(thing)}
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body py-3 p-0">
                    <div class="container-fluid">
                        <div class="row gx-2">
                            <div class="col-12 col-sm-6 pb-2">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text" id="thing-name-{thing.id}">Name</span>
                                    <input
                                        id="thing-name-{thing.id}" type="text" class="form-control"
                                        placeholder="optional"
                                        bind:value={thing.name}
                                    >
                                </div>
                            </div>
                            <div class="col-12 col-sm-6 pb-2">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text">Amount</span>
                                    <input
                                        id="thing-value-{thing.id}" type="number" class="form-control form-control-sm text-end"
                                        min="0" placeholder=""
                                        bind:value={thing.value}
                                    >
                                    <span class="input-group-text">{thing.currency}</span>
                                </div>
                            </div>
                        </div>
                        <div class="row gx-2">
                            <div class="col-12">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text" id="thing-description-{thing.id}">Description</span>
                                    <input id="thing-description-{thing.id}" type="text" class="form-control form-control-sm"
                                        placeholder="optional"
                                        bind:value={thing.description}
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    {:else}
        <table class="table table-borderless table-striped text-center">
            <thead>
                <tr>
                    <td class="col-12 px-0 py-3" colspan="3">
                        <div class="input-group input-group-sm">
                            <select bind:value={fromCode} class="form-select" id="currency-from">
                                {#each currencies as currency}
                                    <option value={currency.code}>{currency.name} {currency.code} </option>
                                {/each}
                            </select>

                            <button on:click={swap} class="btn btn-outline-secondary btn-sm mx-auto" type="button" title="Swap">
                                <i class="fa-solid fa-shuffle"></i>
                            </button>

                            <select bind:value={toCode} class="form-select" id="currency-to">
                                {#each currencies as currency}
                                    <option value={currency.code}>{currency.name} {currency.code} </option>
                                {/each}
                            </select>
                        </div>
                    </td>
                </tr>
            </thead>

            {#if rate && rateInverse && things && Array.isArray(things)}
                <tbody>
                    <tr>
                        <td class="col-5 align-middle p-1">
                            <div class="input-group input-group-sm">
                                <input class="form-control form-control-sm text-end"
                                    type="number" min="0" placeholder=""
                                    on:change={() => quick(FROM)}
                                    bind:value={quickFrom}
                                >
                                <span class="input-group-text">{fromCode}</span>
                            </div>
                        </td>
                        <td class="col-1 align-middle p-1">
                            <i class="fa-solid fa-arrows-left-right"></i>
                        </td>
                        <td class="col-5 align-middle p-1">
                            <div class="input-group input-group-sm">
                                <input class="form-control form-control-sm text-end"
                                    type="number" min="0" placeholder=""
                                    on:change={() => quick(TO)}
                                    bind:value={quickTo}
                                >
                                <span class="input-group-text">{toCode}</span>
                            </div>
                        </td>
                    </tr>

                    {#each things as thing (thing.id)}
                        {#if
                            (
                                thing.currency === fromCode ||
                                (thing.currency === toCode && thing.custom)
                            )
                        }
                            <tr>
                                <td class="col-5 align-middle p-1">
                                    <div class="fs-6">
                                        {#if thing.name}
                                            {thing.name}
                                        {:else if thing.currency === fromCode}
                                            {formatCurrency(thing.value, thing.currency)}
                                        {:else}
                                            {roundCurrency(rateInverse.convert(thing.value), fromCode)}
                                        {/if}
                                    </div>
                                    {#if thing.description && thing.description.length}
                                        <small>{thing.description}</small>
                                    {/if}

                                    <p class="text-secondary mb-0">
                                        <small>
                                            {formatCurrency(thing.value, thing.currency)}
                                        </small>
                                    </p>
                                </td>
                                <td class="col-1 align-middle p-1">
                                    <i class="fa-solid fa-arrows-left-right"></i>
                                </td>
                                <td class="col-5 align-middle p-1">
                                    {#if thing.currency === fromCode}
                                        <p class="fs-6 mb-1">
                                            {roundCurrency(rate.convert(thing.value), toCode)}
                                        </p>
                                        <p class="text-secondary mb-0">
                                            <small>{formatCurrency(rate.convert(thing.value), toCode)}</small>
                                        </p>
                                    {:else}
                                        <p class="fs-6 mb-1">
                                            {roundCurrency(thing.value, toCode)}
                                        </p>
                                        <p class="text-secondary mb-0">
                                            <small>{formatCurrency(thing.value, toCode)}</small>
                                        </p>
                                    {/if}
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            {/if}
        </table>
    {/if}

    <div class="row">
        <div class="col-12 text-center">
            {#if customise}
                <button on:click={() => addThing(fromCode)}
                    class="btn btn-outline-secondary m-1" type="button" title="Save">
                    <i class="fa-solid fa-plus"></i> Add {fromCode}
                </button>
                <button on:click={() => addThing(toCode)}
                    class="btn btn-outline-secondary m-1" type="button" title="Save">
                    <i class="fa-solid fa-plus"></i> Add {toCode}
                </button>
                <br>

                <button on:click={() => { saveThings(); customise = false; }}
                    class="btn btn-outline-primary m-1" type="button" title="Save">
                    <i class="fa-solid fa-save"></i> Save
                </button>
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

<style>
    small {
        font-size: 0.75em;
    }
</style>