import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegAxis } from "./IAutoMovieHumanLegAxis";

/**
 * Type contracts exchanged by AutoMovieHumanLegSection; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegSection {
  /** One station's section. */
  export interface ISection {
    /** The section plane. */
    frame: IAutoMovieHumanLegAxis.IFrame;

    /** Points in the plane, `[x, z, lift]`, one per phase. */
    local: AutoMovieVector3Tuple[];
  }

  /**
   * The centre argument of AutoMovieHumanLegSection.of. The section at station
   * s, canonical.
   *
   * @param law The leg's section law.
   * @param frames The leg's frames.
   * @param centre The centre line: the chart origin's offset from the frame
   *   origin at a station.
   * @param strip The root strip from the crotch ring down the law's crotch
   *   reach: its ring at a share of the reach, 0 at the crotch ring, composed
   *   by the leg chain (`AutoMovieHumanLimbRootStrip`).
   * @param ankle The root strip from the foot's ankle ring up the law's ankle
   *   reach: its ring at a share of the reach, 0 at the ankle ring.
   * @param s The station.
   */
  export type OfCentre = (s: number) => [number, number];

  /**
   * The strip argument of AutoMovieHumanLegSection.of. The section at station
   * s, canonical.
   *
   * @param law The leg's section law.
   * @param frames The leg's frames.
   * @param centre The centre line: the chart origin's offset from the frame
   *   origin at a station.
   * @param strip The root strip from the crotch ring down the law's crotch
   *   reach: its ring at a share of the reach, 0 at the crotch ring, composed
   *   by the leg chain (`AutoMovieHumanLimbRootStrip`).
   * @param ankle The root strip from the foot's ankle ring up the law's ankle
   *   reach: its ring at a share of the reach, 0 at the ankle ring.
   * @param s The station.
   */
  export type OfStrip = (w: number) => AutoMovieVector3Tuple[];

  /**
   * The ankle argument of AutoMovieHumanLegSection.of. The section at station
   * s, canonical.
   *
   * @param law The leg's section law.
   * @param frames The leg's frames.
   * @param centre The centre line: the chart origin's offset from the frame
   *   origin at a station.
   * @param strip The root strip from the crotch ring down the law's crotch
   *   reach: its ring at a share of the reach, 0 at the crotch ring, composed
   *   by the leg chain (`AutoMovieHumanLimbRootStrip`).
   * @param ankle The root strip from the foot's ankle ring up the law's ankle
   *   reach: its ring at a share of the reach, 0 at the ankle ring.
   * @param s The station.
   */
  export type OfAnkle = (w: number) => AutoMovieVector3Tuple[];
}
