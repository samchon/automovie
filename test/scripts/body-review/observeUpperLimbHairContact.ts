import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IHumanPersonHairContactProps } from "@automovie/human/human/structures/IHumanPersonHairContactProps";

import type { IUpperLimbHairContactObservation } from "./IUpperLimbHairContactObservation";
import type { IUpperLimbSignedSurfaceObservation } from "./IUpperLimbSignedSurfaceObservation";

/**
 * Read complete contact-surface admission on an actual pre-contact snapshot.
 *
 * The normal person observer supplies independently owned frozen body and
 * hair arrays. The same complete source incidence reaches the normal contact
 * query; this instrument contains no cropped substitute or expected answer.
 * The signed query's open-sheet admission stays unchanged. Successful query
 * construction establishes its topology preconditions, not collision freedom,
 * clinical validity, appearance or final cleared hair quality.
 */
export function observeUpperLimbHairContact(
  input: IHumanPersonHairContactProps,
): IUpperLimbHairContactObservation {
  const read = (indices: readonly number[]): IUpperLimbSignedSurfaceObservation => {
    const start = performance.now();
    if (indices.length === 0)
      return { status: "unavailable", triangles: 0, reason: "No actual selected contact triangles.", milliseconds: performance.now() - start };
    const mesh: IAutoMovieMesh = {
      positions: [...input.positions],
      indices: [...indices],
      normals: null,
      uvs: null,
      skin: null,
    };
    try {
      createAutoMovieSignedMeshQuery(mesh, { boundary: "open" });
      return { status: "admitted", triangles: indices.length / 3, reason: null, milliseconds: performance.now() - start };
    } catch (error) {
      return { status: "refused", triangles: indices.length / 3, reason: error instanceof Error ? error.message : String(error), milliseconds: performance.now() - start };
    }
  };
  return {
    stage: "placed-hair-before-body-contact",
    frame: "+Y up, +Z forward, +X left; person-model metres",
    bodyVertices: input.positions.length / 3,
    hairVertices: input.hair.reduce((total, mesh) => total + mesh.positions.length / 3, 0),
    clearanceMetres: input.clearance,
    frozen: Object.isFrozen(input) && Object.isFrozen(input.positions) && Object.isFrozen(input.indices) && Object.isFrozen(input.hair) && input.hair.every((mesh) => Object.isFrozen(mesh) && Object.isFrozen(mesh.positions) && Object.isFrozen(mesh.indices)),
    full: read(input.indices),
  };
}
