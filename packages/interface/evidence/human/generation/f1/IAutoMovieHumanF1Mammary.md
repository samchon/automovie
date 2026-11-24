# src/human/generation/f1/IAutoMovieHumanF1Mammary.ts#IAutoMovieHumanF1Mammary

## @evidence contracts/development/design.md#principled-representation

The person's points, the footprint in its course frame and the sampled loop are plain records in mm and radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The figure's declaration and the footprint's made-case test read the same records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No stored loop: every record is generated from the points at the pose.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

# src/human/generation/f1/IAutoMovieHumanF1Mammary.ts#IAutoMovieHumanF1Mammary.IPoints

## @evidence contracts/development/design.md#principled-representation

Six points, an optional seventh and one axis, each a named anthropometric landmark or frame origin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One point per footprint extreme, the two the xiphion's height is read between, and the umbilicus the fold's surface distance runs to.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No point is read off a mesh here; the caller carries each from its frame.

## @evidence contracts/development/common.md#meaningful-documentation

Names each landmark.

# src/human/generation/f1/IAutoMovieHumanF1Mammary.ts#IAutoMovieHumanF1Mammary.IFootprint

## @evidence contracts/development/design.md#principled-representation

Four reaches about the course in one plane define the four quarter ellipses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The frame and the reaches only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every reach is positive and finite or the rule refuses.

## @evidence contracts/development/common.md#meaningful-documentation

States the axes' roles.

# src/human/generation/f1/IAutoMovieHumanF1Mammary.ts#IAutoMovieHumanF1Mammary.ILoop

## @evidence contracts/development/design.md#principled-representation

The world 2-jet and the host chart 2-jet by one clock, as `AutoMovieHumanJoinLoop.master` returns them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds only the sampled course stations the part's start is read from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The readers are the one spline both consumers read.

## @evidence contracts/development/common.md#meaningful-documentation

States units.
