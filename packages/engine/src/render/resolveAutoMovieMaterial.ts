import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Resolve one cross-model material id to one complete material definition.
 *
 * A model part resolves its material inside its own model. Simulated surfaces
 * carry only an id, so their lookup population is every compiled model instead.
 * Repeating an identical record under the same stable id is one definition;
 * repeating that id with any structural difference is an ambiguity and is
 * refused. Candidate and property order cannot affect either the result or the
 * diagnostic.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Collect all models' matching material ids, sort model ids and compare recursively key-ordered structural signatures; absent or conflicting definitions throw while identical duplicate definitions return the first borrowed record.
 * @evidence contracts/common.md#clear-and-simple-design Cross-model simulated-surface lookup is separate from ordinary model-local material binding, with one canonical structural equality owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Smallest model id gives deterministic identity after equality proof, not a way to conceal a conflict; no fixture or default material repairs an ambiguous id.
 * @evidence contracts/common.md#meaningful-documentation Docs identify global candidate population, borrowed result, blank/absent/conflicting refusal and property/declaration-order independence. Arrays are currently traversed as numeric-key records by the signature, under valid material shape admission.
 * @evidence contracts/performance.md#efficient-algorithms Scan M total materials, sort K candidates and canonicalize their B structural bytes, using O(K+B) temporary storage; inventory caches validated repeated id resolutions during its unchanged subject request.
 * @evidence contracts/performance.md#reuse-equivalent-work All simulated material consumers reuse this resolver and one inventory result per id; a standalone call recomputes because mutable model/material contents decide equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the borrowed selected record returns; candidates/signatures are temporary and no host material, shader handle or retained lookup registry is owned.
 */
export const resolveAutoMovieMaterial: (props: {
  models: readonly IAutoMovieModel[];
  material: string;
}) => IAutoMovieMaterial = (props: {
  models: readonly IAutoMovieModel[];
  material: string;
}): IAutoMovieMaterial => {
  if (props.material.trim().length === 0)
    throw new Error("material id must not be blank.");
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
        ): number => compareAutoMovieRenderIds(left.model, right.model),
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
};

/** Canonical structural identity, independent of object property insertion. */
const materialSignature: (material: IAutoMovieMaterial) => string = (
  material: IAutoMovieMaterial,
): string => JSON.stringify(canonicalObject(material));

/** Sort every record key recursively; material records contain no arrays. */
const canonicalObject: (value: unknown) => unknown = (
  value: unknown,
): unknown =>
  value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(
        Object.keys(value)
          .sort(compareAutoMovieRenderIds)
          .map((key: string): [string, unknown] => [
            key,
            canonicalObject((value as Record<string, unknown>)[key]),
          ]),
      );
