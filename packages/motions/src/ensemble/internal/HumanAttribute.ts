import { AutoMovieEngineRandom } from "@automovie/engine";

import type {
  IAutoMovieMotionHumanAttribute,
  IAutoMovieMotionHumanAttributeEffects,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanSkill } from "../../skill/internal/HumanSkill";

/*
 * A group member's attributes: the named qualities a group's distribution gives
 * each member a number of, and the keyed draws that give them.
 *
 * An attribute is a value in [0, 1]: `discipline` (drill and steadiness, 1 the
 * best drilled), `fatigue` (0 fresh, 1 spent) and `morale` (0 broken, 1
 * steady). A group states each as a distribution (`IDistribution`); each member
 * draws its own value from a stream keyed by the chain seed, the ensemble's id,
 * the member's index and the name drawn, so adding a member or an attribute
 * leaves every other draw bit-identical (the keyed streams of
 * `HumanSkill.stream`, Salmon et al. 2011). What an attribute moves is
 * `HUMAN_ATTRIBUTE_EFFECTS`'s; an attribute never decides an outcome.
 */
export namespace HumanAttribute {
  /*
   * Every attribute name, as data.
   */
  export const NAMES: readonly IAutoMovieMotionHumanAttribute.Name[] = [
    "discipline",
    "fatigue",
    "morale",
  ];

  /*
   * The stream of one member's quantity: keyed by the chain seed, the ensemble,
   * the member's index and the quantity's name.
   * Parameter seed: The chain seed.
   * Parameter ensemble: The ensemble's id.
   * Parameter index: The member's index.
   * Parameter name: The quantity drawn: an attribute, `proficiency`, `body`,
   * `role`, or a name a caller keys its own draw by.
   * Returns: The stream.
   */
  export function stream(
    seed: string,
    ensemble: string,
    index: number,
    name: string,
  ): IAutoMovieRandom {
    return AutoMovieEngineRandom.createRandom(
      AutoMovieEngineRandom.deriveSeed(seed, "ensemble", ensemble, String(index), name),
    );
  }

  /*
   * One member's value of a quantity drawn from a distribution, clipped to [0,
   * 1].
   * Parameter seed: The chain seed.
   * Parameter ensemble: The ensemble's id.
   * Parameter index: The member's index.
   * Parameter name: The quantity drawn.
   * Parameter distribution: The group's distribution.
   * Returns: The value, in [0, 1].
   * When the mean lies outside [0, 1] or the spread is
   * negative.
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

  /*
   * An effect's value at an attribute's value (`HUMAN_ATTRIBUTE_EFFECTS`):
   * linear between its ends; the neutral value when the attribute is absent.
   * Parameter effect: The effect.
   * Parameter value: The attribute, in [0, 1]; absent reads `neutral`.
   * Parameter neutral: The value an absent attribute reads as.
   * Returns: The effect's value.
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
