# src/environment/IAutoMovieEnvironmentItem.ts#IAutoMovieEnvironmentItem

## @evidence contracts/development/design.md#principled-representation

At is either a position in local metres or a named anchor with a relative metre offset. A unit quaternion acts in the selected parent frame. Missing location and rotation are a zero offset and the identity turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The definition supplies the module contents. Placement supplies their pose once. Socket references reuse named producer frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The composer refuses nonfinite offsets, nonunit rotations and bad anchor references. Authored item poses are rigid to keep contact and support frames coherent.

## @evidence contracts/development/common.md#meaningful-documentation

States the definition, placement alternatives, frames and defaults.
