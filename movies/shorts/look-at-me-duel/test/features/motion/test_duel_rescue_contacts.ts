import assert from "node:assert/strict";
import { AutoMovieHumanSex, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createDuelActor } from "../../../src/createDuelActor";
import { createDuelHumanParameters } from "../../../src/createDuelHumanParameters";
import { createDuelRescueContacts } from "../../../src/createDuelRescueContacts";
import type { DuelContactPoint } from "../../../src/DuelContactPoint";
import type { DuelRescueEntry } from "../../../src/DuelRescueEntry";
import { fitDuelLeftContact } from "../../../src/fitDuelLeftContact";
import { selectDuelContactPoint } from "../../../src/selectDuelContactPoint";

/**
 * @evidence contracts/testing.md#observable-behavior Both actual cast geometries supply true surface points. Measured formation must restore incoming root/pose, and cannot begin escape before contact. A reachable real LowerArm material target exercises the public contact adapter under a rotated/translated root while preserving legs/right wand. These tests do not establish the assembled rescue or temporal quality.
 * @evidence contracts/testing.md#independent-cases Actual triangle closest-point distances independently certify upper/front/middle-forearm witnesses. The forearm's axial fraction must equal one half, distinct from the bare distal wrist; flexed chest selection retains requested world height. A separate reachable FK pose supplies the public IK target. Initial events, source restoration,3mm contact tolerance and unaffected wand/legs are checked; the moving assembly still needs its whole round.
 */
