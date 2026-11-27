/*
 * The slack `validateTransformScalars` allows a staged rotation's length.
 */
export const UNIT_QUATERNION_EPSILON = 1e-6;

/*
 * A light `rotation` keyframe must be a unit quaternion, the SAME rule
 * `validateTransformScalars` holds a staged light's `transform.rotation` to.
 *
 * This is a fact about the four components TOGETHER, so it cannot be stated as
 * the per-component range IAutoMovieLightChannelProperty.bounds carries:
 * `(0, 0, 0, 0.5)` has every component inside `[-1, 1]` and still describes no
 * rotation. Without it, a track could state through time a light `commitScene`
 * would refuse outright, which is exactly what the bounds exist to prevent.
 */
export const unitQuaternionFault = (value: readonly number[]): string | null => {
  const length: number = Math.hypot(...value);
  return Math.abs(length - 1) <= UNIT_QUATERNION_EPSILON
    ? null
    : `must be a unit quaternion (length 1), but length was ${length}`;
};
