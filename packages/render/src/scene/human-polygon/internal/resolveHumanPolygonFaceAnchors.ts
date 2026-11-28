import { AutoMovieEngineHumanoidSurfaceRegions } from "@automovie/engine";
import type {
  IAutoMovieHumanBindBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieRenderHumanCartoon } from "../../AutoMovieRenderHumanCartoon";

/* Resolve the registered face sites once against the actual stock shell. */
export function resolveHumanPolygonFaceAnchors(
  bones: ReadonlyMap<string, IAutoMovieHumanBindBone>,
  geometry: THREE.BufferGeometry,
  box: THREE.Box3,
): AutoMovieRenderHumanCartoon.IHeadAnchors | undefined {
  const projection = (
    bone: IAutoMovieHumanBindBone,
    head: IAutoMovieHumanBindBone,
  ): [number, number] => [
    bone.position[1] - head.position[1],
    bone.position[2] - head.position[2],
  ];
  const head: IAutoMovieHumanBindBone | undefined = bones.get("head");
  const leftEye: IAutoMovieHumanBindBone | undefined = bones.get("leftEye");
  const rightEye: IAutoMovieHumanBindBone | undefined = bones.get("rightEye");
  if (head === undefined || leftEye === undefined || rightEye === undefined)
    return undefined;
  const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const index: THREE.BufferAttribute = geometry.getIndex()!;
  const a: THREE.Vector3 = new THREE.Vector3();
  const b: THREE.Vector3 = new THREE.Vector3();
  const c: THREE.Vector3 = new THREE.Vector3();
  const hit: THREE.Vector3 = new THREE.Vector3();
  const offset: THREE.Vector3 = new THREE.Vector3();
  function front(site: "nose" | "mouth"): [number, number] | undefined {
    const d: IAutoMovieVector3 =
      AutoMovieEngineHumanoidSurfaceRegions.TABLE[site]!.direction;
    // The engine directions are canonical. Reflect them into the drawing's
    // head frame, then use the same centred station on its actual triangles.
    const direction: THREE.Vector3 = new THREE.Vector3(
      d.z,
      d.y,
      d.x,
    ).normalize();
    const ray: THREE.Ray = new THREE.Ray(centre, direction);
    let far: number = -Infinity;
    let point: [number, number] | undefined;
    for (let i: number = 0; i < index.count; i += 3) {
      const intersection: THREE.Vector3 | null = ray.intersectTriangle(
        a.fromBufferAttribute(position, index.getX(i)),
        b.fromBufferAttribute(position, index.getX(i + 1)),
        c.fromBufferAttribute(position, index.getX(i + 2)),
        false,
        hit,
      );
      if (intersection === null) continue;
      const t: number = offset.subVectors(hit, centre).dot(direction);
      if (t > far) {
        far = t;
        point = [hit.y, hit.z];
      }
    }
    return point;
  }
  const nose: [number, number] | undefined = front("nose");
  const mouth: [number, number] | undefined = front("mouth");
  return nose === undefined || mouth === undefined
    ? undefined
    : {
        leftEye: projection(leftEye, head),
        rightEye: projection(rightEye, head),
        nose,
        mouth,
      };
}
