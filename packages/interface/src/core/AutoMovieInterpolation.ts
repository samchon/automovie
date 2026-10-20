/**
 * How a track interpolates between its keyframes, mirroring glTF animation
 * sampler interpolation so clips round-trip with glTF and VRMA.
 *
 * - `linear`: straight blend, slerp for rotation channels.
 * - `step`: hold the previous keyframe's value until the next (snappy, robotic).
 * - `cubicspline`: Hermite spline; the track's `values` carry three elements per
 *   keyframe (in-tangent, value, out-tangent), tangents scaled by segment
 *   duration, per the glTF convention.
 *
 * `step` switches to the next keyframe's value exactly at that keyframe's
 * time. Camera clearance, authored object-motion clips, and imported motions
 * refuse `cubicspline`, because a spline can overshoot the bounds those gates
 * prove at the keys and a pose keyframe cannot preserve its tangents.
 *
 * @evidence contracts/common.md#principled-implementation `sampleClip` implements the three glTF sampler modes: `step` takes the right key on an exact hit, `linear` slerps rotations and lerps the rest, and `cubicspline` evaluates the Hermite basis from the left out-tangent and right in-tangent scaled by the segment span, renormalizing rotations.
 * @evidence contracts/common.md#clear-and-simple-design The union is exactly the glTF set, so an imported or exported clip needs no mode translation, and the per-mode value layout is stated here once for every track.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gates that prove bounds only at keys refuse `cubicspline` rather than sampling it densely and hoping, and the exact-hit `step` rule follows glTF instead of lagging one sample.
 * @evidence contracts/common.md#meaningful-documentation States each mode's blend, the cubic value layout and tangent scaling, the exact `step` switch instant, and which gates refuse `cubicspline` and why.
 */
export type AutoMovieInterpolation = "linear" | "step" | "cubicspline";
