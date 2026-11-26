import { type AutoMovieArchetype } from "../core/index";
import { createStageCartridgeProp as createStageCartridgePropImplementation } from "./internal/createStageCartridgeProp";
import { type createProjectile } from "./createProjectile";

/** Public operations for Auto Movie Archetype Stage Cartridge Prop. */
export namespace AutoMovieArchetypeStageCartridgeProp {
  /**
   * Paper cylinder stage silhouette.
   *
   * A display cylinder with a precision hand contact at mid-height and an end
   * mark along +Y.
   *
   * @param params The scene id and this digital form's catalogue or sizing
   *   options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageCartridgeProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageCartridgeProp.Affordance,
  AutoMovieArchetypeStageCartridgeProp.Dimension
> {
    return createStageCartridgePropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds end, grip.
   */
  export type Affordance = createProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "length" | "mass"
  >;}
