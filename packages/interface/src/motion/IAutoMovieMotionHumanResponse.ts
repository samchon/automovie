/**
 * How long a person takes to answer a cue it was waiting for: a spoken command,
 * a drum's signal, a gunshot. The latency a synced action is moved by
 * (`IAutoMovieMotionHumanChainCore.ISync.latency`), drawn per performer.
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
export namespace IAutoMovieMotionHumanResponse {
  /** One person's latency. What a latency is drawn as. */
  export type Latency =
    | "reaction"
    | {
        /**
         * Normal reaction-delay mean, seconds; drawn delays are floored at
         * zero.
         */
        mean: number;
        /** Normal reaction-delay standard deviation, seconds. */
        spread: number;
      };
}
