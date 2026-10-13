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
 * @author Samchon
 */
export type AutoMovieInterpolation = "linear" | "step" | "cubicspline";
