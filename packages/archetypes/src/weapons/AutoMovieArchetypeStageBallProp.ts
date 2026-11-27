import { type AutoMovieArchetype } from "../core/index";
import { createStageBallProp as createStageBallPropImplementation } from "./internal/createStageBallProp";
import { type AutoMovieArchetypeProjectile } from "./AutoMovieArchetypeProjectile";

/** Public operations for Auto Movie Archetype Stage Ball Prop. */
export namespace AutoMovieArchetypeStageBallProp {
  /**
   * Small round display token.
   *
   * A sphere resting on the floor below a single precision handle at its centre.
   *
   * @param params The scene id and this digital form's catalogue or sizing
   *   options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageBallProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageBallProp.Affordance,
  AutoMovieArchetypeStageBallProp.Dimension
> {
    return createStageBallPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds body.
   */
  export type Affordance = AutoMovieArchetypeProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    AutoMovieArchetypeProjectile.IParams,
    "id" | "diameter" | "mass"
  >;}
