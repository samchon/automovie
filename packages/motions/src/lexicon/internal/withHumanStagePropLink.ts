import { AffordanceArticulation, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

/**
 * Attach an authored swing and settle to a digital stage prop's link hinge.
 *
 * Keyframes give hinge travel in degrees at seconds relative to a film instant.
 * The connecting curve stays between neighbouring travels and settles at each
 * key. The performance places and retains the final state. This track gives the
 * connector and its terminal part the same articulation.
 *
 * @param prop A digital prop with a poseable `link` hinge.
 * @param start The film second or schedule cue the track starts at.
 * @param keys At least two ordered keys, starting at zero seconds.
 * @returns The prop with the new track appended.
 * @throws {Error} For a missing hinge or inadmissible time or hinge travel.
 */
export function withHumanStagePropLink(
  prop: IAutoMovieMotionHumanProp,
  start: IAutoMovieMotionHumanProp.ITrack["start"],
  keys: readonly withHumanStagePropLink.IKey[],
): IAutoMovieMotionHumanProp {
  const articulation: string = "link";
  const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
    (prop.affordances ?? []).map(
      (site: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [
        site.id,
        site,
      ],
    ),
  );
  if (byId.get(articulation)?.kind !== "hinge" || prop.articulate === undefined)
    throw new Error(`${prop.subject}.link requires a poseable hinge`);
  if (keys.length < 2 || keys[0]!.seconds !== 0)
    throw new Error("Give the link track at least two keys starting at zero");

  const samples: readonly withHumanStagePropLink.IKey[] = keys.map(
    (
      key: withHumanStagePropLink.IKey,
      index: number,
    ): withHumanStagePropLink.IKey => {
      if (index > 0 && key.seconds <= keys[index - 1]!.seconds)
        throw new Error(
          "Link key seconds must be finite and strictly increasing",
        );
      if (
        !AffordanceArticulation.input(byId, articulation, key.degrees).success
      )
        throw new Error(`Inadmissible hinge travel at link key ${index}`);
      return { ...key };
    },
  );
  const last: withHumanStagePropLink.IKey = samples[samples.length - 1]!;
  const track: IAutoMovieMotionHumanProp.ITrack = {
    articulation,
    start,
    duration: last.seconds,
    travel: (seconds: number): number => {
      if (seconds <= 0) return samples[0]!.degrees;
      if (seconds >= last.seconds) return last.degrees;

      let lower: number = 0;
      let upper: number = samples.length - 1;
      while (upper - lower > 1) {
        const middle: number = Math.floor((lower + upper) / 2);
        if (samples[middle]!.seconds <= seconds) lower = middle;
        else upper = middle;
      }
      const from: withHumanStagePropLink.IKey = samples[lower]!;
      const to: withHumanStagePropLink.IKey = samples[upper]!;
      const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        (seconds - from.seconds) / (to.seconds - from.seconds),
      );
      return from.degrees + share * (to.degrees - from.degrees);
    },
  };
  return { ...prop, tracks: [...(prop.tracks ?? []), track] };
}

/** One key on a scene-authored link track. */
export namespace withHumanStagePropLink {
  /** Hinge travel at a track-local instant. */
  export interface IKey {
    /** Seconds after the track begins. */
    seconds: number;
    /** Hinge travel in degrees. */
    degrees: number;
  }
}
