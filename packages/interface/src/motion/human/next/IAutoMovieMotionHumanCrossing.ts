import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanStepOver } from "../everyday/IAutoMovieMotionHumanStepOver";
import type { IAutoMovieMotionHumanSquatVault } from "../sport/IAutoMovieMotionHumanSquatVault";
import type { IAutoMovieMotionHumanVault } from "../sport/IAutoMovieMotionHumanVault";

/**
 * Crossing an obstacle: stepping over it and the vaults.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 */
export interface IAutoMovieMotionHumanCrossing<Chain> {
  /**
   * Stepping over a low obstacle placed in the scene, a kerb or a hurdle (`HumanObstacle`), from standing in front of it: the lead foot lifts over it and lands beyond, then the trail foot follows and lands beside it, both feet clearing the obstacle's top.
   *
   * @param params The `obstacle`, `lead`, `manner` and `onto` of `IAutoMovieMotionHumanStepOver.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stepOver(
    params: IAutoMovieMotionHumanStepOver.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A handspring vault (#3377): a front handspring whose hands land on a prop's top, a vaulting table, a box or a plyometric box, and fly from it to a chosen mat or the floor beyond.
   *
   * @param params The `on` and `landOn` of `IAutoMovieMotionHumanVault.IParams`, with those of `IAutoMovieMotionHumanHandspring.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  vault(params: IAutoMovieMotionHumanVault.IParams, anchor?: string): Chain;

  /**
   * A squat vault over a box: the hands set on the near edge of the box's top, the body tucked over them, a push-off into a flight over the box and a landing on both feet beyond its far edge.
   *
   * @param params The `on` and `seconds` of `IAutoMovieMotionHumanSquatVault.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  squatVault(
    params: IAutoMovieMotionHumanSquatVault.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Crossing a named stage obstruction or the gap between two fixed decks, from a standing or walking entry to a settled exit that the next gait continues: a step over a low obstruction, a hand-supported vault onto a raised top, an airborne jump over an obstacle, or a jump across the gap between two surfaces, each planned by the existing step, support or jump law against the named props' shapes and surfaces. The action refuses a crossing whose displayed body would enter them.
   *
   * @param params One of the four crossing paths of `IAutoMovieMotionHumanCrossing.IParams`, told apart by its `kind`: `step`, `vault`, `jump` or `gap`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  crossObstacle(
    params: IAutoMovieMotionHumanCrossing.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Crossing methods.
 */
export namespace IAutoMovieMotionHumanCrossing {
  /**
   * The apex of a crossing flight: the height of the flight above take-off, metres; positive. It is the jump's own `apex`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the quantity, its unit and its sign.
   * @evidence contracts/development/design.md#principled-representation A length in metres above take-off, as `IAutoMovieMotionHumanJump.IParams.apex` states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The one flight control the airborne crossings expose.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a number, so no indexed access onto the jump's parameters is needed.
   */
  export type ApexMetres = number;
}

/**
 * Crossing a named stage obstruction or the gap between two fixed decks,
 * from a standing or walking entry to a settled exit that the next gait
 * continues. Register `HumanTraversal.crossObstacle` to use it.
 *
 * A low step uses `stepOver` with the lead foot, a vault bears on one palm
 * and the opposite foot on the obstacle's top, and the airborne crossings
 * use the ballistic `jump`. The named props own every dimension: their
 * collision shapes and surface affordances are read in the actor's entry
 * frame, and `crossObstacle` refuses a crossing whose displayed body would
 * enter them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four paths, the laws they reuse, where the geometry comes from and the refusal.
 * @evidence contracts/development/design.md#principled-representation A discriminated union on kind: each variant names exactly the fixtures and controls its path consumes, in world metres where a length appears.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered vocabulary entry over the named stage geometry; planNamedCrossing in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No variant restates a height, depth or edge the fixture owns, so the parameters cannot contradict the staged geometry.
 */
export namespace IAutoMovieMotionHumanCrossing {
  /**
   * A level top surface of a placed prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the scene prop and its surface affordance.
   * @evidence contracts/development/design.md#principled-representation The prop's placed surface affordance supplies the height, width and depth in world metres; the names carry no geometry of their own.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two names distinguish the prop and one of its surfaces, as the vault and gap variants read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No independent height or depth can conflict with the fixture; a missing, moving or sloped surface is refused at runtime by planNamedCrossing.
   */
  export interface ISurface {
    /** Subject of the fixed support prop. */
    prop: string;

    /** Id of its `surface` affordance, level and square to the path. */
    point: string;
  }

  /**
   * A low obstruction stepped over with planted feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the obstacle, the optional lead foot and the optional landing surface.
   * @evidence contracts/development/design.md#principled-representation The obstacle's collision shapes bound the step; the lead side is the anatomical side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters stepOver takes, under the crossing's discriminant.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The obstacle's height and depth stay with its shapes.
   */
  export interface IStep {
    /** Discriminant: a stepped crossing. */
    kind: "step";

    /** Subject of the fixed, shaped obstacle ahead. */
    obstacle: string;

    /** The foot that crosses first; stepOver's choice when absent. */
    lead?: AutoMovieHumanSide;

    /** The level surface beyond the obstacle both feet land on, such as a bathtub's floor inside its rim; the entry floor's height when absent. */
    onto?: ISurface;
  }

  /**
   * A crossing that bears on one palm and the opposite foot on a raised top.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the top surface and the bearing hand, and what the hand side decides.
   * @evidence contracts/development/design.md#principled-representation The surface affordance places both supports; the hand side mirrors the step vault.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two inputs the vault planner reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No palm or foot point is authored beside the surface that owns them.
   */
  export interface IVault {
    /** Discriminant: a hand-supported crossing. */
    kind: "vault";

    /** The raised obstacle's top surface. */
    over: ISurface;

    /** Bearing hand; the opposite foot steps onto the top. Left when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * An airborne crossing over a shaped obstacle to the floor beyond it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the obstacle and the optional flight apex.
   * @evidence contracts/development/design.md#principled-representation The obstacle's far shape extent places the landing; the apex is the jump's own, in metres above take-off.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The obstacle and the one flight control the jump exposes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing point is derived from the obstacle, never authored beside it.
   */
  export interface IJump {
    /** Discriminant: an airborne crossing of an obstacle. */
    kind: "jump";

    /** Subject of the fixed, shaped obstacle ahead. */
    obstacle: string;

    /** Apex above take-off, metres; the jump's default when absent. */
    apex?: ApexMetres;
  }

  /**
   * An airborne crossing from one fixed top surface to another.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the departure and landing surfaces and the optional apex.
   * @evidence contracts/development/design.md#principled-representation Both surfaces are placed affordances, so the gap and the landing height come from the scene.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two surfaces and the one flight control.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The gap width is never typed; a missing gap or a short landing is refused at runtime.
   */
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

  /**
   * Parameters: one of the four crossing paths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four variants.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union, so a variant cannot combine another's fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants the crossing planner dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IStep | IVault | IJump | IGap;
}
