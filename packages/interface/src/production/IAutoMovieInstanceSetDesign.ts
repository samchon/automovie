import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstancePrototypeDesign } from "./IAutoMovieInstancePrototypeDesign";
import { IAutoMovieInstanceSetLayout } from "./IAutoMovieInstanceSetLayout";
import { IAutoMovieInstanceVariation } from "./IAutoMovieInstanceVariation";

/** A compact non-formation crowd, vegetation, prop, or debris set. */
export interface IAutoMovieInstanceSetDesign {
  /** Stable id unique within the world. */
  id: string;

  /** Existing model recipe rendered by every member. */
  modelRecipe: string;

  /** Optional weighted prototype table; `modelRecipe` remains the default. */
  prototypes?: IAutoMovieInstancePrototypeDesign[];

  /** Integer slot count from one through 100,000. */
  count: number;

  /** Compact deterministic placement law. */
  layout: IAutoMovieInstanceSetLayout;

  /** World-space origin for grid and scatter layouts. */
  anchor: IAutoMovieVector3;

  /** Finite base heading in degrees. */
  facingDeg: number;

  /** Full non-negative safe-integer seed. */
  seed: number;

  /** Seed-derived per-slot differences. */
  variation: IAutoMovieInstanceVariation;
}
