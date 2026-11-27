import type {
  IAutoMovieAngleRange,
  IAutoMovieFlexedAbduction,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

/*
 * A joint's admitted abduction interval at a flexion: its `abduction` interval,
 * the ceiling raised linearly with flexion by its `abductionFlexed` coupling up
 * to that coupling's flexion and held beyond (`IAutoMovieFlexedAbduction`);
 * extension keeps the neutral ceiling.
 * Parameter constraint: The joint's range.
 * Parameter flexion: Its flexion, degrees, or null at rest; a non-finite flexion
 * reads as rest.
 * Returns: The interval, the constraint's own when it has no coupling or the
 * flexion adds nothing; null for an immobile axis.
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
  const f: number = flexion ?? 0;
  const share: number = Math.min(1, Math.max(0, f / flexed.flexion));
  return share === 0
    ? allowed
    : {
        min: allowed.min,
        max: allowed.max + (flexed.max - allowed.max) * share,
      };
}
