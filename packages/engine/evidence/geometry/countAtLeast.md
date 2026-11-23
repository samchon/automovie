# src/geometry/countAtLeast.ts#countAtLeast

## @evidence contracts/development/implementation.md#principled-implementation `Number.isSafeInteger` rejects fractions, NaN, infinities and integers past 2^53 in one documented predicate, so the count can index arrays exactly before the lower bound is compared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A shared admission helper for procedural builders, so each builder states only its own minimum and label rather than repeating the integer test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bad count throws instead of being rounded or clamped into a mesh the author did not ask for.

## @evidence contracts/development/common.md#meaningful-documentation

States what is refused, the exact message shape, and that it runs before allocation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One integer predicate and one comparison per call, before any allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each builder admits its own count once per call, so nothing repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing; only the thrown error is allocated on refusal.
