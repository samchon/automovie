# src/recovery/computation/IAutoMovieRecoveryScalarProfilesFittingOperation.ts#IAutoMovieRecoveryScalarProfilesFittingOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Fitted cubic scalar spans in increasing physical station order. Ordinal of the adjacent saved-plane interval in the complete observation sequence.

## @evidence contracts/development/design.md#principled-representation

Ordinal of the adjacent saved-plane interval in the complete observation sequence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitAutoMovieRecoveryImageSupportLoft, fitRecoveryImageProfiles, fitRecoveryScalarProfiles share IAutoMovieRecoveryScalarProfilesFittingOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
