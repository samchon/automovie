import {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSubjectMaterial,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../../render/internal/compareAutoMovieRenderIds";

/*
 * The materials a subject draws with, as id and name, in render-id order.
 *
 * Without `part`, every material the model declares. With `part`, only the
 * material that part cites, or none when it cites none or names an id the model
 * does not declare.
 * Parameter model: Model whose materials are listed.
 * Parameter part: Part whose one material is listed instead, or omitted.
 * Returns: New material records the caller owns.
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
