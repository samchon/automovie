# src/motion/composition/IAutoMovieResolveOutcome.ts#IAutoMovieResolveOutcome

## @evidence contracts/development/common.md#meaningful-documentation

Rules carry production-owned outcome literals and synchronous predicates over borrowed intents; first matching rule wins and the fallback covers no match. The resolver neither validates the production vocabulary nor retains the predicates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieResolveOutcome contracts used by packages/engine/src/composition/resolveAutoMovieOutcome.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Rules carry production-owned outcome literals and synchronous predicates over borrowed intents; first matching rule wins and the fallback covers no match. The resolver neither validates the production vocabulary nor retains the predicates. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieResolveOutcome contract belongs to interface; packages/engine/src/composition/resolveAutoMovieOutcome.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

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
