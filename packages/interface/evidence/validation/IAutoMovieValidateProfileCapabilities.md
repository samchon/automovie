# src/validation/IAutoMovieValidateProfileCapabilities.ts#IAutoMovieValidateProfileCapabilities.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Admit profile id/name uniqueness and mountable/destructible trait fields: seats/payload, durability and impact-body coefficients. Member documentation states the supplied records, units and absence meanings used by validateProfileCapabilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Existing capability variants retain their own fields rather than a test-only parallel schema; runtime uniqueness and coefficient ranges remain validation obligations.

## @evidence contracts/development/design.md#principled-representation

profiles supplies the model's canonical capability records, whose identity, seats, payload, durability and impact coefficients are admitted by the validator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateProfileCapabilities.IProps, used by validateProfileCapabilities. Its profiles members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
