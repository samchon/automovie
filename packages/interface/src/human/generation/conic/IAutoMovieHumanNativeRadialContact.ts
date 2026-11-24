import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSkinDatum } from "../frame/IAutoMovieHumanSkinDatum";

/**
 * The original host chart and a material seed read against its radial section.
 */
export namespace IAutoMovieHumanNativeRadialContact {
  /** The borrowed figure-space section frame also used by skin datum readers. */
  export type IFrame = IAutoMovieHumanSkinDatum.IFrame;

  /**
   * The straight-course host and its original section source.
   */
  export interface IHost {
    /** Host section frame at a material station in millimetres. */
    at: (station: number) => IFrame;

    /** Host world point in millimetres at a material station and phase in radians. */
    point: (station: number, phase: number) => readonly number[];

    /** Inclusive station endpoints in millimetres. */
    domain: readonly [number, number];
  }

  /**
   * The first radial crossing along the declared cutter line.
   */
  export interface IResult {
    /** The cutter's material station at the seed, in millimetres. */
    part: number;

    /** The host's station and phase in millimetres and radians, with phase in [0, 2 pi). */
    host: [number, number];

    /** The cutter's world position at the seed, in figure millimetres. */
    point: AutoMovieVector3Tuple;

    /** The host's world position at its chart address, in figure millimetres. */
    target: AutoMovieVector3Tuple;
  }
}
