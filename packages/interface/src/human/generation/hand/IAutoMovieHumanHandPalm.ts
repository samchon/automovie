import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieCurve64 } from "../../../geometry/curve/IAutoMovieCurve64";

/** Type contracts exchanged by AutoMovieHumanHandPalm; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHandPalm {
  /** JSON coefficient layout before restoring the engine's fixed tuple widths.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation JSON coefficient layout before restoring the engine's fixed tuple widths.
   * @evidence contracts/development/design.md#principled-representation `type`: Declared cubic representation and physical units. `name`: Original curve identity. `closed`: Original closed-loop flag.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandPalm.fixedCurve, AutoMovieHumanHandPalm.fixedSection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `type`, `name`, `closed`, `unit`, `phaseUnit`, `phaseIntervals`, `spans`; callers supply the complete record.
   */
  export interface IFixedCurveInput {
    /** Declared cubic representation and physical units. */
    type: string;
    /** Original curve identity. */
    name: string;
    /** Original closed-loop flag. */
    closed: boolean;
    /** Position unit of the stored controls. */
    unit: string;
    /** Unit of the original curve parameter. */
    phaseUnit: string;
    /** Original span widths. */
    phaseIntervals: number[];
    /** Four three-coordinate controls per span. */
    spans: number[][][];
  }

  /** One Bézier section and its cutting chart in native world millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One Bézier section and its cutting chart in native world millimetres.
   * @evidence contracts/development/design.md#principled-representation `station`: Source row label, with a fractional label for an inserted measured collar cut. `stationMm`: Distance along the source course in millimetres, used to index the axis. `coordinateMm`: Signed cutting-plane coordinate in millimetres in the section's observation chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandPalm.fixedSection. Read by AutoMovieHumanHandPalm.physicalPlane, AutoMovieHumanHandPalm.contourCoordinates, AutoMovieHumanHandPalm.attachFixed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `station`, `stationMm`, `coordinateMm`, `originMm`, `u`, `v`, `loops`; callers supply the complete record.
   */
  export interface IFixedSection {
    /** Source row label, with a fractional label for an inserted measured collar cut. */
    station: number;

    /** Distance along the source course in millimetres, used to index the axis. */
    stationMm: number;

    /** Signed cutting-plane coordinate in millimetres in the section's observation chart. */
    coordinateMm: number;

    /** Cutting-plane origin in native reference-world millimetres. */
    originMm: AutoMovieVector3Tuple;

    /** First unit tangent of the cutting plane in native reference-world axes. */
    u: AutoMovieVector3Tuple;

    /** Second unit tangent of the cutting plane in the reference chart's handedness. */
    v: AutoMovieVector3Tuple;

    /** Source contours in native reference-world millimetres with their observed closure kind. */
    loops: {
      /** Source representation or event kind, restored to the owning contour contract by the Human builder. */
      kind: string;
      /** Closed source curve in its declared section chart; coefficient and derivative units follow that curve's parameter. */
      curve: IAutoMovieCurve64.Cubic;
    }[];
  }

  /** Numerical chart of the ordinary strip. Its rows are still the original world planes.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Numerical chart of the ordinary strip.
   * @evidence contracts/development/design.md#principled-representation `stations`: Accumulated distances between the actual plane origins, millimetres. `worldCollar`: Whether the measured turning collar is retiled in its world chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHandPalm.contourCoordinates. Read by AutoMovieHumanHandPalm.attachFixed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `stations`, `worldCollar`; callers supply the complete record.
   */
  export interface IContourCoordinates {
    /** Accumulated distances between the actual plane origins, millimetres. */
    stations: number[];
    /** Whether the measured turning collar is retiled in its world chart. */
    worldCollar: boolean;
    /** Project one world point into its own recorded section chart. */
    into(row: number, point: AutoMovieVector3Tuple): AutoMovieVector3Tuple;
    /** Return an evaluated section point to its exact recorded world plane. */
    out(point: AutoMovieVector3Tuple): AutoMovieVector3Tuple;
  }

  /** Isolated raw-mesh tip and its observed neighbouring coordinates.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Isolated raw-mesh tip and its observed neighbouring coordinates.
   * @evidence contracts/development/design.md#principled-representation `singleTipQualified`: Whether the raw-mesh maximum qualifies as a single point for a loft cap. `maximum`: Terminal plane coordinate and its raw-mesh extremal points in native world millimetres. `coordinatesMm`: Observed plane coordinates in millimetres, including a cut beyond the maximum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHandPalm.attachFixed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `singleTipQualified`, `maximum`, `coordinatesMm`; callers supply the complete record.
   */
  export interface IFixedTerminal {
    /** Whether the raw-mesh maximum qualifies as a single point for a loft cap. */
    singleTipQualified: boolean;

    /** Terminal plane coordinate and its raw-mesh extremal points in native world millimetres. */
    maximum: {
      /** Physical coordinate of this section or event along the original source axis, millimetres. */
      coordinateMm: number;
      /** Ordered terminal-boundary points in the original source frame, millimetres. */
      pointsMm: AutoMovieVector3Tuple[];
    };

    /** Observed plane coordinates in millimetres, including a cut beyond the maximum. */
    coordinatesMm: number[];
  }

  /** The value argument of AutoMovieHumanHandPalm.fixedSection. Restore the unchanged absolute frame and cubic loops of an authored section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Restore the unchanged absolute frame and cubic loops of an authored section.
   * @evidence contracts/development/design.md#principled-representation `station`: Archived source row address, including fractional labels for inserted cuts; the physical station is stationMm. `stationMm`: Physical station along the original source axis, millimetres. `coordinateMm`: Physical coordinate of this section or event along the original source axis, millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandPalm.IFixedSectionValue is the canonical exchange used by AutoMovieHumanHandPalm.fixedSection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `station`, `stationMm`, `coordinateMm`, `originMm`, `u`, `v`, `loops`; callers supply the complete record.
   */
  export type IFixedSectionValue = {
    /** Archived source row address, including fractional labels for inserted cuts; the physical station is stationMm. */
    station: number;
    /** Physical station along the original source axis, millimetres. */
    stationMm: number;
    /** Physical coordinate of this section or event along the original source axis, millimetres. */
    coordinateMm: number;
    /** Section-plane origin in the original source frame, millimetres. */
    originMm: number[];
    /** Unit u axis of the section's local chart in the registered source frame. */
    u: number[];
    /** Unit v axis of the section's local chart in the registered source frame. */
    v: number[];
    /** Ordered section boundary loops, retaining the original component correspondence and orientation. */
    loops: {
      /** Source representation or event kind, restored to the owning contour contract by the Human builder. */
      kind: string;
      /** Closed source curve in its declared section chart; coefficient and derivative units follow that curve's parameter. */
      curve: IFixedCurveInput;
    }[];
  };

  /** Result of AutoMovieHumanHandPalm.openTerminal. Read the actual open capture edge and verify every directed mesh edge.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read the actual open capture edge and verify every directed mesh edge.
   * @evidence contracts/development/design.md#principled-representation `base`: Index of the first vertex in the actual open terminal ring within the archived mesh position array. `boundary`: Directed open-edge boundary vertices in their verified cyclic order, registered millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandPalm.IOpenTerminalResult is the canonical exchange used by AutoMovieHumanHandPalm.openTerminal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `base`, `boundary`; callers supply the complete record.
   */
  export type IOpenTerminalResult = {
    /** Index of the first vertex in the actual open terminal ring within the archived mesh position array. */
    base: number;
    /** Directed open-edge boundary vertices in their verified cyclic order, registered millimetres. */
    boundary: AutoMovieVector3Tuple[];
  };

  /** The map argument of AutoMovieHumanHandPalm.palmOf. The palm's chain, its sections square to the hand's axis.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The palm's chain, its sections square to the hand's axis.
   * @evidence contracts/development/design.md#principled-representation The palm's chain, its sections square to the hand's axis. The callable takes q and returns AutoMovieVector3Tuple.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHandPalm.PalmOfMap is the canonical exchange used by AutoMovieHumanHandPalm.palmOf.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHandPalm.palmOf for the palm's chain, its sections square to the hand's axis.
   */
  export type PalmOfMap = (
    q: readonly [number, number, number],
  ) => AutoMovieVector3Tuple;
}
