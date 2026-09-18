import { IAutoMovieCompiledFormation, IAutoMovieModel } from "@automovie/interface";
import { productionRuntimeModelId } from "../productionRuntimeModelId";
import { DEFAULT_SUBJECT_HEIGHT } from "./DEFAULT_SUBJECT_HEIGHT";
import { computeModelRestExtentY } from "./computeModelRestExtentY";

/**
 * One member's model-space vertical extent inside a compiled formation.
 *
 * A formation stores where its members STAND, not how tall they are: the
 * compiled bounds are the box of slot positions, so their vertical span is the
 * ground's, and a camera solved from it frames a crowd as a flat carpet. The
 * member's own model supplies the missing dimension, measured through
 * {@link computeModelRestExtentY} — the same read a node subject is measured
 * with, so a hero promoted out of the unit and its anonymous neighbours are the
 * same height by construction.
 *
 * Falls back to {@link DEFAULT_SUBJECT_HEIGHT} standing on the slot when the
 * recipe's runtime model was not supplied or draws nothing, which is the same
 * documented stand-in a subject with no measurable geometry has always taken.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion formationMemberExtent measures the addressed member's live formation slot and model height before world-space union.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants formationMemberExtent realizes dynamic-bounds invariants: One member's model-space vertical extent inside a compiled formation. A formation stores where its members STAND, not how tall they are: the compiled bounds are the box of slot positions, so their vertical span is the ground's, and a camera solved from it frames a crowd as a flat carpet. The member's own model supplies the missing dimension, measured through {@link computeModelRestExtentY} — the same read a node subject is measured with, so a hero promoted out of the unit and its anonymous neighbours are the same height by construction. Falls back to {@link DEFAULT_SUBJECT_HEIGHT} standing on the slot when the recipe's runtime model was not supplied or draws nothing, which is the same documented stand-in a subject with no measurable geometry has always taken.
 */
export const formationMemberExtent = (
  formation: Pick<IAutoMovieCompiledFormation, "modelRecipe">,
  models: readonly IAutoMovieModel[] | undefined,
): { min: number; max: number } => {
  const id = productionRuntimeModelId(formation.modelRecipe);
  const model = (models ?? []).find((candidate) => candidate.id === id);
  const extent = model === undefined ? null : computeModelRestExtentY(model);
  return extent === null || extent.max - extent.min < 0.1
    ? { min: 0, max: DEFAULT_SUBJECT_HEIGHT }
    : extent;
};
