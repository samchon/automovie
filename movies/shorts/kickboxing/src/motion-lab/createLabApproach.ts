import * as THREE from "three";
import type { MotionAction } from "../motion/core/MotionAction";
import { FootworkMotion } from "../motion/defense/FootworkMotion";
import type { ContactTrace } from "../motion/interaction/ContactTrace";
import type { LabActor } from "./LabActor";

/**
 * Plan supported entry around actual opposing foot and glove corridors.
 * @evidence contracts/common.md#implementation-and-ownership Original foot/toe/glove bounds provide attributed broad-phase hints, never a collision verdict. Every finite radial/bilateral candidate reaches the caller's actual fitted full-surface Engine admission. The first admitted route, actual witness/refusal and broad-phase pair/time/bounds are retained. Original aim, dimensions and surface population never change.
 * @evidence contracts/common.md#authoring-interface Metres and seconds follow the measured stance. Ninety-percent reach, thirty/sixty-degree side entries and a1cm planning margin are authored choices, not changed collision geometry or global reachability proof. At most five candidates receive actual admission. Bounds only screen; fitted full-surface inspection decides acceptance with its explicit support/sampling limits.
 */
export function createLabApproach(actor: LabActor, receiver: LabActor, point: MotionAction.Vec3, target: MotionAction.Vec3, maximum: number, scale: number, enabled: boolean, admit: (route: FootworkMotion) => ContactTrace.Result): { route: FootworkMotion | undefined; offset: MotionAction.Vec3; reason: string; inspection?: ContactTrace.Result; admissionError?: string; attempts: { offset: MotionAction.Vec3; reason: string; milliseconds: number; broadPhase?: object; actualWitness?: object }[] } {
  const attempts: { offset: MotionAction.Vec3; reason: string; milliseconds: number; broadPhase?: object; actualWitness?: object }[] = [];
  const none: { route: undefined; offset: MotionAction.Vec3; reason: string; attempts: typeof attempts } = { route: undefined, offset: [0, 0, 0], reason: "Explicit entry disabled; raw requested range retained", attempts };
  if (!enabled) return none;
  const delta: THREE.Vector3 = new THREE.Vector3(target[0] - point[0], 0, target[2] - point[2]);
  const radius: number = maximum * .9;
  if (Math.abs(target[1] - point[1]) >= radius) return { ...none, reason: "Target height exceeds the authored bent-chain envelope; horizontal entry cannot repair it" };
  const reach: number = Math.sqrt(radius * radius - (target[1] - point[1]) ** 2);
  if (delta.length() <= reach + .005) return { ...none, reason: "No entry is required by the measured radial envelope" };
  const direction: THREE.Vector3 = delta.clone().normalize();
  const lateral: THREE.Vector3 = new THREE.Vector3(-direction.z, 0, direction.x);
  const feet: Record<MotionAction.Side, MotionAction.Vec3> = { left: actor.local(actor.patches.left.low.world), right: actor.local(actor.patches.right.low.world) };
  const moving: { id: string; box: THREE.Box3; foot?: MotionAction.Side }[] = parts(actor, actor);
  const fixed: { id: string; box: THREE.Box3; foot?: MotionAction.Side }[] = parts(receiver, actor);
  let fallback: { route: FootworkMotion; offset: MotionAction.Vec3 } | undefined;
  for (const angle of [0, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3]) {
    const end: THREE.Vector3 = delta.clone().sub(direction.clone().multiplyScalar(reach * Math.cos(angle))).add(lateral.clone().multiplyScalar(reach * Math.sin(angle)));
    const sideways: THREE.Vector3 = lateral.clone().multiplyScalar(end.dot(lateral));
    const route: FootworkMotion = phrase(actor.id, feet, sideways.lengthSq() > 1e-8 ? [sideways, end] : [end], scale);
    const offset: MotionAction.Vec3 = end.toArray();
    fallback ??= { route, offset };
    const begun: number = performance.now();
    const broadPhase: object | undefined = broadPhaseHint(route, feet, moving, fixed);
    try {
      const inspection: ContactTrace.Result = admit(route);
      attempts.push({ offset, reason: "Actual fitted full-surface entry admitted", milliseconds: performance.now() - begun, broadPhase });
      return { route, offset, inspection, attempts, reason: "Side-first supported entry with measured foot/glove corridor and actual full-surface admission" };
    } catch (error: unknown) { attempts.push({ offset, reason: error instanceof Error ? error.message : String(error), milliseconds: performance.now() - begun, broadPhase, actualWitness: error instanceof Error && error.cause !== null && typeof error.cause === "object" ? structuredClone(error.cause) : undefined }); }
  }
  return { ...fallback!, attempts, reason: "No candidate entry received actual full-surface admission", admissionError: attempts.map((attempt: { reason: string }): string => attempt.reason).join(" | ") };
}

