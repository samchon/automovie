# src/motion/composition/IAutoMovieResolveOutcome.ts#IAutoMovieResolveOutcome.IRule

## @evidence contracts/development/common.md#meaningful-documentation

Documents ordered predicate execution, borrowed inputs and exception propagation.

## @evidence contracts/development/design.md#principled-representation

The outcome type parameter preserves the production's string vocabulary; id identifies the first accepting rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieOutcome invokes when synchronously at most once if reached, retaining neither rule nor predicate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A rule returns an existing outcome value and carries no global registry or renderer dependency.

# src/motion/composition/IAutoMovieResolveOutcome.ts#IAutoMovieResolveOutcome.ITable

## @evidence contracts/development/common.md#meaningful-documentation

States priority ordering and fallback behavior for no accepted rules.

## @evidence contracts/development/design.md#principled-representation

A readonly rule sequence and mandatory otherwise value ensure every completed evaluation has an outcome, including an empty table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The production owns its rule vocabulary and priority; resolveAutoMovieOutcome applies that order without validating ids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fallback is explicit instead of an optional outcome that would require an invented engine default.

# src/motion/composition/IAutoMovieResolveOutcome.ts#IAutoMovieResolveOutcome.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a winning rule from the default and identifies result mutability.

## @evidence contracts/development/design.md#principled-representation

outcome is always present and rule is absent only when every predicate refused; values share the table's outcome vocabulary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieOutcome creates this reporting record for the caller and retains no predicate state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional rule is provenance, not an alternative result payload or an unresolved decision.
