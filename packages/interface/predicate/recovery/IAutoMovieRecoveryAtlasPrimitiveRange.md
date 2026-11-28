# src/recovery/IAutoMovieRecoveryAtlasPrimitiveRange.ts#IAutoMovieRecoveryAtlasPrimitiveRange

## @evidence contracts/development/common.md#meaningful-documentation

The interface describes the range's ownership of retained triangles on a patch chart. Its Engine-owned declaration explains ordinal basis, normalized chart limits and millimetre estimates.

## @evidence contracts/development/design.md#principled-representation

The interface inherits the realizer's IPrimitiveRangeFields. The Engine attaches each cell to output triangle ordinals and its generating patch. Recovery uses the same ordinals while preserving the original interface assignment behavior.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Recovery generation, compilation and analysis preserve this public interface and its assignability. The Engine supplies all the inherited range fields.
