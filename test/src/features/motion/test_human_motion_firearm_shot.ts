import { createHandgun, createLongGun } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFirearm,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  HumanWeaponFirearm,
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A shot is composed of a draw, a presentation and the firing: the pistol
 * is taken by its grip, its bore is brought onto the line to the target,
 * and the shot lifts the muzzle about the hand and lets it come back.
 *
 * The bore's line is read from the displayed pistol's own `muzzle` contact.
 * Presented, it passes within the declared dispersion of the aim point,
 * 1 degree (provisional: #3348 asks for "the declared dispersion" and no
 * marksmanship source was read). The recoil's size is provisional too (no
 * recoil study was read): the muzzle rises between 3 and 20 degrees and is
 * back within the dispersion at the end. The pistol stays in the hand: the
 * campaign's bound on a grip is 1 mm of drift in the hand's frame.
 *
 * Scenarios, on the average man and the small woman, a full-size handgun
 * standing by the right hip and a target point 5 m ahead at 0.8 of the
 * stature:
 * 1. Drawn and presented, at the presentation's `stroke` and through its
 *    hold the bore's line passes within 1 degree of the target.
 * 2. Fired, the bore's elevation at the recoil's peak (`stroke`) is 3 to 20
 *    degrees above its elevation at the trigger (`strokeStart`, the decisive
 *    instant), and at the end it is within 1 degree of the target again.
 * 3. From the draw's grip to the end the pistol's grip point moves at most
 *    1 mm in the hand's frame.
 * 4. Refused, each naming its axis: a long gun presented in one hand
 *    (`hands`, with 2 as the alternative), and a target behind the
 *    performer (`target`, with the widest angle as the feasible maximum).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances through the public chain, props and input and reads the displayed pistol and hand; a bore off its line, a shot without a rise or a return, a pistol that drifts in the hand or an accepted impossible hold fails.
 * @evidence contracts/development/testing.md#independent-expectations The target is a world point the test states and the bore is the prop's declared contact; the dispersion and the recoil band are stated provisional with what would source them; the grip bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases The aim at its instant and through its hold, the recoil's peak and its end, the grip through three actions, two refusals, two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the composition, the bounds with their standing and the 4 scenarios.
 */
