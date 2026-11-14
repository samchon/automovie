import { createLongGun } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFirearm,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanWeaponFirearm,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A long gun is presented in both hands: the firing hand on the grip, the
 * other hand on the fore-end the weapon declares, the bore on the line to
 * the target.
 *
 * The bounds: the bore's line within the declared 1 degree of the aim point
 * (provisional, as in the handgun's test), and the support hand's grip
 * centre within the campaign's 15 mm of the fore-end at the presentation's
 * decisive instant and 10 mm of where it then was, in the weapon's frame,
 * through the hold.
 *
 * Scenarios, on the average man and the small woman, a carbine taken by its
 * grip and presented at a point 20 m ahead at 0.8 of the stature:
 * 1. At the presentation's `stroke` and at its end the bore's line passes
 *    within 1 degree of the target.
 * 2. At `stroke` the left hand's grip centre is within 15 mm of the
 *    carbine's fore-end, and at the end within 10 mm of where it was on the
 *    carbine.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, props and input and reads the displayed carbine and left hand; a bore off its line or a support hand off the fore-end fails.
 * @evidence contracts/development/testing.md#independent-expectations The fore-end and the muzzle are the prop's declared contacts and the target a world point the test states; the bounds are the campaign's contact bounds and the provisional dispersion.
 * @evidence contracts/development/testing.md#distinguishing-cases The aim and the support hand, each at the decisive instant and at the end of the hold; two bodies of opposite build. The one-hand refusal is the handgun test's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bounds and the 2 scenarios.
 */
export function test_human_motion_firearm_long_gun(): void {
  const carbine: ReturnType<typeof createLongGun> = createLongGun({
    kind: "carbine",
  });
  const muzzle: IAutoMovieTransform = carbine.affordance("muzzle").frame;
  const fore: IAutoMovieVector3 =
    carbine.affordance("foreEnd").frame.translation;
  const bore: IAutoMovieVector3 = Quaternion.rotateVector(muzzle.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const target: IAutoMovieVector3 = { x: -1, y: 0.8 * stature, z: 20 };
    const film: HumanPerformance = new HumanPerformance({
      seed: "carbine",
      laws: [...Object.values(HumanFirearm), HumanWeaponFirearm.draw],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        // The carbine lies level beside the right hip, muzzle ahead, where
        // the hanging arm takes its grip with the bore along the forearm.
        HumanObject.prop("carbine", carbine, {
          at: { x: -0.14 * stature, y: 0.58 * stature, z: -0.1 * stature },
          yaw: 0,
        }),
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("drawFirearm", { prop: "carbine" })
        .registered("takeAim", {
          gun: "carbine",
          target: { kind: "point", at: target, frame: "world" },
          seconds: 0.6,
        }).node,
    });
    const aim: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "takeAim")!;
    const set: number =
      aim.start +
      (aim.plan.events.find((e): boolean => e.name === "stroke")?.share ??
        Number.NaN) *
        aim.plan.duration;
    const on = (frame: IHumanProp.IFrame, local: IAutoMovieVector3) =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );

    // The left hand's grip centre in the carbine's own frame.
    const hand = (seconds: number): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = film.prop("carbine", seconds);
      const socket: IHumanBody["surfaces"]["sockets"]["gripLeft"] =
        body.surfaces.sockets.gripLeft;
      return Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(
          resolveAutoMovieHumanoidSurfaces.place(
            socket,
            film.bones("a", seconds).get(socket.bone)!,
          ).point,
          frame.position,
        ),
      );
    };
    for (const seconds of [set, aim.end]) {
      const frame: IHumanProp.IFrame = film.prop("carbine", seconds);
      const off: number =
        (Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              Vector3.dot(
                Quaternion.rotateVector(frame.rotation, bore),
                Vector3.normalize(
                  Vector3.subtract(target, on(frame, muzzle.translation)),
                ),
              ),
            ),
          ),
        ) *
          180) /
        Math.PI;
      if (!(off <= 1))
        complaints.push(
          `${name}: presented, the carbine's bore passes ${off.toFixed(2)} degrees from the target at ${seconds.toFixed(2)} s, 1 degree at most expected`,
        );
    }

    // The fore-end is a handle along the barrel, as long as it declares; a
    // hand anywhere on that length is on it.
    const half: number = (carbine.affordance("foreEnd").length ?? 0) / 2;
    const from: IAutoMovieVector3 = Vector3.subtract(hand(set), fore);
    const along: number = Math.max(
      -half,
      Math.min(half, Vector3.dot(from, bore)),
    );
    const reached: number = Vector3.length(
      Vector3.subtract(from, Vector3.scale(bore, along)),
    );
    if (!(reached <= 0.015))
      complaints.push(
        `${name}: the support hand's grip centre is ${(reached * 1000).toFixed(1)} mm from the carbine's fore-end when it is presented, 15 mm at most expected`,
      );
    const slid: number = Vector3.length(
      Vector3.subtract(hand(aim.end), hand(set)),
    );
    if (!(slid <= 0.01))
      complaints.push(
        `${name}: through the hold the support hand moves ${(slid * 1000).toFixed(1)} mm on the carbine, 10 mm at most expected`,
      );
  }
  TestValidator.equals("a long gun is presented in both hands", complaints, []);
}
