import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One reference surface as the clearance instrument holds it between
 * readings: its placed local-Float32 copy and the signed queries compiled from it, one per
 * boundary mode. Holding it changes no reading; it only avoids compiling the
 * same reference again for every subject.
 *
 * @evidence contracts/common.md#principled-implementation measureHumanFaceClearance snapshots local Float32 geometry then applies publication TRS, compiling native signed queries for the actual boundary mode.
 * @evidence contracts/common.md#clear-and-simple-design One reference keeps rounded mesh, serialized transform and per-mode queries together under the original exterior mesh's weak key.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuse requires immutable exterior contents and matching serialized TRS; mesh identity alone does not justify reuse after mutation, and surface chord error remains unknown.
 * @evidence contracts/common.md#meaningful-documentation Members explain local publication precision, exact transform key and boundary-mode query ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type builds no hierarchy; measureHumanFaceClearance and engine query own compilation/traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record schedules no requests; the instrument owns weak-key/transform invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; weak-key reference lifetime and retained mesh/query bytes belong to the instrument.
 *
 * @author Samchon
 */
export interface IHumanFaceClearanceReference {
  /** Reference reconstructed in the head frame from actual local Float32 and publication TRS. */
  mesh: IAutoMovieMesh;

  /** Exact serialized publication TRS of this rounded reference. */
  transform: string;

  /** Compiled signed queries by boundary mode. */
  queries: Map<
    "closed" | "open",
    ReturnType<typeof createAutoMovieSignedMeshQuery>
  >;
}
