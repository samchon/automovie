import type {
  IAutoMovieMotionHumanAttribute,
  IAutoMovieMotionHumanResponse,
  IAutoMovieMotionHumanSkill,
  IAutoMovieRandom,
  IAutoMovieReactionTimeDistribution,
} from "@automovie/interface";

import { HUMAN_ATTRIBUTE_EFFECTS } from "../../ensemble/internal/HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "../../ensemble/internal/HumanAttribute";
import { look } from "../../everyday/internal/look";
import { HumanSkill } from "./HumanSkill";

/*
 * How long a person takes to answer a cue it was waiting for: a spoken command,
 * a drum's signal, a gunshot. The latency a synced action is moved by
 * (`AutoMovieMotionHumanChainCore.ISync.latency`), drawn per performer.
 *
 * `reaction` is a simple reaction to an acoustic signal, the orienting law's
 * ex-Gaussian (`look.reactionLaw`, `signal`, provisional constants) drawn by
 * the one ex-Gaussian draw (`HumanSkill.reaction`). When the command was
 * announced by its preparatory word, a person who anticipates is already
 * moving: the `anticipation` axis buys a lead of up to `LEAD`. Morale scales
 * the mean by `HUMAN_ATTRIBUTE_EFFECTS.morale.latency` (hesitation). The result
 * is floored at `FLOOR`. A `{ mean, spread }` draws a normal delay for an act
 * that is not a reaction, floored at 0.
 *
 * A latency varies when a person answers, never whether: an outcome such as a
 * man who does not fire is the author's.
 */
export namespace HumanResponse {
  /*
   * The shortest latency a reaction is given, seconds: a start within 0.1 s of
   * the gun counts as false in athletics because no one reacts faster (World
   * Athletics rule; the fastest valid reaction at Beijing 2008 was 0.118 s,
   * Lipps, Galecki and Ashton-Miller 2011), and `look` floors its reactions
   * there.
   */
  export const FLOOR: number = 0.1;

  /*
   * The most a warned, anticipating person's reaction is shortened by the
   * preparatory word, seconds (provisional: an elite's acoustic orienting mean
   * of 0.18 s against the 0.166 s mean fastest reaction of warned sprinters,
   * Lipps et al. 2011, gives a few hundredths; 0.05 s is provisional until a
   * drill-command study is read).
   */
  export const LEAD: number = 0.05;

  /*
   * One person's latency.
   * Parameter skill: The performer's skill.
   * Parameter random: The stream, keyed by the performer, the synced action and
   * `latency`.
   * Parameter latency: The kind.
   * Parameter warned: Whether a preparatory word announced the cue.
   * Parameter attributes: The performer's attributes.
   * Returns: Seconds after the cue.
   */
  export function latency(
    skill: IAutoMovieMotionHumanSkill,
    random: IAutoMovieRandom,
    latency: IAutoMovieMotionHumanResponse.Latency,
    warned: boolean,
    attributes:
      | Readonly<Partial<Record<IAutoMovieMotionHumanAttribute.Name, number>>>
      | undefined,
  ): number {
    if (latency !== "reaction")
      return Math.max(
        0,
        latency.mean + latency.spread * HumanSkill.normal(random, 0),
      );
    const law: IAutoMovieReactionTimeDistribution = look.reactionLaw(
      skill,
      "signal",
    );
    const hesitation: number = HumanAttribute.effect(
      HUMAN_ATTRIBUTE_EFFECTS.morale.latency,
      attributes?.morale,
      1,
    );
    const lead: number = warned
      ? HumanSkill.quantity(skill, "anticipation", 0, LEAD)
      : 0;
    return Math.max(
      FLOOR,
      HumanSkill.reaction(
        { ...law, mu: law.mu * hesitation - lead },
        random,
        0,
      ),
    );
  }
}
