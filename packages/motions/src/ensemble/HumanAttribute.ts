import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAttribute,
  IAutoMovieMotionHumanAttributeEffects,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanSkill } from "../skill/HumanSkill";

/**
 * A group member's attributes: the named qualities a group's distribution
 * gives each member a number of, and the keyed draws that give them.
 *
 * An attribute is a value in [0, 1]: `discipline` (drill and steadiness, 1
 * the best drilled), `fatigue` (0 fresh, 1 spent) and `morale` (0 broken, 1
 * steady). A group states each as a distribution (`IDistribution`); each
 * member draws its own value from a stream keyed by the chain seed, the
 * ensemble's id, the member's index and the name drawn, so adding a member
 * or an attribute leaves every other draw bit-identical (the keyed streams
 * of `HumanSkill.stream`, Salmon et al. 2011). What an attribute moves is
 * `HUMAN_ATTRIBUTE_EFFECTS`'s; an attribute never decides an outcome.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each attribute measures, its range and direction, how a member's value is drawn and keyed, and who owns the effects.
 * @evidence contracts/development/design.md#principled-representation A closed union of names, a distribution as a mean and a standard deviation on [0, 1] with its shape, and a draw keyed by stable ids.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The names, the distribution, a member's keyed stream (`stream`), its attribute draw (`draw`) and the reading of an effect (`effect`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No ordinal counter is consumed: each draw has its own key.
 */
export namespace HumanAttribute {
  /** Every attribute name, as data. */
  export const NAMES: readonly IAutoMovieMotionHumanAttribute.Name[] = [
    "discipline",
    "fatigue",
    "morale",
  ];

  /**
   * The stream of one member's quantity: keyed by the chain seed, the
   * ensemble, the member's index and the quantity's name.
   *
   * @param seed The chain seed.
   * @param ensemble The ensemble's id.
   * @param index The member's index.
   * @param name The quantity drawn: an attribute, `proficiency`, `body`, `role`, or a name a caller keys its own draw by.
   * @returns The stream.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the key and what may be drawn.
   * @evidence contracts/development/implementation.md#principled-implementation A counter-based stream (Philox through `createAutoMovieRandom`) on a seed derived from stable ids, so streams are independent by construction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key derivation and one stream.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The index is an identity, never an order consumed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One hash of the key.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its key.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function stream(
    seed: string,
    ensemble: string,
    index: number,
    name: string,
  ): IAutoMovieRandom {
    return createAutoMovieRandom(
      deriveAutoMovieSeed(seed, "ensemble", ensemble, String(index), name),
    );
  }

  /**
   * One member's value of a quantity drawn from a distribution, clipped to
   * [0, 1].
   *
   * @param seed The chain seed.
   * @param ensemble The ensemble's id.
   * @param index The member's index.
   * @param name The quantity drawn.
   * @param distribution The group's distribution.
   * @returns The value, in [0, 1].
   * @throws {Error} When the mean lies outside [0, 1] or the spread is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the shapes, the clip and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A normal by Box-Muller (`HumanSkill.normal`), or a uniform of half-width sqrt(3) times the spread so its standard deviation is the spread; clipped to the attribute's range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate, draw, clip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clip is the range's own, stated on the distribution; a spread of 0 returns the mean exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time, two stream reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its key.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function draw(
    seed: string,
    ensemble: string,
    index: number,
    name: string,
    distribution: IAutoMovieMotionHumanAttribute.IDistribution,
  ): number {
    const { mean, spread } = distribution;
    if (!(mean >= 0 && mean <= 1))
      throw new Error(
        `The ${name} distribution's mean ${mean} lies outside [0, 1]`,
      );
    if (!(spread >= 0))
      throw new Error(
        `The ${name} distribution's spread ${spread} is negative`,
      );
    if (spread === 0) return mean;
    const random: IAutoMovieRandom = stream(seed, ensemble, index, name);
    const deviate: number =
      distribution.shape === "uniform"
        ? Math.sqrt(3) * (2 * random.float(0) - 1)
        : HumanSkill.normal(random, 0);
    return Math.min(1, Math.max(0, mean + spread * deviate));
  }

  /**
   * An effect's value at an attribute's value (`HUMAN_ATTRIBUTE_EFFECTS`):
   * linear between its ends; the neutral value when the attribute is absent.
   *
   * @param effect The effect.
   * @param value The attribute, in [0, 1]; absent reads `neutral`.
   * @param neutral The value an absent attribute reads as.
   * @returns The effect's value.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reading and the absent case.
   * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation between the two stated ends, the simplest reading two ends fix.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The neutral value is the caller's, named at its reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function effect(
    effect: IAutoMovieMotionHumanAttributeEffects.IEffect,
    value: number | undefined,
    neutral: number,
  ): number {
    const x: number = value ?? neutral;
    return effect.low + (effect.high - effect.low) * x;
  }
}
