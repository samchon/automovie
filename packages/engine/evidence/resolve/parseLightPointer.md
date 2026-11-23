# src/resolve/parseLightPointer.ts#parseLightPointer

## @evidence contracts/development/implementation.md#principled-implementation

Require /lights/id/property shape, supported property, nonempty decoded id and exact RFC-6901 formatter round-trip; other inputs return null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Supported properties and escaping delegate to canonical owners, separating syntax from eventual light lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Stable ids determine addresses and malformed/extra segments are refused rather than normalized into another target.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify tilde/slash escaping, canonical spelling and null refusal; target existence remains with shot resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

S pointer characters require O(S) splitting, decoding and re-encoding with proportional temporary text.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All pointer producers/parser checks share formatLightPointer, without caching existence across mutable scenes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only decoded strings/property escape; segments and re-encoded text release with the call, with no scene handle or task.
