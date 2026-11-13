import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance,
  HumanFoot,
  type IAutoMovieMotionHumanAuditMeasure,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The balance audit on real bodies: the extrapolated centre of mass of Hof,
 * Gazendam and Sinke (2005) against the feet, read only while both feet
 * alone bear the body.
 *
 * A body in its quiet stance is carried rigidly along its heading at a
 * constant speed `v` for 1 s, both feet declared planted on the ground. Its
 * feet travel with it, so its centre of mass keeps its place over them, and
 * the extrapolated centre lies `v / w` ahead of it, with `w = sqrt(9.81 /
 * (1.34 hipHeight))` the pendulum's eigenfrequency. The feet's hull ends in
 * front at the line through both toe points and behind at the line through
 * both heels, so past either line the distance outside is known in closed
 * form from the stance's centre of mass `c`, toe line `zToe` and heel line
 * `zHeel` along the heading.
 *
 * Scenarios, on the average man and on the small woman, whose shorter
 * pendulum extrapolates less:
 * 1. Standing still the body is balanced: nothing is outside, and the
 *    margin at an instant is positive and less than a foot's length.
 * 2. At 0.05 m/s the extrapolated centre stays over the feet: zero.
 * 3. At 1 m/s forward it lies `c + 1 / w - zToe` outside.
 * 4. At 1 m/s backward it lies `zHeel - (c - 1 / w)` outside.
 * 5. `margin` at 0.5 s of the forward film, with its own difference step,
 *    is the negative of scenario 3's reading: the velocity of a constant
 *    carry does not depend on the span it is differenced over.
 * 6. With the right foot planted only from 0.5 s, the forward film is read
 *    from 0.5 s on; with a hand gripping a rail throughout it is not read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure and margin on a real body's mass model; a velocity taken over the wrong span, a pendulum of the wrong length, or an instant read while a hand bears the body fails.
 * @evidence contracts/development/testing.md#independent-expectations The distance outside is Hof's closed form over the stance's own centre of mass and sole points, with the eigenfrequency written out from the body's hip height.
 * @evidence contracts/development/testing.md#distinguishing-cases Still, slow, fast forward and fast backward; two statures; declared, partly declared and gripped.
 * @evidence contracts/development/testing.md#execution-ownership In memory on two prepared bodies; slow because preparing a body takes seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the construction with its formula and lists the 6 scenarios.
 */
export function test_human_motion_audit_balance(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const ground: IHumanContactWindow["support"] = { kind: "ground" };
  const plant = (
    part: IHumanContactWindow["part"],
    from: number,
  ): IHumanContactWindow => ({
    part,
    kind: "plant",
    from,
    to: 1,
    support: ground,
  });

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stance: Bones = motionHumanStance(body);
    const film = (
      speed: number,
      contacts: IHumanContactWindow[] = [
        plant("leftFoot", 0),
        plant("rightFoot", 0),
      ],
    ): IAutoMovieMotionHumanAuditMotion =>
      motionAuditMoved(
        stance,
        1,
        (_bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 => ({
          x: 0,
          y: 0,
          z: speed * t,
        }),
        [
          {
            name: "stand",
            start: 0,
            entryTime: 0,
            end: 1,
            plan: { duration: 1, contacts },
          },
        ],
      );
    const measure = (
      motion: IAutoMovieMotionHumanAuditMotion,
    ): IAutoMovieMotionHumanAuditMeasure =>
      AutoMovieMotionHumanAuditBalance.measure(motion, "a", body);

    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const centre: number = resolveAutoMovieCenterOfMass.place(model, stance).z;
    const sole: number[] = HumanFoot.base(body, stance).map(
      (p: IAutoMovieVector3): number => p.z,
    );
    const zToe: number = Math.max(...sole);
    const zHeel: number = Math.min(...sole);
    const lead: number = 1 / Math.sqrt(9.81 / (1.34 * body.measure.hipHeight));

    const still: IAutoMovieMotionHumanAuditMeasure = measure(film(0));
    const margin: number = AutoMovieMotionHumanAuditBalance.margin(
      film(0),
      "a",
      body,
      model,
      0.5,
    );
    TestValidator.predicate(
      `${name}: standing still is balanced, margin ${(margin * 1000).toFixed(1)} mm`,
      still.value === 0 &&
        still.where === "none" &&
        margin > 0 &&
        margin < zToe - zHeel,
    );
    TestValidator.equals(
      `${name}: a slow carry stays over the feet`,
      measure(film(0.05)).value,
      0,
    );

    const forward: IAutoMovieMotionHumanAuditMeasure = measure(film(1));
    TestValidator.predicate(
      `${name}: a forward carry leaves the toes by ${((centre + lead - zToe) * 1000).toFixed(1)} mm, got ${(forward.value * 1000).toFixed(1)}`,
      Math.abs(forward.value - (centre + lead - zToe)) <= 1e-6 &&
        forward.where === "both feet",
    );
    const backward: IAutoMovieMotionHumanAuditMeasure = measure(film(-1));
    TestValidator.predicate(
      `${name}: a backward carry leaves the heels by ${((zHeel - (centre - lead)) * 1000).toFixed(1)} mm, got ${(backward.value * 1000).toFixed(1)}`,
      Math.abs(backward.value - (zHeel - (centre - lead))) <= 1e-6,
    );
    TestValidator.predicate(
      `${name}: one instant's margin agrees with the motion's reading`,
      Math.abs(
        AutoMovieMotionHumanAuditBalance.margin(
          film(1),
          "a",
          body,
          model,
          0.5,
        ) + forward.value,
      ) <= 1e-6,
    );

    const late: IAutoMovieMotionHumanAuditMeasure = measure(
      film(1, [plant("leftFoot", 0), plant("rightFoot", 0.5)]),
    );
    TestValidator.predicate(
      `${name}: only instants with both feet planted are read`,
      Math.abs(late.value - forward.value) <= 1e-6 && late.seconds >= 0.5,
    );
    const gripped: IAutoMovieMotionHumanAuditMeasure = measure(
      film(1, [
        plant("leftFoot", 0),
        plant("rightFoot", 0),
        {
          part: "rightHand",
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "rail" },
        },
      ]),
    );
    TestValidator.predicate(
      `${name}: a gripping hand leaves the instant unread`,
      gripped.value === 0 && gripped.where === "none",
    );
  }
}
