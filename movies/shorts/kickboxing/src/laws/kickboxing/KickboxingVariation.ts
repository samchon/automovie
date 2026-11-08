import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";

import type { IFighterMeasure } from "./IFighterMeasure";
import type { KickboxingAction } from "./KickboxingAction";
import { KickboxingTechnique } from "./KickboxingTechnique";
import { KickboxingTiming } from "./KickboxingTiming";

/**
 * Seeded variation of the continuous intent parameters a performer leaves
 * open, drawn from the film seed and the intent's stable id, each inside a
 * domain derived from the laws so the outcome class never changes: how far
 * a defending limb closes its corridor, how late an answer starts within
 * the time its class allows, where on the struck region the weapon lands,
 * the angle a step-in leaves on, and how fast a kick's leg returns within
 * its recoil. An answer waits at most half the time its class allows, so its
 * own movement never gets less time than its wait. Timings and outcomes are not drawn, so every screenplay anchor
 * holds for every seed.
 *
 * ```ts
 * KickboxingVariation.answer("kickboxing", "s01-b04/1", "parry", "cross", 0.35, measure);
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#punch-timing The alternating interval's spread, 0.46 / 3 s, bounds an answer's lateness.
 * @evidence docs/research/kickboxing/techniques.md#kick-timing The recoil's spread, 0.17 s, bounds how fast the leg returns.
 * @evidence docs/research/kickboxing/techniques.md#defenses A defense begins at the attack's launch and completes by its contact.
 * @evidence docs/research/kickboxing/exchanges.md#outcomes The outcome table decides; variation only realizes it.
 */
export namespace KickboxingVariation {
  /** Spread of the alternating-hand interval, seconds (Piorkowski et al. 2011: ±0.46 s over three intervals). */
  export const LATENESS: number = 0.46 / 3;

  /** Spread of the kick's recoil, seconds (Gavagan and Sayers 2017: 0.65 ± 0.17 s). */
  export const RECOIL_SPREAD: number = 0.17;

  /** An answer's drawn parameters. */
  export interface IAnswer {
    /** Seconds after the strike's launch the answer starts moving, inside its class's time. */
    lateness: number;

    /** Share of the full defensive shape reached, in (0, 1]. */
    coverage: number;
  }

  /** A strike's drawn parameters. */
  export interface IStrike {
    /** Offset of the contact along the struck region's surface, metres. */
    point: number;

    /** Seconds the kicking leg takes back to the replant, at most the measured recoil. */
    recoil: number;
  }

  /**
   * The domain of an answer's lateness: from its start to the answer's
   * spread, never past the instant its class needs it complete (the answered
   * contact, or for a habit the time it fires by).
   *
   * @param ready Seconds from the strike's launch by which the answer is complete.
   * @returns The upper bound, seconds; the lower is zero.
   * @evidence docs/research/kickboxing/techniques.md#punch-timing The interval's spread.
   */
  export function lateness(ready: number): number {
    return Math.max(0, Math.min(LATENESS, ready / 2));
  }

  /**
   * The domain of a defense's coverage: its shortfall stays within one
   * glove radius over an arm's reach, so the defending glove or forearm
   * still covers the corridor its class closes. A taken blow has no
   * defensive shape and keeps full coverage.
   *
   * @param measure The defender's measure.
   * @returns The lower bound; the upper is one.
   * @evidence docs/research/kickboxing/techniques.md#defenses A block or parry places the glove or forearm across the line.
   */
  export function coverage(measure: IFighterMeasure): number {
    return 1 - measure.gloveRadius / measure.armReach;
  }

  /**
   * The domain of a contact offset: half the striking surface's width, the
   * glove radius for a punch and the foot's thickness (ankle height) for a
   * kick or knee, so the weapon still covers the region's point.
   *
   * @param spec The technique.
   * @param measure The striker's measure.
   * @returns The bound, metres, either way along the surface.
   * @evidence docs/research/kickboxing/techniques.md#surfaces The weapon surface meets the region.
   */
  export function point(
    spec: KickboxingTechnique.ISpec,
    measure: IFighterMeasure,
  ): number {
    return spec.limb === "arm" ? measure.gloveRadius : measure.ankle;
  }

  /**
   * The domain of a step-in's angle: between its first direction and the
   * straight line to where it lands, the stance's own half width over the
   * range, so the bowed path strays no wider than the stance; the landing
   * itself is the footwork law's.
   *
   * @param measure The mover's measure.
   * @param range The range he steps to, metres.
   * @returns The bound, radians, either way.
   * @evidence docs/research/kickboxing/ring-generalship.md#movements The attacker steps in to range on the opponent.
   */
  export function angle(measure: IFighterMeasure, range: number): number {
    return Math.atan2(measure.hipHalfWidth, Math.max(range, measure.foot));
  }

  /**
   * An answer's draw.
   *
   * @param seed The film seed.
   * @param id The answered strike's anchor.
   * @param answer The answer.
   * @param ready Seconds from the launch by which its class needs it complete.
   * @param measure The defender's measure.
   * @returns The drawn parameters.
   */
  export function answer(
    seed: string,
    id: string,
    answer: KickboxingAction.Answer,
    ready: number,
    measure: IFighterMeasure,
  ): IAnswer {
    const random = createAutoMovieRandom(
      deriveAutoMovieSeed(seed, "answer", id),
    );
    if (answer === "take") return { lateness: 0, coverage: 1 };
    const low: number = coverage(measure);
    return {
      lateness: random.float(0) * lateness(ready),
      coverage: low + (1 - low) * random.float(1),
    };
  }

  /**
   * A strike's draw.
   *
   * @param seed The film seed.
   * @param id The strike's anchor.
   * @param technique The technique.
   * @param measure The striker's measure.
   * @returns The drawn parameters.
   */
  export function strike(
    seed: string,
    id: string,
    technique: KickboxingTechnique.Name,
    measure: IFighterMeasure,
  ): IStrike {
    const random = createAutoMovieRandom(
      deriveAutoMovieSeed(seed, "strike", id),
    );
    const spec: KickboxingTechnique.ISpec =
      KickboxingTechnique.table[technique];
    return {
      point: (random.float(0) * 2 - 1) * point(spec, measure),
      recoil: KickboxingTiming.KICK_RECOIL - random.float(1) * RECOIL_SPREAD,
    };
  }

  /**
   * A step-in's drawn angle.
   *
   * @param seed The film seed.
   * @param id The step-in's anchor.
   * @param measure The mover's measure.
   * @param range The range he steps to.
   * @returns Radians off the line, signed.
   */
  export function approach(
    seed: string,
    id: string,
    measure: IFighterMeasure,
    range: number,
  ): number {
    const random = createAutoMovieRandom(
      deriveAutoMovieSeed(seed, "approach", id),
    );
    return (random.float(0) * 2 - 1) * angle(measure, range);
  }
}
