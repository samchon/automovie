import { transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

/**
 * Reconstruct the actual local Float32 publication in its source metre frame.
 * This CPU view is measurement data, not an additional rendered surface.
 *
 * @evidence contracts/common.md#principled-implementation Local positions/normals round to Float32 before ordinary TRS restores the source metre frame; absent TRS returns that rounded view, as measurement data rather than another surface.
 * @evidence contracts/common.md#clear-and-simple-design This CPU reader separates publication-precision observation from geometry generation, delegating transform semantics to the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unrounded source, expected world box or added renderer object substitutes the actual local publication.
 * @evidence contracts/common.md#meaningful-documentation The public comment gives Float32 publication precision, source-frame restoration and measurement-only ownership.
 * @evidence contracts/performance.md#efficient-algorithms For V position/normal components, rounding is O(V) with fresh arrays; optional transform includes its full mesh-processing cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One rounded view supplies the optional transform; no mutable mesh/TRS identity cache assumes unchanged values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh arrays/transformed mesh transfer to its caller while untouched attributes follow spread/engine ownership, with no handles, tasks or permanent registry.
 */
export function readHumanLocalMeshWorld(
  mesh: IAutoMovieMesh,
  transform?: IAutoMovieTransform | null,
): IAutoMovieMesh {
  const rounded: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.map(Math.fround),
    normals: mesh.normals?.map(Math.fround) ?? null,
  };
  return transform === undefined || transform === null
    ? rounded
    : transformAutoMovieMesh(rounded, transform);
}
