# src/recovery/IAutoMovieRecoveryCameraPoseSelectionOperation.ts#IAutoMovieRecoveryCameraPoseSelectionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The result exposes all branch counts, the chosen branch's triangulated observations and provisional pose, and the distinction between unique and tied support.

## @evidence contracts/development/design.md#principled-representation

The essential decomposition produces two rotations and two translation signs. Each branch is measured on the same observations and scale, with median angles from finite points positive in both cameras.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation reports branch geometry. The pair qualifier combines it with the remaining design, pixel and planar gates.
