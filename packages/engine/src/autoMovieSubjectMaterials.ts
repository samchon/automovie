import {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSubjectMaterial,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./render/compareAutoMovieRenderIds";

/**
 * The materials a subject draws with, as id and name, in render-id order.
 *
 * Without `part`, every material the model declares. With `part`, only the
 * material that part cites, or none when it cites none or names an id the
 * model does not declare.
 *
 * @param model Model whose materials are listed.
 * @param part Part whose one material is listed instead, or omitted.
 * @returns New material records the caller owns.
 *
 * @evidence contracts/common.md#principled-implementation Projects the declared material records to their identity fields and sorts them with the render-id comparator every subject list uses, so the order does not depend on authoring order.
 * @evidence contracts/common.md#clear-and-simple-design One material listing for prototypes, parts, elements and instances, which previously kept a model and a part variant twice over.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No material is special-cased, and an unresolved part material is left out rather than invented.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both modes, the order, and the unresolved and uncited part cases.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the model's material count plus an O(m log m) sort of the m listed materials.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure projection of one model's records that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned list, one record per listed material, and retains nothing.
 */
export const autoMovieSubjectMaterials = (
  model: IAutoMovieModel,
  part?: IAutoMovieModelPart,
): IAutoMovieSubjectMaterial[] =>
  model.materials
    .filter(
      (material: IAutoMovieMaterial): boolean =>
        part === undefined || material.id === part.material,
    )
    .map(
      (material: IAutoMovieMaterial): IAutoMovieSubjectMaterial => ({
        id: material.id,
        name: material.name,
      }),
    )
    .sort(
      (
        left: IAutoMovieSubjectMaterial,
        right: IAutoMovieSubjectMaterial,
      ): number => compareAutoMovieRenderIds(left.id, right.id),
    );
