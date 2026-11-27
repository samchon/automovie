import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieResolveMaterial,
} from "@automovie/interface";

import { compareRenderIds } from "./compareRenderIds";

/*
 * Resolve one cross-model material id to one complete material definition.
 *
 * A model part resolves its material inside its own model. Simulated surfaces
 * carry only an id, so their lookup population is every compiled model instead.
 * Repeating an identical record under the same stable id is one definition;
 * repeating that id with any structural difference is an ambiguity and is
 * refused. Candidate and property order cannot affect either the result or the
 * diagnostic.
 */
export function resolveMaterial(
  props: IAutoMovieResolveMaterial.IProps,
): IAutoMovieMaterial {
  const candidates: { model: string; material: IAutoMovieMaterial }[] =
    props.models
      .flatMap(
        (
          model: IAutoMovieModel,
        ): { model: string; material: IAutoMovieMaterial }[] =>
          model.materials
            .filter(
              (material: IAutoMovieMaterial): boolean =>
                material.id === props.material,
            )
            .map(
              (
                material: IAutoMovieMaterial,
              ): { model: string; material: IAutoMovieMaterial } => ({
                model: model.id,
                material,
              }),
            ),
      )
      .sort(
        (
          left: { model: string; material: IAutoMovieMaterial },
          right: { model: string; material: IAutoMovieMaterial },
        ): number => compareRenderIds(left.model, right.model),
      );
  if (candidates.length === 0)
    throw new Error(
      `material "${props.material}" is absent from the compiled model population.`,
    );
  const signature: string = materialSignature(candidates[0]!.material);
  if (
    candidates
      .slice(1)
      .some(
        (candidate: { model: string; material: IAutoMovieMaterial }): boolean =>
          materialSignature(candidate.material) !== signature,
      )
  )
    throw new Error(
      `material "${props.material}" has conflicting definitions in models: ${candidates
        .map(
          (candidate: {
            model: string;
            material: IAutoMovieMaterial;
          }): string => candidate.model,
        )
        .map((model: string): string => `"${model}"`)
        .join(", ")}.`,
    );
  return candidates[0]!.material;
}

/*
 * Canonical structural identity, independent of object property insertion.
 */
const materialSignature: (material: IAutoMovieMaterial) => string = (
  material: IAutoMovieMaterial,
): string => JSON.stringify(canonicalObject(material));

/*
 * Sort every record key recursively; material records contain no arrays.
 */
const canonicalObject: (value: unknown) => unknown = (
  value: unknown,
): unknown =>
  value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(
        Object.keys(value)
          .sort(compareRenderIds)
          .map((key: string): [string, unknown] => [
            key,
            canonicalObject((value as Record<string, unknown>)[key]),
          ]),
      );
