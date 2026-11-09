import { Vector3, type IAutoMovieRandom } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanSkill } from "../skill/HumanSkill";

/**
 * Where a strike lands relative to its aim: the author's declared accuracy
 * plus the performer's seeded endpoint scatter.
 *
 * - `hit`: on the aim point; the weapon stops on the first surface it meets.
 * - `graze`: one weapon width beside it; the weapon glances and follows
 *   through.
 * - `miss`: clear of it by two weapon widths and 5 cm; the weapon follows
 *   through.
 * - a vector: that world offset, stopping on whatever it meets.
 *
 * The scatter is impulse variability, a normal draw with the standard
 * deviation `k D / T` of `HumanSkill.scatter` (Schmidt et al. 1979), shaped
 * by skill: a novice scatters isotropically, an expert keeps the error out
 * of the directions that decide the hit, the lateral share falling to 0.3 of
 * the along-line share on the `path` axis (minimal intervention, Todorov and
 * Jordan 2002; provisional share).
 */
export namespace StrikingQuality {
  /** A declared accuracy. */
  export type Accuracy = "hit" | "graze" | "miss" | IAutoMovieVector3;

  /**
   * Half the width of a closed fist, metres: hand breadth is about 0.46 of
   * hand length in adults (Pheasant and Haslegrave, Bodyspace, 3rd ed., hand
   * dimensions: 87 against 189 mm), and the fist is as wide as the hand.
   *
   * @param hand The hand's length, wrist to fingertip, metres.
   * @returns Metres.
   */
  export function fist(hand: number): number {
    return 0.23 * hand;
  }

  /**
   * Whether a weapon stops on the surface it meets under an accuracy.
   *
   * @param accuracy The declared accuracy.
   * @returns False for a graze or a miss, which pass the surface.
   */
  export function stops(accuracy: Accuracy | undefined): boolean {
    return accuracy !== "graze" && accuracy !== "miss";
  }

  /**
   * The landing offset from the aim point.
   *
   * @param input What the offset depends on.
   * @returns World metres.
   */
  export function offset(input: {
    /** The performer's skill. */
    skill: HumanSkill.ISkill;
    /** The strike's scatter stream. */
    random: IAutoMovieRandom;
    /** The declared accuracy; `hit` when absent. */
    accuracy?: Accuracy;
    /** The weapon's travel direction at contact, unit. */
    direction: IAutoMovieVector3;
    /** The weapon's half width, metres. */
    radius: number;
    /** The distance the weapon travels, metres. */
    distance: number;
    /** The delivery time, seconds. */
    seconds: number;
  }): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = Vector3.normalize(input.direction);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const sideways: IAutoMovieVector3 =
      Math.abs(Vector3.dot(d, up)) > 0.95 ? { x: 1, y: 0, z: 0 } : Vector3.normalize(Vector3.cross(up, d));
    const lift: IAutoMovieVector3 = Vector3.cross(d, sideways);
    const accuracy: Accuracy = input.accuracy ?? "hit";
    const declared: IAutoMovieVector3 =
      accuracy === "hit"
        ? { x: 0, y: 0, z: 0 }
        : accuracy === "graze"
          ? Vector3.scale(lift, 2 * input.radius)
          : accuracy === "miss"
            ? Vector3.scale(lift, 4 * input.radius + 0.05)
            : accuracy;
    const sigma: number = HumanSkill.scatter(input.skill, input.distance, input.seconds);
    const lateral: number = HumanSkill.quantity(input.skill, "path", 1, 0.3);
    const scatter: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(d, sigma * HumanSkill.normal(input.random, 0)),
      Vector3.add(
        Vector3.scale(sideways, sigma * lateral * HumanSkill.normal(input.random, 2)),
        Vector3.scale(lift, sigma * lateral * HumanSkill.normal(input.random, 4)),
      ),
    );
    return Vector3.add(declared, scatter);
  }
}
