import * as THREE from "three";

import type { createHumanActor } from "./createHumanActor";

/**
 * Bind one real forehead-surface witness to the existing polygon head.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the installed drawing's actual frontAt triangle projection at the upper central forehead, beneath the crown, with no sphere or head-centre substitute. The same local skin point follows the existing head carrier; a local tangent normal comes from adjacent points on that original front surface. This is one attributable coarse contact witness, not a whole-head collision certificate or a predeclared successful event.
 * @evidence contracts/common.md#authoring-interface Supply the actual cast drawing and world head transform. point/normal sample the current placed geometry without changing a pose or owning resources. The current coupled controller consumes this witness against Harry's original triangles, rejects misaligned/deep contact and binds both actors' stop/recovery to the admitted event. A connected candidate is not an approved36–48s segment; the actual prepared frames still decide acceptance.
 */
export function createForeheadWitness(actor: { drawing: Pick<ReturnType<typeof createHumanActor>["drawing"], "head"> }): {
  localPoint: THREE.Vector3;
  point: () => THREE.Vector3;
  normal: () => THREE.Vector3;
} {
  const head: ReturnType<typeof createHumanActor>["drawing"]["head"] = actor.drawing.head;
  const height: number = head.max[1] - head.min[1];
  const width: number = head.max[2] - head.min[2];
  const y: number = head.min[1] + height * 0.72;
  const z: number = (head.min[2] + head.max[2]) / 2;
  const delta: number = Math.min(height, width) * 0.001;
  const x: number | undefined = head.frontAt(y, z);
  const lower: number | undefined = head.frontAt(y - delta, z);
  const upper: number | undefined = head.frontAt(y + delta, z);
  const right: number | undefined = head.frontAt(y, z - delta);
  const left: number | undefined = head.frontAt(y, z + delta);
  if (!(height > 0 && width > 0) || [x, lower, upper, right, left].some((value: number | undefined): boolean => value === undefined || !Number.isFinite(value)))
    throw new Error("The actual polygon has no finite central forehead surface");
  const localPoint: THREE.Vector3 = new THREE.Vector3(x!, y, z);
  const localNormal: THREE.Vector3 = new THREE.Vector3(1, -(upper! - lower!) / (2 * delta), -(left! - right!) / (2 * delta)).normalize();
  return { localPoint: localPoint.clone(),
    point: (): THREE.Vector3 => { head.object.updateWorldMatrix(true, false); return head.object.localToWorld(localPoint.clone()); },
    normal: (): THREE.Vector3 => { head.object.updateWorldMatrix(true, false); return localNormal.clone().transformDirection(head.object.matrixWorld); } };
}
