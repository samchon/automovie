import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Whether a face part must be a closed surface: its material has a positive
 * thickness, so an otherwise open mesh must seal before it is admitted.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Derives the closure gate from the part's actual material binding.
 */
export function needsConnectedFaceClosedSurface(
  model: IAutoMovieModel,
  part: IAutoMovieModel["parts"][number],
): boolean {
  return model.materials.some((material) => material.id === part.material && (material.thickness ?? 0) > 0);
}
