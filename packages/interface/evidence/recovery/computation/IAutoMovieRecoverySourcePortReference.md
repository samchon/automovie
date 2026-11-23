# src/recovery/computation/IAutoMovieRecoverySourcePortReference.ts#IAutoMovieRecoverySourcePortReference

## @evidence contracts/development/common.md#meaningful-documentation

Address of the observation represented by a source port. The discriminator requires section/curve, section/contact observation, or named-boundary identity for its actual variant. Numeric ordinals are dimensionless and their range belongs to the supplying observation.

## @evidence contracts/development/design.md#principled-representation

The discriminator requires section/curve, section/contact observation, or named-boundary identity for its actual variant. Numeric ordinals are dimensionless and their range belongs to the supplying observation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source-port declarations and observed port memberships share this reference without embedding source geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The closed union excludes mixing a contact ordinal with a curve or named boundary; it does not certify that an address exists.
