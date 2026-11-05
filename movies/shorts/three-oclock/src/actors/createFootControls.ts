import { AutoMovieHumanGrounding, AutoMovieHumanLegIk, AutoMovieHumanRigControls, AutoMovieHumanSupportFrame, type AutoMovieHumanClinicalIk, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createHumanActor } from "./createHumanActor";
import type { evaluateFootContacts } from "./evaluateFootContacts";
import { selectSoleContacts } from "./selectSoleContacts";

/** Public hard support result plus separately measured whole-airfoot admission. */
type ContactFit = AutoMovieHumanGrounding.IResult & { contactAdmitted: boolean; footMinimum: { left: number; right: number }; pathError: { left: number; right: number }; modes: ReturnType<typeof evaluateFootContacts>; hardTargets: AutoMovieHumanClinicalIk.ITarget[]; softTargets: AutoMovieHumanClinicalIk.ITarget[]; requestedRoot: AutoMovieHumanGrounding.IRoot; rootAxes: readonly ("x" | "y" | "z")[]; rootAdjustment: number[] };

/** One actual neutral support triangle and its public rigid placement law. */
type SoleTriangle = { contacts: [AutoMovieHumanSupportFrame.IPoint, AutoMovieHumanSupportFrame.IPoint, AutoMovieHumanSupportFrame.IPoint]; neutral: THREE.Vector3[]; make: ReturnType<typeof AutoMovieHumanSupportFrame.prepare> };

/**
 * Fit actual stance contact separately from an airborne shoe's preferred path.
 *
 * @evidence contracts/common.md#implementation-and-ownership Retains every original skin/shoe vertex as an independent hard floor constraint. Actual shoe supporting-face vertices replace the former lowest-neutral Subtalar skin witness: flat stance uses three hard contacts; rolling toe/heel uses its real hard contact. The airborne anterior sole point has a hard authored trajectory because visible transfer is required, while its other two points remain soft orientation preferences in the accepted prefix. The new exit prepares a separate original-vertex triangle with both actual anterior edge endpoints, since a maximum-area stance triangle may contain two heels. Only those two forefoot endpoints become required in air; its heel remains soft, so pitch is not forced flat. The original stance triangle, complete floor population and descriptor fingerprint stay unchanged. This does not impose a flat airborne shoe. Public SupportFrame/LegIk/Grounding own transforms and fitting; twelve clinical leg channels retain original conditional ROM. Public status and soft residual remain honest; central swing additionally needs whole-foot clearance. No source shape is flattened or excluded.
 * @evidence contracts/common.md#authoring-interface Prepare once while the actual actor is neutral, then share this owner-bound instance across calibration/final performers. reference is the actual anterior sole contact in neutral evaluator metres; goals are world metres after root placement. descriptor retains owner, exact original contacts, full-floor count and a noncryptographic FNV1a64 fingerprint over all registered vertices/contacts/references; raw SHA receipts stay separate. Explicit flat/toe/heel/air roles distinguish contact from preference. airForefoot is used only by the new exit to prevent its observed opposite anterior corner from remaining grounded; every original floor point remains registered. Root fitting preserves the authoredXZ path and adjustsY only; the request, axes and actual displacement remain reported. Knee preferences remain subordinate to hard stance/path/floor. Actual requested lift at least15mm needs whole-foot minimum2mm. This is contact geometry, not balance proof.
 */
