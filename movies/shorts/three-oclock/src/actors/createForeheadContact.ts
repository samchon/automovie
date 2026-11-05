import { createAutoMovieSignedMeshQuery, type IAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import * as THREE from "three";

import { createForeheadWitness } from "./createForeheadWitness";
import type { createHumanActor } from "./createHumanActor";

/**
 * Measure one actual forehead point against the other original head surface.
 *
 * @evidence contracts/common.md#implementation-and-ownership Compiles Harry's actual original head triangles through the public signed nearest-feature query. Carina's actual frontAt forehead point is transformed into that same mesh frame; the returned original triangle point/normal are transformed back. Forehead-region and opposing-normal checks distinguish the intended brush from chin/crown contact. Source triangles are neither replaced nor altered. This witness is a coarse contact predicate, not whole-head or hair collision proof.
 * @evidence contracts/common.md#authoring-interface Both actual actors must already have their current poses placed. Returns a stateless measurement closure retaining only one fixed source query and skin descriptor. Positive signed gap is exterior; admission requires0–2mm distance, the upper-front region and opposing normals. The shared event controller consumes the measured gap rather than declaring contact at a guessed timestamp.
 */
export function createForeheadContact(carina: ReturnType<typeof createHumanActor>, harry: ReturnType<typeof createHumanActor>): () => {
  gap: number; distance: number; admitted: boolean; forehead: boolean; alignment: number; first: number[]; second: number[]; triangle: number;
} {
  const witness: ReturnType<typeof createForeheadWitness> = createForeheadWitness(carina);
  const mesh: THREE.Mesh | undefined = harry.drawing.parts.get("head");
  if (mesh === undefined) throw new Error("Shared forehead contact needs the original Harry head mesh");
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
  const positions: number[] = [];
  for (let index: number = 0; index < attribute.count; index++) positions.push(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  const source: IAutoMovieMesh = { positions, indices: mesh.geometry.getIndex() === null ? null : Array.from(mesh.geometry.getIndex()!.array), normals: null, uvs: null, skin: null };
  const query: ReturnType<typeof createAutoMovieSignedMeshQuery> = createAutoMovieSignedMeshQuery(source);
  return (): { gap: number; distance: number; admitted: boolean; forehead: boolean; alignment: number; first: number[]; second: number[]; triangle: number } => {
    mesh.updateWorldMatrix(true, false);
    const first: THREE.Vector3 = witness.point();
    const hit: IAutoMovieSignedMeshQueryHit = query(mesh.worldToLocal(first.clone()).toArray());
    const second: THREE.Vector3 = mesh.localToWorld(new THREE.Vector3(...hit.point));
    const local: THREE.Vector3 = harry.drawing.head.object.worldToLocal(second.clone());
    const head: typeof harry.drawing.head = harry.drawing.head;
    const height: number = (local.y - head.min[1]) / (head.max[1] - head.min[1]);
    const forehead: boolean = height >= 0.58 && height <= 0.9 && local.x >= (head.min[0] + head.max[0]) / 2;
    const alignment: number = witness.normal().dot(new THREE.Vector3(...hit.normal).transformDirection(mesh.matrixWorld));
    return { gap: hit.signedDistance, distance: hit.distance, admitted: hit.signedDistance >= -1e-8 && hit.distance <= 0.002 && forehead && alignment < -0.3,
      forehead, alignment, first: first.toArray(), second: second.toArray(), triangle: hit.triangle };
  };
}
