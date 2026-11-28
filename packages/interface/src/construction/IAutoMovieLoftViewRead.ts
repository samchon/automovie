import type { IAutoMovieViewSectionField } from "./IAutoMovieViewSectionField";

/** Data and callback contracts shared by the LoftViewRead operations. */
export namespace IAutoMovieLoftViewRead {
  /**
   * Effective scalar inputs at one physical station for a native local section.
   * The reader evaluates the signed outlines as directional extents, applies
   * fullness and any applicable cap shoulder policy, and reads declared touch
   * and split controls. Native section preparation admits these values as
   * geometry.
   */
  export interface IValues {
    /**
     * Four chart extents in millimetres, in +u, +v, −u, −v order. The
     * negative-axis outline values are sign-reversed into extents.
     */
    extents: number[];

    /**
     * Four effective dimensionless shoulder shares, in cyclic quarter order. A
     * regular four-quarter read includes the applicable cap blend.
     */
    shoulders: number[];

    /**
     * Four authored guide contact offsets in chart millimetres, in +u, +v, −u,
     * −v order, when present.
     */
    touch?: number[];

    /**
     * One [u, v, tangent angle, following shoulder] per quarter, when declared.
     * Coordinates are chart millimetres, the angle is radians and the share is
     * dimensionless.
     */
    splits?: number[][];

    /**
     * Ordered split points within each of four quarters, when declared. Each
     * point contains [u, v, tangent angle, following shoulder]. An empty
     * quarter list retains one arc.
     */
    pieces?: number[][][];
  }

  /**
   * Effective native scalar values and physical-station derivatives at one
   * direct-source station. Each scalar tuple contains value, first derivative
   * and second derivative in increasing order. The derivative coordinate is
   * physical station in millimetres, after any root or angle conversion.
   */
  export interface IJets {
    /**
     * Four extent jets in +u, +v, −u, −v order. Each triple uses millimetres,
     * millimetres per millimetre, and inverse millimetres.
     */
    extents: IAutoMovieViewSectionField.IStationJet[];

    /**
     * Four effective shoulder jets in cyclic quarter order, with unitless value
     * and derivatives per millimetre and per squared millimetre.
     */
    shoulders: IAutoMovieViewSectionField.IStationJet[];

    /**
     * Jets of declared guide offsets in +u, +v, −u, −v order. Values use chart
     * millimetres and derivatives use physical station.
     */
    touch?: IAutoMovieViewSectionField.IStationJet[];

    /**
     * One split per quarter when declared, each with station triples for u, v,
     * tangent angle and following shoulder in that order.
     */
    splits?: IAutoMovieViewSectionField.IStationJet[][];

    /**
     * Ordered splits within each of four quarters when declared. Each split
     * gives station triples for u, v, tangent angle and following shoulder.
     */
    pieces?: IAutoMovieViewSectionField.IStationJet[][][];
  }
}
