import { type AutoMovieArchetype } from "../core/index";
import { createStageStockBowProp as createStageStockBowPropImplementation } from "./internal/createStageStockBowProp";
import { type AutoMovieArchetypeBow } from "./AutoMovieArchetypeBow";

/** Public operations for Auto Movie Archetype Stage Stock Bow Prop. */
export namespace AutoMovieArchetypeStageStockBowProp {
  /**
   * Stock-mounted bow silhouette for screen staging.
   *
   * A digital display model with a stock, visible spanning curve and posed actor
   * contact marks.
   *
   * @param params The scene identity and optional dimensions for the display
   *   silhouette.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageStockBowProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageStockBowProp.Affordance,
  AutoMovieArchetypeStageStockBowProp.Dimension
> {
    return createStageStockBowPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "brace" | "depth" | "length" | "mass";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance =
    | "butt"
    | "crank"
    | "foreEnd"
    | "grip"
    | "lowerLimb"
    | "nock"
    | "rail"
    | "rest"
    | "stirrup"
    | "string"
    | "trigger"
    | "upperLimb";

  /** The model identity, dimensions. */
  export type IParams = Pick<
    AutoMovieArchetypeBow.IParams,
    "id" | "length" | "depth" | "brace" | "mass"
  >;}
