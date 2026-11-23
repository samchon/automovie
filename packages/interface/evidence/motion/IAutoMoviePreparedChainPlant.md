# src/motion/IAutoMoviePreparedChainPlant.ts#IAutoMoviePreparedChainPlant

## @evidence contracts/development/design.md#principled-representation

Captures articulation-free chain frames under the current parent pose plus root/mid effective clinical domains; local offsets and relative lower/effector rotations reconstruct candidate points and orientations including unchanged intermediate bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates pose-invariant preparation from candidate-specific target/bend choice so the inverse solve and residual scorer consume identical frames and constraints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Domains come from the actual skeleton and shared defaults; this record has no alternate rig limits or copied measurement that overrides solved FK.

## @evidence contracts/development/common.md#meaningful-documentation

Describes articulation removal, current parent pose, model-metre coordinates, local offsets and relative lower/effector orientation required to reconstruct a candidate.
