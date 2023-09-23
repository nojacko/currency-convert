<script lang="ts">
    import Thing from "$lib/Thing";
    import { formatCurrency, roundCurrency } from "./utils/maths";

    export let thing: Thing;
</script>

<div class="fs-6">
    {#if thing.name}
        {thing.name}
    {:else}
        {roundCurrency(thing.value, thing.currency)}
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

<style>
    small {
        font-size: 0.75rem;
    }
</style>