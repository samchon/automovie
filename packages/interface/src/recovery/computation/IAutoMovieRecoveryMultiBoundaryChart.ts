import type { AutoMovieVector3Tuple } from "../../index";

/**
 * A coherent genus-zero triangle observation opened into one disk by cutting a boundary-connecting edge forest.
 * RecoveryMultiBoundaryChart verifies complete oriented boundary cycles, selects
 * measured shortest paths, and duplicates disconnected vertex fans. Positions stay
 * in the original millimetre frame and duplicated fans retain the same physical
 * keys. The result preserves source triangles for fitting and is not publishable
 * reconstruction geometry; unsupported topology or arithmetic throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Private physical positions in millimetres; returned positions include fan duplicates. Private oriented incidence; returned triangles address the cut disk vertices.
 * @evidence contracts/development/design.md#principled-representation Private physical positions in millimetres; returned positions include fan duplicates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryFeatureChartPreparation, RecoveryMultiBoundaryChart share IAutoMovieRecoveryMultiBoundaryChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual source edges selected by the private connecting cut forest.
 */

export namespace IAutoMovieRecoveryMultiBoundaryChart {
  /**
   * Immutable physical observations and complete oriented boundary cycles admitted by RecoveryMultiBoundaryChart.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Private physical positions in millimetres; returned positions include fan duplicates. Private oriented incidence; returned triangles address the cut disk vertices.
   * @evidence contracts/development/design.md#principled-representation Private physical positions in millimetres; returned positions include fan duplicates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryFeatureChartPreparation, RecoveryMultiBoundaryChart share IAutoMovieRecoveryMultiBoundaryChart's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Input = {
    /** Private physical positions in millimetres; returned positions include fan duplicates. */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /** Private oriented incidence; returned triangles address the cut disk vertices. */
    triangles: readonly (readonly [number, number, number])[];

    /** Declared physical identities, including distinct cut-fan occurrences in the result. */
    vertexKeys: readonly string[];

    /** Complete coherent boundary cycles of one orientable genus-zero component. */
    cycles: readonly (readonly number[])[];
  };

  /**
   * The cut observation disk, its physical source identities and independent area-preservation measurement from RecoveryMultiBoundaryChart.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Private physical positions in millimetres; returned positions include fan duplicates. Private oriented incidence; returned triangles address the cut disk vertices.
   * @evidence contracts/development/design.md#principled-representation Private physical positions in millimetres; returned positions include fan duplicates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryFeatureChartPreparation, RecoveryMultiBoundaryChart share IAutoMovieRecoveryMultiBoundaryChart's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual source edges selected by the private connecting cut forest.
   */

  export type Result = {
    /** Private physical positions in millimetres; returned positions include fan duplicates. */
    verticesMm: Readonly<AutoMovieVector3Tuple>[];

    /** Private oriented incidence; returned triangles address the cut disk vertices. */
    triangles: [number, number, number][];

    /** Declared physical identities, including distinct cut-fan occurrences in the result. */
    vertexKeys: string[];

    /** Single coherent boundary of the resulting private cut disk. */
    boundaryCycle: number[];

    /** Actual source edges selected by the private connecting cut forest. */
    cutEdges: number;

    /** Actual extra vertex occurrences introduced to separate cut banks. */
    duplicatedFanVertices: number;

    /** Measured returned minus input triangle area in square millimetres. */
    sourceAreaDifferenceMm2: number;
  };
  /** Cut a qualified genus-zero observation into a disk while preserving original physical vertices and area. Invalid boundary cycles, unsupported topology or nonrepresentable cuts throw; inputs remain borrowed and the returned disk owns its duplicated fans.
   * @evidence contracts/development/common.md#meaningful-documentation Cut a qualified genus-zero observation into a disk while preserving original physical vertices and area. Invalid boundary cycles, unsupported topology or nonrepresentable cuts throw; inputs remain borrowed and the returned disk owns its duplicated fans.
   * @evidence contracts/development/design.md#principled-representation The existing source, query and result records preserve physical identity and explicit topology qualification.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The runtime operation and its callers share the same input and result owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported incidence remains explicit and no source address becomes reconstructed geometry.
   */
  export type Operation = (input: Input) => Result;
}
