import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanJump } from "../actions/IAutoMovieMotionHumanJump";

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
    apex?: IAutoMovieMotionHumanJump.IParams["apex"];
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
    apex?: IAutoMovieMotionHumanJump.IParams["apex"];
  }

  /**
   * Parameters: one of the four crossing paths.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; planNamedCrossing owns the geometry and clearance refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four variants and the admission owners.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union, so a variant cannot combine another's fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The variants the crossing planner dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are separated by kind rather than optional fields.
   */
  export type IParams = IStep | IVault | IJump | IGap;
}
