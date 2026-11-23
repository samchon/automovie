# src/architecture/IAutoMovieValidateGeneratedAcquisition.ts#IAutoMovieValidateGeneratedAcquisition.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Validate authored generation metadata beside a supplied output-digest identity. Member documentation states the supplied records, units and absence meanings used by validateGeneratedAcquisition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The metadata gate does not invoke a provider or prove replay; seed presence is checked against the claimed reproducibility without inventing a provider-specific seed domain.

## @evidence contracts/development/design.md#principled-representation

acquisition records provider/model/input provenance and an optional safe-integer seed; digest is the expected output identity or null after recorded local transformation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateGeneratedAcquisition.IProps, used by validateGeneratedAcquisition. Its acquisition, digest members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
