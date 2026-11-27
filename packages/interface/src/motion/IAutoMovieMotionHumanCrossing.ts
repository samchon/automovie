import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanStepOver } from "./IAutoMovieMotionHumanStepOver";
import type { IAutoMovieMotionHumanSquatVault } from "./IAutoMovieMotionHumanSquatVault";
import type { IAutoMovieMotionHumanVault } from "./IAutoMovieMotionHumanVault";

/**
 * Crossing an obstacle: stepping over it and the vaults.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanCrossing` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanCrossing<Chain> {
  /**
   * Stepping over a low obstacle placed in the scene, a kerb or a hurdle
   * (`HumanObstacle`), from standing in front of it: the lead foot lifts over
   * it and lands beyond, then the trail foot follows and lands beside it, both
   * feet clearing the obstacle's top.
   *
   * @param params The `obstacle`, `lead`, `manner` and `onto` of
   *   `IAutoMovieMotionHumanStepOver.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stepOver(
    params: IAutoMovieMotionHumanStepOver.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A handspring vault: a front handspring whose hands land on a prop's top, a
   * vaulting table, a box or a plyometric box, and fly from it to a chosen mat
   * or the floor beyond.
   *
   * Registered law: `registered("vault", params)`; not a chain method.
   *
   * @param params The `on` and `landOn` of
   *   `IAutoMovieMotionHumanVault.IParams`, with those of
   *   `IAutoMovieMotionHumanHandspring.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  vault(params: IAutoMovieMotionHumanVault.IParams, anchor?: string): Chain;

  /**
   * A squat vault over a box: the hands set on the near edge of the box's top,
   * the body tucked over them, a push-off into a flight over the box and a
   * landing on both feet beyond its far edge.
   *
   * Registered law: `registered("squatVault", params)`; not a chain method.
   *
   * @param params The `on` and `hold` of
   *   `IAutoMovieMotionHumanSquatVault.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  squatVault(
    params: IAutoMovieMotionHumanSquatVault.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Crossing a named stage obstruction or the gap between two fixed decks, from
   * a standing or walking entry to a settled exit that the next gait continues:
   * a step over a low obstruction, a hand-supported vault onto a raised top, an
   * airborne jump over an obstacle, or a jump across the gap between two
   * surfaces, each planned by the existing step, support or jump law against
   * the named props' shapes and surfaces. The action refuses a crossing whose
   * displayed body would enter them.
   *
   * Registered law: `registered("crossObstacle", params)`; not a chain method.
   *
   * @param params One of the four crossing paths of
   *   `IAutoMovieMotionHumanCrossing.IParams`, told apart by its `kind`:
   *   `step`, `vault`, `jump` or `gap`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  crossObstacle(
    params: IAutoMovieMotionHumanCrossing.IParams,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the Crossing methods. */
/**
 * Crossing a named stage obstruction or the gap between two fixed decks, from a
 * standing or walking entry to a settled exit that the next gait continues.
 * Register `HumanTraversal.crossObstacle` to use it.
 *
 * A low step uses `stepOver` with the lead foot, a vault bears on one palm and
 * the opposite foot on the obstacle's top, and the airborne crossings use the
 * ballistic `jump`. The named props own every dimension: their collision shapes
 * and surface affordances are read in the actor's entry frame, and
 * `crossObstacle` refuses a crossing whose displayed body would enter them.
 */
export namespace IAutoMovieMotionHumanCrossing {
  /**
   * The apex of a crossing flight: the height of the flight above take-off,
   * metres; positive. It is the jump's own `apex`.
   */
  export type ApexMetres = number;

  /** A level top surface of a placed prop. */
  export interface ISurface {
    /** Subject of the fixed support prop. */
    prop: string;

    /** Id of its `surface` affordance, level and square to the path. */
    point: string;
  }

  /** A low obstruction stepped over with planted feet. */
  export interface IStep {
    /** Discriminant: a stepped crossing. */
    kind: "step";

    /** Subject of the fixed, shaped obstacle ahead. */
    obstacle: string;

    /** The foot that crosses first; stepOver's choice when absent. */
    lead?: AutoMovieHumanSide;

    /**
     * The level surface beyond the obstacle both feet land on, such as a
     * bathtub's floor inside its rim; the entry floor's height when absent.
     */
    onto?: ISurface;
  }

  /** A crossing that bears on one palm and the opposite foot on a raised top. */
  export interface IVault {
    /** Discriminant: a hand-supported crossing. */
    kind: "vault";

    /** The raised obstacle's top surface. */
    over: ISurface;

    /** Bearing hand; the opposite foot steps onto the top. Left when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** An airborne crossing over a shaped obstacle to the floor beyond it. */
  export interface IJump {
    /** Discriminant: an airborne crossing of an obstacle. */
    kind: "jump";

    /** Subject of the fixed, shaped obstacle ahead. */
    obstacle: string;

    /** Apex above take-off, metres; the jump's default when absent. */
    apex?: ApexMetres;
  }

  /** An airborne crossing from one fixed top surface to another. */
  export interface IGap {
    /** Discriminant: a gap between two decks. */
    kind: "gap";

    /** The surface both feet bear on at entry. */
    from: ISurface;

    /** The surface to land on. */
    to: ISurface;

    /** Apex above take-off, metres; the jump's default when absent. */
    apex?: ApexMetres;
  }

  /** Parameters: one of the four crossing paths. */
  export type IParams = IStep | IVault | IJump | IGap;
}
