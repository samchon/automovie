import { IAutoMovieFormationSlotMotion, IAutoMovieFormationSlotState } from "@automovie/interface";
import { IDENTITY_FORMATION_SLOT_STATE } from "./constants/IDENTITY_FORMATION_SLOT_STATE";
import { lerp } from "./lerp";
import { ease } from "./motion/ease";
/**
 * Sample what one named member of a unit is doing differently at one time.
 *
 * The unit-level sampler answers for the whole crowd at once; this answers for
 * one member of it. The retention law is deliberately the same one: identity
 * before the first cue that names this slot, interpolation inside a cue, and
 * the cue's exact `to` state retained after it ends. That is what lets a member
 * removed once stay removed, and a member that fell stay down, without the
 * author restating either every second of the shot.
 *
 * `present` is not interpolated, because half-drawn is not a state a member can
 * be in. Inside a cue the member holds `from.present`; from the cue's end it
 * holds `to.present`, which the retention above already carries. So a cue whose
 * `from` is present and whose `to` is not takes its member out of the shot at
 * the cue's end, and one absent at both ends takes it out at the cue's start.
 *
 * Selection scans all supplied cues and their slot lists before sorting matches
 * by start and code-unit id. Identity and retained states alias module/input
 * records; consumers must treat returned states as read-only.
 *
 * @evidence contracts/common.md#principled-implementation A deterministic start/id cue walk eases numeric offset and heading while present stays discrete until cue end, preserving authored removal and recovery states between cues.
 * @evidence contracts/common.md#clear-and-simple-design Geometry measurement, placement validation and viewer exceptions share the slot state while formation-wide motion stays in its own sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No half-present state is invented; the discrete boundary rule and first-active precedence apply to every named slot without member-specific defaults.
 * @evidence contracts/common.md#meaningful-documentation States presence boundaries, exact target retention, full cue/slot-list selection cost and shared identity/input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Selection costs the total inspected slot-list population, followed by O(C log C) sorting and O(C) walking C matches; temporary storage is O(C).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A different slot or source chronology changes the selected cues, and no cross-query exception index is retained here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Active numeric records are new, but identity and retained states alias shared records; the selection array is temporary and no actor object is retained.
 */
export const sampleFormationSlotMotion: (motions: readonly IAutoMovieFormationSlotMotion[], formation: string, slot: number, time: number) => IAutoMovieFormationSlotState = (
  motions: readonly IAutoMovieFormationSlotMotion[],
  formation: string,
  slot: number,
  time: number,
): IAutoMovieFormationSlotState => {
  const cues: IAutoMovieFormationSlotMotion[] = motions
    .filter((cue: IAutoMovieFormationSlotMotion): boolean => cue.formation === formation && cue.slots.includes(slot))
    .sort(
      (left: IAutoMovieFormationSlotMotion, right: IAutoMovieFormationSlotMotion): number =>
        left.start - right.start ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
  if (cues.length === 0 || time < cues[0]!.start)
    return IDENTITY_FORMATION_SLOT_STATE;
  let retained: IAutoMovieFormationSlotState = cues[0]!.from;
  for (const cue of cues) {
    if (time < cue.start) return retained;
    if (time < cue.end) {
      const progress: number = ease(
        cue.easing,
        Math.max(0, Math.min(1, (time - cue.start) / (cue.end - cue.start))),
      );
      return {
        present: cue.from.present,
        offset: {
          x: lerp(cue.from.offset.x, cue.to.offset.x, progress),
          y: lerp(cue.from.offset.y, cue.to.offset.y, progress),
          z: lerp(cue.from.offset.z, cue.to.offset.z, progress),
        },
        facingOffsetDeg: lerp(
          cue.from.facingOffsetDeg,
          cue.to.facingOffsetDeg,
          progress,
        ),
      };
    }
    retained = cue.to;
  }
  return retained;
};
