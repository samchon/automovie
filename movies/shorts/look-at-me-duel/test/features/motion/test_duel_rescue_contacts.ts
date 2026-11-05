import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AutoMovieHumanSex, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createDuelActor } from "../../../src/createDuelActor";
import { createDuelHumanParameters } from "../../../src/createDuelHumanParameters";
import { createDuelRescueContacts } from "../../../src/createDuelRescueContacts";
import type { DuelContactPoint } from "../../../src/DuelContactPoint";
import type { DuelRescueEntry } from "../../../src/DuelRescueEntry";
import type { DuelContactFrame } from "../../../src/DuelContactFrame";
import { evaluateDuelRescue } from "../../../src/evaluateDuelRescue";
import { fitDuelLeftContact } from "../../../src/fitDuelLeftContact";
import { selectDuelContactPoint } from "../../../src/selectDuelContactPoint";
import { selectDuelShoulderPair } from "../../../src/selectDuelShoulderPair";

/** Actual retained body/wand input, without unrelated historical solver output. */
interface Placement { root: [number, number, number]; yaw: number; pose: IAutoMovieHumanPose; wrist: [number, number, number]; wandTip: [number, number, number] }

/**
 * @evidence contracts/testing.md#observable-behavior Actual casts supply true contact surfaces and restore entry placement. Standalone public IK preserves legs/right wand. The bounded contact port then runs a retained-input reach/redirect/grip/press lifecycle, verifies own admitted seed continuation and distinguishes historical permission from a currently released press. This is not assembled rescue or temporal acceptance.
 * @evidence contracts/testing.md#independent-cases Triangle membership, middle-forearm fraction, flexed chest and proximal-shoulder/plain-knit regions are checked. A reachable public FK pose supplies the standalone target. The fixture owns historical R2 poses/placement and source identity; current Node FK supplies all entry witnesses together, without asserting unsupported1e-9 browser/Node equality. The actual historical0.614328mm tip/0.576493mm wrist discrepancy and unknown cause remain separately retained. Thirteen calls inspect actual fit, unchanged legs/right arm, admitted continuation, unreachable rejection and released contact with preserved history. No movie, geometry compatibility or force approval follows.
 */
