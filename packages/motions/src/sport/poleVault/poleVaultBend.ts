import { pinnedElastica } from "@automovie/engine";
import type { IAutoMovieAffordance } from "@automovie/interface";

import { poleVaultSwing } from "./poleVaultSwing";

/**
 * A vaulting pole's bend through a swing, as its hinged chain shows it.
 *
 * The pole between the planted tip and the top hand is the pinned elastica
 * whose chord is the swing's (`pinnedElastica`; Timoshenko and Gere 1961,
 * 짠2.7), the shape Linthorne 2000's force law is drawn from (Hubbard 1980's
 * elastica without an end moment); above the hand the pole runs straight on.
 * The elastica's parameter is solved once at each of the swing's integrated
 * instants and read between them linearly. The chain's links (the vaulting
 * pole's hinges, `createVaultingPole`) take the discrete elastic rod's reading
 * of a smooth curve (Bergou, Wardetzky, Robinson, Audoly and Grinspun 2008,
 * "Discrete Elastic Rods", SIGGRAPH, 짠4.1): each hinge turns by the curve's
 * integrated curvature over its dual domain, from the middle of the link below
 * it to the middle of the link above, so each link lies along the curve's
 * tangent at its middle.
 *
 * @param swing The swing.
 * @param affordances The pole's affordances, its hinges among them, in the
 *   pole's own frame with its plant end at the origin and its length along
 *   `+Y`.
 * @returns The bend's reader.
 */
export function poleVaultBend(
  swing: poleVaultSwing.ISwing,
  affordances: readonly IAutoMovieAffordance[],
): poleVaultBend.IBend {
  const length: number = swing.length;
  const hinges: readonly IAutoMovieAffordance[] = affordances
    .filter((a: IAutoMovieAffordance): boolean => a.kind === "hinge")
    .sort(
      (a: IAutoMovieAffordance, b: IAutoMovieAffordance): number =>
        a.frame.translation.y - b.frame.translation.y,
    );

  // Each link's ends along the pole from the tip: the hinges' places, the
  // topmost link running on to the top hand and past it.
  const ends: readonly number[] = [
    0,
    ...hinges.map((h: IAutoMovieAffordance): number => h.frame.translation.y),
  ];
  const middles: readonly number[] = ends.map(
    (at: number, j: number): number =>
      j + 1 < ends.length
        ? (at + ends[j + 1]!) / 2
        : at + (at - ends[j - 1]!) / 2,
  );
  const parameters: readonly number[] = swing.samples.map(
    (sample: poleVaultSwing.ISample): number =>
      pinnedElastica.parameter(
        Math.min(
          1,
          Math.hypot(sample.position.forward, sample.position.up) / length,
        ),
      ),
  );
  const parameter: (seconds: number) => number = (seconds: number): number => {
    if (seconds >= swing.duration) return parameters.at(-1)!;
    const k: number = Math.min(
      parameters.length - 2,
      Math.floor(Math.max(0, seconds) / poleVaultSwing.STEP),
    );
    if (k < 0) return parameters[0]!;
    const from: number = swing.samples[k]!.seconds;
    const to: number = swing.samples[k + 1]!.seconds;
    const progress: number = Math.max(0, (seconds - from) / (to - from));
    return parameters[k]! + (parameters[k + 1]! - parameters[k]!) * progress;
  };
  // A link's direction from the elastica's chord, toward the bow.
  const direction: (m: number, j: number) => number = (
    m: number,
    j: number,
  ): number => pinnedElastica.slope(m, Math.min(1, middles[j]! / length));
  return {
    hinges: hinges.map((h: IAutoMovieAffordance): string => h.id),
    turn: (k: number, seconds: number): number => {
      const m: number = parameter(seconds);
      return ((direction(m, k) - direction(m, k + 1)) * 180) / Math.PI;
    },
    chain: (seconds: number): poleVaultBend.IChain => {
      const m: number = parameter(seconds);
      let along: number = 0;
      let across: number = 0;
      let grip: number = 0;
      for (let j: number = 0; j < ends.length; j++) {
        const angle: number = direction(m, j);
        const run: number =
          Math.min(length, j + 1 < ends.length ? ends[j + 1]! : length) -
          ends[j]!;
        if (run <= 0) break;
        along += run * Math.cos(angle);
        across += run * Math.sin(angle);
        grip = angle;
      }
      const chord: number = Math.hypot(along, across);
      return { chord, top: grip - Math.atan2(across, along) };
    },
  };
}

/** Companion types of {@link poleVaultBend}. */
export namespace poleVaultBend {
  /** The bent chain at an instant of the swing. */
  export interface IChain {
    /** The chain's chord from the tip to the top hand, metres. */
    chord: number;

    /**
     * The direction of the link the top hand holds from that chord, radians,
     * toward the bow.
     */
    top: number;
  }

  /** A bend's reader. */
  export interface IBend {
    /** The hinges' ids, from the tip up. */
    hinges: readonly string[];

    /**
     * A hinge's travel at a second of the swing, degrees: the turn from the
     * link below it to the link above.
     *
     * @param k The hinge's index in `hinges`.
     * @param seconds Seconds after the plant.
     * @returns The travel.
     */
    turn(k: number, seconds: number): number;

    /**
     * The chain at a second of the swing.
     *
     * @param seconds Seconds after the plant.
     * @returns Its chord and the held link's direction.
     */
    chain(seconds: number): IChain;
  }
}