export function test_human_motion_firearm_shot(): void {
  const pistol: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const rifle: ReturnType<typeof createLongGun> = createLongGun({
    kind: "carbine",
  });
  const muzzle: IAutoMovieTransform = pistol.affordance("muzzle").frame;
  const bore: IAutoMovieVector3 = Quaternion.rotateVector(muzzle.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const grip: IAutoMovieVector3 = pistol.affordance("grip").frame.translation;
  const laws: IHumanActionLaw<never>[] = [
    ...Object.values(HumanFirearm),
    HumanWeaponFirearm.draw,
  ];
  const complaints: string[] = [];
  const degrees = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, Vector3.dot(Vector3.normalize(a), Vector3.normalize(b))),
      ),
    ) *
      180) /
    Math.PI;

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const target: IAutoMovieVector3 = { x: 0.3, y: 0.8 * stature, z: 5 };
    const perform = (
      composition: HumanChain,
      extra: IHumanProp[] = [],
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "shot",
        laws,
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
          // The pistol stands on its grip beside the right hip, muzzle ahead.
          HumanObject.prop("pistol", pistol, {
            at: { x: -0.14 * stature, y: 0.5 * stature, z: 0.08 * stature },
            yaw: 0,
          }),
          ...extra,
        ],
        composition: composition.node,
      });
    const aimed: AutoMovieMotionTarget = {
      kind: "point",
      at: target,
      frame: "world",
    };
    const film: HumanPerformance = perform(
      HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("drawFirearm", { prop: "pistol" })
        .registered("takeAim", { gun: "pistol", target: aimed, seconds: 0.5 })
        .registered("recoil", { gun: "pistol" }),
    );
    const named = (row: string): HumanSegment.ISegment =>
      film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
    const instant = (segment: HumanSegment.ISegment, event: string): number =>
      segment.start +
      (segment.plan.events.find((e): boolean => e.name === event)?.share ??
        Number.NaN) *
        segment.plan.duration;
    const line = (seconds: number): IAutoMovieVector3 =>
      Quaternion.rotateVector(film.prop("pistol", seconds).rotation, bore);
    const off = (seconds: number): number => {
      const frame: IHumanProp.IFrame = film.prop("pistol", seconds);
      return degrees(
        line(seconds),
        Vector3.subtract(
          target,
          Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, muzzle.translation),
          ),
        ),
      );
    };
    const elevation = (seconds: number): number =>
      (Math.asin(Math.max(-1, Math.min(1, line(seconds).y))) * 180) / Math.PI;

    // 1. Presented, the bore is on the target.
    const aim: HumanSegment.ISegment = named("takeAim");
    for (const seconds of [
      instant(aim, "stroke"),
      (instant(aim, "stroke") + aim.end) / 2,
      aim.end,
    ])
      if (!(off(seconds) <= 1))
        complaints.push(
          `${name}: presented, the bore's line passes ${off(seconds).toFixed(2)} degrees from the target at ${seconds.toFixed(2)} s, 1 degree at most expected`,
        );

    // 2. The shot lifts the muzzle and lets it back.
    const shot: HumanSegment.ISegment = named("recoil");
    const trigger: number = shot.start + (shot.plan.contact ?? Number.NaN);
    const rise: number =
      elevation(instant(shot, "stroke")) - elevation(trigger);
    if (!(rise >= 3 && rise <= 20))
      complaints.push(
        `${name}: the muzzle rises ${rise.toFixed(1)} degrees from the trigger to the recoil's peak, 3 to 20 expected (provisional)`,
      );
    if (!(off(shot.end) <= 1))
      complaints.push(
        `${name}: after the shot the bore's line passes ${off(shot.end).toFixed(2)} degrees from the target, 1 degree at most expected`,
      );

    // 3. The pistol stays in the hand.
    const draw: HumanSegment.ISegment = named("drawFirearm");
    const held = (seconds: number): IAutoMovieVector3 => {
      const frame: IHumanProp.IFrame = film.prop("pistol", seconds);
      const hand: IAutoMovieResolvedBone = film
        .bones("a", seconds)
        .get("rightHand")!;
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(
          Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, grip),
          ),
          hand.worldPosition,
        ),
      );
    };
    const closed: number = instant(draw, "gripClosed") + 0.02;
    let drift: number = 0;
    for (let seconds: number = closed; seconds <= shot.end; seconds += 0.05)
      drift = Math.max(
        drift,
        Vector3.length(Vector3.subtract(held(seconds), held(closed))),
      );
    if (!(drift <= 0.001))
      complaints.push(
        `${name}: the pistol's grip moves ${(drift * 1000).toFixed(2)} mm in the hand's frame between the draw and the end of the shot, 1 mm at most expected`,
      );

    // 4. What is refused.
    const refused = (build: () => unknown): unknown => {
      try {
        build();
      } catch (error) {
        return error;
      }
      return null;
    };
    const said = (thrown: unknown): string =>
      thrown instanceof Error ? thrown.message : String(thrown);
    const single: unknown = refused(() =>
      perform(
        HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("takeAim", { gun: "rifle", hands: 1, target: aimed }),
        [
          HumanObject.prop("rifle", rifle, {
            at: { x: -0.2, y: 0.9, z: 0.2 },
            yaw: 0,
          }),
        ],
      ),
    );
    if (
      !(
        single instanceof HumanRefusal &&
        single.axis === "hands" &&
        single.feasible?.kind === "alternatives" &&
        single.feasible.values.includes("2")
      )
    )
      complaints.push(
        `${name}: a long gun presented in one hand: a refusal on hands offering 2 expected, got ${said(single)}`,
      );
    const behind: unknown = refused(() =>
      perform(
        HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("takeAim", {
            target: {
              kind: "point",
              at: { x: 0, y: 0.8 * stature, z: -5 },
              frame: "world",
            },
          }),
      ),
    );
    if (
      !(
        behind instanceof HumanRefusal &&
        behind.axis === "target" &&
        behind.feasible?.kind === "range" &&
        behind.feasible.maximum !== null &&
        behind.feasible.maximum < 180
      )
    )
      complaints.push(
        `${name}: a target behind the performer: a refusal on target with the widest angle expected, got ${said(behind)}`,
      );
  }
  TestValidator.equals("a shot is drawn, aimed and fired", complaints, []);
}
