import type { IHumanBodySkinDownInput } from "./IHumanBodySkinDownInput";
import { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * Differentiate posed skin position along one metre of rest-frame downward travel at each vertex.
 *
 * Dual-quaternion skinning is rigid for fixed weights, but a bone with `distributeTwist` gives a position-dependent rotation along its shaft. The gravity sag stage needs that map's local direction in the shared Y-up, Z-forward metre frame. A backward difference follows the physical -Y direction at a twist clamp, where the opposite derivative can differ. Its first-order truncation is O(h/L) and subtraction roundoff is O(epsilon L/h); h = sqrt(Number.EPSILON) L balances the two. L is at least one metre and spans the largest absolute input coordinate. The already skinned positions must be the output of the same input positions, skin, joints and transforms, so only one further skin evaluation is needed. Neither input array is changed. This is a numeric derivative of the current rig, not a measured tissue parameter.
 *
 * @evidence contracts/common.md#principled-implementation A shared skinning call perturbs every source vertex along basis -Y and compares its result with the same-input skinned array, accounting for position-dependent distributed twist in the gravity response.
 * @evidence contracts/common.md#clear-and-simple-design One source-coordinate scale determines the backward difference step and one additional skin evaluation produces all vertex derivative directions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching source/skin/rig inputs are a caller premise; the sqrt-epsilon step is numerical error-balancing policy, with branch and conditioning limits rather than measured tissue calibration or exact derivatives.
 * @evidence contracts/common.md#meaningful-documentation The comment states basis metre axes, one-metre derivative meaning, directional clamp behavior, step scaling and unchanged input arrays.
 * @evidence contracts/performance.md#efficient-algorithms Coordinate-scale and finite-difference array passes are linear in V vertices, plus one shared skinning evaluation; existing skinned positions avoid a second nominal evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller supplies the already computed pure skinning output from identical inputs, and the derivative reuses the same skinning owner and transform set.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned derivative positions escape; perturbed coordinates and the additional skinned array expire after return, with no cache, handle or asynchronous task.
 */
export function humanBodySkinDownDirection(
  input: IHumanBodySkinDownInput,
): number[] {
  const {
    positions,
    skinned,
    skin,
    joints,
    transforms,
    toeSplit,
  }: IHumanBodySkinDownInput = input;
  const scale: number = positions.reduce(
    (largest: number, value: number): number =>
      Math.max(largest, Math.abs(value)),
    1,
  );
  const step: number = Math.sqrt(Number.EPSILON) * scale;
  const below: number[] = skinHumanBodySurface(
    positions.map((value: number, i: number): number =>
      i % 3 === 1 ? value - step : value,
    ),
    skin,
    joints,
    transforms,
    toeSplit,
  );
  return below.map(
    (value: number, i: number): number => (value - skinned[i]) / step,
  );
}
