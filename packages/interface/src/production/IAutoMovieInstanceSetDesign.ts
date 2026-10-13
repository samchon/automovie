import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstancePrototypeDesign } from "./IAutoMovieInstancePrototypeDesign";
import { IAutoMovieInstanceSetLayout } from "./IAutoMovieInstanceSetLayout";
import { IAutoMovieInstanceVariation } from "./IAutoMovieInstanceVariation";

/**
 * A compact non-formation crowd, vegetation, prop, or debris set.
 *
 * @evidence contracts/common.md#principled-implementation Count, layout, anchor, heading and seed regenerate stable slots; positive weighted prototypes and bounded variation determine each member without serializing a full scene node per slot.
 * @evidence contracts/common.md#clear-and-simple-design Keeps general instance placement separate from formation capabilities, hero promotion and motion channels; optional prototypes extend the default recipe with explicit weighted choices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing recipe and route references and admitted layout capacity are required; seed-derived variation does not stand in for missing model geometry or authorize a guessed instance count.
 * @evidence contracts/common.md#meaningful-documentation Defines the count limit, seed range, layout and recipe roles, world-meter anchor and degree heading; route placement uses its route snapshot rather than the anchor's XZ position.
 * @author Samchon
 */
export interface IAutoMovieInstanceSetDesign {
  /** Stable id unique within the world. */
  id: string;

  /** Existing default model recipe used when no alternate prototype is selected. */
  modelRecipe: string;

  /** Optional weighted prototype table; `modelRecipe` remains the default. */
  prototypes?: IAutoMovieInstancePrototypeDesign[];

  /** Integer slot count from one through 100,000. */
  count: number;

  /** Compact deterministic placement law. */
  layout: IAutoMovieInstanceSetLayout;

  /** World-space meter origin for grid, scatter, lattice and explicit layouts; route layout uses only its height. */
  anchor: IAutoMovieVector3;

  /** Finite base heading in degrees. */
  facingDeg: number;

  /** Full non-negative safe-integer seed. */
  seed: number;

  /** Seed-derived per-slot differences. */
  variation: IAutoMovieInstanceVariation;
}
