# src/sport/pocketedBalls.ts#pocketedBalls

## @evidence contracts/development/common.md#meaningful-documentation

States the crediting rule, its read clock, the order, the off-table case and the failure effects.

## @evidence contracts/development/implementation.md#principled-implementation

A ball resting on the bed has its centre one radius above it; only a ball that dropped through an opening can have its centre a radius below it. Each 120 Hz cache frame is the solver's own completed state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

bakePrecisionDeck owns the shot; this reader owns the pocket and cup credit from its cache.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads solved poses only; no pocket capture zone or tuned distance is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F * B * P) for F cache frames, B balls and P pockets; each ball stops being scanned once credited.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One cache frame read per instant serves every ball.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains no frame.
