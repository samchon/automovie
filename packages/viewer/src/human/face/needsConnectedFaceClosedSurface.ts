import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

/**
 * Whether a face part must be a closed surface: its material has a positive
 * thickness, so an otherwise open mesh must seal before it is admitted.
 *
 * @evidence contracts/common.md#principled-implementation A matching material id with positive declared thickness imposes the engine topology validator's closed-surface obligation. Admitted unique material ids and supported finite thickness are upstream premises; no matching material or nonpositive/absent thickness yields false here.
 * @evidence contracts/common.md#clear-and-simple-design One predicate joins material obligation to geometry witness/gating so appearance edits that change thickness can invalidate the reused closure verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material thickness, not anatomical part names or fixture ids, determines the obligation. The predicate does not manufacture closure or establish clinical tissue continuity.
 * @evidence contracts/common.md#meaningful-documentation The comment states positive-thickness reason and the requirement to seal before numerical admission, keeping topology validation itself outside this boolean helper.
 * @evidence contracts/performance.md#efficient-algorithms Scans M materials with early exit; repeated per-part calls can cost P times M during renderer preparation, with no secondary index retained here.
 * @evidence contracts/performance.md#reuse-equivalent-work Both witness admission and publication use this canonical current material obligation; changed material thickness is reread rather than cached by part id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows model/part and returns a boolean with no retained map, witness, material or native handle.
 */
export function needsConnectedFaceClosedSurface(
  model: IAutoMovieModel,
  part: IAutoMovieModel["parts"][number],
): boolean {
  return model.materials.some(
    (material: IAutoMovieMaterial): boolean =>
      material.id === part.material && (material.thickness ?? 0) > 0,
  );
}
