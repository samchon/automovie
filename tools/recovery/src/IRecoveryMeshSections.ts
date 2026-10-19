import type { IAutoMovieContourLoft64 as L } from "../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import type { RecoveryBezierFit as F } from "./RecoveryBezierFit.ts";

/**
 * Generic private observation input and source-free saved-curve publication records.
 *
 * @evidence contracts/common.md#principled-implementation The structural record retains the original coefficient, phase and physical identity fields.
 * @evidence contracts/common.md#clear-and-simple-design This type owner separates immutable contracts from numerical execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type does not supply geometry, weld positions or certify source fidelity.
 * @evidence contracts/common.md#meaningful-documentation Members state their units, ownership and local diagnostic scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays and records.
 */
export namespace IRecoveryMeshSections {
  /**
   * Generic oriented triangle mesh and source-independent extraction policy.
   *
   * @evidence contracts/common.md#principled-implementation Physical positions, oriented incidence and an orthonormal frame define linear slicing without specimen metadata.
   * @evidence contracts/common.md#clear-and-simple-design Numerical budgets and unit registration are explicit at the tool seam.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No rig, subject name or source-specific cut table enters the algorithm.
   * @evidence contracts/common.md#meaningful-documentation Properties state units, exact-alias policy and general physical controls.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A structural record computes nothing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Inputs are stable for one extraction call.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns input arrays.
   * @author Samchon
   */
  export interface Input {
    /** Source positions already converted once to millimetres. */
    verticesMm: [number, number, number][];
    /** Oriented source faces for observation only, discarded before reconstruction. */
    triangles: [number, number, number][];
    /** Sweep direction normalized once; coordinates use its unit projection in millimetres. */
    axis: [number, number, number];
    /** Nonparallel frame reference used by the existing right-handed plane-frame operator. */
    reference: [number, number, number];
    /** Positive nominal station spacing, millimetres; every resolvable critical bracket is added. */
    stepMm: number;
    /** Positive complete-polyline fitting tolerance, millimetres. */
    toleranceMm: number;
    /** Positive cubic tessellation chord tolerance, millimetres; not a surface bound. */
    chordToleranceMm: number;
    /** Maximum station population; exhaustion rejects rather than drops cuts. */
    maxSections: number;
    /** Maximum fitted spans per observed curve. */
    maxSpans: number;
    /** Exact equal-position aliases establish incidence without moving positions. */
    exactCoordinateAliases: boolean;
    /** Registered face material-side sign; mixed shells are not repaired by global volume. */
    sourceOrientationSign: 1 | -1;
    /** Operational turn angle for automatic C0 corners, degrees in (0,180). */
    cornerDegrees: number;
    /** Explicit PL critical classifier; omission preserves the legacy closed-link policy. */
    criticalPolicy?: "legacy-link-cycle-v1" | "boundary-regular-path-v1";
  }

  /**
   * Physical cubic bundle with source gaps and topology observations retained.
   *
   * @evidence contracts/common.md#principled-implementation The engine input contains only cubics, signed loop incidence and generating event terminals; open arcs are separate unsupported surface evidence.
   * @evidence contracts/common.md#clear-and-simple-design One section record owns its loop curves and fit reports; longitudinal guides reference those same curve identities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original vertices, faces and normals are absent; diagnostics never authorize a replacement source surface.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes reusable production capability from its source-derived shape artifact and unproven surface interpolation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reconstruction consumer reads this sole coefficient authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The artifact owns its bounded coefficient and diagnostic arrays; source maps are not retained.
   * @author Samchon
   */
  export interface Bundle {
    /** Versioned generic curve artifact, not a population parameter family. */
    schema: "automovie-recovery-curves-v1";
    /** Complete engine contract with all physical section coefficients. */
    loft: L;
    /** Same-order section reports, including open fitted arcs and acceptance status. */
    reports: {
      coordinateMm: number;
      fits: Omit<F.Result, "curve">[];
      open: F.Result[];
      isolatedContactsMm: C.Vector[];
      diagnostics: string[];
    }[];
    /** Unresolved events, flat plateaus and numerical source issues remain explicit. */
    diagnostics: string[];
    /** Physical intervals whose topology is unsupported; reconstruction must leave these slabs open. */
    topologyGaps: { beforeMm: number; afterMm: number; reason: string }[];
    /** Source events with no displayable incident closed curve remain observations, not engine declarations. */
    unconsumedEvents: { event: L.IEvent; reason: string }[];
    /** The exact policy allows the same automatic operation to be repeated. */
    policy: Omit<Input, "verticesMm" | "triangles">;
    /** Observation and coefficient populations expose edge-by-edge re-encoding. */
    summary: {
      observations: number;
      spans: number;
      sections: number;
      events: number;
      aliases: number;
    };
    /** Present for an explicitly incomplete automatic station-prefix checkpoint. */
    coverage?: {
      complete: false;
      plannedSections: number;
      retainedSections: number;
      sourceRangeMm: [number, number];
      observedStationRangeMm: [number, number];
      unobservedStationRangeMm: [number, number] | null;
      missingSourceRangeMm: [number, number] | null;
    };
  }
}
