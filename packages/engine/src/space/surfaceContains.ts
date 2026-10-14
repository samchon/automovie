import { IAutoMovieSurface } from "@automovie/interface";
import { prepareSurface } from "./prepareSurface";
import { preparedSurfaceContains } from "./preparedSurfaceContains";
/**
 * Query a surface's actual outer-and-hole footprint in the horizontal plane.
 *
 * @evidence contracts/common.md#principled-implementation Fresh prepareSurface and preparedSurfaceContains preserve concavity, voids and the canonical rim rule rather than testing a convex superset.
 * @evidence contracts/common.md#clear-and-simple-design The one-off convenience seam delegates preparation and membership to the same owners used by repeated-query callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This answers no height, walkability or full 3D containment claim; invalid geometry is not repaired and source records are read as supplied.
 * @evidence contracts/common.md#meaningful-documentation Documents XZ membership, hole preservation and one-off preparation; repeated callers can use prepareSurface directly.
 * @evidence contracts/performance.md#efficient-algorithms E ring vertices require O(E) projection, area and membership work with O(E) temporary plan storage per call.
 * @evidence contracts/performance.md#reuse-equivalent-work No prepared generation is retained across calls; repeated queries should reuse the explicit prepared seam when source geometry is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; the fresh preparation is released with the call and no retained handle or task is acquired.
 * @author Samchon
 */
export const surfaceContains: (surface: IAutoMovieSurface, x: number, z: number) => boolean = (
  surface: IAutoMovieSurface,
  x: number,
  z: number,
): boolean => preparedSurfaceContains(prepareSurface(surface), x, z);
