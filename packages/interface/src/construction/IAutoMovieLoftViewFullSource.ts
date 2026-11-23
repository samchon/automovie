import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieLoftViewSource } from "./IAutoMovieLoftViewSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns
 * no emitted rows, fitted source, legacy lift or geometry process.
 *
 * @evidence contracts/development/design.md#principled-representation One immutable scalar/axis/feature tuple owns Point0 and independently available physical2 in station mm and phase radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The factory exposes only the domain and two capabilities consumed by original-root construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fake chain, fit, source-profile substitute or missing derivative is introduced; unavailable orders remain explicit admission failures.
 * @evidence contracts/development/common.md#meaningful-documentation States direct source ownership, independent capabilities and actual feature/shift scope.
 */
export namespace IAutoMovieLoftViewFullSource {
  /**
   * Complete original scalar controls, their actual axis and immutable features.
   *
   * @evidence contracts/development/design.md#principled-representation Retains the existing direct-source input and actual axis/relief owners without display density or realized geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is read by preparation or the two native queries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original descriptor types; unsupported girth ownership is refused rather than lofted.
   * @evidence contracts/development/common.md#meaningful-documentation Source stations and feature shifts use mm; phase/turn use radians; borrowed inputs remain immutable for reader lifetime.
   */
  export type IInput = IAutoMovieLoftViewSource.IInput &
    Pick<IAutoMovieViewPart, "axis" | "reliefs">;

  /**
   * Two independent full-native capabilities on one inclusive original domain.
   *
   * @evidence contracts/development/design.md#principled-representation Point0 does not require physical2; a collapsed pole may have a value while its regular physical2 chart is unavailable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Root construction reads domain, point and jet; no surface orientation or topology certificate is asserted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numeric unavailability throws AdmissionError; actual axis callback errors retain their identity.
   * @evidence contracts/development/common.md#meaningful-documentation Gives domain, fresh-vector ownership and the distinction between value and derivative admission.
   */
  export interface IReader {
    /** Inclusive physical station bounds, mm. */
    readonly domain: readonly [number, number];
    /**
     * Fresh full world Point0, mm; no axis.jet is requested.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives mm/radian coordinates, independent capability and fresh output ownership.
     */
    point(s: number, t: number): AutoMovieVector3Tuple;
    /**
     * Actual world total2: p mm, u per mm, v per radian and corresponding second orders.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States station-mm/phase-radian derivative units, error behavior and output ownership.
     */
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet;
  }
}
