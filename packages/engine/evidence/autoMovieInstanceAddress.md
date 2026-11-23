# src/autoMovieInstanceAddress.ts#autoMovieInstanceAddress

## @evidence contracts/development/implementation.md#principled-implementation

An explicit member keeps its authored identity and a generated member is named by its deterministic slot, so the same member gets the same address in every revision that keeps its slot or explicit id; zero padding makes lexicographic and numeric slot order coincide below a million members.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of the member address grammar, read by instance-set member pages and paired with `autoMovieInstanceAddressSlot`, which parses it back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No set or slot is special-cased; the explicit-id and slot forms follow from the layout alone.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both forms, the padding and the order it preserves, and that the slot is not range-checked.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per call, one array index and one string template, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure formatter of one member that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the padded slot text and the returned address string, and retains neither.
