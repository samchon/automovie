# src/fluid/IAutoMovieWaterFeatureFrame.ts#IAutoMovieWaterFeatureFrame

## @evidence contracts/development/design.md#principled-representation

lowerWaterFeature passes one solved state into both child producers, which copy its step. That producer establishes the shared instant; the interface alone cannot reject manually mismatched records or certify finite child outputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Groups state, surface, spray and the owning feature id for one lowering result; it introduces no runtime wrapper or second solver state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record has no runtime substitutions or fixture-dependent fields; producer-derived members retain the approximations and numerical gaps of the solver, surface and spray.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the producer and member ownership, shared-state derivation and structural/numerical limits.
