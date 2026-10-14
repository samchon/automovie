import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstancePrototypeDesign } from "./IAutoMovieInstancePrototypeDesign";
import { IAutoMovieInstanceSetLayout } from "./IAutoMovieInstanceSetLayout";
import { IAutoMovieInstanceVariation } from "./IAutoMovieInstanceVariation";

/**
 * A compact non-formation crowd, vegetation, prop, or debris set.
 *
 * @evidence contracts/common.md#principled-implementation Count, layout, anchor, heading and seed regenerate stable slots; positive weighted prototypes and bounded variation determine each member without serializing a full scene node per slot.
 * @evidence contracts/common.md#clear-and-simple-design Keeps general instance placement separate from formation capabilities, hero promotion and motion channels; optional prototypes extend the default recipe with explicit weighted choices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recipe references, count limits, seed and layout capacity are authoring premises, not checks performed by this type or the compact compiler. Building populations receive the narrower validateBuiltPopulation check; world compilation regenerates slots and rejects missing routes and nonfinite sampled positions but does not replace the retired whole-design gate.
 * @evidence contracts/common.md#meaningful-documentation Defines the count limit, seed range, layout and recipe roles, world-meter anchor and degree heading; route placement uses its route snapshot rather than the anchor's XZ position.
 * @author Samchon
 */
export interface IAutoMovieInstanceSetDesign {
  /** Stable id unique within the world. */
  id: string;

  /** Existing base recipe; compilation inserts it as prototype `default` with weight one when a prototype table is supplied. */
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
