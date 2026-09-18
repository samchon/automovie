import { IPortraitComponentHost } from "../surface/IPortraitComponentHost";
import { selectAutoMovieTriangleRegion } from "@automovie/engine";

/**
 * Select the original patch bounded by the inward-oriented anatomical loop.
 * The engine owns the connectivity operation; no image-plane test is repeated
 * here, so changing a measured face cannot change which seam triangles it cuts.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Selects a component's host patch by anatomical boundary connectivity rather than image-plane containment.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Delegates the inward-oriented loop to the engine's triangle-region selector, preserving original removable face identities.
 */
export function portraitFacesInsideLoop(
  host: IPortraitComponentHost,
  loop: number[],
): number[] {
  return selectAutoMovieTriangleRegion({
    indices: host.indices,
    boundary: loop,
  });
}
