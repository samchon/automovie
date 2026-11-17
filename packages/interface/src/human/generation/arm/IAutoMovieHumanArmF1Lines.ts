import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Measured arm contours, conic quarter shoulders and world-millimetre triangle buffers.
 *
 * The interface package owns these declarations; AutoMovieHumanArmF1Lines in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measured arm contours, conic quarter shoulders and world-millimetre triangle buffers. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IFixedMesh, IFixedRing, IShoulders, IStation declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IFixedMesh, IFixedRing, IShoulders, IStation separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanArmF1Lines exchanges the named IFixedMesh, IFixedRing, IShoulders, IStation contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanArmF1Lines {
  /** Locally owned mutable world-millimetre triangles, until the region is returned.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Locally owned mutable world-millimetre triangles, until the region is returned.
   * @evidence contracts/development/design.md#principled-representation `positions`: Absolute millimetre positions, three numbers per vertex. `indices`: Three vertex indices per emitted triangle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmF1Lines.sleeve. Read by AutoMovieHumanHandPalm.attachFixed, AutoMovieHumanHandPalm.openTerminal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `positions`, `indices`; callers supply the complete record.
   */
  export interface IFixedMesh {
    /** Absolute millimetre positions, three numbers per vertex. */
    positions: number[];

    /** Three vertex indices per emitted triangle. */
    indices: number[];
  }

  /** One ordered, implicitly closed set of measured contour controls and its distal plane normal.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One ordered, implicitly closed set of measured contour controls and its distal plane normal.
   * @evidence contracts/development/design.md#principled-representation `points`: Absolute contour vertices in millimetres, without a repeated closing point. `normal`: Unit normal pointing along the measured distal course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmF1Lines.sleeve. Also types AutoMovieHumanArmF1Lines.orientation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `points`, `normal`; callers supply the complete record.
   */
  export interface IFixedRing {
    /** Absolute contour vertices in millimetres, without a repeated closing point. */
    points: AutoMovieVector3Tuple[];

    /** Unit normal pointing along the measured distal course. */
    normal: AutoMovieVector3Tuple;
  }

  /** One quarter's conic shoulder per pair of guides.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One quarter's conic shoulder per pair of guides.
   * @evidence contracts/development/design.md#principled-representation `lateralPosterior`: Between the lateral and posterior guides. `posteriorMedial`: Between the posterior and medial guides. `medialAnterior`: Between the medial and anterior guides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmF1Lines.IShoulders is the canonical exchange used by AutoMovieHumanArmF1Lines.q.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `lateralPosterior`, `posteriorMedial`, `medialAnterior`, `anteriorLateral`; callers supply the complete record.
   */
  export interface IShoulders {
    /** Between the lateral and posterior guides. */
    lateralPosterior: number;

    /** Between the posterior and medial guides. */
    posteriorMedial: number;

    /** Between the medial and anterior guides. */
    medialAnterior: number;

    /** Between the anterior and lateral guides. */
    anteriorLateral: number;
  }

  /** One authored station.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One authored station.
   * @evidence contracts/development/design.md#principled-representation `site`: Its anatomical site. `along`: Millimetres from the segment's zero along its axis, or the landmark it stands at. `extents`: Outline values from the segment axis: lateral, medial, anterior, posterior, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanArmF1Lines.HUMERUS, AutoMovieHumanArmF1Lines.FOREARM.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `site`, `along`, `extents`, `shoulders`; callers supply the complete record.
   */
  export interface IStation {
    /** Its anatomical site. */
    site: string;

    /** Millimetres from the segment's zero along its axis, or the landmark it stands at. */
    along: number | "axilla level" | "elbow" | "wrist" | "knuckles";

    /** Outline values from the segment axis: lateral, medial, anterior, posterior, mm. */
    extents: [number, number, number, number];

    /** Quarter shoulders. */
    shoulders: IShoulders;
  }
}
