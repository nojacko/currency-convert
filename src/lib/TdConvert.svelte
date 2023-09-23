<script lang="ts">
    import Thing from "$lib/Thing";
    import Rate from "./Rate";
    import { formatCurrency, roundCurrency } from "./utils/maths";

    export let thing: Thing;
    export let rate: Rate;
</script>

<p class="fs-6 mb-1">
    {roundCurrency(thing.valueConverted(rate), rate.to)}
</p>
<p class="text-secondary mb-0">
    <small>{formatCurrency(thing.valueConverted(rate), rate.to)}</small>
</p>

<style>
    small {
        font-size: 0.75rem;
    }
</style>