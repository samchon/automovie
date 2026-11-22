import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/** How many seconds' postures one writer keeps before it starts afresh: a few seconds read at the audit's grid many times over. */
const KEPT: number = 4096;

/**
 * A jump's ground writer read once per second it is asked at.
 *
 * The push-off and the landing clear the arms against the bent legs
 * (`jumpGroundPosture`), a search over the arm's swing. A take that lays an
 * overlay over the jump rebuilds and audits it, reading the jump's posture
 * at the same seconds again and again; the posture at a second is the same
 * every time (the jump's plan is fixed once planned), so it is kept the
 * first time and handed back after. The kept postures are dropped when
 * `KEPT` seconds have been read.
 *
 * @param write The ground writer.
 * @returns The writer, each second's posture computed once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cost it saves, why a second's posture is fixed, and the bound.
 * @evidence contracts/development/implementation.md#principled-implementation The plan is a pure function of the second once planned, so its value at a second is reused; a different channel request is not kept.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map, one lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the full posture is kept; a channel-restricted read goes to the writer.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time reads after the first at a second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same second's posture is computed once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most `KEPT` postures, dropped together.
 */
export function jumpGroundMemo(
  write: IAutoMovieMotionHumanActionPlan["posture"],
): IAutoMovieMotionHumanActionPlan["posture"] {
  const kept: Map<number, IAutoMovieMotionHumanPosture> = new Map();
  return (
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => {
    if (channels !== undefined)
      return write(seconds, channels, resolution, projection);
    const known: IAutoMovieMotionHumanPosture | undefined = kept.get(seconds);
    if (known !== undefined) return known;
    const posture: IAutoMovieMotionHumanPosture = write(
      seconds,
      channels,
      resolution,
      projection,
    );
    if (kept.size >= KEPT) kept.clear();
    kept.set(seconds, posture);
    return posture;
  };
}
