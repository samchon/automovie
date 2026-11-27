import { type AutoMovieArchetype } from "../core/index";
import { createStageStoneProp as createStageStonePropImplementation } from "./internal/createStageStoneProp";
import { type AutoMovieArchetypeProjectile } from "./AutoMovieArchetypeProjectile";

/** Public operations for Auto Movie Archetype Stage Stone Prop. */
export namespace AutoMovieArchetypeStageStoneProp {
  /**
   * Stage stone silhouette.
   *
   * A stone-like digital sphere with the authored one-hand contact above the
   * support plane.
   *
   * @param params The scene id and this digital form's catalogue or sizing
   *   options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageStoneProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageStoneProp.Affordance,
  AutoMovieArchetypeStageStoneProp.Dimension
> {
    return createStageStonePropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "gravity" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds body.
   */
  export type Affordance = AutoMovieArchetypeProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    AutoMovieArchetypeProjectile.IParams,
    "id" | "mass" | "gravity"
  >;}
