import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";

/**
 * Structural records for RecoveryDiskChart.
 *
 * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
 * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
 * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
 */
export namespace IRecoveryDiskChart {
  /**
   * Original immutable input contract.
   *
   * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
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
   * @evidence contracts/common.md#principled-implementation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/common.md#clear-and-simple-design A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input and output lifetimes remain with the operation and its caller.
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
