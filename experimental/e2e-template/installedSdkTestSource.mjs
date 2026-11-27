/** Source of the generated test for installed archetypes, contacts and room props. */
export const installedSdkTestSource = (
  contactBody,
) => `import assert from "node:assert/strict";
import {
  AutoMovieArchetypeCamera, AutoMovieArchetypePhone, AutoMovieArchetypeRemote, AutoMovieArchetypeTablet,
  AutoMovieArchetypeDesktopKeyboard as RootAutoMovieArchetypeDesktopKeyboard,
  AutoMovieArchetypeLaptop as RootAutoMovieArchetypeLaptop,
  AutoMovieArchetypeRadio as RootAutoMovieArchetypeRadio,
  AutoMovieArchetypeScenicContainer,
} from "@automovie/archetypes";
import { AutoMovieArchetypeCargoPod } from "@automovie/archetypes/props";
import { AutoMovieArchetypeRing } from "@automovie/archetypes/gym";
import * as props from "@automovie/archetypes/props";
import { AutoMovieEngineKinematics, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { AutoMovieMotionHumanOperate, AutoMovieMotionHumanBody, AutoMovieMotionHumanChain, AutoMovieMotionHumanObject, AutoMovieMotionHumanPerformance } from "@automovie/motions";

import type { IFilmProduction } from "../../../src/IFilmProduction";
import { starter } from "../../../src/composition/films/starter";

/**
 * Execute installed SDK consumers through the generated nested test project.
 *
 * Scenarios: the saved selector and named props, two displayed phone swipes and the
 * compiled furnished room run after dynamic test discovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the nested runtime integration and actual installed SDK consumers.
 * @evidence contracts/development/testing.md#behavioral-verification The generated test runner and dynamic loader exercise the packed SDK's public entry points, a posed fingertip on an installed phone and two named models in a furnished room. The installed package boundary and test discovery are the behavior under test.
 * @evidence contracts/development/testing.md#independent-expectations Ricoh specifies a 109.4 mm camera width. The case collider and the declared 94-percent screen width determine the glass targets, with a 9 mm acceptance bound and a 285 ms stroke target. The two seeds cover the representative phone and a prior worst case. Literal names check the cargo mount and room models, and strict equality checks identity across export paths.
 */
export async function test_installed_sdk(): Promise<void> {
  assert.ok(AutoMovieArchetypeRing.create({ id: "sdk-consumer" }).parts.length > 0);
  assert.equal(AutoMovieArchetypeCamera, props.AutoMovieArchetypeCamera);
  assert.equal(RootAutoMovieArchetypeDesktopKeyboard, props.AutoMovieArchetypeDesktopKeyboard);
  assert.equal(RootAutoMovieArchetypeLaptop, props.AutoMovieArchetypeLaptop);
  assert.equal(AutoMovieArchetypePhone, props.AutoMovieArchetypePhone);
  assert.equal(RootAutoMovieArchetypeRadio, props.AutoMovieArchetypeRadio);
  assert.equal(AutoMovieArchetypeRemote, props.AutoMovieArchetypeRemote);
  assert.equal(AutoMovieArchetypeTablet, props.AutoMovieArchetypeTablet);
  assert.equal(AutoMovieArchetypeCamera.create({ model: "grIII" }).dimensions.width, 0.1094);
  const oldPod = AutoMovieArchetypeScenicContainer.create({ kind: "cargoPod" }, 7);
  const pod = AutoMovieArchetypeCargoPod.create({}, 7);
  assert.deepEqual(oldPod.affordances.map((contact) => contact.id), ["top"]);
  assert.deepEqual(pod.affordance("top"), oldPod.affordance("top"));
  assert.equal(pod.affordance("mount").frame.translation.y, 0);

  const params: IAutoMovieHumanParameters = ${JSON.stringify(contactBody.params)};
  const prepared = AutoMovieHumanCanonicalBody.prepare(params, { id: "f-average", mass: ${contactBody.mass} });
  const body = AutoMovieMotionHumanBody.create(prepared.skeleton, prepared.profile);
  const rotation = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
  );
  const centre = { x: -body.measure.shoulderHalfWidth, y: body.measure.shoulderHeight - 0.14, z: 0.48 };
  const Chain = AutoMovieMotionHumanChain.extend({ swipeTouchscreen: AutoMovieMotionHumanOperate.swipeTouchscreen });
  // The contact matrix retains seed zero and seed 180, the largest measured gap in the native sweep.
  for (const seed of [0, 180]) {
    const phone = AutoMovieArchetypePhone.create({}, seed);
    const shell = phone.shapes().find((shape) => shape.id === "body");
    assert(shell?.kind === "box");
    assert.equal(phone.affordance("screen").kind, "surface");
    const glassOffset = AutoMovieEngineQuaternion.rotateVector(rotation, { x: 0, y: shell.halfExtents.y, z: shell.halfExtents.z });
    const film = new AutoMovieMotionHumanPerformance({
      seed: "catalogue/phone-use",
      laws: [AutoMovieMotionHumanOperate.swipeTouchscreen],
      performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
      props: [AutoMovieMotionHumanObject.prop("phone", phone, { position: AutoMovieEngineVector3.subtract(centre, glassOffset), rotation, fixed: true })],
      composition: Chain.subject("a").stand({ hold: 0.6, sway: 0 })
        .swipeTouchscreen({ prop: "phone", screen: "screen", from: -0.25, to: 0.25 }).node,
    });
    const stroke = film.segments("a")[1]!;
    const start = stroke.plan.events.find((event) => event.name === "strokeStart")!.share;
    const end = stroke.plan.events.find((event) => event.name === "strokeEnd")!.share;
    assert.ok(Math.abs((end - start) * stroke.plan.duration - 0.285) <= 0.005, \`Phone seed \${seed} stroke duration\`);
    for (const [share, fraction] of [[start, -0.25], [(start + end) / 2, 0], [end, 0.25]] as const) {
      const seconds = stroke.start + share * stroke.plan.duration;
      const surface = body.surfaces.regions.indexTipRight;
      const bone = film.bones("a", seconds).get(surface.bone)!;
      const tip = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
        surface,
        bone,
      );
      const expected = AutoMovieEngineVector3.add(centre, AutoMovieEngineVector3.scale(
        { x: -Math.sqrt(3) / 2, y: -0.5, z: 0 }, fraction * 2 * shell.halfExtents.x * 0.94,
      ));
      const gap = AutoMovieEngineVector3.distance(tip, expected);
      assert.ok(gap <= 0.009, \`Phone seed \${seed} at \${seconds} s misses glass by \${gap} m\`);
    }
  }
  const room: IFilmProduction = await starter().create();
  try {
    assert.ok(room.scene.getObjectByName("installed-room/bench"));
    assert.ok(room.scene.getObjectByName("installed-room/bookcase"));
  } finally {
    room.dispose();
  }
}
`;
