# src/physics/IAutoMoviePhysicalControllerCheckpoint.ts#IAutoMoviePhysicalControllerCheckpoint

## @evidence contracts/development/design.md#principled-representation

Contact and ownership prefix lengths, active episode identities and engine-authored interval plans describe the causal state required at a completed cache step; times and poses retain their simulation-local SI units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalSimulation writes these fields and restores controller plans; restorePhysicalSimulationCheckpoint restores the associated ledgers for the same admitted simulation prefix.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record spells out existing engine data instead of deriving its shape from the solver's binding or copying a solver structure; optional historical fields retain their existing empty-state restoration behavior.

## @evidence contracts/development/common.md#meaningful-documentation

States snapshot pairing, ownership, input-equivalence admission, index domains, clocks and absent-field restoration behavior.
