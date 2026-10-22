import type { AutoMovieHumanHarmonicCurve } from "./AutoMovieHumanHarmonicCurve";
import type { AutoMovieHumanLoftChain } from "./AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import type { AutoMovieHumanLoftParameter } from "./AutoMovieHumanLoftParameter";

/**
 * Principal-layer data of one chain, as published by the observation fitter
 * and consumed by {@link AutoMovieHumanLoftChain}.
 */
export interface IAutoMovieHumanLoftChain {
  /** Stable chain name used for part ids and diagnostics. */
  name: string;

  /** Highest harmonic K of every section in this chain. */
  order: number;

  /** Phase correspondence rule; see {@link AutoMovieHumanLoftParameter}. */
  rule: AutoMovieHumanLoftParameter.Rule;

  /**
   * Number of uniform phases of the chain's own rings.
   *
   * Chosen by the fitter from the chain's largest perimeter so vertices are a
   * few millimetres apart; a child switches from its inherited ring to this
   * phase set in its first band.
   */
  samples: number;

  /** Principal layers ordered by strictly increasing height, at least two. */
  layers: IAutoMovieHumanLoftChain.ILayer[];
}
export namespace IAutoMovieHumanLoftChain {
  /** One principal layer: a shape event of the chain. */
  export interface ILayer {
    /**
     * Station of the layer along the chain in mm, strictly increasing over
     * the chain's layers. For a layer without a frame it is the world height
     * of its horizontal section.
     */
    y: number;

    /** Section plane of the layer; absent means horizontal at height `y`. */
    frame?: AutoMovieHumanLoftFrame.IFrame;

    /** Harmonic section coefficients in mm, layout of {@link AutoMovieHumanHarmonicCurve}. */
    coefficients: number[];

    /** Height derivative of every coefficient in mm per mm, shared by both adjacent intervals. */
    slopes: number[];
  }
}
