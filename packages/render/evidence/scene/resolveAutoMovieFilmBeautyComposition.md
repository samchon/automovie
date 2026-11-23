# src/index.ts#resolveAutoMovieFilmBeautyComposition

## @evidence contracts/development/implementation.md#principled-implementation

Admits exactly one/two finite0..1 sampled layers, interpreting full single weight as direct, fractional single as fade and exact-complement pair as ordered dissolve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit discriminated composition separates admission from frame dispatch and native display effects.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid cardinality/weight/exact complement refuses rather than clamp, normalize or invent an opaque shot; floating inputs must already carry the canonical sampler complement relation.

## @evidence contracts/development/common.md#meaningful-documentation

Documents direct/fade/dissolve operands and named invalid weight/cardinality semantics before rendering.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two admitted layers require fixed checks and one small composition wrapper; no payload clone, sort or scene traversal is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returned branches borrow actual layer identity for their one draw; different sampled frame inputs are not memoized by equal weight or shot name.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the small result wrapper holds borrowed layers, with no renderer, target, texture or persistent composition cache acquired.
