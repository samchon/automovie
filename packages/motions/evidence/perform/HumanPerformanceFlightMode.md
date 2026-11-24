# src/perform/HumanPerformanceFlightMode.ts#HumanPerformanceFlightMode

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted authored-flight mode a performance is resolved under.

## @evidence contracts/development/design.md#principled-representation

The interface input's own flight union without its absent case, so a resolved performance always carries one of `staged` or `physical`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mode's type is the interface input's, narrowed here once for the state's one consumer, `HumanPerformanceState.of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No new mode exists; the alias only removes `undefined`, which `of` maps to `staged`.

# src/perform/HumanPerformanceFlightMode.ts#HumanPerformanceFlightMode.of

## @evidence contracts/development/common.md#meaningful-documentation

States how the effective property is read, the staged default for an absent mode and the refusal for any other value.

## @evidence contracts/development/implementation.md#principled-implementation

The input is spread once, as resolution reads it; the copy's own `flight` is used when the spread produced one, otherwise one ordinary `input.flight` read supplies an inherited or non-enumerable mode, so no enumerable getter runs twice.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capture, default, admit, return: the one owner of the mode the flight dispatcher reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No descriptor or prototype inspection and no trusted flag; an invalid literal is refused with its value and the two admitted modes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shallow spread and at most one property read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The mode is read once per resolution and shared with nothing else.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The copy is call-local and the result is a scalar; nothing is retained.
