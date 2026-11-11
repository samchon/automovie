import type { IAutoMovieMark } from "@automovie/engine";
import * as THREE from "three";

import { HUMAN_CAPTURE_PEOPLE } from "./HUMAN_CAPTURE_PEOPLE";
import { markHumanCaptureCurves } from "./markHumanCaptureCurves";
import { resolveHumanCaptureSubject } from "./resolveHumanCaptureSubject";

/**
 * Build one capture subject's figure: the person's generated surface as three.js meshes named by the figure's own parts, and its construction as marks.
 *
 * The object is a group named after the person; each generated piece is one mesh beneath it named by its piece, the authored family's name or `<family>.mirror` for its reflected twin, so a piece's path is `<person>/<family>`. The group turns the figure's frame (forward +X, up +Y, left +Z) a quarter turn about the vertical so the figure faces +Z, the side the `front` view stands on. Pieces are shaded in one light skin tone on both sides, because the parts are open tubes whose inside shows at their ends. A piece the loft could not build has no mesh.
 *
 * It throws as `resolveHumanCaptureSubject` does for an unknown person or pose.
 *
 * @param name The subject's name, such as `f1`.
 * @returns The figure's object, its marks, and the call that releases its geometry and material.
 */
export function buildHumanCaptureFigure(name: string): {
  object: THREE.Group;
  marks: IAutoMovieMark[];
  dispose: () => void;
} {
  const person: string = resolveHumanCaptureSubject(name).person;
  const offered: (typeof HUMAN_CAPTURE_PEOPLE)[string] = HUMAN_CAPTURE_PEOPLE[person]!;
  const object: THREE.Group = new THREE.Group();
  object.name = person;
  object.rotation.y = -Math.PI / 2;
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9b8a3,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const geometries: THREE.BufferGeometry[] = [];
  for (const piece of offered.create()) {
    if (piece.indices.length === 0) continue;
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(piece.positions, 3));
    geometry.setIndex(piece.indices);
    geometry.computeVertexNormals();
    geometries.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    mesh.name = piece.name;
    object.add(mesh);
  }
  object.updateMatrixWorld(true);
  return {
    object,
    marks: markHumanCaptureCurves(person, offered.members),
    dispose: (): void => {
      for (const geometry of geometries) geometry.dispose();
      material.dispose();
    },
  };
}
