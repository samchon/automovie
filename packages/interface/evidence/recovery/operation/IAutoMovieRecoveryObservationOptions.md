# src/recovery/operation/IAutoMovieRecoveryObservationOptions.ts#IAutoMovieRecoveryObservationOptions

## @evidence contracts/development/common.md#meaningful-documentation

Required saved cubic basis, also carried by the observation result type.

## @evidence contracts/development/design.md#principled-representation

Observation options with an explicitly selected saved cubic basis. The selector is required so the result's generic basis matches the runtime input.

## @evidence contracts/development/design.md#minimal-and-owned-surface

observeAutoMovieRecovery, observeAutoMovieRecoveryPolyline, observeAutoMovieRecoverySections share IAutoMovieRecoveryObservationOptions's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
