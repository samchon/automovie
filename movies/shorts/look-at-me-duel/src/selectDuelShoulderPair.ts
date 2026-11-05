import * as THREE from "three";

import type { createDuelActor } from "./createDuelActor";
import type { DuelContactPoint } from "./DuelContactPoint";
import { selectDuelContactPoint } from "./selectDuelContactPoint";

/**
 * Resolve a sliding shoulder press from real proximal-arm and front-knit surfaces.
 * @evidence contracts/common.md#implementation-and-ownership The proximal fifth of the actual UpperArm supplies finite material-vertex candidates. Each ray-hits the current opposing chest at that world height and its natural lateral position, bounded to the plain knit region clear of tie/lapels. The nearest sampled real pair replaces the arbitrary fixed chest-column marker; it is not a joint-centre or collision proxy. Selection alone certifies no touch: the continuing IK result and final material separation are still measured.
 * @evidence contracts/common.md#authoring-interface Supply both currently placed and posed actors after their current-frame support/wand evaluation. Returns two actual carrier-local witnesses. The shoulder press may slide; forearm grips remain separately fixed material points. Missing real geometry or a missing candidate refuses. This does not certify all-solid penetration or contact forces.
 */
export function selectDuelShoulderPair(carina: ReturnType<typeof createDuelActor>, harry: ReturnType<typeof createDuelActor>): { shoulder: DuelContactPoint; chest: DuelContactPoint } {
  carina.object.updateWorldMatrix(true, true);
  harry.object.updateWorldMatrix(true, true);
  const mesh: THREE.Mesh | undefined = carina.drawing.parts.get("leftUpperArm");
  const carrier: THREE.Group | undefined = carina.drawing.bones.get("leftUpperArm");
  const chest: THREE.Group | undefined = harry.drawing.bones.get("chest");
  if (mesh === undefined || carrier === undefined || chest === undefined) throw new Error("Actual shoulder/chest geometry missing");
  const origin: THREE.Vector3 = carina.point("leftUpperArm");
  const axis: THREE.Vector3 = carina.point("leftLowerArm").sub(origin);
  const vertices: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
  let best: { shoulder: DuelContactPoint; chest: DuelContactPoint; distance: number } | undefined;
  for (let index: number = 0; index < vertices.count; index++) {
    const world: THREE.Vector3 = mesh.localToWorld(new THREE.Vector3(vertices.getX(index), vertices.getY(index), vertices.getZ(index)));
    const fraction: number = world.clone().sub(origin).dot(axis) / axis.lengthSq();
    if (fraction < -0.1 || fraction > 0.2) continue;
    const lateral: number = THREE.MathUtils.clamp(chest.worldToLocal(world.clone()).z, 0.04, 0.085);
    let peer: DuelContactPoint;
    try { peer = selectDuelContactPoint(harry, "chest", { kind: "front", height: world.y, lateral }); }
    catch (error: unknown) {
      if (error instanceof Error && error.message === "Actual front-knit surface was not intersected") continue;
      throw error;
    }
    const surface: THREE.Vector3 = chest.localToWorld(new THREE.Vector3(...peer.localPoint));
    const distance: number = world.distanceTo(surface);
    if (best === undefined || distance < best.distance) {
      const point: THREE.Vector3 = carrier.worldToLocal(world);
      best = { shoulder: { bone: "leftUpperArm", localPoint: [point.x, point.y, point.z] }, chest: peer, distance };
    }
  }
  if (best === undefined) throw new Error("No actual proximal-shoulder/front-knit pair exists in the current pose");
  return { shoulder: best.shoulder, chest: best.chest };
}
