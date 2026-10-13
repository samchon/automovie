import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";


/**
 * Classify each resolved effector sample as stance when its model-frame Y is at or below sampled ground plus finite nonnegative tolerance. Missing effectors are false; nonfinite sampled ground throws and callback exceptions propagate.
 *
 * @evidence contracts/common.md#principled-implementation Uses the same inclusive height predicate for planting runs and per-frame retarget contacts; the ground callback and tolerance use the resolved pose's model-metre frame, so all consumers classify the same contact geometry.
 * @evidence contracts/common.md#clear-and-simple-design One mask primitive owns contact classification; pinStanceTargets groups runs and preserveRetargetContacts maps each contacting source frame separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid tolerance or sampled nonfinite height refuses instead of silently yielding all-false contact; an unresolved effector remains explicitly non-contacting rather than guessed from another bone.
 * @evidence contracts/common.md#meaningful-documentation States inclusive height threshold, model frame, missing-effector meaning and callback failure effects.
 * @evidence contracts/performance.md#efficient-algorithms One map lookup and at most one ground sample per frame yields O(F) work and an F-boolean result; no FK or repeated bone scan occurs in this primitive.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumes already completed FK maps supplied by the caller; ground callbacks are evaluated at actual effector positions and are not memoized across possibly effectful samples.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one owned boolean per input frame and retains neither callback nor maps; callback/terrain resources remain caller-owned.
 */
export const contactMask: (props: { /** End-effector bone judged against the ground. */ effector : AutoMovieHumanoidBone ; /** Per-frame FK bone lookups. */ resolved : ReadonlyArray < ReadonlyMap < AutoMovieHumanoidBone , IAutoMovieResolvedBone > > ; /** Ground height at a plan position. */ groundAt : ( x : number , z : number ) => number ; /** Contact tolerance above the ground counted as stance. */ tolerance : number ; }) => boolean [ ] = (props: {
  /** End-effector bone judged against the ground. */
  effector: AutoMovieHumanoidBone;

  /** Per-frame FK bone lookups. */
  resolved: ReadonlyArray<
    ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
  >;

  /** Ground height at a plan position. */
  groundAt: (x: number, z: number) => number;

  /** Contact tolerance above the ground counted as stance. */
  tolerance: number;
}): boolean[] => {
  if (!Number.isFinite(props.tolerance) || props.tolerance < 0)
    throw new Error("contact tolerance must be finite and non-negative");
  return props.resolved.map((map: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): boolean => {
    const p: IAutoMovieVector3 | undefined = map.get(props.effector)?.worldPosition;
    if (p === undefined) return false;
    const height: number = props.groundAt(p.x, p.z);
    if (!Number.isFinite(height))
      throw new Error(`contact ground height at (${p.x}, ${p.z}) must be finite`);
    return p.y <= height + props.tolerance;
  });
};
