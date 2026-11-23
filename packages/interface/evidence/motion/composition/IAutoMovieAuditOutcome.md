# src/motion/composition/IAutoMovieAuditOutcome.ts#IAutoMovieAuditOutcome.ISide

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes an exact subject match from an optional region filter.

## @evidence contracts/development/design.md#principled-representation

Subject ids are exact strings; an absent expectation region is a wildcard, while a missing measured region is not an invented match.

## @evidence contracts/development/design.md#minimal-and-owned-surface

auditAutoMovieOutcome uses the same contact-side identity for measurements and expectations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A region is independent refinement of subject identity, not a second alternative contact kind.

# src/motion/composition/IAutoMovieAuditOutcome.ts#IAutoMovieAuditOutcome.IContact

## @evidence contracts/development/common.md#meaningful-documentation

States contact time on the expectation clock and impulse in newton-seconds.

## @evidence contracts/development/design.md#principled-representation

Two unordered sides, a timestamp and one measured impulse support window matching; the caller admits numeric values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The auditor borrows these measurements and considers both side orders without altering them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zero impulse can represent geometric touch; existence of a contact is not inferred from force alone.

# src/motion/composition/IAutoMovieAuditOutcome.ts#IAutoMovieAuditOutcome.IExpectation

## @evidence contracts/development/common.md#meaningful-documentation

Explains inclusive windows, region matching and the peak-impulse threshold.

## @evidence contracts/development/design.md#principled-representation

Window endpoints share the measurement clock; a reversed interval matches nothing. Required impulse defaults to zero and forbidden checks ignore it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

auditAutoMovieOutcome owns matching and failure findings; the producer owns finite ordered time and impulse premises.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The threshold refines a contact expectation and does not encode a second competing contact variant.

# src/motion/composition/IAutoMovieAuditOutcome.ts#IAutoMovieAuditOutcome.IOutcome

## @evidence contracts/development/common.md#meaningful-documentation

Describes required and forbidden contact evidence, including empty and absent lists.

## @evidence contracts/development/design.md#principled-representation

An outcome id labels findings, with independent lists of positive and negative contact expectations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Production outcome declarations supply these lists to auditAutoMovieOutcome; the auditor does not rewrite them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty required list and an absent forbidden list impose no conditions rather than manufacturing a contact.
