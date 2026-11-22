import type {
  IAutoMovieAngleRange,
  IAutoMovieFlexedAbduction,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

/**
 * A joint's admitted abduction interval at a flexion: its `abduction`
 * interval, the ceiling raised linearly with flexion by its
 * `abductionFlexed` coupling up to that coupling's flexion and held beyond
 * (`IAutoMovieFlexedAbduction`); extension keeps the neutral ceiling.
 *
 * @param constraint The joint's range.
 * @param flexion Its flexion, degrees, or null at rest; a non-finite flexion reads as rest.
 * @returns The interval, the constraint's own when it has no coupling or the flexion adds nothing; null for an immobile axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the linear rise, its ends and the null and non-finite readings.
 * @evidence contracts/development/implementation.md#principled-implementation One closed-form interpolation of the ceiling on the flexion share, the floor unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One share and one interval.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the ceiling moves, and only by the declared coupling.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; the constraint's own interval is returned unchanged where nothing moves.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The clamp, the scan and the validator read the one interval from here.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function abductionRange(
  constraint: IAutoMovieJointConstraint,
  flexion: number | null,
): IAutoMovieAngleRange | null {
  const allowed: IAutoMovieAngleRange | null = constraint.abduction;
  const flexed: IAutoMovieFlexedAbduction | null | undefined =
    constraint.abductionFlexed;
  if (allowed === null || flexed === undefined || flexed === null)
    return allowed;
  const f: number = flexion === null || !Number.isFinite(flexion) ? 0 : flexion;
  const share: number = Math.min(1, Math.max(0, f / flexed.flexion));
  return share === 0
    ? allowed
    : {
        min: allowed.min,
        max: allowed.max + (flexed.max - allowed.max) * share,
      };
}
