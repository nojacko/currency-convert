<script lang="ts">
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";
    import { browser } from "$app/environment";

    import { formatCurrency } from "$lib/utils/maths";
    import { generateDefaultThings } from "$lib/utils/currency";
    import Api, { KEY_THINGS } from "$lib/Api";
    import Currency from "$lib/Currency";
    import LocalStorage from "$lib/LocalStorage";
    import Rate from "$lib/Rate";
    import Thing from "$lib/Thing";
    import ThingTd from "$lib/TdThing.svelte";
    import TdConvert from "$lib/TdConvert.svelte";

    const DEFAULT_FROM_CODE = "GBP";
    const DEFAULT_TO_CODE = "THB";
    const FROM = "from";
    const TO = "to"

    let showCustomise = false;
    let showCustomiseDefault = false;

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
    $: thingsCustom = things.filter((thing) => thing.custom)
    $: thingsBuiltIn = things.filter((thing) => !thing.custom)

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
                if (rate && rateInverse && baseRate && baseRateInverse) {
                    const thingsFrom = Thing.thingsForCurrency(things, fromCode);
                    if (thingsFrom.length === 0) {
                        things.push(...generateDefaultThings(rate, baseRate));
                    }

                    const thingsTo = Thing.thingsForCurrency(things, toCode);
                    if (thingsTo.length === 0) {
                        things.push(...generateDefaultThings(rateInverse, baseRateInverse));
                    }
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

        if (rate && baseRate) {
            things.push(...generateDefaultThings(rate, baseRate));
        }

        if (rateInverse && baseRateInverse) {
            things.push(...generateDefaultThings(rateInverse, baseRateInverse));
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

    {#if showCustomise}
        <div class="row mb-2">
            <div class="col-12">
                <div class="card border-secondary mb-2">
                    <div class="card-header p-2">
                        <div class="container-fluid">
                            <div class="row align-items-center">
                                <div class="col">
                                    <strong>Your Conversions</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {#if Array.isArray(thingsCustom)}
                        <div class="card-body p-2">
                            {#each thingsCustom as thing (thing.id)}
                                <div class="card border-secondary mb-2">
                                    <div class="card-header">
                                        <div class="row align-items-center">
                                            <div class="col-10 col-sm-11">{thing.name ? `${thing.name} (${thing.currency})` : formatCurrency(thing.value, thing.currency)}</div>
                                            <div class="col-2 col-sm-1">
                                                <div class="d-grid gap-2">
                                                    <button
                                                        id="delete-{thing.id}" class="btn btn-sm btn-outline-danger float-end" type="button" title="Delete"
                                                        on:click={() => deleteThing(thing)}
                                                    >
                                                        <i class="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
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
                                                        <input id="thing-description-{thing.id}" class="form-control form-control-sm"
                                                            type="text" placeholder="optional"
                                                            bind:value={thing.description}
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <div class="card-body mt-0 p-2 pt-0">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="co; text-center">
                                    <div class="btn-group" role="group" aria-label="Basic outlined example">
                                        <button class="btn btn-outline-primary"
                                            type="button" title="Add {fromCode}"
                                            on:click={() => addThing(fromCode)}
                                        >
                                            <i class="fa-solid fa-plus"></i> {fromCode}
                                        </button>
                                        <button class="btn btn-outline-primary"
                                            type="button" title="Add {toCode}"
                                            on:click={() => addThing(toCode)}
                                        >
                                            <i class="fa-solid fa-plus"></i> {toCode}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {#if Array.isArray(thingsBuiltIn)}
            <div class="row mb-2">
                <div class="col-12">
                    <div class="card border-secondary mb-2">
                        <div class="card-body p-2">
                            <div class="container-fluid">
                                <div class="row align-items-center">
                                    <div class="col-10">
                                        <strong>Default Conversions</strong>
                                    </div>
                                    <div class="col-2 text-end">
                                        <button class="btn btn-sm btn-outline-secondary" type="button" title="Toggle"
                                            on:click={() => {showCustomiseDefault = !showCustomiseDefault }}
                                        >
                                            <i class="fa-solid {showCustomiseDefault ? "fa-arrow-up" : "fa-arrow-down"}"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {#if showCustomiseDefault}
                            {#each thingsBuiltIn as thing (thing.id)}
                                <div class="card-body p-2" transition:slide>
                                    <div class="container-fluid">
                                        <div class="row align-items-center">
                                            <div class="col-10">
                                                {thing.name ? `${thing.name} (${thing.currency})` : formatCurrency(thing.value, thing.currency)}
                                            </div>
                                            <div class="col-2 text-end">
                                                <button
                                                    id="delete-{thing.id}" class="btn btn-sm btn-outline-secondary" type="button" title="Delete"
                                                    on:click={() => thing.visible = !thing.visible }
                                                >
                                                    <i class="fa-regular {thing.visible ? "fa-eye" : "fa-eye-slash" }"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
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

                            <button type="button" class="btn btn-outline-secondary btn-sm mx-auto" title="Swap"
                                on:click={swap}
                            >
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
                        {#if thing.visible &&
                            (
                                thing.currency === fromCode ||
                                (thing.currency === toCode && thing.custom)
                            )
                        }
                            <tr>
                                <td class="col-5 align-middle p-1">
                                    {#if thing.currency === fromCode}
                                        <ThingTd thing={thing} />
                                    {:else}
                                        <TdConvert thing={thing} rate={rateInverse}/>
                                    {/if}
                                </td>
                                <td class="col-1 align-middle p-1">
                                    <i class="fa-solid fa-arrows-left-right"></i>
                                </td>
                                <td class="col-5 align-middle p-1">
                                    {#if thing.currency === fromCode}
                                        <TdConvert thing={thing} rate={rate}/>
                                    {:else}
                                        <ThingTd thing={thing} />
                                    {/if}
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            {/if}
        </table>
    {/if}

    <div class="row mb-2">
        <div class="col-12 text-center">
            {#if showCustomise}
                <button type="button" class="btn btn-outline-warning m-1" title="Save"
                    on:click={() => { window.confirm("Reset?") && resetThings(); showCustomise = false; }}
                >
                    <i class="fa-solid fa-arrows-rotate"></i> Reset
                </button>
                <button type="button" class="btn btn-outline-primary m-1" title="Save"
                    on:click={() => { saveThings(); showCustomise = false; }}
                >
                    <i class="fa-solid fa-save"></i> Save
                </button>
            {:else}
                <button type="button" class="btn btn-outline-secondary m-1" title="Customise"
                    on:click={() => showCustomise = true}
                >
                    <i class="fa-solid fa-gear"></i> Customise
                </button>
            {/if}
        </div>
    </div>
</div>

<style>
    .card button {
        min-width: 2rem;
    }
</style>