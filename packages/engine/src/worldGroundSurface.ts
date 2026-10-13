import { IAutoMovieWorldSurface } from "@automovie/interface";

import { worldSurfaceContains } from "./worldSurfaceContains";

/**
 * The world terrain under an XZ point, or `null` where the world has none.
 *
 * The first declared surface containing the point wins, which is the answer the
 * ground oracle already reported and therefore the one an author has been
 * composing against: a terraced square states its steps in the order it wants
 * them read. A point exactly on a footprint edge is on that surface, because
 * the edge of a floor is still floor and a strict reading would drop the
 * outermost rank of a unit sized to its own ground.
 *
 * The height that goes with it is {@link worldSurfaceHeight} of the same record.
 * Both answers come from here so a placement, a gate and an oracle cannot each
 * pick a different surface.
 *
 * @param surfaces Candidate terrain records in precedence order.
 * @param point World XZ position in metres; height does not select a surface.
 * @returns The first containing record by reference, or null.
 *
 * @evidence contracts/common.md#principled-implementation Array.find implements declaration-order precedence and the shared worldSurfaceContains predicate includes footprint edges, so height queries and ground admission select the same terrain record without comparing elevations.
 * @evidence contracts/common.md#clear-and-simple-design Owns terrain precedence only, delegates footprint classification to worldSurfaceContains and leaves elevation interpolation to worldSurfaceHeight through its callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every surface uses one footprint rule; overlapping surfaces follow authored order and a missing surface returns null without inventing ground.
 * @evidence contracts/common.md#meaningful-documentation States precedence, boundary inclusion, XZ metre coordinates, height independence, null absence and aliasing of the returned surface.
 * @evidence contracts/performance.md#efficient-algorithms Scans surfaces until the first hit, with time proportional to the corners of the footprints visited and constant auxiliary space outside delegated per-edge point records; priority requires checking earlier surfaces first.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each point query reads the current mutable surface list; this selector coordinates no requests and caches no footprint classifications.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The selector retains no list or point beyond the call and returns a reference already owned by the surface list, without acquiring a handle or task.
 */
export const worldGroundSurface: (surfaces: readonly IAutoMovieWorldSurface [ ], point: { x : number ; z : number }) => IAutoMovieWorldSurface | null = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
): IAutoMovieWorldSurface | null =>
  surfaces.find((surface: IAutoMovieWorldSurface): boolean => worldSurfaceContains(surface, point)) ?? null;