export function test_duel_rescue_contacts(): void {
  const carina: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(1700, AutoMovieHumanSex.Female), { hair: 0xe8d9af, house: 0x245d48, glasses: false, smirk: true, skirt: true });
  const harry: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(1780, AutoMovieHumanSex.Male), { hair: 0x25201f, house: 0x842a33, glasses: true, smirk: false });
  try {
    const actors: Record<"Carina" | "Harry", ReturnType<typeof createDuelActor>> = { Carina: carina, Harry: harry };
    const entries: Record<"Carina" | "Harry", DuelRescueEntry> = {} as Record<"Carina" | "Harry", DuelRescueEntry>;
    const references: Record<"Carina" | "Harry", { left: THREE.Vector3; right: THREE.Vector3 }> = {} as Record<"Carina" | "Harry", { left: THREE.Vector3; right: THREE.Vector3 }>;
    for (const role of ["Carina", "Harry"] as const) {
      const actor: ReturnType<typeof createDuelActor> = actors[role];
      actor.object.position.set(role === "Carina" ? -0.2 : 1.4, 0.01, role === "Carina" ? -0.15 : -1.35);
      actor.object.rotation.y = role === "Carina" ? 0.65 : Math.PI;
      const output: AutoMovieHumanSkeleton.IOutput = actor.pose({});
      const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(), right: new THREE.Vector3() };
      references[role] = { left: new THREE.Vector3(), right: new THREE.Vector3() };
      for (const side of ["left", "right"] as const) {
        const point: typeof actor.shoes.ball.left = actor.shoes.ball[side];
        const bone: AutoMovieHumanSkeleton.IPlacement = output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === point.bone)!;
        references[role][side] = new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...bone.rotation)).add(new THREE.Vector3(...bone.position));
        feet[side] = actor.drawing.bones.get(point.bone)!.localToWorld(new THREE.Vector3(...point.localPoint));
      }
      entries[role] = { position: actor.object.position.clone(), yaw: actor.object.rotation.y, pose: {}, ...feet, wrist: actor.point("rightHand"), wandTip: actor.wandTip() };
    }
    const contacts: ReturnType<typeof createDuelRescueContacts> = createDuelRescueContacts(actors, entries, references);
    assert.deepEqual(contacts.events(), { redirectTouch: null, forearmTouch: null, shoulderTouch: null, escapeReady: false });
    for (const role of ["Carina", "Harry"] as const) {
      assert.deepEqual(actors[role].object.position.toArray(), entries[role].position.toArray());
      assert.ok(actors[role].wandTip().distanceTo(entries[role].wandTip) < 1e-10);
      assert.ok(contacts.meeting[role].toArray().every(Number.isFinite));
    }
    const shoulder: DuelContactPoint = selectDuelContactPoint(carina, "leftUpperArm", { kind: "upper" });
    const chest: DuelContactPoint = selectDuelContactPoint(harry, "chest", { kind: "front", height: 1.4, lateral: 0.06 });
    const middle: DuelContactPoint = selectDuelContactPoint(carina, "rightLowerArm", { kind: "forearm", toward: harry.point("leftUpperArm") });
    const elbow: THREE.Vector3 = carina.point("rightLowerArm");
    const axis: THREE.Vector3 = carina.point("rightHand").sub(elbow);
    const middleWorld: THREE.Vector3 = carina.drawing.bones.get(middle.bone)!.localToWorld(new THREE.Vector3(...middle.localPoint));
    assert.ok(Math.abs(middleWorld.clone().sub(elbow).dot(axis) / axis.lengthSq() - 0.5) < 1e-8);
    assert.ok(middleWorld.distanceTo(carina.wristContact("right", harry.point("leftUpperArm"))) > axis.length() * 0.3);
    for (const [actor, point] of [[carina, shoulder], [harry, chest], [carina, middle]] as const) {
      const mesh: THREE.Mesh = actor.drawing.parts.get(point.bone)!;
      const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
      const index: THREE.BufferAttribute | null = mesh.geometry.index;
      const count: number = index?.count ?? attribute.count;
      let minimum: number = Infinity;
      const local: THREE.Vector3 = new THREE.Vector3(...point.localPoint);
      for (let triangle: number = 0; triangle < count; triangle += 3) {
        const vertices: THREE.Vector3[] = [0, 1, 2].map((corner: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(attribute, index?.getX(triangle + corner) ?? triangle + corner));
        minimum = Math.min(minimum, new THREE.Triangle(vertices[0]!, vertices[1]!, vertices[2]!).closestPointToPoint(local, new THREE.Vector3()).distanceTo(local));
      }
      assert.ok(minimum < 1e-8, "Selected witness must belong to actual emitted triangles");
      assert.ok(local.length() > 0.01, "A joint centre is not a surface substitute");
    }
    harry.pose({ spine: { thoracic: { flexion: 12 } } });
    const flexed: DuelContactPoint = selectDuelContactPoint(harry, "chest", { kind: "front", height: 1.34, lateral: 0.06 });
    assert.ok(Math.abs(harry.drawing.bones.get("chest")!.localToWorld(new THREE.Vector3(...flexed.localPoint)).y - 1.34) < 1e-8, "A crouched chest must not inherit a standing height target");
    harry.pose({});
    const bareWorld: THREE.Vector3 = harry.wristContact("left", carina.point("leftUpperArm"));
    const bareLocal: THREE.Vector3 = harry.drawing.bones.get("leftLowerArm")!.worldToLocal(bareWorld);
    const point: DuelContactPoint = { bone: "leftLowerArm", localPoint: [bareLocal.x, bareLocal.y, bareLocal.z] };
    const reachable: IAutoMovieHumanPose = { arms: { left: { shoulder: { flexion: 20 }, elbow: { flexion: 45 } }, right: {} } };
    harry.pose(reachable);
    const target: THREE.Vector3 = harry.drawing.bones.get(point.bone)!.localToWorld(new THREE.Vector3(...point.localPoint));
    const before: AutoMovieHumanSkeleton.IOutput = harry.pose({});
    const wand: THREE.Vector3 = harry.wandTip();
    const fitted: ReturnType<typeof fitDuelLeftContact> = fitDuelLeftContact(harry, {}, point, target);
    harry.pose(fitted.result.pose);
    assert.ok(harry.drawing.bones.get(point.bone)!.localToWorld(new THREE.Vector3(...point.localPoint)).distanceTo(target) <= 0.003);
    assert.ok(harry.wandTip().distanceTo(wand) < 1e-10);
    assert.equal(fitted.result.output.clamped.length, 0);
    for (const original of before.posed.filter((row: AutoMovieHumanSkeleton.IPlacement): boolean => /hips|UpperLeg|LowerLeg|Foot|Subtalar|Hallux|Toe/.test(row.bone))) {
      const current: AutoMovieHumanSkeleton.IPlacement = fitted.result.output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === original.bone)!;
      assert.deepEqual(current.position, original.position, "An arm contact cannot move lower FK");
      assert.deepEqual(current.rotation, original.rotation);
    }
  } finally { carina.dispose(); harry.dispose(); }
}
