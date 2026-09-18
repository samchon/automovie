import { IAutoMovieFormationSlotMotion, IAutoMovieFormationSlotState } from "@automovie/interface";
import { easingProgress } from "./easingProgress";
import { lerp } from "./lerp";
import { IDENTITY_FORMATION_SLOT_STATE } from "./IDENTITY_FORMATION_SLOT_STATE";

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
 * Cost is the number of cues that name this slot, which is why the channel is
 * sparse: a crowd of a hundred thousand pays for the three exceptions it has.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-group-state Resolves one slot's sparse presence, offset, and facing exception without expanding the formation into per-member tracks.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Retains the latest member exception and interpolates its active cue on the same shot-local clock as group motion.
 */
export const sampleFormationSlotMotion = (
  motions: readonly IAutoMovieFormationSlotMotion[],
  formation: string,
  slot: number,
  time: number,
): IAutoMovieFormationSlotState => {
  const cues = motions
    .filter((cue) => cue.formation === formation && cue.slots.includes(slot))
    .sort(
      (left, right) =>
        left.start - right.start ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
    );
  if (cues.length === 0 || time < cues[0]!.start)
    return IDENTITY_FORMATION_SLOT_STATE;
  let retained = cues[0]!.from;
  for (const cue of cues) {
    if (time < cue.start) return retained;
    if (time < cue.end) {
      const progress = easingProgress(
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
