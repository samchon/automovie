import { transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

/**
 * Reconstruct the actual local Float32 publication in its source metre frame.
 * This CPU view is measurement data, not an additional rendered surface.
 *
 * @evidence contracts/common.md#principled-implementation Reads the same rounded local coordinates and ordinary TRS as the published part.
 * @evidence contracts/common.md#clear-and-simple-design One conversion supplies physical readers with a shared-frame view.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not round reconstructed world coordinates a second time or change incidence.
 * @evidence contracts/common.md#meaningful-documentation Separates measurement reconstruction from emitted local buffers.
 * @evidence contracts/modeling.md#spatial-conventions Applies the declared part TRS after local Float32 rounding.
 * @evidence contracts/modeling.md#shared-boundaries Preserves physical addresses and triangle identities, including the engine's mirror winding for a reflecting transform.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads an existing part frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no input.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no second surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical fact.
 * @evidenceExclude contracts/anatomy.md#permitted-range Changes no predicate.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping control.
 */
export function readHumanLocalMeshWorld(
  mesh: IAutoMovieMesh,
  transform?: IAutoMovieTransform | null,
): IAutoMovieMesh {
  const rounded: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.map(Math.fround),
    normals: mesh.normals?.map(Math.fround) ?? null,
  };
  return transform === undefined || transform === null
    ? rounded
    : transformAutoMovieMesh(rounded, transform);
}
