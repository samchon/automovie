import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieBlendColumn } from "./IAutoMovieBlendColumn";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidMesh } from "./IAutoMovieSolidMesh";

/**
 * Periodic ribbon strips and their source-rail correspondence for solid
 * assembly.
 */
export namespace IAutoMovieSolidBlendChain {
  /**
   * A two-layer blend chain and the column-aligned trim/measurement records
   * used by Body and Clip. Chain station is w*length in mm; chain phase phi
   * names trace parameter seed+phi. Layer frame/zero-jet records are shared
   * factory objects, so mutating them can affect other published blends.
   */
  export interface IBlend {
    /** The chain. */
    chain: IAutoMovieLoftChain;

    /** Its station span `L`, mm: the share `w` is `station / L`. */
    length: number;

    /**
     * The curve parameter of the chain's phase 0, radians
     * (`AutoMovieSolidIntersection.IPoint.t`).
     */
    seed: number;

    /** The host's rail at the columns, as a trim of the host's face. */
    host: IAutoMovieSolidMesh.ILoopChart;

    /** The part's rail at the columns, as a trim of the part's face. */
    part: IAutoMovieSolidMesh.ILoopChart;

    /**
     * The host's chart direction at each column from the curve's preimage
     * toward its rail, of unit world speed: the host continues past its rail at
     * `host.chart[k] + sigma across[k]`, `sigma > 0` in millimetres.
     */
    across: [number, number][];

    /**
     * The part's chart direction at each column from the curve's preimage
     * toward its rail, of unit world speed at the preimage
     * (`AutoMovieSolidRail.IRail.partAcross`): the part continues past its rail
     * along it.
     */
    partAcross: [number, number][];

    /** The intersection curve's point at each column, mm. */
    curve: [number, number, number][];

    /**
     * The declared chords at each column, mm
     * (`AutoMovieSolidJoin.IJoin.widths`); the part's null where its rail is
     * one fixed station.
     */
    widths: {
      /**
       * Declared host-side chord width in millimetres at each corresponding
       * column, in the blend's phase order.
       */
      host: number[];

      /**
       * Declared part-side chord width in millimetres at each column, or null
       * for a rail constrained to one fixed station.
       */
      part: (number | null)[];
    };

    /**
     * The kind of the curve's parameter
     * (`AutoMovieSolidIntersection.Parameter`).
     */
    parameter: IAutoMovieSolidIntersection.Parameter["kind"];

    /**
     * The part's kept side in its station: the part continues past its rail at
     * `s + sigma d`, `d > 0` (the phase parameter).
     */
    sigma: 1 | -1;
  }

  /**
   * Uniform phase columns at 2pi*k/count, each pairing two world-space ribbons.
   * Cross derivatives are with respect to one dimensionless share from start to
   * end. strip divides first and second orders by its mean chord length and its
   * square to form millimetre-station derivatives. Input vectors are read
   * during interpolation; resulting coefficient arrays are new.
   */
  export type IStripColumns = readonly IAutoMovieBlendColumn[];

  /**
   * Optional interior cross-sections in the same phase-column order as the
   * rails. Empty means a two-layer strip. Each section supplies one world-space
   * point and first/second cross-share partial per rail column; strip uses
   * t*length as its station and scales derivatives exactly as at the boundary
   * rails.
   */
  export type IStripInner = readonly {
    /**
     * Interior dimensionless share of the physical chord span, strictly between
     * 0 and 1 and increasing across the supplied sections; caller owns this
     * premise.
     */
    t: number;

    /**
     * One [point, first cross partial, second cross partial] triple per phase
     * column, in world millimetres per the corresponding cross-share order.
     */
    jets: readonly [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ][];
  }[];

  /**
   * Published strip chain and its mean paired-rail chord length, or null when
   * that span or the start-column outward-orientation anchor is unusable.
   * Successful layers own new coefficient arrays but share the factory LEVEL
   * frame and STILL derivative frames across layers and other returned strips.
   * Treat these frame records as immutable; no deep copy or freeze is
   * provided.
   */
  export type IStripResult = {
    /**
     * New periodic strip chain with station span [0,length]; shared factory
     * frame objects remain subject to the documented alias-mutation
     * limitation.
     */
    chain: IAutoMovieLoftChain;

    /**
     * Positive finite mean distance between paired rail points, in millimetres;
     * null replaces the entire result when this span or the orientation anchor
     * is unusable.
     */
    length: number;
  } | null;
}
