# src/core/AutoMovieInterpolation.ts#AutoMovieInterpolation

## @evidence contracts/development/design.md#principled-representation `sampleClip` implements the three glTF sampler modes: `step` takes the right key on an exact hit, `linear` slerps rotations and lerps the rest, and `cubicspline` evaluates the Hermite basis from the left out-tangent and right in-tangent scaled by the segment span, renormalizing rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union is exactly the glTF set, so an imported or exported clip needs no mode translation, and the per-mode value layout is stated here once for every track.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Gates that prove bounds only at keys refuse `cubicspline` rather than sampling it densely and hoping, and the exact-hit `step` rule follows glTF instead of lagging one sample.

## @evidence contracts/development/common.md#meaningful-documentation

States each mode's blend, the cubic value layout and tangent scaling, the exact `step` switch instant, and which gates refuse `cubicspline` and why.
