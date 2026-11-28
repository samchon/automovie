# src/recovery/IAutoMovieRecoveryAtlasCounts.ts#IAutoMovieRecoveryAtlasCounts

## @evidence contracts/development/common.md#meaningful-documentation

The interface describes the work totals and millimetre estimate as reported by Recovery. It inherits each member's documentation from the Engine-owned declaration.

## @evidence contracts/development/design.md#principled-representation

The interface inherits the realizer's IResultCountFields, keeping their units and caller-owned lifetime. The original interface assignment behavior remains distinct from the realizer's field projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recovery realization and tensor reports retain this public interface and its assignability. The Engine realizer owns the inherited count fields.
