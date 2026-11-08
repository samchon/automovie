import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Structural records for RecoveryDiskChart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidence contracts/development/design.md#principled-representation Represents Structural records for RecoveryDiskChart: companion namespace of 2 members (`Input`, `Result`); units and frames named in its text: degrees. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRecoveryDiskChart` in packages/recovery/src/internal/IRecoveryDiskChart.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/recovery (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IRecoveryDiskChart {
  /**
   * Original immutable input contract.
   *
   * @evidence contracts/development/design.md#principled-representation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   */
  export type Input = {
    /** Private immutable chart positions in physical millimetres. */
    verticesMm: readonly C.Vector[];

    /** Private oriented triangle incidence of the admitted disk. */
    triangles: readonly (readonly [number, number, number])[];

    /** Physical observation identities aligned with vertices, distinct from coordinate equality. */
    vertexKeys: readonly string[];

    /** Coherently oriented complete disk boundary in vertex addresses. */
    boundaryCycle: readonly number[];

    /** Minimum physical turn angle in degrees eligible for anchor selection. */
    cornerDegrees: number;
  };

  /**
   * Original returned coefficient and diagnostic contract.
   *
   * @evidence contracts/development/design.md#principled-representation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   */
  export type Result = {
    /** Private immutable chart positions in physical millimetres. */
    verticesMm: C.Vector[];

    /** Private oriented triangle incidence of the admitted disk. */
    triangles: [number, number, number][];

    /** Physical observation identities aligned with vertices, distinct from coordinate equality. */
    vertexKeys: string[];

    /** Four oriented chart-side observation chains after exact quarter insertions. */
    sides: [number[], number[], number[], number[]];

    /** Actual stable-key anchor choice, turn threshold and physical quarter lengths. */
    cornerRule: {
      anchorKey: string;
      anchorTurningDegrees: number;
      featureThresholdDegrees: number;
      selection:
        | "maximum-qualified-turn-then-key"
        | "minimum-key-without-qualified-turn";
      quarterLengthsMm: [number, number, number, number];
      perimeterMm: number;
    };

    /** Private quarter-cut ancestry and measured millimetre insertion positions. */
    insertedBoundaryVertices: {
      id: number;
      key: string;
      edgeKeys: [string, string];
      fractionFromFirst: number;
      pointMm: C.Vector;
    }[];
  };
}
