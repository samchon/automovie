import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanChain } from "./IAutoMovieMotionHumanChain";
import type { IAutoMovieMotionHumanFirefight } from "./IAutoMovieMotionHumanFirefight";

/**
 * Fighting a fire. A nozzle and a backup role extinguish, run a hose line and
 * beat flames; a victim whose clothes burn stops, drops and rolls. The
 * durations are provisional.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanFirefighting` or from the row namespace of the family,
 * and append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanFirefighting<Chain> {
  /**
   * Firefighting drills with coarse inert props.
   *
   * Registered law: `registered("extinguish", params)`; not a chain method.
   *
   * @param params The `prop`, `target`, `sweeps` and `span` of
   *   `IAutoMovieMotionHumanFirefight.IExtinguish`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  extinguish(
    params: IAutoMovieMotionHumanFirefight.IExtinguish,
    anchor?: string,
  ): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * Registered law: `registered("hoseLine", params)`; not a chain method.
   *
   * @param params The `prop`, `role`, `grip`, `advance`, `target` and `sweeps`
   *   of `IAutoMovieMotionHumanFirefight.IHoseLine`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  hoseLine(
    params: IAutoMovieMotionHumanFirefight.IHoseLine,
    anchor?: string,
  ): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * Registered law: `registered("beatFlames", params)`; not a chain method.
   *
   * @param params The `prop`, `partner`, `region` and `count` of
   *   `IAutoMovieMotionHumanFirefight.IBeatFlames`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  beatFlames(
    params: IAutoMovieMotionHumanFirefight.IBeatFlames,
    anchor?: string,
  ): Chain;

  /**
   * Firefighting drills with coarse inert props.
   *
   * Registered law: `registered("stopDropRoll", params)`; not a chain method.
   *
   * @param params The `rolls` of
   *   `IAutoMovieMotionHumanFirefight.IStopDropRoll`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stopDropRoll(
    params: IAutoMovieMotionHumanFirefight.IStopDropRoll,
    anchor?: string,
  ): Chain;
  /**
   * The PASS drill whole (OSHA): the extinguisher taken by its carrying handle,
   * the pin pulled by the free hand by its ring, then aim, squeeze and sweep,
   * so the pin is out before the lever moves.
   *
   * @param params The extinguisher, the fire, the sweeps and the carrying
   *   `hand` of `IAutoMovieMotionHumanFirefighting.IPass`.
   * @param anchor The action's id for `sync` and `until`, set on the sweep;
   *   none when absent.
   * @returns The chain with the take, the pin's pull and the sweep appended.
   */
  pass(params: IAutoMovieMotionHumanFirefighting.IPass, anchor?: string): Chain;
}
/** The parameter types of the Firefighting methods. */
export namespace IAutoMovieMotionHumanFirefighting {
  /**
   * The parameters of `pass`: those of `extinguish` and the hand that carries
   * the extinguisher.
   */
  export interface IPass extends IAutoMovieMotionHumanFirefight.IExtinguish {
    /** The hand that carries the extinguisher; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * The team's shared parameters: the line, the advance, the target and the
   * sweeps; each member's role and grip are set per member.
   */
  export type IHoseTeam = Omit<
    IAutoMovieMotionHumanFirefight.IHoseLine,
    "role" | "grip"
  >;

  /** A team member's chain and standing place. */
  export interface ITeamMember {
    /** The member's chain so far. */
    chain: IAutoMovieMotionHumanChain;

    /**
     * Where the member stands, world metres; the advance walks from it along
     * `+Z`.
     */
    at: IAutoMovieVector3;
  }

  /** The operator's and the backup's chains, in that order. */
  export type Team = readonly [
    IAutoMovieMotionHumanChain,
    IAutoMovieMotionHumanChain,
  ];
}
