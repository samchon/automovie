# src/architecture/IAutoMovieValidateDesignReference.ts#IAutoMovieValidateDesignReference.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Validate one observed design reference as evidence. Member documentation states the supplied records, units and absence meanings used by validateDesignReference.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Observed references do not become authored designs through validation, and declared digests are not proof that external bytes were read.

## @evidence contracts/development/design.md#principled-representation

reference joins source frames, observed primitives, candidates and analysis status; frame-relative bounds, ids and sha256 syntax are checked by validateDesignReference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateDesignReference.IProps, used by validateDesignReference. Its reference members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
