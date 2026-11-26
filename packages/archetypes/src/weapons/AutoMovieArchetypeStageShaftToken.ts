import { type AutoMovieArchetype } from "../core/index";
import { createStageShaftToken as createStageShaftTokenImplementation } from "./internal/createStageShaftToken";
import { createProjectile } from "./createProjectile";

/** Public operations for Auto Movie Archetype Stage Shaft Token. */
export namespace AutoMovieArchetypeStageShaftToken {
  /**
   * Slender shaft stage token.
   *
   * The arrow and bolt silhouettes share a model-space handle, seat and tip mark
   * along the shaft.
   *
   * @param params The scene id and this digital form's catalogue or sizing
   *   options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeStageShaftToken.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageShaftToken.Affordance,
  AutoMovieArchetypeStageShaftToken.Dimension
> {
    return createStageShaftTokenImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "westminster" | "az472" | "nmm11461" | "met33754";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "head" | "headWidth" | "length" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds nock, nockGrip, shaft, tip.
   */
  export type Affordance = createProjectile.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["arrow", "bolt"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createProjectile.IParams,
    "id" | "length" | "diameter"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A model from this form's catalogue. */
    model?: Model;
  }}
