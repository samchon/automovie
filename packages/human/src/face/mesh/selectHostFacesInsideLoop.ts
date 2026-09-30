import { IPortraitComponentHost } from "../surface/structures/IPortraitComponentHost";
import { selectAutoMovieTriangleRegion } from "@automovie/engine";

/**
 * Select the original patch bounded by the inward-oriented anatomical loop.
 * The engine owns the connectivity operation; no image-plane test is repeated
 * here, so changing a measured face cannot change which seam triangles it cuts.
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
