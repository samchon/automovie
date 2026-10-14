import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

/**
 * A generated numerical model containing the requested number of identical unit-box parts.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing material, semantic and render-budget units consume these parts through real model/material/inventory operations; this helper creates input without asserting measured output.
 * @evidence contracts/testing.md#independent-expectations Every part is an authored unit box with a position-derived id and the matching supplied material id, allowing expectations from six-face arithmetic instead of production snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Omitted parts selects one; supplied counts retain Array.from length semantics, missing per-part material selects null, and the supplied materials array is borrowed rather than cloned or admitted.
 * @evidence contracts/testing.md#execution-ownership Pure fixture construction for existing unit entries, with fresh part records and no renderer, filesystem, native artifact or case registration.
 */
export const boxModel: (props: {
  id: string;
  parts?: number;
  materials?: IAutoMovieMaterial[];
}) => IAutoMovieModel = (props: {
  id: string;
  parts?: number;
  materials?: IAutoMovieMaterial[];
}): IAutoMovieModel => ({
  id: props.id,
  name: null,
  origin: "generated",
  parts: Array.from(
    { length: props.parts ?? 1 },
    (_: unknown, index: number): IAutoMovieModel["parts"][number] => ({
      id: `${props.id}-part-${index}`,
      name: null,
      geometry: {
        type: "primitive" as const,
        shape: { type: "box" as const, width: 1, height: 1, depth: 1 },
      },
      material: (props.materials ?? [])[index]?.id ?? null,
      attachedBone: null,
      transform: null,
    }),
  ),
  skeleton: null,
  body: null,
  materials: props.materials ?? [],
  asset: null,
});
