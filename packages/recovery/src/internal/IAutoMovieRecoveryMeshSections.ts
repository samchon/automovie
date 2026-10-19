import {
  type IAutoMovieCurve64 as C,
  type IAutoMovieContourLoft64 as L,
} from "@automovie/engine/geometry/curve";
import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

import type { RecoveryBezierFit as F } from "./RecoveryBezierFit";

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
export namespace IAutoMovieRecoveryMeshSections {
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
  export type Input = IAutoMovieRecoveryInput;

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