export function test_duel_rescue_contacts(): void {
  const carina: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(1700, AutoMovieHumanSex.Female), { hair: 0xe8d9af, house: 0x245d48, glasses: false, smirk: true, skirt: true });
  const harry: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(1780, AutoMovieHumanSex.Male), { hair: 0x25201f, house: 0x842a33, glasses: true, smirk: false });
  try {
    const actors: Record<"Carina" | "Harry", ReturnType<typeof createDuelActor>> = { Carina: carina, Harry: harry };
    const entries: Record<"Carina" | "Harry", DuelRescueEntry> = {} as Record<"Carina" | "Harry", DuelRescueEntry>;
    for (const role of ["Carina", "Harry"] as const) {
      const actor: ReturnType<typeof createDuelActor> = actors[role];
      actor.object.position.set(role === "Carina" ? -0.2 : 1.4, 0.01, role === "Carina" ? -0.15 : -1.35);
      actor.object.rotation.y = role === "Carina" ? 0.65 : Math.PI;
      actor.pose({});
      const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(), right: new THREE.Vector3() };
      for (const side of ["left", "right"] as const) {
        const point: typeof actor.shoes.ball.left = actor.shoes.ball[side];
        feet[side] = actor.drawing.bones.get(point.bone)!.localToWorld(new THREE.Vector3(...point.localPoint));
      }
      entries[role] = { position: actor.object.position.clone(), yaw: actor.object.rotation.y, pose: {}, ...feet, wrist: actor.point("rightHand"), wandTip: actor.wandTip() };
    }
    const contacts: ReturnType<typeof createDuelRescueContacts> = createDuelRescueContacts(actors, entries);
    assert.deepEqual(contacts.events(), { redirectTouch: null, forearmTouch: null, shoulderTouch: null, escapeReady: false, protectiveContactActive: false });
    for (const role of ["Carina", "Harry"] as const) {
      assert.deepEqual(actors[role].object.position.toArray(), entries[role].position.toArray());
      assert.ok(actors[role].wandTip().distanceTo(entries[role].wandTip) < 1e-10);
      assert.ok(contacts.meeting[role].toArray().every(Number.isFinite));
    }
    const shoulder: DuelContactPoint = selectDuelContactPoint(carina, "leftUpperArm", { kind: "upper" });
    const chest: DuelContactPoint = selectDuelContactPoint(harry, "chest", { kind: "front", height: 1.4, lateral: 0.06 });
    const middle: DuelContactPoint = selectDuelContactPoint(carina, "rightLowerArm", { kind: "forearm", toward: harry.point("leftUpperArm") });
    const pair: ReturnType<typeof selectDuelShoulderPair> = selectDuelShoulderPair(carina, harry);
    const shoulderWorld: THREE.Vector3 = carina.drawing.bones.get(pair.shoulder.bone)!.localToWorld(new THREE.Vector3(...pair.shoulder.localPoint));
    const shoulderAxis: THREE.Vector3 = carina.point("leftLowerArm").sub(carina.point("leftUpperArm"));
    const shoulderFraction: number = shoulderWorld.sub(carina.point("leftUpperArm")).dot(shoulderAxis) / shoulderAxis.lengthSq();
    assert.ok(shoulderFraction >= -0.1 - 1e-9 && shoulderFraction <= 0.2 + 1e-9, "The press belongs to the proximal shoulder region");
    assert.ok(pair.chest.localPoint[2] >= 0.04 - 1e-9 && pair.chest.localPoint[2] <= 0.085 + 1e-9, "The counterpart stays on actual plain knit, clear of tie/lapels");
    const elbow: THREE.Vector3 = carina.point("rightLowerArm");
    const axis: THREE.Vector3 = carina.point("rightHand").sub(elbow);
    const middleWorld: THREE.Vector3 = carina.drawing.bones.get(middle.bone)!.localToWorld(new THREE.Vector3(...middle.localPoint));
    assert.ok(Math.abs(middleWorld.clone().sub(elbow).dot(axis) / axis.lengthSq() - 0.5) < 1e-8);
    assert.ok(middleWorld.distanceTo(carina.wristContact("right", harry.point("leftUpperArm"))) > axis.length() * 0.3);
    for (const [actor, point] of [[carina, shoulder], [harry, chest], [carina, middle], [carina, pair.shoulder], [harry, pair.chest]] as const) {
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

    const fixture: { format: string; entry: { carina: Placement; harry: Placement }; samples: { seconds: number; frame: { carina: Placement; harry: Placement } }[] } = JSON.parse(readFileSync(new URL("../../fixtures/rescue-contact-lifecycle.json", import.meta.url), "utf8")) as typeof fixture;
    assert.equal(fixture.format, "look-at-me-duel-contact-lifecycle-v1");
    const realEntries: Record<"Carina" | "Harry", DuelRescueEntry> = {} as typeof realEntries;
    const references: Record<"Carina" | "Harry", { left: THREE.Vector3; right: THREE.Vector3 }> = {} as typeof references;
    /** Apply one retained placement through the current public model, not stored fake FK. */
    function placed(actor: ReturnType<typeof createDuelActor>, input: Placement): DuelContactFrame {
      actor.object.position.set(...input.root);
      actor.object.rotation.set(0, input.yaw, 0);
      const pose: IAutoMovieHumanPose = structuredClone(input.pose);
      return { pose, output: actor.pose(pose), gripError: 0, contacts: [] };
    }
    for (const [role, key] of [["Carina", "carina"], ["Harry", "harry"]] as const) {
      const actor: ReturnType<typeof createDuelActor> = actors[role];
      const neutral: AutoMovieHumanSkeleton.IOutput = actor.evaluate({});
      references[role] = { left: new THREE.Vector3(), right: new THREE.Vector3() };
      for (const side of ["left", "right"] as const) {
        const point: typeof actor.shoes.ball.left = actor.shoes.ball[side];
        const carrier: AutoMovieHumanSkeleton.IPlacement = neutral.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === point.bone)!;
        references[role][side] = new THREE.Vector3(...point.localPoint).applyQuaternion(new THREE.Quaternion(...carrier.rotation)).add(new THREE.Vector3(...carrier.position));
      }
      const input: Placement = fixture.entry[key];
      const applied: DuelContactFrame = placed(actor, input);
      actor.object.updateWorldMatrix(true, true);
      const foot: (side: "left" | "right") => THREE.Vector3 = (side: "left" | "right"): THREE.Vector3 => actor.drawing.bones.get(actor.shoes.ball[side].bone)!.localToWorld(new THREE.Vector3(...actor.shoes.ball[side].localPoint));
      const actualTip: THREE.Vector3 = actor.wandTip();
      const actualWrist: THREE.Vector3 = actor.point("rightHand");
      const tipError: number = actualTip.distanceTo(new THREE.Vector3(...input.wandTip));
      assert.ok(Number.isFinite(tipError) && actualWrist.toArray().every(Number.isFinite));
      assert.equal(applied.output.clamped.length, 0);
      // The fixture owns historical poses/placement, not an API promise of
      // bit-identical browser/Node calibration. All entry witnesses belong to
      // this same current actor. The original cross-host differences and
      // failed1e-9 oracle remain in the retained diagnostic receipt.
      realEntries[role] = { position: new THREE.Vector3(...input.root), yaw: input.yaw, pose: structuredClone(input.pose), left: foot("left"), right: foot("right"), wrist: actualWrist, wandTip: actualTip };
    }
    const lifecycle: ReturnType<typeof createDuelRescueContacts> = createDuelRescueContacts(actors, realEntries);
    const previous: Partial<Record<"carina" | "harry", IAutoMovieHumanPose>> = {};
    let latest: ReturnType<typeof lifecycle.fit> | undefined;
    for (const sample of fixture.samples) {
      const input: { carina: DuelContactFrame; harry: DuelContactFrame } = { carina: placed(carina, sample.frame.carina), harry: placed(harry, sample.frame.harry) };
      const c: ReturnType<typeof evaluateDuelRescue> = evaluateDuelRescue(sample.seconds, "Carina", realEntries, references.Carina, lifecycle.meeting, false, false, false);
      const h: ReturnType<typeof evaluateDuelRescue> = evaluateDuelRescue(sample.seconds, "Harry", realEntries, references.Harry, lifecycle.meeting, false, false, false);
      latest = lifecycle.fit(sample.seconds, input, { carina: c, harry: h, ending: false });
      for (const [key, actor] of [["carina", carina], ["harry", harry]] as const) {
        assert.deepEqual(latest[key].pose.legs, input[key].pose.legs);
        assert.deepEqual(latest[key].pose.arms?.right, input[key].pose.arms?.right);
        for (const contact of latest[key].contacts ?? []) {
          if (previous[key] !== undefined) {
            const expected: NonNullable<IAutoMovieHumanPose["arms"]>["left"] = structuredClone(previous[key]!.arms!.left);
            const actual: NonNullable<IAutoMovieHumanPose["arms"]>["left"] = structuredClone(contact.fit.input.seed.arms!.left);
            delete expected.hand;
            delete actual.hand;
            assert.deepEqual(actual, expected, "Each role continues its own last admitted arm, not the other role or a stale base pose");
          }
          if (contact.error <= 0.003 && actor.evaluate(contact.fit.result.pose).clamped.length === 0) previous[key] = contact.fit.result.pose;
        }
      }
    }
    assert.ok(latest !== undefined);
    const established: ReturnType<typeof lifecycle.events> = lifecycle.events();
    assert.ok(established.redirectTouch !== null && established.forearmTouch !== null && established.shoulderTouch !== null, JSON.stringify(established));
    assert.equal(established.escapeReady, true);
    assert.equal(established.protectiveContactActive, true, "The positive lifecycle needs current real contact, not only historical event latches");
    const admittedLeft: NonNullable<IAutoMovieHumanPose["arms"]>["left"] = structuredClone(latest.harry.pose.arms!.left);
    carina.object.position.x += 4;
    const failed: ReturnType<typeof lifecycle.fit> = lifecycle.fit(38.04, { carina: { ...latest.carina, gripError: 0, contacts: [] }, harry: { ...latest.harry, gripError: 0, contacts: [] } }, { carina: { redirect: 0, shoulder: 0 }, harry: { reach: 0, forearmGrip: 1 }, ending: true });
    assert.ok(failed.harry.gripError > 0.003, "An explicit unreachable negative case stays failed");
    assert.equal(lifecycle.events().protectiveContactActive, false);
    carina.object.position.x -= 4;
    carina.pose(latest.carina.pose);
    harry.pose(latest.harry.pose);
    const resumed: ReturnType<typeof lifecycle.fit> = lifecycle.fit(38.08, { carina: { ...latest.carina, gripError: 0, contacts: [] }, harry: { ...latest.harry, gripError: 0, contacts: [] } }, { carina: { redirect: 0, shoulder: 0 }, harry: { reach: 0, forearmGrip: 1 }, ending: true });
    const resumedSeed: NonNullable<IAutoMovieHumanPose["arms"]>["left"] = structuredClone(resumed.harry.contacts![0]!.fit.input.seed.arms!.left);
    delete admittedLeft.hand;
    delete resumedSeed.hand;
    assert.deepEqual(resumedSeed, admittedLeft, "A failed fit cannot replace the admitted continuation seed");
    const released: ReturnType<typeof lifecycle.fit> = lifecycle.fit(38.1, { carina: { ...latest.carina, gripError: 0, contacts: [] }, harry: { ...latest.harry, gripError: 0, contacts: [] } }, { carina: { redirect: 0, shoulder: 0 }, harry: { reach: 0, forearmGrip: 0 }, ending: true });
    assert.equal(lifecycle.events().escapeReady, true, "Releasing does not erase actual historical touch events");
    assert.equal(lifecycle.events().protectiveContactActive, false, "Historical touch cannot certify a currently released press/hold");
    assert.equal(released.carina.contacts!.length + released.harry.contacts!.length, 0);
  } finally { carina.dispose(); harry.dispose(); }
}
