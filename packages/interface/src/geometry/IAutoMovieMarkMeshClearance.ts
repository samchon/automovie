import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieMeshClearanceWitness } from "./IAutoMovieMeshClearanceWitness";

/**
 * Inputs for turning directional clearance witnesses into inspection segments.
 *
 * The mesh and witness gap share metre coordinates; anchor selects the
 * object-local frame or null for world space. Witness lengths and front vertex
 * bounds are checked; finite mesh values, weights, gaps and a matching
 * measurement axis remain caller premises.
 */
export namespace IAutoMovieMarkMeshClearance {
  /**
   * Witnesses and frame identity for mesh-clearance inspection marks: one
   * segment per witness from its point on the front surface to the matching
   * point on the back surface, flagged where the back lies in front.
   *
   * A witness's front point is its front triangle's vertices weighted by its
   * barycentric weights, and its back point is that point moved `gap` metres
   * back along the measured axis, because the gap is the front depth minus the
   * back depth there. Each becomes a segment of kind `clearance`, label
   * `clearance witness`, colour yellow-green `9acd32`, at path
   * `<path>/clearance/<ordinal>`, flagged when its gap is negative. Coordinates
   * are those of the meshes, which share one frame; `anchor` names the scene
   * object that frame belongs to, or null for world space.
   *
   * It throws for a witness that names a vertex outside the front mesh or does
   * not hold three vertices and three weights.
   */
  export type IProps = {
    /**
     * Inspection path prefix; output paths append /clearance/<witness ordinal>
     * without normalization.
     */
    path: string;

    /**
     * Borrowed packed xyz metre positions of the exact front mesh measured by
     * the witnesses; no index or normal buffer is needed.
     */
    front: Pick<IAutoMovieMesh, "positions">;

    /**
     * The depth axis used by the measurement; each back endpoint subtracts
     * witness.gap along this axis.
     */
    axis: "x" | "y" | "z";

    /**
     * Borrowed measurement witnesses in output mark order, including clear
     * ones; empty produces no marks. Gaps and barycentric weights must remain
     * compatible with front.
     */
    witnesses: readonly IAutoMovieMeshClearanceWitness[];

    /**
     * Scene object path whose local frame contains front, or null when its
     * positions are already in world space; copied unchanged to every mark.
     */
    anchor: string | null;
  };
}
