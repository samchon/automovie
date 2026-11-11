import { resolveAutoMovieHumanoidRingModules } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import type { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";

/**
 * Emit the mannequin's rigid modules from the engine's ring modules, the one
 * statement of the body's simple solid form: the same rings and ring points
 * the physical profile takes its colliders from, so the drawn surface and
 * the collision surface share every vertex.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Ring selection and ring points come from `resolveAutoMovieHumanoidRingModules`; this function only hands each module's sections, with their actual points, to the supplied assembler in the engine's drawing order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Separates module selection, owned by the engine, from drawing lifecycle, palette and pose application; it borrows the caller's bone lookup and add callback.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No section dimension, anatomy coefficient or authored pose is stated here; a module whose bone the drawing lacks is refused by the lookup.
 * @evidence contracts/development/common.md#meaningful-documentation Records who owns the form, why the drawing reads it and what this function returns.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the engine's modules, at most one per emitted bone, with map lookups.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's rings and points and the caller's maps and material-owning assembler.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary vectors and sections transfer to assembly; the caller owns every emitted mesh, diagnostic and material and receives the actual head objects and bounds.
 */
export function buildHumanPolygonParts(
  output: AutoMovieHumanPolygon.IInput,
  boneAt: (name: string) => AutoMovieHumanPolygon.IBone,
  add: (
    bone: AutoMovieHumanPolygon.IBone,
    rings: buildHumanPolygonModule.ISection[],
    axis: THREE.Vector3,
    breadth?: THREE.Vector3,
    topPole?: [number, number, number],
  ) => THREE.Group,
): { headObject: THREE.Group; headMesh: THREE.Mesh; headBox: THREE.Box3 } {
  const three = (value: IAutoMovieVector3): THREE.Vector3 =>
    new THREE.Vector3(value.x, value.y, value.z);
  let headObject: THREE.Group | undefined;
  for (const module of resolveAutoMovieHumanoidRingModules(output.bones)) {
    const group: THREE.Group = add(
      boneAt(module.bone),
      module.rings.map(
        (
          ring: resolveAutoMovieHumanoidRingModules.IRing,
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
  const headMesh: THREE.Mesh = headObject.children[0] as THREE.Mesh;
  headMesh.geometry.computeBoundingBox();
  const headBox: THREE.Box3 = headMesh.geometry.boundingBox!;
  return { headObject, headMesh, headBox };
}
