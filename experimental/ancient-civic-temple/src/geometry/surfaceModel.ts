/**
 * Groups a face list into model parts by surface owner. A part ID is a complete surface ID, and
 * materials binds a material to that ID. Before material binding, part.material is null and the
 * caller fills in no arbitrary material. Geometry is in world m, so the element transform is the
 * identity.
 */
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import type { WallFace } from "./WallFace";

export const surfaceModel = (id: string, name: string, faces: readonly WallFace[]): IAutoMovieModel => {
  if (faces.length === 0) throw new Error(`${id}: model without faces.`);
  const surfaces = [...new Set(faces.map((face) => face.surface))].sort((a, b) => a.localeCompare(b));
  return {
    id, name, origin: "generated", skeleton: null, body: null, materials: [], asset: null,
    parts: surfaces.map((surface) => {
      const corners = faces.filter((face) => face.surface === surface).map((face) => face.corners);
      try {
        return {
          id: surface, name: null, material: null, attachedBone: null, transform: null,
          geometry: { type: "mesh", mesh: buildAutoMoviePolyhedron(corners) },
        };
      } catch (error) {
        throw new Error(`${id}/${surface}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }),
  };
};

