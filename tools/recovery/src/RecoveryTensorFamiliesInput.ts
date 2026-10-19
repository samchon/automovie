import type { IAutoMovieBicubicAtlasGeometry } from "../../../packages/interface/src/model/IAutoMovieBicubicAtlasGeometry.ts";
import type { RecoveryAnalyticDomainsInput } from "./RecoveryAnalyticDomainsInput.ts";

/**
 * Saved analytic families and their shared contour coefficient boundaries.
 * Optional tensor publication leaves the original curve-only bundle unchanged.
 * Exact group and curve IDs declare generation ownership; they do not qualify
 * inter-operator polygonal conformity, transverse continuity or source fidelity.
 *
 * @evidence contracts/common.md#principled-implementation Group addresses transfer each domain to one tensor recipe; endpoint bindings admit the same saved coefficient authority.
 * @evidence contracts/common.md#clear-and-simple-design A structural extension leaves the original extraction and curve-only bundle API unchanged; the adapter namespace retains its existing public Input alias.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record admits no source geometry, normals or source index table; it introduces no fitting or representation method.
 * @evidence contracts/common.md#meaningful-documentation Properties separate saved recipe ownership, delegated groups and exact canonical endpoint coefficient bindings, with unsupported geometric qualifications explicit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A structural type performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Admission and realization own reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns these immutable records; this declaration retains no runtime state.
 */
export type RecoveryTensorFamiliesInput = RecoveryAnalyticDomainsInput & {
  /** Absence preserves the curve-only path. Families retain their own partial realization reports. */
  tensorFamilies?: readonly {
    /** Unique source-free family identity. */
    id: string;
    /** Complete saved analytic recipe; its controls use model metres. */
    geometry: IAutoMovieBicubicAtlasGeometry;
    /** Exact interval and group ordinals whose generation belongs to this family. */
    replacedGroups: readonly { interval: number; group: number }[];
    /** Named end curves and their exact recipe control-ID and phase-interval authority. */
    boundaries: readonly {
      curveName: string;
      controlIds: readonly (readonly number[])[];
      phaseIntervals: readonly number[];
    }[];
  }[];
};
