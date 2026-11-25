# src/perform/HumanPerformanceFlightMode.ts#HumanPerformanceFlightMode

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted authored-flight mode a performance is resolved under.

## @evidence contracts/development/design.md#principled-representation

The interface input's own flight union without its absent case, so a resolved performance always carries one of `staged` or `physical`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mode's type is the interface input's, narrowed here once for the state's one consumer, `HumanPerformance`'s construction of its state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No new mode exists; the alias only removes `undefined`, which the function maps to `staged`.

# src/perform/HumanPerformanceFlightMode.ts#HumanPerformanceFlightMode

## @evidence contracts/development/common.md#meaningful-documentation

States the staged default for an absent mode.

## @evidence contracts/development/implementation.md#principled-implementation

The declared flight union is trusted: an absent mode is `staged`, any other is the input's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One defaulted read: the one owner of the mode the flight dispatcher reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No runtime check of the declared union and no fallback beyond the documented default.

## @evidence contracts/development/implementation.md#efficient-algorithms

One property read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The mode is read once per resolution and shared with nothing else.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The result is a scalar; nothing is retained.
