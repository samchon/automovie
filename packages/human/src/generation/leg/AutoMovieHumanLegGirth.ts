import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The girth the leg's section asks for along the walk: each tape at its
 * published site, the landmark shares between, and a monotone cubic through
 * them (Fritsch and Carlson), so every run between two knots rises or falls
 * once and no combination of tapes makes a section overshoot its knots.
 *
 * Sites: the calf tape at the leg's maximum girth below the knee (the shank
 * landmark where the references' calf peaks), the knee tape at mid-patella,
 * {@link MID_PATELLA} under the knee centre (the references: 36 mm; ANSUR II
 * puts it 16.9 mm below the lateral epicondyle in women and 3.3 mm in men,
 * with the joint centre at the epicondyles), and the thigh tape at the
 * widest girth just under the crotch (ISO 8559-1 5.3.20). The shares between
 * are the references' girths over their own calf maximum (shank) or thigh
 * maximum (thigh) at each landmark row, their medians over f1, f2, m1 and m2.
 */
export namespace AutoMovieHumanLegGirth {
  /** The tapes the law reads, mm. */
  export interface ITapes {
    /** Thigh girth. */
    thigh: number;

    /** Knee girth at mid-patella. */
    knee: number;

    /** Calf girth at its maximum. */
    calf: number;
  }

  /** What the law is placed from. */
  export interface IInput {
    /** The tapes. */
    tapes: ITapes;

    /** The joints' heights, mm. */
    bones: AutoMovieHumanLegStations.IBones;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** The neighbours' rings, each a knot at its own station with its taut girth, `[girth]`. */
    ends?: AutoMovieHumanLegProfile.IEnds;
  }

  /** Mid-patella under the knee centre, world mm: the median of the references (f1 38, f2 34, m1 36, m2 36). */
  export const MID_PATELLA: number = 36;

  /**
   * Shank rows, `[share of the shank, girth over the calf tape]`: the medians
   * over the four references of the hull girth at the row over the person's
   * own calf maximum (rows 0.15 to 0.65). The rows 0.07 (29 mm under the knee
   * centre) is the knee tape's site's neighbour and is left to the knee knot.
   */
  export const SHANK: readonly (readonly [number, number])[] = [
    [0.15, 0.924],
    [0.25, 0.972],
    [0.35, 1],
    [0.5, 0.903],
    [0.65, 0.741],
    [0.8, 0.626],
    [0.9, 0.604],
  ];

  /**
   * Thigh rows, `[share of the thigh, girth over the thigh tape]`: the same
   * over the person's own maximum over the thigh rows (0.25 is the widest).
   * The row 1 is the knee centre and is left to the knee knot.
   */
  export const THIGH: readonly (readonly [number, number])[] = [
    [0.25, 1],
    [0.35, 0.96],
    [0.5, 0.893],
    [0.65, 0.801],
    [0.8, 0.687],
    [0.9, 0.635],
  ];

  /**
   * The thigh tape's site, a share of the thigh from the hip centre: the
   * input's declared definition, ISO 8559-1 5.3.20, the widest girth under the
   * gluteal fold, which is the thigh row 0.25 (the references' widest row).
   * The thigh rows are read relative to their own ratio here, so the tape
   * stands at this share whatever row it falls between; an input measured at
   * another site moves only this declaration.
   */
  export const THIGH_SITE: number = 0.25;

  /**
   * A table's ratio at a share: linear between its two rows either side, held
   * at the end rows past them.
   *
   * @param table Rows `[share, ratio]` by increasing share.
   * @param share The share read.
   */
  export function ratioAt(table: readonly (readonly [number, number])[], share: number): number {
    if (share <= table[0]![0]) return table[0]![1];
    for (let i: number = 1; i < table.length; i++) {
      const [s0, r0]: readonly [number, number] = table[i - 1]!;
      const [s1, r1]: readonly [number, number] = table[i]!;
      if (share <= s1) return r0 + ((r1 - r0) * (share - s0)) / (s1 - s0);
    }
    return table[table.length - 1]![1];
  }

  /**
   * The girth law.
   *
   * @param input The tapes, the joints and the scale.
   * @returns The girth the section asks for at a station, mm, held at the end knots past them.
   */
  export function of(input: IInput): (s: number) => number {
    const tapes: ITapes = input.tapes;
    const bones: AutoMovieHumanLegStations.IBones = input.bones;
    const thighSite: number = ratioAt(THIGH, THIGH_SITE);
    const knots: [number, number][] = [
      ...[...SHANK].reverse().map(([share, ratio]: readonly [number, number]): [number, number] => [
        AutoMovieHumanLegStations.heightAt(bones, "shank", share),
        ratio * tapes.calf,
      ]),
      [bones.knee - MID_PATELLA * input.scale, tapes.knee],
      ...[...THIGH].reverse().map(([share, ratio]: readonly [number, number]): [number, number] => [
        AutoMovieHumanLegStations.heightAt(bones, "thigh", share),
        (ratio / thighSite) * tapes.thigh,
      ]),
    ];

    // Heights must rise strictly through the knots: shank rows, the knee site, thigh rows.
    for (let i: number = 1; i < knots.length; i++)
      if (!(knots[i]![0] > knots[i - 1]![0])) throw new Error("The girth law's sites are not in order along the leg");

    // The rings are the law's first and last knots, by the table's ring rule.
    const end: (e: AutoMovieHumanLegProfile.IEnd | undefined) => AutoMovieHumanLegProfile.IKnot | undefined = (
      e: AutoMovieHumanLegProfile.IEnd | undefined,
    ): AutoMovieHumanLegProfile.IKnot | undefined =>
      e === undefined ? undefined : { at: e.at, value: e.values[0]! };
    const joined: [number, number][] = AutoMovieHumanLegProfile.joined(
      knots.map(([at, value]: [number, number]): AutoMovieHumanLegProfile.IKnot => ({ at, value })),
      end(input.ends?.bottom),
      end(input.ends?.top),
    ).map((k: AutoMovieHumanLegProfile.IKnot): [number, number] => [k.at, k.value]);
    return (s: number): number => AutoMovieHumanMonotoneCubic.interpolate(joined, s);
  }
}
