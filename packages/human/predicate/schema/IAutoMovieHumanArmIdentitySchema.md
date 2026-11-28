# src/schema/IAutoMovieHumanArmIdentitySchema.ts#IAutoMovieHumanArmIdentitySchema

## @evidence contracts/development/common.md#meaningful-documentation

The record describes measured upper arm, forearm and hand dimensions separately from shoulder, elbow and forearm mobility. Individual descriptions supply their landmarks and signs.

## @evidence contracts/development/design.md#principled-representation

Required arm lengths and selected girths reuse the existing non-null body-anatomy fields. Hand dimensions, dorsal fat and mobility carry their individual bounds. Bilateral identity owns the anatomical side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The detailed body identity reuses this record for each arm. The extremity input also reuses its four hand measurements. Mobility stays separate from posed joint values.
