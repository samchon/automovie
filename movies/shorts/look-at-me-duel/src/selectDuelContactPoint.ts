import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { DuelContactPoint } from "./DuelContactPoint";

/**
 * Select a real shoulder, middle-forearm or plain front-knit material point.
 * @evidence contracts/common.md#implementation-and-ownership Upper selection uses the highest emitted vertex. Forearm selection ray-hits the actual LowerArm mesh at the midpoint between elbow and wrist. Front selection uses a horizontal ray at the requested world height, including under chest flexion, clear of the caller's tie/lapel region. No joint-centre hull or invisible contact proxy replaces a visible surface.
 * @evidence contracts/common.md#authoring-interface Call after applying the intended pose. Supply an existing generated bone and upper, front world-height/local-lateral metres, or middle-forearm approach point. Return a carrier-local material point or throw on missing geometry/hit. Re-selecting front each frame permits sliding contact; the consumer must retain the actual peer point and inspect continuing separation.
 */
export function selectDuelContactPoint(actor: ReturnType<typeof createDuelActor>, bone: DuelContactPoint["bone"], selection: { kind: "upper" } | { kind: "front"; height: number; lateral: number } | { kind: "forearm"; toward: THREE.Vector3 }): DuelContactPoint {
  const mesh: THREE.Mesh | undefined = actor.drawing.parts.get(bone);
  const carrier: THREE.Group | undefined = actor.drawing.bones.get(bone);
  if (mesh === undefined || carrier === undefined) throw new Error(`Missing actual contact surface ${bone}`);
  actor.object.updateWorldMatrix(true, true);
  if (selection.kind === "forearm") {
    if (bone !== "leftLowerArm" && bone !== "rightLowerArm") throw new Error("Forearm contact requires an actual LowerArm surface");
    const hand: string = bone === "leftLowerArm" ? "leftHand" : "rightHand";
    const elbow: THREE.Vector3 = actor.point(bone);
    const axis: THREE.Vector3 = actor.point(hand).sub(elbow).normalize();
    const centre: THREE.Vector3 = elbow.clone().lerp(actor.point(hand), 0.5);
    const outward: THREE.Vector3 = selection.toward.clone().sub(centre);
    outward.addScaledVector(axis, -outward.dot(axis));
    if (outward.lengthSq() < 1e-10 || !outward.toArray().every(Number.isFinite)) throw new Error("Forearm contact requires a distinct finite approach");
    outward.normalize();
    const hit: THREE.Intersection | undefined = new THREE.Raycaster(centre.clone().addScaledVector(outward, 0.30), outward.clone().negate(), 0, 0.60).intersectObject(mesh, false)[0];
    if (hit === undefined) throw new Error("Actual middle-forearm sleeve triangles were not intersected");
    const local: THREE.Vector3 = carrier.worldToLocal(hit.point.clone());
    return { bone, localPoint: [local.x, local.y, local.z] };
  }
  if (selection.kind === "upper") {
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
    let highest: THREE.Vector3 | undefined;
    for (let index: number = 0; index < attribute.count; index++) {
      const point: THREE.Vector3 = mesh.localToWorld(new THREE.Vector3(attribute.getX(index), attribute.getY(index), attribute.getZ(index)));
      if (highest === undefined || point.y > highest.y) highest = point;
    }
    if (highest === undefined) throw new Error("Empty actual shoulder surface");
    const local: THREE.Vector3 = carrier.worldToLocal(highest);
    return { bone, localPoint: [local.x, local.y, local.z] };
  }
  mesh.geometry.computeBoundingBox();
  const bounds: THREE.Box3 = mesh.geometry.boundingBox!;
  const originAtBone: THREE.Vector3 = carrier.getWorldPosition(new THREE.Vector3());
  const height: number = carrier.worldToLocal(new THREE.Vector3(originAtBone.x, selection.height, originAtBone.z)).y;
  const local: THREE.Vector3 = new THREE.Vector3(bounds.max.x + 0.30, THREE.MathUtils.clamp(height, bounds.min.y + 0.015, bounds.max.y - 0.015), THREE.MathUtils.clamp(selection.lateral, bounds.min.z + 0.015, bounds.max.z - 0.015));
  const origin: THREE.Vector3 = carrier.localToWorld(local);
  const direction: THREE.Vector3 = new THREE.Vector3(-1, 0, 0).transformDirection(carrier.matrixWorld);
  origin.y = selection.height;
  direction.y = 0;
  direction.normalize();
  const hit: THREE.Intersection | undefined = new THREE.Raycaster(origin, direction, 0, 1).intersectObject(mesh, false)[0];
  if (hit === undefined) throw new Error("Actual front-knit surface was not intersected");
  const point: THREE.Vector3 = carrier.worldToLocal(hit.point.clone());
  return { bone, localPoint: [point.x, point.y, point.z] };
}
