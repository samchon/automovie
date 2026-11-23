import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftSectionPhase } from "../../../construction/IAutoMovieLoftSectionPhase";
import type { IAutoMovieLoftViewRead } from "../../../construction/IAutoMovieLoftViewRead";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewOutline } from "../../../construction/IAutoMovieViewOutline";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Original ridge coordinate curves and regular-fork ports carrying their source frame and available jets.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadEarRidge in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original ridge coordinate curves and regular-fork ports carrying their source frame and available jets. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IRidge, IPort, IPorts declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IRidge, IPort, IPorts separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadEarRidge exchanges the named IRidge, IPort, IPorts contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanHeadEarRidge {
  /**
   * Ridge together with the original coordinate sources its course evaluates.
   * Original coordinate curves and the view retain the same course clock.
   * Extends the existing view with its three coordinate sources.
   * No sampled output surface recovers these coordinates.
   * Coordinates use calibration mm and physical station mm.
   * Data performs no work.
   * The ridge factory owns preparation.
   * The caller retains three knot-sized coordinate sources with its ridge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Ridge together with the original coordinate sources its course evaluates.
   * @evidence contracts/development/design.md#principled-representation `coordinates`: Original world-mm coordinates in the same physical station clock as axis.at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadEarRidge.of, AutoMovieHumanHeadEarRidgeAxis.of. Read by AutoMovieHumanHeadEarRidge.port. Also types AutoMovieHumanHeadEarParts.ridge, AutoMovieHumanHeadEarParts.source.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `coordinates`; callers supply the complete record.
   */
  export interface IRidge extends IAutoMovieViewPart {
    /** Original world-mm coordinates in the same physical station clock as axis.at. */
    coordinates: [
      IAutoMovieViewOutline.IOutline,
      IAutoMovieViewOutline.IOutline,
      IAutoMovieViewOutline.IOutline,
    ];
  }

  /**
   * A regular fork's complete original source, frame and available local derivatives.
   * Retains one original whole-phase family with its source clock, complete frame and available scalar/coordinate derivatives.
   * Both branches consume one shared record.
   * Neither four extents nor a shared site alone replaces the full source and frame.
   * Fields distinguish native phase derivatives from physical station2 and numerical frame values.
   * Data performs no work.
   * The port factory owns preparation.
   * The composition retains its parent ridge, admitted source and native phase closure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A regular fork's complete original source, frame and available local derivatives.
   * @evidence contracts/development/design.md#principled-representation `site`: Shared anatomical source site. `owner`: Actual generating ridge, in calibration mm. `station`: Actual regular station on that original ridge, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadEarRidge.port. Read by AutoMovieHumanHeadEarRidge.extension. Also types AutoMovieHumanHeadEarParts.junction, AutoMovieHumanHeadEarRidge.port.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `site`, `owner`, `station`, `source`, `inputs`, `jets`, `jetFailure`, `frame`, `originJet`, `phase`; callers supply the complete record.
   */
  export interface IPort {
    /** Shared anatomical source site. */
    site: string;
    /** Actual generating ridge, in calibration mm. */
    owner: IRidge;
    /** Actual regular station on that original ridge, mm. */
    station: number;
    /** All original signed scalar supports, fullness and cap laws. */
    source: IAutoMovieLoftViewSource.ISource;
    /** Same source's local scalar values, not measured mesh extents. */
    inputs: IAutoMovieLoftViewRead.IValues;
    /** Actual source station2 when finite; null preserves unavailable physical derivatives. */
    jets: IAutoMovieLoftViewRead.IJets | null;
    /** Actual reason physical scalar2 is unavailable, preserved separately from finite phase geometry. */
    jetFailure: string | null;
    /** The same original ridge's section plane. */
    frame: IAutoMovieLoftSectionFrame;
    /** Actual first/second derivatives of the common original course coordinates, per physical station mm. */
    originJet: [[number, number, number], [number, number, number]];
    /**
     * Whole native phase function and its available first/second phase derivatives.
     */
    phase: (phi: number) => IAutoMovieLoftSectionPhase;
  }

  /**
   * A local named port or a borrowed complete parent port.
   * Distinguishes a newly authored site from borrowing an actual source family.
   * Optional start and end use the same port type.
   * A string name alone supplies no shared frame or section.
   * Ports are regular sections inside hidden poles.
   * Data performs no work.
   * The constructor owns source reuse.
   * Borrowed ports remain owned by the same composition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A local named port or a borrowed complete parent port.
   * @evidence contracts/development/design.md#principled-representation `start`: Source start's regular fork, before its hidden closing pole. `end`: Source end's regular fork, before its hidden closing pole.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadEarRidge.of, AutoMovieHumanHeadEarRidgeAxis.of. Also types AutoMovieHumanHeadEarParts.ridge.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `start`: Source start's regular fork, before its hidden closing pole. `end`: Source end's regular fork, before its hidden closing pole.
   */
  export interface IPorts {
    /** Source start's regular fork, before its hidden closing pole. */
    start?: string | IPort;
    /** Source end's regular fork, before its hidden closing pole. */
    end?: string | IPort;
  }
}