/** Complete actual source foot/toe/glove boxes in the entering actor's fixed frame. */
function parts(owner: LabActor, frame: LabActor): { id: string; box: THREE.Box3; foot?: MotionAction.Side }[] {
  const meshes: { id: string; mesh: THREE.Mesh; foot?: MotionAction.Side }[] = [];
  for (const [bone, mesh] of owner.person.drawing.parts) if (/^(left|right)(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/u.test(bone)) meshes.push({ id: `${owner.id}:${bone}`, mesh, foot: bone.startsWith("left") ? "left" : "right" });
  for (const side of ["left", "right"] as const) meshes.push({ id: `${owner.id}:${side}-glove`, mesh: owner.glove(side) });
  return meshes.map((part: { id: string; mesh: THREE.Mesh; foot?: MotionAction.Side }): { id: string; box: THREE.Box3; foot?: MotionAction.Side } => {
    const box: THREE.Box3 = new THREE.Box3();
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = part.mesh.geometry.getAttribute("position");
    part.mesh.updateWorldMatrix(true, false);
    for (let index: number = 0; index < attribute.count; index++) box.expandByPoint(new THREE.Vector3(...frame.local(new THREE.Vector3().fromBufferAttribute(attribute, index).applyMatrix4(part.mesh.matrixWorld).toArray())));
    return { id: part.id, box, foot: part.foot };
  });
}

/** Retain the first broad-phase candidate; only actual full-surface admission can refuse it. */
function broadPhaseHint(route: FootworkMotion, feet: Record<MotionAction.Side, MotionAction.Vec3>, moving: { id: string; box: THREE.Box3; foot?: MotionAction.Side }[], fixed: { id: string; box: THREE.Box3 }[]): object | undefined {
  const count: number = Math.ceil(route.duration * 60);
  for (let index: number = 0; index <= count; index++) {
    const sample: FootworkMotion.Sample = route.sample(route.duration * index / count);
    for (const part of moving) {
      const shift: THREE.Vector3 = part.foot ? new THREE.Vector3(...sample.feet[part.foot].target).sub(new THREE.Vector3(...feet[part.foot])) : new THREE.Vector3(...sample.rootOffset);
      const box: THREE.Box3 = part.box.clone().translate(shift).expandByScalar(.01);
      const other: { id: string; box: THREE.Box3 } | undefined = fixed.find((candidate: { box: THREE.Box3 }): boolean => box.intersectsBox(candidate.box));
      if (other) return { time: route.duration * index / count, attack: part.id, receiver: other.id, attackBounds: { min: box.min.toArray(), max: box.max.toArray() }, receiverBounds: { min: other.box.min.toArray(), max: other.box.max.toArray() }, coordinateFrame: "entering actor fixed local metres", planningPaddingMetres: .01, verdict: "broad-phase-candidate-only" };
    }
  }
  return undefined;
}

/** Short direction-first phrases realize each actual lateral/forward waypoint without paired roots. */
function phrase(actorId: string, feet: Record<MotionAction.Side, MotionAction.Vec3>, waypoints: THREE.Vector3[], scale: number): FootworkMotion {
  const steps: FootworkMotion.Step[] = [];
  let cursor: number = 0;
  let previous: THREE.Vector3 = new THREE.Vector3();
  for (const waypoint of waypoints) {
    const segment: THREE.Vector3 = waypoint.clone().sub(previous);
    const count: number = Math.ceil(segment.length() / .25);
    const displacement: MotionAction.Vec3 = segment.divideScalar(count).toArray();
    const projection: number = displacement[0] * (feet.left[0] - feet.right[0]) + displacement[2] * (feet.left[2] - feet.right[2]);
    for (let index: number = 0; index < count; index++) {
      const step: FootworkMotion.Step = { start: cursor, unload: .08 * scale, swing: .24 * scale, load: .08 * scale, follow: .24 * scale, settle: .1 * scale, first: projection >= 0 ? "left" : "right", displacement, clearance: .04 };
      steps.push(step); cursor = FootworkMotion.end(step);
    }
    previous = waypoint;
  }
  return new FootworkMotion(actorId, feet, steps);
}
