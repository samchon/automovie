import { ArchetypeTrackProfile } from "./ArchetypeTrackProfile";
import { ArchetypeTrackRange } from "./ArchetypeTrackRange";
import { ArchetypeTrackTime } from "./ArchetypeTrackTime";
import type { AutoMovieArchetype } from "./AutoMovieArchetype";
import type { AutoMovieArchetypeTrack } from "./AutoMovieArchetypeTrack";

/**
 * Prepare the public mechanism ease on the same minimum-jerk profile.
 *
 * @param archetype The articulation's model and refusal name.
 * @param articulation The articulation to carry between two travels.
 * @param props Finite start, positive duration, supported endpoint travels and optional crossing.
 * @returns A pure scalar track with held endpoints and an optional launch.
 * @throws {AutoMovieArchetypeRefusal} For unsupported clock, range, endpoint difference, crossing or rate.
 * @evidence contracts/development/common.md#meaningful-documentation States prepared scalar inputs, clock/range premises and represented event instants; AutoMovieArchetypeTrack.ease documents the study and provisional mechanical use.
 * @evidence contracts/development/implementation.md#principled-implementation ArchetypeTrackProfile owns the unchanged quintic and its conditioned value/inverse/rate. The original sample is compared against held boundaries before elapsed/remaining time; FastTwoSum's prepared end residual preserves the actual remaining time when whole-span subtraction rounds to duration.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Snapshot/admit input scalars, prepare one profile and clock residual, then return the scalar reader and optional crossing.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No range margin, curve, measured bound or sample time is changed or clamped. Unsupported clock resolution refuses instead of moving an event.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two range admissions, constant-time playback and one profile crossing when requested; range admission owns its existing neutral-pose cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Clock/range/profile owners prepare one independent track, with no geometry rebuilding or inverse calculation per sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only prepared scalar values and the profile closures escape; the mutable input record and model are not retained by playback.
 */
export function ArchetypeTrackEase<Id extends string>(
  archetype: AutoMovieArchetype<Id, string>,
  articulation: Id,
  props: {
    start: number;
    from: number;
    to: number;
    seconds: number;
    launch?: number;
  },
): AutoMovieArchetypeTrack.ITrack<Id> {
  const name: string = archetype.archetype;
  const start: number = props.start;
  const seconds: number = props.seconds;
  const from: number = props.from;
  const to: number = props.to;
  const requested: number | undefined = props.launch;
  const end: number = ArchetypeTrackTime.end(name, start, seconds);
  const error: number = ArchetypeTrackTime.roundingError(start, seconds, end);
  ArchetypeTrackRange(archetype, articulation, "from", from, [from]);
  ArchetypeTrackRange(archetype, articulation, "to", to, [to]);
  const profile: ReturnType<typeof ArchetypeTrackProfile> =
    ArchetypeTrackProfile(name, from, to, seconds);
  let launch: AutoMovieArchetypeTrack.ILaunch | null = null;
  if (requested !== undefined) {
    const event: ReturnType<typeof profile.crossing> =
      profile.crossing(requested);
    launch = {
      seconds: ArchetypeTrackTime.instant(
        name,
        start,
        end,
        seconds,
        event.offset,
        event.fromEnd,
        error,
      ),
      travel: requested,
      rate: event.rate,
    };
  }
  return {
    articulation,
    start,
    end,
    launch,
    travel: (sample: number): number => {
      const elapsed: number = ArchetypeTrackTime.elapsed(
        name,
        sample,
        start,
        end,
        seconds,
      );
      if (sample <= start) return from;
      if (sample >= end) return to;
      const remaining: number = end - sample + error;
      return elapsed <= remaining
        ? profile.value(elapsed / seconds, false)
        : profile.value(remaining / seconds, true);
    },
  };
}
