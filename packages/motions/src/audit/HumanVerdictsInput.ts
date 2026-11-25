import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * What `HumanVerdicts` reads of its input: the fields of a performance and of
 * its placed actions the verdicts actually read, so a performance, or a typed
 * minimal motion a unit test builds, can be judged alike.
 */
export namespace HumanVerdictsInput {
  /**
   * What the verdicts read of a performance: its length, its performers'
   * bodies, their displayed poses and bones, the props' frames and flights, the
   * solved windows and each performer's placed actions.
   */
  export interface IPerformance extends Pick<
    IAutoMovieMotionHumanPerformance,
    "duration" | "pose" | "bones" | "prop" | "site" | "flights" | "simulations"
  > {
    /** The performers, by subject, with their bodies. */
    readonly performers: readonly Pick<
      IAutoMovieMotionHumanPerformer,
      "subject" | "body"
    >[];

    /**
     * A performer's placed actions, in film order.
     *
     * @param subject The performer.
     * @returns The actions.
     */
    segments(subject: string): readonly HumanVerdictsInput.ISegment[];
  }

  /**
   * What the verdicts read of a placed action: its identity, its film span, its
   * params (for the water it names), its plan, and its law's family and
   * physical flag.
   */
  export interface ISegment extends Pick<
    IAutoMovieMotionHumanSegment,
    "id" | "index" | "name" | "start" | "entryTime" | "end" | "params" | "plan"
  > {
    /** The action's law, as far as its family and physics are read. */
    law: Pick<IAutoMovieMotionHumanActionLaw<never>, "family" | "physical">;
  }
}
