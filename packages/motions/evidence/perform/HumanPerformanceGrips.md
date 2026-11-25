# src/perform/HumanPerformanceGrips.ts#HumanPerformanceGrips

## @evidence contracts/development/common.md#meaningful-documentation

States prop identity, placement stability, fixture exclusion and the cached-or-assembled grip list.

## @evidence contracts/development/implementation.md#principled-implementation

Converts each authored wear/mount/contact share to its original film second, clips contacts to placed spans and ends each worn span at the first later grip, wear or mount before the stable start-time sort.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the existing cache, handle a fixture, collect each person's wears, mounts, holds and contacts in their original group order, then close worn spans and sort once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves duplicate spans, equal-time insertion order, all 1e-9 allowances, inHand callbacks, staged capture identity and numerical endpoints. Cache reads and writes retain their original resolving policy, including the early cached return.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each person's S carrier/overlay references are copied once instead of three times, with all authored wear/mount/contact and hold scans retained. Closing W worn spans against G collected grips costs O(W(G+W)), then O((G+W) log(G+W)) sorting; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three ordered scans borrow one unchanged per-person segment snapshot within this call. Existing completed lists remain in the state's gripCache; no new cache, invalidation policy or pose/FK memo is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary segment arrays release with this call; existing span records and seated offsets remain in the resolved-state cache until that state is released. Cache population follows requested subject strings with no eviction here; ordinary consumers use declared props, but this signature imposes no cardinality bound. Cached arrays stay borrowed and a new array transfers to the same existing owner on publication.
