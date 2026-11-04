import assert from "node:assert/strict";
import { AutoMovieHumanGrounding, AutoMovieHumanRigControls, type AutoMovieHumanSupportFrame } from "@automovie/human";
import * as THREE from "three";
import { InspectionPerson } from "../../../../src/InspectionPerson";
import { LabActorSupport } from "../../../../src/motion-lab/LabActorSupport";
import { prepareLabHuman } from "../../../../src/motion-lab/prepareLabHuman";
import { KnockdownMotion } from "../../../../src/motion/down/KnockdownMotion";
import { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Check the original Human polygon's complete displayed geometry during side descent.
 *
 * Scenarios:
 * 1. Both anatomical fall sides consume the same 180 cm athletic public Human.
 * 2. Native Grounding.inspect observes the original complete body and actual floor contact.
 * 3. Real displayed world matrices independently locate the requested material vertex.
 * 4. Phase joins and the unsuccessful rise preserve floor clearance and seek determinism.
 *
 * @evidence contracts/testing.md#observable-behavior Builds the original low-cost polygon with the public prepared Human evaluator, captures its actual emitted rigid vertices including the current cartoon face, applies the real pose/root graph and calls public Human Grounding.inspect. It does not build the dense skin, create a browser, detect a kick, or prove force/balance/self-collision/audio/visual naturalness. The real equipped actor host owns its separate full-cloud admission and moving review.
 * @evidence contracts/testing.md#independent-cases Original native mesh attributes and world matrices provide an oracle independent of DownGrounding's quaternion/point code. Existing .25mm contact and 1 micrometre floor tolerances remain unchanged. Both sides, collapse boundaries at .18/1.1/1.6 and attempt boundaries 8/13 plus half-step neighbors detect unsupported or discontinuous geometry. Arbitrary seek order must reproduce the same raw sample.
 */
export function test_down_human_surface(): void {
  const prepared: ReturnType<typeof prepareLabHuman> = prepareLabHuman();
  const person: InspectionPerson = new InspectionPerson(prepared.parameters, 0x885533, prepared.evaluate);
  try {
    person.pose({});
    const points: AutoMovieHumanSupportFrame.IPoint[] = LabActorSupport.cloud(person);
    assert.ok(points.length > 100);
    let minimum: number = Infinity;
    for (const point of points) {
      const carrier: THREE.Group | undefined = person.drawing.bones.get(point.bone);
      assert.ok(carrier);
      minimum = Math.min(minimum, carrier.localToWorld(new THREE.Vector3(...point.localPoint)).y);
    }
    const entry: MotionAction.Sample = { pose: {}, rootOffset: [0, -minimum, 0], support: { left: .5, right: .5 }, effectors: [], phase: "contact", elapsed: 0, progress: 1 };
    const grounding: AutoMovieHumanGrounding.IPrepared = AutoMovieHumanGrounding.prepare(prepared.evaluate, points);
    for (const side of ["left", "right"] as const) {
      const action: KnockdownMotion = new KnockdownMotion({ actorId: "receiver", entry, impact: { actionId: "observed-high-kick", actorId: "attacker", targetId: "receiver", time: 150, relation: "body", point: [0, 1.65, 0], normal: [0, 0, side === "left" ? 1 : -1] }, side, duration: 30, timing: { attemptStart: 8, attemptDuration: 5 }, context: { evaluatePose: prepared.evaluate, points, frame: { origin: [0, 0, 0], yawRadians: 0 }, floorY: 0 } });
      for (const time of [0, .09, .18 - 1 / 240, .18, .18 + 1 / 240, .4, .7, 1.1 - 1 / 240, 1.1, 1.1 + 1 / 240, 1.6, 3, 8, 9.25, 10.5, 11.75, 13, 17, 30]) {
        const sample: KnockdownMotion.Sample = action.sample(time);
        assert.equal(sample.support.kind, "contacts");
        if (sample.support.kind !== "contacts") throw new Error("Expected explicit whole-body contact support");
        const contact: MotionAction.GroundContact = sample.support.contacts[0]!;
        const root: AutoMovieHumanGrounding.IRoot = { translation: [...sample.rootOffset], rotation: [...sample.rootRotation!] };
        const observation: AutoMovieHumanGrounding.IResult = grounding.inspect(sample.pose, root, { targets: [{ bone: contact.bone, localPoint: [...contact.localPoint], position: [...contact.world] }], channels: [AutoMovieHumanRigControls.channel("neck.cervical.flexion")], rootAxes: [], iterations: 1, tolerance: .00025, floorTolerance: .000001 });
        assert.equal(observation.status, "admitted", `${side} ${time}: ${JSON.stringify(observation)}`);
        assert.ok(observation.floorMinimum >= -.000001);
        assert.ok(observation.supportError <= .00025);
        person.pose(sample.pose);
        person.object.position.set(...root.translation);
        person.object.quaternion.set(...root.rotation);
        person.object.updateWorldMatrix(true, true);
        const carrier: THREE.Group | undefined = person.drawing.bones.get(contact.bone);
        assert.ok(carrier);
        const actual: THREE.Vector3 = carrier.localToWorld(new THREE.Vector3(...contact.localPoint));
        assert.ok(actual.distanceTo(new THREE.Vector3(...contact.world)) < .00025);
        for (const point of points) {
          const bone: THREE.Group | undefined = person.drawing.bones.get(point.bone);
          assert.ok(bone);
          assert.ok(bone.localToWorld(new THREE.Vector3(...point.localPoint)).y >= -.000001, `${side} ${time} floor ${point.bone}`);
        }
      }
      const repeated: KnockdownMotion.Sample = action.sample(.7);
      action.sample(29); action.sample(.01);
      assert.deepEqual(action.sample(.7), repeated);
      for (const boundary of [.18, 1.1, 1.6, 8, 13]) {
        const before: KnockdownMotion.Sample = action.sample(boundary - .000001);
        const after: KnockdownMotion.Sample = action.sample(boundary + .000001);
        const material: AutoMovieHumanSupportFrame.IPoint = points[0]!;
        const positions: THREE.Vector3[] = [];
        for (const sample of [before, after]) {
          person.pose(sample.pose);
          person.object.position.set(...sample.rootOffset);
          person.object.quaternion.set(...sample.rootRotation!);
          person.object.updateWorldMatrix(true, true);
          positions.push(person.drawing.bones.get(material.bone)!.localToWorld(new THREE.Vector3(...material.localPoint)));
        }
        assert.ok(positions[0]!.distanceTo(positions[1]!) < .0001, `${side} requested material jumps at ${boundary}`);
      }
    }
  } finally { person.dispose(); }
}
