import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegCrotchRoot } from "./IAutoMovieHumanLegCrotchRoot";
import type { IAutoMovieHumanLegTube } from "./IAutoMovieHumanLegTube";

/**
 * A leg's end rings, physical station interval and girth/tube readers used for
 * section evaluation.
 *
 * The interface package owns these declarations; AutoMovieHumanLegSectionLaw in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegSectionLaw {
  /** One leg's law. */
  export interface ILaw {
    /** Station of the ankle ring, mm. */
    bottom: number;

    /** Station of the crotch ring, mm. */
    top: number;

    /** The ankle ring, canonical world. */
    ankleWorld: AutoMovieVector3Tuple[];

    /** The ankle ring's centroid, `[x, z]`. */
    ankleCentre: [number, number];

    /**
     * The crotch arc's centroid, `[x, z]`, the centre its phases are read
     * about.
     */
    crotchCentre: [number, number];

    /**
     * Span of the root strip from the ankle ring up to the law's own section,
     * mm.
     */
    ankleReach: number;

    /** Span of the root strip from the crotch ring to the law's own section, mm. */
    crotchReach: number;

    /** The girth law, mm. */
    girth: (s: number) => number;

    /** The tube. */
    tube: (s: number) => IAutoMovieHumanLegTube.ISection;

    /** The crotch ring the leg takes. */
    root: IAutoMovieHumanLegCrotchRoot.IRoot;
  }

  /**
   * The centre argument of AutoMovieHumanLegSectionLaw.points. World points of
   * the law's section at a station, canonical, at the leg's phases.
   *
   * @param law The law.
   * @param s The station.
   * @param frame The section plane at the station.
   * @param centre The chart origin's offset from the frame origin, `[along u,
   *   along v]` mm.
   */
  export type PointsCentre = readonly [number, number];
}
