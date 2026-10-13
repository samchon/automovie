import {
  IAutoMovieCompiledFormation,
  IAutoMovieModel,
} from "@automovie/interface";

import { productionRuntimeModelId } from "../productionRuntimeModelId";
import { computeModelRestExtentY } from "./computeModelRestExtentY";
import { DEFAULT_SUBJECT_HEIGHT } from "./constants/DEFAULT_SUBJECT_HEIGHT";
import { MIN_MEASURED_SUBJECT_HEIGHT } from "./constants/MIN_MEASURED_SUBJECT_HEIGHT";

/**
 * One member's model-space vertical extent inside a compiled formation, in
 * metres above the slot it stands on.
 *
 * A formation stores where its members stand, not how tall they are: the
 * compiled bounds are the box of slot positions, so their vertical span is the
 * ground's, and a camera solved from it frames a crowd as a flat carpet. The
 * member's own model supplies the missing dimension, found by the runtime id
 * {@link productionRuntimeModelId} gives the formation's recipe and measured
 * through {@link computeModelRestExtentY}, the read a node subject is measured
 * with, so a hero promoted out of the unit and its anonymous neighbours are the
 * same height by construction.
 *
 * Falls back to {@link DEFAULT_SUBJECT_HEIGHT} standing on the slot when the
 * recipe's runtime model is not among `models`, draws nothing, or measures
 * shorter than {@link MIN_MEASURED_SUBJECT_HEIGHT}, the same stand-in and
 * threshold a node subject takes.
 *
 * @evidence contracts/common.md#principled-implementation Reads the member's drawn rest extent from its runtime model, the geometry the renderer instances for every slot, and substitutes the shared stand-in height only where that measurement is missing or below the threshold framing trusts.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the formation-to-model join; measurement is `computeModelRestExtentY` and the fallback constants are the ones `nodeSubjectExtent` applies, so a member and a node subject cannot be sized by different rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no recipe or model, and the threshold is the shared `MIN_MEASURED_SUBJECT_HEIGHT` rather than a private literal, so no formation is sized by its own rule.
 * @evidence contracts/common.md#meaningful-documentation States the unit and reference point, why slot bounds lack a height, how the model is found and measured, why heroes and members agree, and each fallback case with its source.
 * @evidence contracts/performance.md#efficient-algorithms A linear search over the supplied models plus one drawn-vertex measurement of the match; callers pass the shot's few runtime models, where a lookup index would cost the same pass to build.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one formation and the model list; a pass framing one unit over many samples owns any reuse of the extent.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned two numbers.
 */
export function formationMemberExtent (
  formation: Pick<IAutoMovieCompiledFormation, "modelRecipe">,
  models: readonly IAutoMovieModel[] | undefined,
): { min: number; max: number } {
  const id: string = productionRuntimeModelId(formation.modelRecipe);
  const model: IAutoMovieModel | undefined = (models ?? []).find(
    (candidate: IAutoMovieModel): boolean => candidate.id === id,
  );
  const extent: { min: number; max: number } | null =
    model === undefined ? null : computeModelRestExtentY(model);
  return extent === null ||
    extent.max - extent.min < MIN_MEASURED_SUBJECT_HEIGHT
    ? { min: 0, max: DEFAULT_SUBJECT_HEIGHT }
    : extent;
}
