import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstancePrototypeDesign } from "./IAutoMovieInstancePrototypeDesign";
import { IAutoMovieInstanceSetLayout } from "./IAutoMovieInstanceSetLayout";
import { IAutoMovieInstanceVariation } from "./IAutoMovieInstanceVariation";
import { IAutoMovieModelLod } from "./IAutoMovieModelLod";

/**
 * A compact non-formation crowd, vegetation, prop, or debris set.
 *
 * @evidence contracts/common.md#principled-implementation Count, layout, anchor, heading and seed regenerate stable slots; positive weighted prototypes and bounded variation determine each member without serializing a full scene node per slot.
 * @evidence contracts/common.md#clear-and-simple-design Keeps general instance placement separate from formation capabilities, hero promotion and motion channels; optional prototypes extend the default model group with explicit weighted choices, each with its own optional distance tiers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Model group references, LOD tier order, count limits, seed and layout capacity are authoring premises, not checks performed by this type or the compact compiler. Building populations receive the narrower validateBuiltPopulation check; world compilation regenerates slots and rejects missing routes and nonfinite sampled positions but does not replace the retired whole-design gate.
 * @evidence contracts/common.md#meaningful-documentation Defines the count limit, seed range, layout, model group and LOD tier roles, world-meter anchor and degree heading; route placement uses its route snapshot rather than the anchor's XZ position.
 */
export interface IAutoMovieInstanceSetDesign {
  /** Stable id unique within the world. */
  id: string;

  /** Existing base model group id; compilation inserts it as prototype `default` with weight one when a prototype table is supplied. */
  model: string;

  /**
   * Ordered distance tiers for the base group, ordered `hero`, `near`, `far` with increasing positive distances and an unbounded tier only at the end; omitted or empty draws `model` as one unbounded `near` tier.
   */
  lod?: IAutoMovieModelLod[];

  /** Optional weighted prototype table; `model` remains the default. */
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
