import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A copy of a mesh with its positions expressed in a directional frame: each
 * position becomes its dot products with `across`, `up` and `forward`. The
 * copy sets `normals` to null. Refuses positions that are incomplete or not
 * finite. Shared by the directional contact and
 * intersection constructors.
 *
 * Axes are an admitted orthonormal caller frame and positions retain their
 * length unit. Only positions are newly owned; other buffers are shared. This
 * helper does not independently admit the basis or projected arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Dot products express admitted finite XYZ rows in the caller's shared basis, preserving projected triangle correspondence and clearing stale normals.
 * @evidence contracts/common.md#clear-and-simple-design One position-only adapter serves depth and clearance engines; directional frame admission and complete index admission belong to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No projection grid or geometry sample substitutes for original vertices; basis validity and finite projected results remain caller/engine premises.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes newly owned positions from shared buffers, unchanged units, cleared normals and the unvalidated basis/output premises.
 * @evidence contracts/performance.md#efficient-algorithms One O(V) traversal produces three dot products per vertex and a new position buffer; topology is shared rather than recopied.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Projection reflects the current mesh and basis for one owning query build; this adapter coordinates no persistent cache across geometry changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned O(V) position buffer and borrowed remaining fields; no independent reference survives outside the returned mesh.
 * @author Samchon
 */
export function projectMeshOntoFrame(
  mesh: IAutoMovieMesh,
  across: IAutoMovieVector3,
  up: IAutoMovieVector3,
  forward: IAutoMovieVector3,
): IAutoMovieMesh {
  if (mesh.positions.length % 3 !== 0 || !mesh.positions.every(Number.isFinite))
    throw new Error(
      "Directional contact needs complete finite mesh positions.",
    );
  const positions: number[] = [];
  for (let i: number = 0; i < mesh.positions.length; i += 3) {
    const point: IAutoMovieVector3 = Vector3.create(
      mesh.positions[i],
      mesh.positions[i + 1],
      mesh.positions[i + 2],
    );
    positions.push(
      Vector3.dot(point, across),
      Vector3.dot(point, up),
      Vector3.dot(point, forward),
    );
  }
  return { ...mesh, positions, normals: null };
}
