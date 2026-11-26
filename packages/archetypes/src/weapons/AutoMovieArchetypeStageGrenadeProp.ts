import { type AutoMovieArchetype } from "../core/index";
import { createStageGrenadeProp as createStageGrenadePropImplementation } from "./internal/createStageGrenadeProp";
import { createProjectile } from "./createProjectile";

/** Public operations for Auto Movie Archetype Stage Grenade Prop. */
export namespace AutoMovieArchetypeStageGrenadeProp {
  /**
   * Rounded period stage silhouette.
   *
   * The ornamental top and round body are an inert digital model with a single
   * actor grip at the body's centre.
   *
   * @param params The scene id and this digital form's catalogue or sizing
   *   options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageGrenadeProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageGrenadeProp.Affordance,
  AutoMovieArchetypeStageGrenadeProp.Dimension
> {
    return createStageGrenadePropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds body.
   */
  export type Affordance = createProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "length" | "mass"
  >;}
