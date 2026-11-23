# src/effectRuntime/productionFilmEffectFrameRate.ts#productionFilmEffectFrameRate

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `canonicalProductionFrameRate`, which reduces by Euclid's greatest common divisor so equal rates have one spelling; a fractional scalar is refused because a decimal display value does not identify the rational that produced it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Exists only to translate the shared reducer's plain `Error` into the film-effect refusal class under a code the caller chooses, so the materializer and the runtime validator share one rule and differ only in how they classify the failure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The catch translates rather than recovers: it never substitutes a default rate, and every failure of the reducer, including a `TypeError` from a malformed persisted value, surfaces as the caller's refusal code.

## @evidence contracts/development/common.md#meaningful-documentation

States the two accepted input forms and their reduction, which caller uses which code, and that every reduction failure becomes the one coded refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Euclid's algorithm takes `O(log min(numerator, denominator))` modulo steps, and the scalar form is constant time; nothing else is computed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reduction of one value per call with no coordination across requests to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new two-number record owned by the caller and retains nothing.
