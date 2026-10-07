import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceColliderGeometry } from "./structures/IHumanSourceColliderGeometry.ts";

/**
 * Read the registered source colliders through the actual signed-mesh owner.
 *
 * Each query consumes the exact source surface plus its declared closure.
 * Evaluation points are its referenced resident vertices in the canonical
 * head frame, not an invented calibration shape or a posed runtime surface.
 * Engine refusals are recorded with their collider, resident point and original
 * diagnostic; neither triangle arithmetic nor its guard is reimplemented here.
 * Every resident point is attempted so one refusal does not hide other source
 * failures. Missing contact registration returns null, not a successful empty
 * population. Missing registered surfaces refuse the malformed source itself.
 *
 * This establishes only how these actual neutral points reach the query.
 * Runtime shaped colliders, generated optical exterior, construction startup
 * and their other query points remain separate consumer observations.
 */
export function readHumanSourceColliderGeometry(
  face: IAutoMovieHumanFaceBasis,
): IHumanSourceColliderGeometry[] | null {
  if (face.contact === undefined) return null;
  const message = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);
  return face.contact.colliders.map(
    (collider, at): IHumanSourceColliderGeometry => {
      const surface = face.surfaces.find(
        (entry) => entry.id === collider.surface,
      );
      if (surface === undefined)
        throw new Error(
          `Source collider ${at} has no registered surface ${collider.surface}.`,
        );
      const indices = [...surface.indices, ...collider.closure];
      const vertices = [...new Set(indices)].sort((a, b) => a - b);
      const result: IHumanSourceColliderGeometry = {
        collider: at,
        surface: surface.id,
        surfaceTriangles: surface.indices.length / 3,
        closureTriangles: collider.closure.length / 3,
        residentPoints: vertices.length,
        queriesAttempted: 0,
        failures: [],
      };
      let query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
      try {
        query = createAutoMovieSignedMeshQuery(
          {
            positions: surface.positions,
            indices,
            normals: null,
            uvs: null,
            skin: null,
          },
          { boundary: "open" },
        );
      } catch (error) {
        result.failures.push({ vertex: null, error: message(error) });
        return result;
      }
      for (const vertex of vertices) {
        result.queriesAttempted++;
        try {
          query(surface.positions.slice(3 * vertex, 3 * vertex + 3));
        } catch (error) {
          result.failures.push({ vertex, error: message(error) });
        }
      }
      return result;
    },
  );
}
