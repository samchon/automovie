import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLegCrotchRoot } from "./IAutoMovieHumanLegCrotchRoot";
import type { IAutoMovieHumanLegTube } from "./IAutoMovieHumanLegTube";

/**
 * A leg's end rings, physical station interval and girth/tube readers used for section evaluation.
 *
 * The interface package owns these declarations; AutoMovieHumanLegSectionLaw in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A leg's end rings, physical station interval and girth/tube readers used for section evaluation. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only ILaw, PointsCentre declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation ILaw, PointsCentre separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanLegSectionLaw exchanges the named ILaw, PointsCentre contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanLegSectionLaw {
  /** One leg's law.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One leg's law.
   * @evidence contracts/development/design.md#principled-representation `bottom`: Station of the ankle ring, mm. `top`: Station of the crotch ring, mm. `ankleWorld`: The ankle ring, canonical world.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegSectionLaw.of. Read by AutoMovieHumanLegSection.of, AutoMovieHumanLegSectionLaw.points. Also types AutoMovieHumanLegChain.law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bottom`, `top`, `ankleWorld`, `ankleCentre`, `crotchCentre`, `ankleReach`, `crotchReach`, `girth`, `tube`, `root`; callers supply the complete record.
   */
  export interface ILaw {
    /** Station of the ankle ring, mm. */
    bottom: number;

    /** Station of the crotch ring, mm. */
    top: number;

    /** The ankle ring, canonical world. */
    ankleWorld: AutoMovieVector3Tuple[];

    /** The ankle ring's centroid, `[x, z]`. */
    ankleCentre: [number, number];

    /** The crotch arc's centroid, `[x, z]`, the centre its phases are read about. */
    crotchCentre: [number, number];

    /** Span of the root strip from the ankle ring up to the law's own section, mm. */
    ankleReach: number;

    /** Span of the root strip from the crotch ring to the law's own section, mm. */
    crotchReach: number;

    /**
     * The girth law, mm.
     */
    girth: (s: number) => number;

    /**
     * The tube.
     */
    tube: (s: number) => IAutoMovieHumanLegTube.ISection;

    /** The crotch ring the leg takes. */
    root: IAutoMovieHumanLegCrotchRoot.IRoot;
  }

  /** The centre argument of AutoMovieHumanLegSectionLaw.points. World points of the law's section at a station, canonical, at the leg's phases.
  @param law The law.
  @param s The station.
  @param frame The section plane at the station.
  @param centre The chart origin's offset from the frame origin, `[along u, along v]` mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation World points of the law's section at a station, canonical, at the leg's phases.
 * @evidence contracts/development/design.md#principled-representation World points of the law's section at a station, canonical, at the leg's phases. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegSectionLaw.PointsCentre is the canonical exchange used by AutoMovieHumanLegSectionLaw.points.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSectionLaw.points for world points of the law's section at a station, canonical, at the leg's phases.
 */
  export type PointsCentre = readonly [number, number];
}
