import type { IFighterMeasure } from "../../laws/kickboxing/IFighterMeasure";
import { KickboxingRange } from "../../laws/kickboxing/KickboxingRange";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";
import { StanceShape } from "../../laws/kickboxing/StanceShape";

/**
 * The research ranges the picture measures are accepted inside, by measure
 * name. Range bounds in metres come from the two fighters' own measures,
 * because no source fixes a fighting distance in metres; every other bound
 * is a named research value.
 *
 * ```ts
 * const ranges = PictureTargets.of(a.body.measure, b.body.measure);
 * PictureTargets.annotate(measures, ranges); // adds knee-flexion-min, -max...
 * PictureTargets.outside(measures, ranges); // the measures out of range
 * ```
 *
 * @evidence docs/research/kickboxing/ring-generalship.md#targets Distance by phase, close share, footwork travel, lateral share and idle share.
 * @evidence docs/research/kickboxing/ring-generalship.md#stance Stance knee flexion inside 25–45 degrees.
 * @evidence docs/research/kickboxing/techniques.md#reach Outside range a step beyond the teep; no fixed range in metres.
 * @evidence docs/research/cinematography/fight-coverage.md#targets Both fighters' feet in frame for at least 80% of the film.
 * @evidence docs/research/kickboxing/techniques.md#kick-timing Peak metatarsal speed of the measured Muay Thai kicks.
 */
export namespace PictureTargets {
  /** An accepted range of one measure. */
  export interface IRange {
    /** Least accepted value; -Infinity when unbounded below. */
    min: number;

    /** Greatest accepted value; Infinity when unbounded above. */
    max: number;

    /** The research section that states it. */
    source: string;
  }

  /** Greatest share of open-phase instants at close range: one in ten (ring generalship targets). */
  export const CLOSE_SHARE_MAX: number = 0.1;

  /** Least foot travel, metres per fighter-minute: a third of a 0.35 s cadence of half-stance steps (ring generalship targets). */
  export const FOOT_TRAVEL_MIN: number = 20;

  /** Least lateral share of the foot travel: 30% of the footwork path across the fighters' line (ring generalship targets). */
  export const LATERAL_SHARE_MIN: number = 0.3;

  /** Greatest share of fighter-instants with no hand or foot moving: one in ten (ring generalship targets). */
  export const IDLE_SHARE_MAX: number = 0.1;

  /** Median peak fist end-point speed of punches, metres per second: measured crosses to lead hooks, 7.3-12 m/s (Frontiers in Sports and Active Living 2024), around the single maximal cross's 8.22 ± 1.08 m/s (Piorkowski, Lees and Barton 2011). */
  export const PUNCH_PEAK_SPEED: readonly [number, number] = [7.3, 12];

  /** Median peak metatarsal (midfoot) speed of round kicks, metres per second: Muay Thai maximum linear foot velocity 13.24 ± 2.30 m/s, one standard deviation either side (Gavagan and Sayers 2017, Table 2). */
  export const KICK_PEAK_SPEED: readonly [number, number] = [
    13.24 - 2.3,
    13.24 + 2.3,
  ];

  /** Least share of the film showing both fighters' feet (fight-coverage targets). */
  export const FEET_IN_FRAME_MIN: number = 0.8;

  const GENERALSHIP: string = "docs/research/kickboxing/ring-generalship.md";

  /**
   * The accepted ranges for two fighters: the outside-range distance at
   * least the shorter teep range; the exchange distance between the
   * shortest punch range and the longer outside range, in either direction.
   *
   * @param a The first fighter's measure.
   * @param b The second fighter's measure.
   * @returns Ranges by measure name.
   */
  export function of(
    a: IFighterMeasure,
    b: IFighterMeasure,
  ): Record<string, IRange> {
    const pairs: [IFighterMeasure, IFighterMeasure][] = [
      [a, b],
      [b, a],
    ];
    const punches: KickboxingTechnique.Name[] = (
      Object.keys(KickboxingTechnique.table) as KickboxingTechnique.Name[]
    ).filter((n) => KickboxingTechnique.table[n].family === "punch");
    const range = (min: number, max: number, source: string): IRange => ({
      min,
      max,
      source,
    });
    return {
      "distance-outside": range(
        Math.min(...pairs.map(([x, y]) => KickboxingRange.of(x, y, "teep"))),
        Infinity,
        `${GENERALSHIP}#targets`,
      ),
      "distance-exchange": range(
        Math.min(
          ...pairs.flatMap(([x, y]) =>
            punches.map((n) => KickboxingRange.of(x, y, n)),
          ),
        ),
        Math.max(...pairs.map(([x, y]) => KickboxingRange.outside(x, y))),
        `${GENERALSHIP}#targets`,
      ),
      "close-share": range(0, CLOSE_SHARE_MAX, `${GENERALSHIP}#targets`),
      "knee-flexion": range(
        StanceShape.KNEE_FLEXION_RANGE[0],
        StanceShape.KNEE_FLEXION_RANGE[1],
        `${GENERALSHIP}#stance`,
      ),
      "foot-travel-per-minute": range(
        FOOT_TRAVEL_MIN,
        Infinity,
        `${GENERALSHIP}#targets`,
      ),
      "foot-lateral-share": range(
        LATERAL_SHARE_MIN,
        1,
        `${GENERALSHIP}#targets`,
      ),
      "idle-share": range(0, IDLE_SHARE_MAX, `${GENERALSHIP}#targets`),
      "punch-peak-speed": range(
        PUNCH_PEAK_SPEED[0],
        PUNCH_PEAK_SPEED[1],
        "docs/research/kickboxing/techniques.md#punch-timing",
      ),
      "kick-peak-speed": range(
        KICK_PEAK_SPEED[0],
        KICK_PEAK_SPEED[1],
        "docs/research/kickboxing/techniques.md#kick-timing",
      ),
      "feet-in-frame": range(
        FEET_IN_FRAME_MIN,
        1,
        "docs/research/cinematography/fight-coverage.md#targets",
      ),
    };
  }

  /**
   * The measures with each ranged measure's finite bounds beside it, as
   * `<name>-min` and `<name>-max`, and `picture-out-of-range`, the count of
   * ranged measures outside their range or missing.
   *
   * @param measures The picture measures.
   * @param ranges The accepted ranges.
   * @returns A new record.
   */
  export function annotate(
    measures: Readonly<Record<string, number>>,
    ranges: Readonly<Record<string, IRange>>,
  ): Record<string, number> {
    const result: Record<string, number> = { ...measures };
    for (const [name, r] of Object.entries(ranges)) {
      if (Number.isFinite(r.min)) result[`${name}-min`] = r.min;
      if (Number.isFinite(r.max)) result[`${name}-max`] = r.max;
    }
    result["picture-out-of-range"] = outside(measures, ranges).length;
    return result;
  }

  /**
   * The ranged measures outside their range or missing, as findings.
   *
   * @param measures The picture measures.
   * @param ranges The accepted ranges.
   * @returns One line per measure out of range, naming the value, the range and its source.
   */
  export function outside(
    measures: Readonly<Record<string, number>>,
    ranges: Readonly<Record<string, IRange>>,
  ): string[] {
    const lines: string[] = [];
    for (const [name, r] of Object.entries(ranges)) {
      const value: number | undefined = measures[name];
      if (value !== undefined && value >= r.min && value <= r.max) continue;
      lines.push(
        `${name}: ${value === undefined ? "missing" : value.toFixed(3)} outside [${r.min.toFixed(3)}, ${r.max.toFixed(3)}] (${r.source})`,
      );
    }
    return lines;
  }
}
