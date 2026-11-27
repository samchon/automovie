import {
  IAutoMovieCompiledFormation,
  type IAutoMovieFormationMemberExtent,
  IAutoMovieModel,
} from "@automovie/interface";

import { productionRuntimeModelId } from "../../model/internal/productionRuntimeModelId";
import { computeModelRestExtentY } from "./computeModelRestExtentY";
import { AutoMovieEngineDefaultSubjectHeight } from "../AutoMovieEngineDefaultSubjectHeight";
import { AutoMovieEngineMinMeasuredSubjectHeight } from "../AutoMovieEngineMinMeasuredSubjectHeight";

/*
 * One member's model-space vertical extent inside a compiled formation, in
 * metres above the slot it stands on.
 *
 * A formation stores where its members stand, not how tall they are: the
 * compiled bounds are the box of slot positions, so their vertical span is the
 * ground's, and a camera solved from it frames a crowd as a flat carpet. The
 * member's own model supplies the missing dimension, found by the runtime id
 * productionRuntimeModelId gives the formation's model group and
 * measured through computeModelRestExtentY, the read a node subject is
 * measured with, so a hero promoted out of the unit and its anonymous
 * neighbours are the same height by construction.
 *
 * Falls back to AutoMovieEngineDefaultSubjectHeight standing on the slot when the
 * group's runtime model is not among `models`, draws nothing, or measures
 * shorter than AutoMovieEngineMinMeasuredSubjectHeight, the same stand-in and
 * threshold a node subject takes.
 */
export function formationMemberExtent(
  formation: Pick<IAutoMovieCompiledFormation, "model">,
  models: readonly IAutoMovieModel[] | undefined,
): IAutoMovieFormationMemberExtent.IResult {
  const id: string = productionRuntimeModelId(formation.model);
  const model: IAutoMovieModel | undefined = (models ?? []).find(
    (candidate: IAutoMovieModel): boolean => candidate.id === id,
  );
  const extent: { min: number; max: number } | null =
    model === undefined ? null : computeModelRestExtentY(model);
  return extent === null ||
    extent.max - extent.min < AutoMovieEngineMinMeasuredSubjectHeight
    ? { min: 0, max: AutoMovieEngineDefaultSubjectHeight }
    : extent;
}
