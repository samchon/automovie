# src/validation/IAutoMovieViolationCollector.ts#IAutoMovieViolationCollector

## @evidence contracts/development/design.md#principled-representation

Canonical violation construction and toValidation severity folding preserve warning-only success and error failure, with field-specific predicates appending in call order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A shared collector eliminates repeated array threading and common scalar/vector/rotation policies; callers supply their own paths and semantic limits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The public items array is mutable and returned validation aliases it, so append-only usage is a caller discipline rather than enforced immutable publication; no severity or offending value is silently repaired.

## @evidence contracts/development/common.md#meaningful-documentation

Documents insertion order, public mutable storage, shared result ownership and error-versus-warning folding, with no automatic freeze or population ceiling.
