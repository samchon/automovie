import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieLoftViewSource } from "./IAutoMovieLoftViewSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns no
 * emitted rows, fitted source, legacy lift or geometry process.
 */
export namespace IAutoMovieLoftViewFullSource {
  /**
   * Direct view scalar construction with its actual axis and optional reliefs.
   * Supply the original station domain, front and side outlines and direct
   * shoulder or top fullness. Keep the axis and feature data unchanged while
   * the reader retains them.
   */
  export type IInput = IAutoMovieLoftViewSource.IInput &
    Pick<IAutoMovieViewPart, "axis" | "reliefs">;

  /**
   * Value and second-order readers on the original inclusive physical station
   * domain. Both apply the supplied axis and reliefs. Point evaluation needs
   * only axis values and can read an admitted collapsed pole; jet evaluation
   * needs actual derivatives at a regular station.
   */
  export interface IReader {
    /**
     * Inclusive pair of original lower and upper physical stations, in
     * millimetres, prepared from the direct view source.
     */
    readonly domain: readonly [number, number];
    /**
     * Read a fresh world point in millimetres at physical station s in
     * millimetres and polar phase t in radians. This value-only operation reads
     * the axis value and applies admitted relief. A valid collapsed pole
     * returns its frame origin.
     */
    point(s: number, t: number): AutoMovieVector3Tuple;
    /**
     * Read all world partials through total order two at physical station s in
     * millimetres and polar phase t in radians. The solid-surface result uses u
     * for station and v for phase. An outside station, collapsed pole or
     * unavailable physical derivatives causes the reader to throw.
     */
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet;
  }
}
