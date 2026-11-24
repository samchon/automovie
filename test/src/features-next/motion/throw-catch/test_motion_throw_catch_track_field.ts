import {
  createHighJump,
  createLandingMat,
  createPlyoBox,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanSport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Show a block exit, the named launch leg and crossbar plane of a high
 * jump, and a handspring vault landing on an authored raised mat.
 *
 * Scenarios:
 * 1. The sprint hands come off at the gun. The right-foot block leaves
 *    before the left one. The displayed hips and rear ankle rise.
 * 2. Each high-jump support choice holds that foot to takeoff. The
 *    displayed centre crosses the bar's world plane within 10 mm and
 *    peaks at its axis plus the optional reserve.
 * 3. A 50 mm mat rise changes both ankles' touchdown height by 50 mm
 *    within 10 mm, and both feet subsequently bear on the mat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged actions, contact order and metre-valued checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plans through the public lexicon and measures resolved skeletons alongside declared bearing windows.
 * @evidence contracts/development/testing.md#independent-expectations Authored drive time, legal order of block releases, bar axis and reserve, and mat height provide the expected relationships.
 * @evidence contracts/development/testing.md#distinguishing-cases Alternates the chosen high-jump support, adds a reserve on the same bar and compares the same vault on flat and raised landing surfaces.
 * @evidence contracts/development/testing.md#execution-ownership Uses the shared Human fixture without a render or external process.
 */
export function test_motion_throw_catch_track_field(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const athlete = {
    subject: "a",
    body,
    at: origin,
    yaw: 0,
    proficiency: { level: "trained" as const },
  };
  const driveSeconds: number = 0.3;
  const sprint: HumanPerformance = new HumanPerformance({
    seed: "exercise-track",
    laws: [HumanSport.sprintStart],
    performers: [athlete],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .registered("sprintStart", {
        hold: 0.4,
        drive: driveSeconds,
        front: "left",
      }).node,
  });
  const start: IAutoMovieMotionHumanSegment = sprint.segments("a")[1]!;
  const set: number = when(start, "set");
  const gun: number = when(start, "gun");
  const rear: number = when(start, "rearBlockOff");
  const exit: number = when(start, "blockExit");
  TestValidator.predicate(
    "the authored block drive runs beyond the held set",
    set < gun &&
      gun < rear &&
      rear < exit &&
      Math.abs(exit - gun - driveSeconds) <= 1e-6,
  );
  for (const [part, expected] of [
    ["leftHand", gun],
    ["rightHand", gun],
    ["rightFoot", rear],
    ["leftFoot", exit],
  ] as const) {
    const bearing: IAutoMovieMotionHumanContactWindow = contact(start, part);
    TestValidator.predicate(
      part + " persists to its own block-drive release",
      Math.abs(start.start + bearing.to * start.plan.duration - expected) <=
        1e-6,
    );
  }
  const hipsInSet: IAutoMovieVector3 = joint(sprint, gun, "hips");
  const hipsAtExit: IAutoMovieVector3 = joint(sprint, exit - 1e-4, "hips");
  TestValidator.predicate(
    "the short launch carries the hips forwards and upwards",
    hipsAtExit.z - hipsInSet.z > 0.05 && hipsAtExit.y - hipsInSet.y > 0.02,
  );
  TestValidator.predicate(
    "the front ankle stays on its block while the rear ankle rises",
    Vector3.distance(
      joint(sprint, gun, "leftFoot"),
      joint(sprint, exit - 1e-4, "leftFoot"),
    ) <= 0.01 &&
      joint(sprint, exit - 1e-4, "rightFoot").y -
        joint(sprint, rear, "rightFoot").y >=
        0.04,
  );

  const crossbar = createHighJump({
    kind: "highJump",
    height: 1.415,
    diameter: 0.03,
  });
  const barZ: number = 1.25;
  const matHeight: number = 0.762;
  for (const [side, reserve] of [
    ["left", undefined],
    ["right", undefined],
    ["left", 0.25],
  ] as const) {
    const barYaw: number = side === "left" ? 0 : 30;
    const jump: HumanPerformance = new HumanPerformance({
      seed: "exercise-field",
      laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.fosburyFlop],
      performers: [athlete],
      props: [
        HumanObject.prop("bar", crossbar, {
          at: { x: 0, y: 0, z: barZ },
          yaw: barYaw,
        }),
        HumanObject.prop("mat", createPlyoBox({ height: matHeight }), {
          at: { x: 0, y: 0, z: 2.5 },
          yaw: 0,
        }),
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3, sway: 0 })
        .registered("fosburyFlop", {
          bar: "bar",
          on: "mat",
          to: { x: 0, y: matHeight, z: 2.5 },
          takeoffFoot: side,
          ...(reserve === undefined ? {} : { apexReserve: reserve }),
        }).node,
    });
    const leap: IAutoMovieMotionHumanSegment = jump.segments("a")[1]!;
    const takeoff: number = when(leap, "takeoff");
    const apex: number = when(leap, "apex");
    const crossing: number = when(leap, "barCrossing");
    const touchdown: number = when(leap, "touchdown");
    const support: IAutoMovieMotionHumanContactWindow = contact(
      leap,
      (side + "Foot") as "leftFoot" | "rightFoot",
    );
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      jump,
      "a",
      body,
      0,
    );
    const centre: IAutoMovieVector3 = HumanSignature.centre(reader, crossing);
    const angle: number = (barYaw * Math.PI) / 180;
    const planeDistance: number =
      centre.x * Math.sin(angle) + (centre.z - barZ) * Math.cos(angle);
    TestValidator.predicate(
      side + " leg remains the takeoff support",
      Math.abs(leap.start + support.to * leap.plan.duration - takeoff) <= 1e-6,
    );
    TestValidator.predicate(
      side + " takeoff crosses the actual bar plane in flight",
      takeoff < crossing &&
        crossing < touchdown &&
        Math.abs(planeDistance) <= 0.01,
    );
    TestValidator.predicate(
      side +
        " takeoff peaks at the crossbar axis plus reserve " +
        (reserve ?? 0),
      Math.abs(
        HumanSignature.centre(reader, apex).y -
          (crossbar.affordance("bar").frame.translation.y + (reserve ?? 0)),
      ) <= 0.01,
    );
  }

  const gymnast: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  const pad = createLandingMat({ kind: "highJump" });
  const box = createPlyoBox({
    kind: "wood",
    height: 0.762,
    width: 0.762,
    depth: 0.762,
  });
  // At this entry the hands reach x = -1.27 m. Give them 30 mm of
  // platform behind that mark, keeping the box face ahead of the gymnast.
  const boxAt: IAutoMovieVector3 = {
    x: -1.27 - 0.03 + box.affordance("surface").depth! / 2,
    y: 0,
    z: 1,
  };
  /** Vault from the marked box, optionally adding the landing mat. */
  const vault = (mat?: IAutoMovieVector3): HumanPerformance =>
    new HumanPerformance({
      seed: "exercise-vault",
      laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.handspringVault],
      performers: [
        { ...athlete, body: gymnast, at: { x: -1.5, y: 0, z: 1 }, yaw: 90 },
      ],
      props: [
        HumanObject.prop("box", box, { at: boxAt, yaw: 90 }),
        ...(mat === undefined
          ? []
          : [HumanObject.prop("pad", pad, { at: mat, yaw: 0 })]),
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.5, sway: 0 })
        .registered("handspringVault", {
          on: "box",
          ...(mat === undefined ? {} : { landOn: "pad" }),
        }).node,
    });
  const floor: HumanPerformance = vault();
  const floorLanding: number = when(floor.segments("a")[1]!, "touchdown");
  const mid: IAutoMovieVector3 = Vector3.lerp(
    joint(floor, floorLanding + 1e-4, "leftFoot"),
    joint(floor, floorLanding + 1e-4, "rightFoot"),
    0.5,
  );
  const lift: number = 0.05;
  const matOrigin: IAutoMovieVector3 = Vector3.subtract(
    { ...mid, y: lift },
    pad.affordance("surface").frame.translation,
  );
  const matted: HumanPerformance = vault(matOrigin);
  const action: IAutoMovieMotionHumanSegment = matted.segments("a")[1]!;
  const matLanding: number = when(action, "touchdown");
  TestValidator.predicate(
    "table support comes before the separate flight to the mat",
    when(action, "handsDown") < when(action, "release") &&
      when(action, "release") < matLanding,
  );
  for (const foot of ["leftFoot", "rightFoot"] as const) {
    const bearing: IAutoMovieMotionHumanContactWindow = contact(
      action,
      foot,
      "prop",
    );
    const rise: number =
      joint(matted, matLanding + 1e-4, foot).y -
      joint(floor, floorLanding + 1e-4, foot).y;
    TestValidator.predicate(
      foot + " lands at the named mat height and retains that support",
      bearing.support?.kind === "prop" &&
        bearing.support.subject === "pad" &&
        Math.abs(rise - lift) <= 0.01,
    );
  }
}

/** The absolute film second of a required event. */
function when(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event = segment.plan.events.find(
    (candidate): boolean => candidate.name === name,
  );
  if (event === undefined)
    throw new Error(segment.name + " has no " + name + " event");
  return segment.start + event.share * segment.plan.duration;
}

/** A required contact window for the indicated part and optional support kind. */
function contact(
  segment: IAutoMovieMotionHumanSegment,
  part: IAutoMovieMotionHumanContactWindow["part"],
  kind?: string,
): IAutoMovieMotionHumanContactWindow {
  const found: IAutoMovieMotionHumanContactWindow | undefined =
    segment.plan.contacts.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === part &&
        (kind === undefined || window.support?.kind === kind),
    );
  if (found === undefined)
    throw new Error(segment.name + " has no contact for " + part);
  return found;
}

/** One actual resolved joint position at the requested film second. */
function joint(
  film: HumanPerformance,
  time: number,
  bone: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  return film.bones("a", time).get(bone)!.worldPosition;
}
