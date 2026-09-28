/**
 * 면 목록을 표면 소유별 model part로 묶는다. part ID가 완결 표면 ID이며
 * materials가 이 ID에 재료를 결속한다. 재료 결속 전에는 part.material이
 * null이고 전달자가 임의 재료를 채우지 않는다. geometry는 world m이므로
 * element 변환은 항등이다.
 */
import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import type { WallFace } from "./wall-solids";

export const surfaceModel = (id: string, name: string, faces: readonly WallFace[]): IAutoMovieModel => {
  if (faces.length === 0) throw new Error(`${id}: 면이 없는 model입니다.`);
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

export const identityTransform = () => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