export function createFootControls(actor: ReturnType<typeof createHumanActor>): {
  owner: THREE.Object3D;
  descriptor: { ownerId: string; fingerprint: string; floorPoints: number; contacts: readonly AutoMovieHumanSupportFrame.IPoint[] };
  reference: { left: THREE.Vector3; right: THREE.Vector3 };
  fit: (seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, modes?: ReturnType<typeof evaluateFootContacts>, preferredKnees?: { left: number; right: number }, airForefoot?: boolean) => ContactFit;
  inspect: (pose: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, modes?: ReturnType<typeof evaluateFootContacts>) => ContactFit;
} {
  const parents: Map<string, string | null> = new Map(actor.neutral.bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
  const points: AutoMovieHumanSupportFrame.IPoint[] = [];
  for (const [bone, mesh] of actor.drawing.parts) {
    let ancestor: string | null | undefined = bone;
    const visited: Set<string> = new Set();
    while (ancestor !== undefined && ancestor !== null && ancestor !== "leftFoot" && ancestor !== "rightFoot") {
      if (visited.has(ancestor)) throw new Error("Cyclic Human foot ancestry");
      visited.add(ancestor);
      ancestor = parents.get(ancestor);
    }
    if (ancestor !== "leftFoot" && ancestor !== "rightFoot") continue;
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
    for (let index: number = 0; index < attribute.count; index++)
      points.push({ bone: AutoMovieHumanRigControls.joint(bone), localPoint: [attribute.getX(index), attribute.getY(index), attribute.getZ(index)] });
  }
  points.push(...actor.shoePoints);
  const solve: AutoMovieHumanGrounding.IPrepared = AutoMovieHumanGrounding.prepare(actor.evaluate, points);
  const reference: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(), right: new THREE.Vector3() };
  const soles: Partial<Record<"left" | "right", SoleTriangle & { heel: number; air?: SoleTriangle }>> = {};
  const skin: Set<THREE.Mesh> = new Set(actor.drawing.parts.values());
  for (const side of ["left", "right"] as const) {
    const foot: THREE.Group = actor.drawing.bones.get(`${side}Foot`)!;
    const shoes: THREE.Mesh[] = foot.children.filter((item: THREE.Object3D): item is THREE.Mesh => item instanceof THREE.Mesh && !skin.has(item));
    shoes.sort((a: THREE.Mesh, b: THREE.Mesh): number => volume(b) - volume(a));
    if (shoes[0] === undefined) throw new Error(`Missing actual ${side} school shoe`);
    const chosen: ReturnType<typeof selectSoleContacts> = selectSoleContacts(shoes[0], foot);
    const contacts: [AutoMovieHumanSupportFrame.IPoint, AutoMovieHumanSupportFrame.IPoint, AutoMovieHumanSupportFrame.IPoint] = chosen.points.map((point: THREE.Vector3): AutoMovieHumanSupportFrame.IPoint => ({ bone: AutoMovieHumanRigControls.joint(`${side}Foot`), localPoint: point.toArray() as [number, number, number] })) as [AutoMovieHumanSupportFrame.IPoint, AutoMovieHumanSupportFrame.IPoint, AutoMovieHumanSupportFrame.IPoint];
    const placement: AutoMovieHumanSkeleton.IPlacement = actor.neutral.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === `${side}Foot`)!;
    const neutral: THREE.Vector3[] = chosen.points.map((point: THREE.Vector3): THREE.Vector3 => point.clone().applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position)));
    reference[side].copy(neutral[0]!);
    const heel: number = chosen.points.reduce((best: number, point: THREE.Vector3, index: number): number => point.x < chosen.points[best]!.x ? index : best, 0);
    let air: SoleTriangle | undefined;
    const edge: typeof chosen.forefoot = chosen.forefoot;
    if (edge !== undefined && edge.points.some((point: THREE.Vector3): boolean => point.distanceToSquared(chosen.points[0]) < 1e-20)) {
      const other: THREE.Vector3 = edge.points.find((point: THREE.Vector3): boolean => point.distanceToSquared(chosen.points[0]) >= 1e-20)!;
      const corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3] = [chosen.points[0], other, chosen.points[heel]!];
      const actual: SoleTriangle["contacts"] = corners.map((point: THREE.Vector3): AutoMovieHumanSupportFrame.IPoint => ({ bone: AutoMovieHumanRigControls.joint(`${side}Foot`), localPoint: point.toArray() as [number, number, number] })) as SoleTriangle["contacts"];
      air = { contacts: actual, neutral: corners.map((point: THREE.Vector3): THREE.Vector3 => point.clone().applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position))), make: AutoMovieHumanSupportFrame.prepare(actor.neutral, actual) };
    }
    soles[side] = { contacts, neutral, heel, make: AutoMovieHumanSupportFrame.prepare(actor.neutral, contacts), ...(air === undefined ? {} : { air }) };
  }
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = [];
  for (const side of ["left", "right"] as const)
    for (const joint of ["hip.flexion", "hip.abduction", "hip.rotation", "knee.flexion", "knee.rotation", "ankle.dorsiflexion"] as const)
      channels.push(AutoMovieHumanRigControls.channel(`legs.${side}.${joint}`));
  const contacts: AutoMovieHumanSupportFrame.IPoint[] = ["left", "right"].flatMap((side: string): AutoMovieHumanSupportFrame.IPoint[] => soles[side as "left" | "right"]!.contacts);
  const content: string = JSON.stringify([points, contacts, reference.left.toArray(), reference.right.toArray()]);
  let hash: bigint = 14695981039346656037n;
  for (let index: number = 0; index < content.length; index++) hash = BigInt.asUintN(64, (hash ^ BigInt(content.charCodeAt(index))) * 1099511628211n);
  const descriptor: { ownerId: string; fingerprint: string; floorPoints: number; contacts: readonly AutoMovieHumanSupportFrame.IPoint[] } = Object.freeze({ ownerId: actor.object.uuid, fingerprint: `fnv1a64:${hash.toString(16).padStart(16, "0")}`, floorPoints: points.length, contacts: Object.freeze(structuredClone(contacts)) });
  for (const point of descriptor.contacts) { Object.freeze(point.localPoint); Object.freeze(point); }

  /** Fit or independently inspect the exact same source skin and support goals. */
  function run(seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, inspect: boolean, supplied?: ReturnType<typeof evaluateFootContacts>, preferredKnees?: { left: number; right: number }, airForefoot: boolean = false): ContactFit {
    const goals: { left: THREE.Vector3; right: THREE.Vector3 } = { left, right };
    const modes: ReturnType<typeof evaluateFootContacts> = supplied ?? { left: left.y > 0.001001 ? "air" : "flat", right: right.y > 0.001001 ? "air" : "flat" };
    actor.object.updateWorldMatrix(true, false);
    const initialRotation: THREE.Quaternion = actor.object.getWorldQuaternion(new THREE.Quaternion());
    const hardTargets: AutoMovieHumanClinicalIk.ITarget[] = [];
    const softTargets: AutoMovieHumanClinicalIk.ITarget[] = [];
    const all: Partial<Record<"left" | "right", AutoMovieHumanClinicalIk.ITarget[]>> = {};
    for (const side of ["left", "right"] as const) {
      const sole: NonNullable<(typeof soles)[typeof side]> = soles[side]!;
      const shape: SoleTriangle | undefined = airForefoot && modes[side] === "air" ? sole.air : sole;
      if (shape === undefined) throw new Error(`No two original anterior sole vertices prepared for ${side} air course`);
      const offset: THREE.Vector3 = shape.neutral.reduce((sum: THREE.Vector3, point: THREE.Vector3): THREE.Vector3 => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / 3).sub(reference[side]).applyQuaternion(initialRotation);
      const origin: THREE.Vector3 = actor.object.worldToLocal(goals[side].clone().add(offset));
      const inverse: THREE.Quaternion = initialRotation.clone().invert();
      const forward: THREE.Vector3 = shape.neutral[1]!.clone().sub(shape.neutral[0]!).applyQuaternion(initialRotation).applyQuaternion(inverse);
      const normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0).applyQuaternion(inverse);
      const targets: AutoMovieHumanClinicalIk.ITarget[] = shape.make({ origin: origin.toArray() as [number, number, number], forward: forward.toArray() as [number, number, number], normal: normal.toArray() as [number, number, number] }).map((target: AutoMovieHumanClinicalIk.ITarget): AutoMovieHumanClinicalIk.ITarget => ({ ...target, position: actor.object.localToWorld(new THREE.Vector3(...target.position)).toArray() as [number, number, number] }));
      all[side] = targets;
      for (let index: number = 0; index < 3; index++) {
        const hard: boolean = modes[side] === "flat" || (modes[side] === "toe" || modes[side] === "air") && index === 0 || modes[side] === "heel" && index === sole.heel || airForefoot && modes[side] === "air" && index === 1;
        (hard ? hardTargets : softTargets).push(targets[index]!);
      }
    }
    if (!inspect) {
      const rotation: THREE.Quaternion = actor.object.getWorldQuaternion(new THREE.Quaternion());
      const current: AutoMovieHumanSkeleton.IOutput = actor.evaluate(seed);
      const supports: AutoMovieHumanLegIk.ISupport[] = [];
      for (const side of ["left", "right"] as const) {
        if (modes[side] === "air") continue;
        const sole: NonNullable<(typeof soles)[typeof side]> = soles[side]!;
        const index: number = modes[side] === "heel" ? sole.heel : 0;
        const ankle: AutoMovieHumanSkeleton.IPlacement = actor.neutral.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === `${side}Foot`)!;
        const offset: THREE.Vector3 = sole.neutral[index]!.clone().sub(new THREE.Vector3(...ankle.position)).applyQuaternion(rotation);
        const goal: THREE.Vector3 = new THREE.Vector3(...all[side]![index]!.position).sub(offset);
        supports.push({ side, position: [goal.x, goal.y, goal.z], kneeFlexion: Math.max(12, seed.legs?.[side]?.knee?.flexion ?? 12) });
      }
      if (supports.length === 0) throw new Error("This authored step has no supporting shoe");
      const position: THREE.Vector3 = actor.object.getWorldPosition(new THREE.Vector3());
      const height: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> = AutoMovieHumanLegIk.supportHeight(current, actor.neutral,
        { translation: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] }, supports);
      if (!height.feasible) throw new Error("Authored step exceeds this Human body's measured leg reach");
      actor.object.position.y = height.height;
    }
    actor.object.updateWorldMatrix(true, false);
    let pose: IAutoMovieHumanPose = seed;
    for (const side of ["left", "right"] as const) {
      const sole: NonNullable<(typeof soles)[typeof side]> = soles[side]!;
      const index: number = modes[side] === "heel" ? sole.heel : 0;
      const goal: THREE.Vector3 = new THREE.Vector3(...all[side]![index]!.position);
      const witness: AutoMovieHumanSupportFrame.IPoint = sole.contacts[index]!;
      if (!inspect) {
        const local: THREE.Vector3 = actor.object.worldToLocal(goal.clone());
        pose = AutoMovieHumanLegIk.seedPoint(actor.evaluate, pose, side, { ...witness, position: [local.x, local.y, local.z] });
      }
    }
    const position: THREE.Vector3 = actor.object.getWorldPosition(new THREE.Vector3());
    const rotation: THREE.Quaternion = actor.object.getWorldQuaternion(new THREE.Quaternion());
    const root: AutoMovieHumanGrounding.IRoot = { translation: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z, rotation.w] };
    const preferred: Partial<Record<AutoMovieHumanRigControls.DegreeChannel, number>> = {};
    for (const side of ["left", "right"] as const) if (preferredKnees !== undefined)
      preferred[AutoMovieHumanRigControls.channel(`legs.${side}.knee.flexion`)] = preferredKnees[side];
    const request: AutoMovieHumanGrounding.IRequest = { targets: hardTargets, softTargets, ...(Object.keys(preferred).length === 0 ? {} : { preferred }), channels: inspect ? [] : channels, rootAxes: inspect ? [] : ["y"], iterations: 10, tolerance: 0.003, floorTolerance: 0.00001 };
    const result: AutoMovieHumanGrounding.IResult = inspect ? solve.inspect(pose, root, request) : solve(pose, root, request);
    const matrices: Map<string, THREE.Matrix4> = new Map();
    const placement: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(result.output.posed.map((row: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [row.bone, row]));
    const world: THREE.Matrix4 = new THREE.Matrix4().compose(new THREE.Vector3(...result.root.translation), new THREE.Quaternion(...result.root.rotation), new THREE.Vector3(1, 1, 1));
    const footMinimum: { left: number; right: number } = { left: Infinity, right: Infinity };
    for (const point of points) {
      if (!matrices.has(point.bone)) { const at: AutoMovieHumanSkeleton.IPlacement = placement.get(point.bone)!; matrices.set(point.bone, new THREE.Matrix4().compose(new THREE.Vector3(...at.position), new THREE.Quaternion(...at.rotation), new THREE.Vector3(1, 1, 1)).premultiply(world)); }
      const side: "left" | "right" = point.bone.startsWith("left") ? "left" : "right";
      footMinimum[side] = Math.min(footMinimum[side], new THREE.Vector3(...point.localPoint).applyMatrix4(matrices.get(point.bone)!).y);
    }
    const pathError: { left: number; right: number } = { left: 0, right: 0 };
    for (const side of ["left", "right"] as const) {
      const target: AutoMovieHumanClinicalIk.ITarget = all[side]![0]!;
      pathError[side] = new THREE.Vector3(...target.localPoint!).applyMatrix4(matrices.get(target.bone)!).distanceTo(new THREE.Vector3(...target.position));
    }
    const contactAdmitted: boolean = result.status === "admitted" && (["left", "right"] as const).every((side: "left" | "right"): boolean => modes[side] !== "air" || goals[side].y < 0.016 || footMinimum[side] >= 0.002);
    return { ...result, contactAdmitted, footMinimum, pathError, modes, hardTargets, softTargets, requestedRoot: root, rootAxes: request.rootAxes!, rootAdjustment: result.root.translation.map((value: number, index: number): number => value - root.translation[index]!) };
  }
  return { owner: actor.object, descriptor, reference, fit: (seed: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, modes?: ReturnType<typeof evaluateFootContacts>, preferredKnees?: { left: number; right: number }, airForefoot: boolean = false): ContactFit => run(seed, left, right, false, modes, preferredKnees, airForefoot),
    inspect: (pose: IAutoMovieHumanPose, left: THREE.Vector3, right: THREE.Vector3, modes?: ReturnType<typeof evaluateFootContacts>): ContactFit => run(pose, left, right, true, modes) };
}

/** Rank actual shoe pieces by their local box volume; the toe casing exceeds its strap. */
function volume(mesh: THREE.Mesh): number { mesh.geometry.computeBoundingBox(); const size: THREE.Vector3 = mesh.geometry.boundingBox!.getSize(new THREE.Vector3()); return size.x * size.y * size.z; }
