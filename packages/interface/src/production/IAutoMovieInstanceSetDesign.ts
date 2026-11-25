import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieInstancePrototypeDesign } from "./IAutoMovieInstancePrototypeDesign";
import type { IAutoMovieInstanceSetLayout } from "./IAutoMovieInstanceSetLayout";
import type { IAutoMovieInstanceVariation } from "./IAutoMovieInstanceVariation";
import type { IAutoMovieModelLod } from "./IAutoMovieModelLod";

/** A compact non-formation crowd, vegetation, prop, or debris set. */
export interface IAutoMovieInstanceSetDesign {
  /** Stable id unique within the world. */
  id: string;

  /**
   * Existing base model group id; compilation inserts it as prototype `default`
   * with weight one when a prototype table is supplied.
   */
  model: string;

  /**
   * Ordered distance tiers for the base group, ordered `hero`, `near`, `far`
   * with increasing positive distances and an unbounded tier only at the end;
   * omitted or empty draws `model` as one unbounded `near` tier.
   */
  lod?: IAutoMovieModelLod[];

  /** Optional weighted prototype table; `model` remains the default. */
  prototypes?: IAutoMovieInstancePrototypeDesign[];

  /** Integer slot count from one through 100,000. */
  count: number;

  /** Compact deterministic placement law. */
  layout: IAutoMovieInstanceSetLayout;

  /**
   * World-space meter origin for grid, scatter, lattice and explicit layouts;
   * route layout uses only its height.
   */
  anchor: IAutoMovieVector3;

  /** Finite base heading in degrees. */
  facingDeg: number;

  /** Full non-negative safe-integer seed. */
  seed: number;

  /** Seed-derived per-slot differences. */
  variation: IAutoMovieInstanceVariation;
}
