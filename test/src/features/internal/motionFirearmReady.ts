import { createHandgun, createTable } from "@automovie/archetypes";
import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
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
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "./motionHumanBody";

/**
 * A pistol drawn off a counter and presented at a ready position, on one
 * body, which the `test_human_motion_firearm_ready_*` specs read one body
 * each: the standoff's draw, whose high ready was refused on all but two of
 * eighteen bodies while its pose was one typed frame.
 *
 * The person stands at the origin facing +Z behind a counter-height table
 * (0.914 m) whose front lies 0.53 m ahead; a full-size handgun stands on it
 * 0.18 m to the right and 0.30 m ahead. The person draws it and presents it
 * at the high ready, and again, in a second performance, at the low ready,
 * a target point 6 m ahead at chest height.
 *
 * Scenarios, for each carriage:
 * 1. It plans.
 * 2. Over the presentation's hold, read five times, the bore's elevation
 *    lies inside the doctrine's region (`HumanWeaponFirearm` presents it,
 *    the region is read here from the sources, not from the law): the high
 *    ready at least 45 degrees above level (US Army TC 3-22.9, para 6-23)
 *    and at most 75 (provisional, no source gives a greatest), the low ready
 *    30 to 45 degrees below level (TC 3-22.9, para 6-19), give or take the
 *    angle a 10 mm miss at the muzzle turns the bore by over the muzzle's
 *    distance from the grip (the campaign's fit bound on a held tool's pose).
 * 3. From the draw's grip to the end, the pistol's grip point moves at most
 *    1 mm in the hand's frame (the campaign's grip bound): the hand holds
 *    the pose chosen for it.
 *
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the case it comes from and the 3 scenarios with their bounds and sources.
 * @evidence contracts/development/implementation.md#principled-implementation Real handgun and table archetypes, the chain's own draw and presentation, and the displayed pistol's muzzle and grip read against the hand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One stage per carriage, one reading per scenario, gathered as complaints and asserted once.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A carriage that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two short performances, a few readings each.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the readings exist once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionFirearmReady(name: motionHumanBody.Name): void {
  const body: IHumanBody = motionHumanBody(name);
  const complaints: string[] = [];
  const pistol: ReturnType<typeof createHandgun> = createHandgun({
    frame: "fullSize",
  });
  const muzzle: IAutoMovieTransform = pistol.affordance("muzzle").frame;
  const bore: IAutoMovieVector3 = Quaternion.rotateVector(muzzle.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const grip: IAutoMovieVector3 = pistol.affordance("grip").frame.translation;
  // The bore's turn a 10 mm miss at the muzzle makes, degrees.
  const slack: number =
    (Math.asin(
      0.01 / Vector3.length(Vector3.subtract(muzzle.translation, grip)),
    ) *
      180) /
    Math.PI;
  const laws: IHumanActionLaw<never>[] = [
    ...Object.values(HumanFirearm),
    HumanWeaponFirearm.draw,
    HumanWeaponFirearm.present,
  ] as IHumanActionLaw<never>[];
  const regions: Record<"highReady" | "lowReady", readonly [number, number]> = {
    highReady: [45, 75],
    lowReady: [-45, -30],
  };

  for (const carriage of ["highReady", "lowReady"] as const) {
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "ready",
        laws,
        props: [
          HumanObject.prop("bar", createTable({ kind: "counter" }), {
            at: { x: 0, y: 0, z: 0.53 },
            yaw: 180,
          }),
          HumanObject.prop("pistol", pistol, {
            at: { x: -0.18, y: 0.914, z: 0.3 },
            yaw: 0,
          }),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .registered("drawFirearm", { prop: "pistol" })
          .registered("presentFirearm", {
            gun: "pistol",
            carriage,
            target: {
              kind: "point",
              at: { x: 0, y: 0.72 * body.measure.stature, z: 6 },
              frame: "world",
            },
          }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${carriage}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const named = (row: string): HumanSegment.ISegment =>
      film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
    const present: HumanSegment.ISegment = named("presentFirearm");
    const stroke: number =
      present.start +
      (present.plan.events.find((e): boolean => e.name === "stroke")?.share ??
        Number.NaN) *
        present.plan.duration;

    // 2. The bore inside the region.
    const [least, most]: readonly [number, number] = regions[carriage];
    for (let i: number = 0; i <= 4; i++) {
      const t: number = stroke + ((present.end - 0.01 - stroke) * i) / 4;
      const line: IAutoMovieVector3 = Quaternion.rotateVector(
        film.prop("pistol", t).rotation,
        bore,
      );
      const elevation: number =
        (Math.asin(Math.max(-1, Math.min(1, line.y))) * 180) / Math.PI;
      if (!(elevation >= least - slack && elevation <= most + slack))
        complaints.push(
          `${name}: ${carriage}: the bore is ${elevation.toFixed(1)} degrees above level at ${t.toFixed(2)} s, ${least} to ${most} give or take ${slack.toFixed(1)} expected`,
        );
    }

    // 3. The pistol stays in the hand.
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
    const draw: HumanSegment.ISegment = named("drawFirearm");
    const closed: number =
      draw.start +
      (draw.plan.events.find((e): boolean => e.name === "gripClosed")?.share ??
        Number.NaN) *
        draw.plan.duration +
      0.02;
    let drift: number = 0;
    for (let t: number = closed; t <= present.end; t += 0.1)
      drift = Math.max(
        drift,
        Vector3.length(Vector3.subtract(held(t), held(closed))),
      );
    if (!(drift <= 0.001))
      complaints.push(
        `${name}: ${carriage}: the pistol's grip moves ${(drift * 1000).toFixed(2)} mm in the hand's frame, 1 mm at most expected`,
      );
  }
  TestValidator.equals(
    `a pistol is presented at the ready positions (${name})`,
    complaints,
    [],
  );
}
