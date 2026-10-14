import { selectAutoMovieTriangleRegion } from "@automovie/engine";

import { IPortraitComponentHost } from "../surface/structures/IPortraitComponentHost";

/**
 * Select the original patch bounded by the inward-oriented anatomical loop.
 * The engine owns the connectivity operation; no image-plane test is repeated
 * here, so changing a measured face cannot change which seam triangles it cuts.
 * Malformed or nonseparating boundaries propagate the engine's refusal;
 * neither the host nor the supplied loop is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Delegates the oriented-boundary adjacency flood to selectAutoMovieTriangleRegion, using the host's original triangle ordinals. Consistently wound manifold topology and a separating loop are admitted by that producer, independent of posed positions.
 * @evidence contracts/common.md#clear-and-simple-design This adapter hands only indices and the loop to the engine, keeping portrait host ownership separate from the shared connectivity algorithm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid topology or a nonseparating loop throws from the engine; no image-plane, landmark-specific, or partial-selection fallback changes the result.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies original face selection, inward winding, pose independence, unchanged caller arrays, and propagated refusal.
 * @evidence contracts/performance.md#efficient-algorithms For T source triangles, B loop vertices and K selected triangles, the delegated edge flood takes O(T+B+K log K) time and O(T+B) working storage including the sorted output; this adapter adds a constant-sized argument object.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call selects one current host/loop pair; component builders supply different boundaries, with no shared completed request or cache owned here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains no host, loop, handle, or task after return or refusal; the selected ordinal array transfers to its caller.
 */
export function selectHostFacesInsideLoop(
  host: IPortraitComponentHost,
  loop: number[],
): number[] {
  return selectAutoMovieTriangleRegion({
    indices: host.indices,
    boundary: loop,
  });
}
