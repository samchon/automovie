import { type AutoMovieArchetype } from "../core/index";
import { createFieldGoal as createFieldGoalImplementation } from "./internal/createFieldGoal";
import { type AutoMovieArchetypeGoal } from "./AutoMovieArchetypeGoal";

/** Public operations for Auto Movie Archetype Field Goal. */
export namespace AutoMovieArchetypeFieldGoal {
  /**
   * A rectangular field, court or ice goal with a scoring opening.
   *
   * Two posts and a crossbar stand in the XY plane. The field faces +Z, and mouth
   * marks the scoring aperture.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeFieldGoal.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeFieldGoal.Affordance, AutoMovieArchetypeFieldGoal.Dimension> {
    return createFieldGoalImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "bar" | "height" | "mass" | "width";

  /** The contact identifiers for the apparatus. */
  export type Affordance = "crossbar" | "leftPost" | "mouth" | "rightPost";

  /** Goals of the same rectangular frame family, in catalogue order. */
  export const KINDS: readonly Kind[] = [
    "footballGoal",
    "fieldHockeyGoal",
    "iceHockeyGoal",
    "lacrosseGoal",
    "handballGoal",
  ];

  /** The sport that supplies the geometry and bands. */
  export type Kind =
    | "footballGoal"
    | "fieldHockeyGoal"
    | "iceHockeyGoal"
    | "lacrosseGoal"
    | "handballGoal";

  /** The identifier and overrides that apply to this profile. */
  export interface IParams extends Pick<
    AutoMovieArchetypeGoal.IParams,
    "id" | "width" | "height" | "bar" | "mass"
  > {
    /** The sport profile. Omission selects the football goal. */
    kind?: Kind;
  }}
