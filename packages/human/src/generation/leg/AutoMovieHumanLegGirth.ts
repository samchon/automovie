import type {
  IAutoMovieHumanLegGirth,
  IAutoMovieHumanLegProfile,
  IAutoMovieHumanLegStations,
} from "@automovie/interface";

import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanLegSites } from "../AutoMovieHumanLegSites";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/** Smooth girth law through actual tapes and the adjacent rings. */
export namespace AutoMovieHumanLegGirth {
  /**
   * Legacy mid-patella offset from the anatomical knee centre, millimetres.
   * ANSUR II male and female mean offsets below the lateral epicondyle are 3.3
   * and 16.9 mm. ESTIMATE: use their midpoint as a sagittal proxy.
   */
  export const MID_PATELLA: number = (3.3 + 16.9) / 2;

  /** ANSUR 1988 nominal calf site expressed from knee toward ankle. */
  export const CALF_SITE: number =
    1 -
    (AutoMovieHumanLegSites.CALF_SHARE[0] +
      AutoMovieHumanLegSites.CALF_SHARE[1]) /
      2;

  /** The calf tape is the only supported internal shank girth. */
  export const SHANK: readonly (readonly [number, number])[] = [[CALF_SITE, 1]];

  /**
   * ESTIMATE: the proximal quarter is the fallback when furrow height is
   * absent.
   */
  export const THIGH_SITE: number = 1 / 4;

  /** The given thigh tape supplies the only independent internal thigh girth. */
  export const THIGH: readonly (readonly [number, number])[] = [
    [THIGH_SITE, 1],
  ];

  /**
   * A table's ratio at a share: linear between its two rows either side, held
   * at the end rows past them.
   *
   * @param table Rows `[share, ratio]` by increasing share.
   * @param share The share read.
   */
  export function ratioAt(
    table: IAutoMovieHumanLegGirth.RatioAtTable,
    share: number,
  ): number {
    if (share <= table[0]![0]) return table[0]![1];
    for (let i: number = 1; i < table.length; i++) {
      const [s0, r0]: readonly [number, number] = table[i - 1]!;
      const [s1, r1]: readonly [number, number] = table[i]!;
      if (share <= s1) return r0 + ((r1 - r0) * (share - s0)) / (s1 - s0);
    }
    return table[table.length - 1]![1];
  }

  /**
   * The thigh tape's station: the person's furrow height when it stands above
   * the knee so that the tape preserves station order, else {@link THIGH_SITE}
   * of the thigh.
   *
   * @param input The law's input.
   * @returns The station, mm.
   */
  export function tapeStation(input: IAutoMovieHumanLegGirth.IInput): number {
    const share: number = AutoMovieHumanLegStations.heightAt(
      input.bones,
      "thigh",
      THIGH_SITE,
    );
    const next: number = input.bones.knee;
    return input.site !== undefined &&
      Number.isFinite(input.site) &&
      input.site > next
      ? input.site
      : share;
  }

  /**
   * The girth law.
   *
   * @param input The tapes, the joints and the scale.
   * @returns The girth the section asks for at a station, mm, held at the end
   *   knots past them.
   */
  export function of(
    input: IAutoMovieHumanLegGirth.IInput,
  ): IAutoMovieHumanLegGirth.OfResult {
    const tapes: IAutoMovieHumanLegGirth.ITapes = input.tapes;
    const bones: IAutoMovieHumanLegStations.IBones = input.bones;
    const thighSite: number = ratioAt(THIGH, THIGH_SITE);
    const knots: [number, number][] = [
      ...[...SHANK]
        .reverse()
        .map(([share, ratio]: readonly [number, number]): [number, number] => [
          AutoMovieHumanLegStations.heightAt(bones, "shank", share),
          ratio * tapes.calf,
        ]),
      [bones.knee - MID_PATELLA * input.scale, tapes.knee],
      ...[...THIGH]
        .reverse()
        .map(([share, ratio]: readonly [number, number]): [number, number] => [
          share === THIGH_SITE
            ? tapeStation(input)
            : AutoMovieHumanLegStations.heightAt(bones, "thigh", share),
          (ratio / thighSite) * tapes.thigh,
        ]),
    ];

    // Heights must rise strictly through the knots: shank rows, the knee site, thigh rows.
    for (let i: number = 1; i < knots.length; i++)
      if (!(knots[i]![0] > knots[i - 1]![0]))
        throw new Error("The girth law's sites are not in order along the leg");

    // The rings are the law's first and last knots, by the table's ring rule.
    const end: (
      e: IAutoMovieHumanLegProfile.IEnd | undefined,
    ) => IAutoMovieHumanLegProfile.IKnot | undefined = (
      e: IAutoMovieHumanLegProfile.IEnd | undefined,
    ): IAutoMovieHumanLegProfile.IKnot | undefined =>
      e === undefined ? undefined : { at: e.at, value: e.values[0]! };
    const joined: [number, number][] = AutoMovieHumanLegProfile.joined(
      knots.map(
        ([at, value]: [number, number]): IAutoMovieHumanLegProfile.IKnot => ({
          at,
          value,
        }),
      ),
      end(input.ends?.bottom),
      end(input.ends?.top),
    ).map((k: IAutoMovieHumanLegProfile.IKnot): [number, number] => [
      k.at,
      k.value,
    ]);
    return (s: number): number =>
      AutoMovieHumanMonotoneCubic.interpolate(joined, s);
  }
}
