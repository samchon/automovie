import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieHumanBindBone,
  IAutoMovieHumanSkeleton,
  IAutoMovieResolveHumanoidRingModules,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import type { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";

/*
 * Emit the mannequin's rigid modules from the engine's ring modules, the one
 * statement of the body's simple solid form: the same rings and ring points the
 * physical profile takes its colliders from, so the drawn surface and the
 * collision surface share every vertex.
 */
export function buildHumanPolygonParts(
  output: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
  boneAt: (name: string) => IAutoMovieHumanBindBone,
  add: (
    bone: IAutoMovieHumanBindBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ) => THREE.Group,
): { headObject: THREE.Group; headMesh: THREE.Mesh; headBox: THREE.Box3 } {
  const three = (value: IAutoMovieVector3): THREE.Vector3 =>
    new THREE.Vector3(value.x, value.y, value.z);
  let headObject: THREE.Group | undefined;
  for (const module of AutoMovieEngineKinematics.resolveAutoMovieHumanoidRingModules(output.bones)) {
    const group: THREE.Group = add(
      boneAt(module.bone),
      module.rings.map(
        (
          ring: IAutoMovieResolveHumanoidRingModules.IRing,
        ): buildHumanPolygonModule.ISection => ({
          centre: three(ring.centre),
          depth: ring.depth,
          breadth: ring.breadth,
          points: ring.points.map(three),
        }),
      ),
      three(module.axis),
      module.breadth === null ? undefined : three(module.breadth),
      module.pole === null
        ? undefined
        : [module.pole.x, module.pole.y, module.pole.z],
    );
    if (module.bone === "head") headObject = group;
  }
  if (headObject === undefined)
    throw new Error("Polygon drawing requires the head module");
  const head: THREE.Object3D | undefined = headObject.children[0];
  if (head === undefined || !AutoMovieThreeKind.isMesh(head))
    throw new Error("Polygon drawing requires the head module's mesh");
  const headMesh: THREE.Mesh = head;
  headMesh.geometry.computeBoundingBox();
  const headBox: THREE.Box3 = headMesh.geometry.boundingBox!;
  return { headObject, headMesh, headBox };
}
