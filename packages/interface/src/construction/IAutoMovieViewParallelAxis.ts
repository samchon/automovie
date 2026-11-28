import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the ViewParallelAxis operations. */
export namespace IAutoMovieViewParallelAxis {
  /**
   * Three prepared-input outline declarations for the origin of a parallel view
   * axis. Each maps physical station in millimetres to one world coordinate in
   * millimetres. The axis uses one fixed chart basis at every station.
   */
  export interface IOrigin {
    /**
     * Outline of the origin's world X coordinate against station, both in
     * millimetres.
     */
    x: IAutoMovieViewPart.IOutline;

    /**
     * Outline of the origin's world Y coordinate against the same station, both
     * in millimetres.
     */
    y: IAutoMovieViewPart.IOutline;

    /**
     * Outline of the origin's world Z coordinate against the same station, both
     * in millimetres.
     */
    z: IAutoMovieViewPart.IOutline;
  }
}
