/** Source of the generated test for installed archetypes, contacts and room props. */
export const installedSdkTestSource = (
  contactBody,
) => `import assert from "node:assert/strict";
import {
  createCamera, createCargoPod, createDesktopKeyboard, createLaptop, createPhone,
  createRadio, createRemote, createRing, createScenicContainer, createTablet,
} from "@automovie/archetypes";
import * as props from "@automovie/archetypes/props";
import { Quaternion, Vector3 } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { AutoMovieMotionHumanOperate, createHumanBody, HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import type { IFilmProduction } from "../../../src/IFilmProduction";
import { starter } from "../../../src/composition/films/starter";

/**
 * Execute installed SDK consumers through the generated nested test project.
 *
 * Scenarios: the old and named props, two displayed phone swipes and the
 * compiled furnished room run after dynamic test discovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the nested runtime integration and actual installed SDK consumers.
 * @evidence contracts/development/testing.md#behavioral-verification Test discovery executes the installed root, props and environment exports, composes a real actor and reads its displayed fingertip at both ends and the midpoint of the stroke. Runs through the generated pnpm test command and its actual dynamic loader, without a browser or patched dependency.
 * @evidence contracts/development/testing.md#independent-expectations Ricoh lists the GR III at 109.4 mm wide. The placed case collider gives the glass plane and the 94-percent width. The established 9 mm touchscreen bound and 285 ms stroke signature apply. The fixture also names the bench and bookcase. Exercises root/subpath identity, the legacy cargo pod's top and the named pod's new bottom mount, the representative phone and the largest locally measured contact gap from the 200-seed sweep, and two familiar objects in the furnished scene.
 */
export async function test_installed_sdk(): Promise<void> {
  assert.ok(createRing({ id: "sdk-consumer" }).parts.length > 0);
  assert.equal(createCamera, props.createCamera);
  assert.equal(createDesktopKeyboard, props.createDesktopKeyboard);
  assert.equal(createLaptop, props.createLaptop);
  assert.equal(createPhone, props.createPhone);
  assert.equal(createRadio, props.createRadio);
  assert.equal(createRemote, props.createRemote);
  assert.equal(createTablet, props.createTablet);
  assert.equal(createCamera({ model: "grIII" }).dimensions.width, 0.1094);
  const oldPod = createScenicContainer({ kind: "cargoPod" }, 7);
  const pod = createCargoPod({}, 7);
  assert.deepEqual(oldPod.affordances.map((contact) => contact.id), ["top"]);
  assert.deepEqual(pod.affordance("top"), oldPod.affordance("top"));
  assert.equal(pod.affordance("mount").frame.translation.y, 0);

  const params: IAutoMovieHumanParameters = ${JSON.stringify(contactBody.params)};
  const prepared = AutoMovieHumanCanonicalBody.prepare(params, { id: "f-average", mass: ${contactBody.mass} });
  const body = createHumanBody(prepared.skeleton, prepared.profile);
  const rotation = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
  );
  const centre = { x: -body.measure.shoulderHalfWidth, y: body.measure.shoulderHeight - 0.14, z: 0.48 };
  const Chain = HumanChain.extend({ swipeTouchscreen: AutoMovieMotionHumanOperate.swipeTouchscreen });
  // The contact matrix retains seed zero and seed 180, the largest measured gap in the native sweep.
  for (const seed of [0, 180]) {
    const phone = createPhone({}, seed);
    const shell = phone.shapes().find((shape) => shape.id === "body");
    assert(shell?.kind === "box");
    assert.equal(phone.affordance("screen").kind, "surface");
    const glassOffset = Quaternion.rotateVector(rotation, { x: 0, y: shell.halfExtents.y, z: shell.halfExtents.z });
    const film = new HumanPerformance({
      seed: "catalogue/phone-use",
      laws: [AutoMovieMotionHumanOperate.swipeTouchscreen],
      performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
      props: [HumanObject.prop("phone", phone, { position: Vector3.subtract(centre, glassOffset), rotation, fixed: true })],
      composition: Chain.subject("a").stand({ hold: 0.6, sway: 0 })
        .swipeTouchscreen({ prop: "phone", screen: "screen", from: -0.25, to: 0.25 }).node,
    });
    const stroke = film.segments("a")[1]!;
    const start = stroke.plan.events.find((event) => event.name === "strokeStart")!.share;
    const end = stroke.plan.events.find((event) => event.name === "strokeEnd")!.share;
    assert.ok(Math.abs((end - start) * stroke.plan.duration - 0.285) <= 0.005, \`Phone seed \${seed} stroke duration\`);
    for (const [share, fraction] of [[start, -0.25], [(start + end) / 2, 0], [end, 0.25]] as const) {
      const seconds = stroke.start + share * stroke.plan.duration;
      const tip = HumanHand.frame(body, film.bones("a", seconds), "right", "indexTip", "point").point;
      const expected = Vector3.add(centre, Vector3.scale(
        { x: -Math.sqrt(3) / 2, y: -0.5, z: 0 }, fraction * 2 * shell.halfExtents.x * 0.94,
      ));
      const gap = Vector3.distance(tip, expected);
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
