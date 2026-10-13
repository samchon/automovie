/**
 * How a track interpolates between its keyframes, mirroring glTF animation
 * sampler interpolation so clips round-trip with glTF/VRMA.
 *
 * - `linear`: straight blend (slerp for rotation channels).
 * - `step`: hold the previous keyframe's value until the next (snappy / robotic).
 * - `cubicspline`: Hermite spline; the track's `values` carry three elements per
 *   keyframe (in-tangent, value, out-tangent), tangents scaled by segment
 *   duration, per the glTF convention.
 *
 * `step` switches to the next keyframe's value exactly at that keyframe's
 * time. Camera clearance and authored prop-joint clips refuse `cubicspline`,
 * because a spline can overshoot the bounds those gates prove at the keys.
 *
 * @evidence contracts/common.md#principled-implementation `sampleClip` implements the glTF sampler rules: `step` holds the left key and takes the right key on an exact hit, `linear` lerps or slerps rotations, and `cubicspline` evaluates Hermite with tangents scaled by the segment span and renormalizes quaternions.
 * @evidence contracts/common.md#clear-and-simple-design Uses the three glTF names verbatim so clips round-trip with glTF and VRMA without a translation table, and the engine's `TRACK_INTERPOLATIONS` set lists exactly these for runtime checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Camera clearance and `gateAuthoredObjectMotions` refuse `cubicspline` because tangents can overshoot a bound proved at the keys, a stated restriction of those gates rather than an exception for particular clips.
 * @evidence contracts/common.md#meaningful-documentation States each mode's blend rule, the exact-hit behavior of `step`, the in-tangent, value, out-tangent layout with span-scaled tangents, and which gates refuse splines.
 * @author Samchon
 */
export type AutoMovieInterpolation = "linear" | "step" | "cubicspline";
