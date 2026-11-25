# src/motion/human/compose/IAutoMovieMotionHumanTrunk.ts#IAutoMovieMotionHumanTrunk.ICrouch

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member gives its meaning, unit and range.

## @evidence contracts/development/design.md#principled-representation

A crouch is how far the hips sink and how far the trunk pitches, between a sinking and a rising window; the knees are not stated because the planted feet decide them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven required members and the legs the crouch plants, read only by `crouch`; the legs exist because one caller (the batting stance) steps one foot out itself while the body sinks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hip shift: the shift is solved, so a caller cannot state one that unbalances the body; the feet are read off the standing posture, so a caller cannot plant them somewhere the body does not stand.

# src/motion/human/compose/IAutoMovieMotionHumanTrunk.ts#IAutoMovieMotionHumanTrunk.IShape

## @evidence contracts/development/common.md#meaningful-documentation

Depth measures hip descent in metres and pitch measures inclination in degrees. The standing pose supplies the plants.

## @evidence contracts/development/design.md#principled-representation

prepareCrouch checks depth and pitch are nonnegative and derives foot placement from the body and standing pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Repeated crouches share this shape. The caller can reserve a leg for another goal and supply an optional balance request.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shape stores geometry and selected legs without storing sampled keyframes or an assumed shift.

# src/motion/human/compose/IAutoMovieMotionHumanTrunk.ts#IAutoMovieMotionHumanTrunk.IInclineResult

## @evidence contracts/development/common.md#meaningful-documentation

pitch is remaining root inclination in degrees; joints contains clinical-degree rotations after distributing trunk flexion.

## @evidence contracts/development/design.md#principled-representation

Separates the pelvis rotation from the flexion carried by spine and chest joints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by HumanTrunk.incline and read when constructing inclined postures.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical posture joint map and keeps backward inclination on the pelvis alone.

# src/motion/human/compose/IAutoMovieMotionHumanTrunk.ts#IAutoMovieMotionHumanTrunk.IRegionResult

## @evidence contracts/development/common.md#meaningful-documentation

point is in world metres; normal is an outward unit direction in the same frame.

## @evidence contracts/development/design.md#principled-representation

A surface location and orientation let hand rests use the posed region's geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanTrunk.region produces the point and normal together from the selected region.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members reuse the canonical vector representation while their comments distinguish position from direction.

# src/motion/human/compose/IAutoMovieMotionHumanTrunk.ts#IAutoMovieMotionHumanTrunk.ISurfaceResult

## @evidence contracts/development/common.md#meaningful-documentation

point is the ray hit in world metres; normal is the outward unit direction there.

## @evidence contracts/development/design.md#principled-representation

Keeps the actual collider intersection and its normal together for a surface-aligned hand rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanTrunk.surface returns the pair read by trunk-contact placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

HumanColliders.cast supplies the intersection on the midline colliders, without using a hand's existing placement as a surface.
