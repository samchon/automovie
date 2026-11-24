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
 * @param props Finite start, positive duration, supported endpoint travels and
 *   optional crossing.
 * @returns A pure scalar track with held endpoints and an optional launch.
 * @throws {AutoMovieArchetypeRefusal} For unsupported clock, range, endpoint
 *   difference, crossing or rate.
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
