import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { RecoveryBezierFit as F } from "./RecoveryBezierFit";
import type { RecoveryChartCollar as L } from "./RecoveryChartCollar";
import type { RecoveryChartFit as J } from "./RecoveryChartFit";
import type { RecoveryChartLeafControls as K } from "./RecoveryChartLeafControls";

/**
 * Structural records for RecoveryChartLeafFit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
 * @evidence contracts/development/design.md#principled-representation Represents Structural records for RecoveryChartLeafFit: companion namespace of 2 members (`Input`, `Result`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRecoveryChartLeafFit` in packages/recovery/src/internal/IRecoveryChartLeafFit.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/recovery (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IRecoveryChartLeafFit {
  /**
   * Original immutable input contract.
   *
   * @evidence contracts/development/design.md#principled-representation These records preserve the operation's original structural fields and ownership declarations without executing geometry or fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A type-only owner separates the unchanged input and result contracts from execution.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The records introduce no defaults, source fallback, validation bypass or numerical transformation.
   * @evidence contracts/development/common.md#meaningful-documentation Existing member comments retain their units and boundary meanings; the operation documents numerical qualifications.
   */
  export type Input = {
    /** Stable chart identity retained by the fitted patch family. */
    name: string;

    /** Private physical chart observations in millimetres. */
    verticesMm: readonly C.Vector[];

    /** Original private triangle incidence used by physical-area integration. */
    triangles: readonly (readonly [number, number, number])[];

    /** Chart-local UV coordinates aligned with the private vertices. */
    parameters: readonly (readonly number[])[];

    /** Complete fitted boundary cubic results, one per chart side. */
    curves: readonly F.Result[];

    /** Four increasing normalized phase partitions for the authoritative side cubics. */
    knots: readonly [
      readonly number[],
      readonly number[],
      readonly number[],
      readonly number[],
    ];

    /** Requested correspondence residual in millimetres, independent of embedding. */
    toleranceMm: number;

    /** Positive maximum retained leaf patches in one fit attempt. */
    maxPatches: number;

    /** Positive numerical solver iteration limit per attempted fit. */
    maxIterations: number;

    /** Explicit maximum physical-area observation rows per attempt. */
    maxObservationRows: number;

    /** Maximum residual-driven refinement waves after the initial fit. */
    maxRefinements: number;

    /** Optional millimetre exchange length for physical-gradient observation rows. */
    physicalGradientLengthMm?: number;
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
    /** Returned complete millimetre coefficient registry with fixed boundary authority. */
    controlsMm: C.Vector[];

    /** Fitted leaf identities and row-major sixteen-control registry references. */
    patches: { id: string; controlIds: number[] }[];

    /** Combined numerical and declared observation acceptance, without an embedding claim. */
    qualified: boolean;

    /** Joint fit diagnostics with coefficients owned by controlsMm instead of duplicated here. */
    joint: Omit<J.Result, "controls">;

    /** Retained leaves, shared edges and physical boundary-control bindings. */
    leafLayout: {
      leaves: ReturnType<typeof L>["leaves"];
      edges: ReturnType<typeof K>["edges"];
      bindings: ReturnType<typeof K>["bindings"];
    };

    /** Physical source-area quadrature population and its independent qualification. */
    areaObservation: {
      /** Combined numerical and declared observation acceptance, without an embedding claim. */
      qualified: boolean;
      rows: number;
      sourceAreaMm2: number;
      quadratureMinimumRows: number;
      integratedAreaMm2: number | null;
      maximumRelativeAreaDiscrepancy: number | null;
      reason: string | null;
    };

    /** Actual refinement history, residuals and attempted patch populations. */
    refinement: {
      rounds: number;
      reason: string;
      residualsMm: number[];
      areaRmsMm: (number | null)[];
      attemptedPatches: number[];
    };
  };
}
