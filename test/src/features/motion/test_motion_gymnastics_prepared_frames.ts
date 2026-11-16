import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  physicalShapeBounds,
  resolveAutoMovieCenterOfMass,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  GymnasticsMat,
  GymnasticsWheel,
  HumanChain,
  HumanColliders,
  HumanGymnastics,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanContactWindow,
  type IHumanPosture,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Gymnastic COM placement and floor contact stay physical when fixed flight
 * shapes and changing mat postures share prepared geometry.
 *
 * Scenarios:
 * 1. A canonical average man's front handspring is performed at yaw zero
 *    and at yaw37 after a (1,0,-2) metre move. Three interior flight centres
 *    obey the drag-free second difference and the independent rigid move.
 * 2. Average-man and small-woman touchdown postures settle onto a 0.45 metre
 *    mat. At start, one-third, half, completion and hold, the actual lowest
 *    collider remains on that authored height, and horizontal COM follows
 *    the unit-entry-velocity quintic's exact rational values.
 * 3. Mat queries arrive out of order. Mutating an earlier root and clinical
 *    head demand cannot change a later query or overwrite that earlier result.
 * 4. A five-row wheel joins each bone's contiguous support and preserves
 *    its literal first/last row times, including singleton and empty tables.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States canonical Human provenance, metre/degree frames, physical targets, rational time coefficients, result ownership and the four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises actual public handspring performance and GymnasticsMat.lie consumers, reading their canonical displayed geometry through full ordinary FK and independent mass/floor reductions; public wheel contact conversion is checked against hand-written run endpoints.
 * @evidence contracts/development/testing.md#independent-expectations Gravity fixes the flight second difference; a literal Y37 matrix plus authored translation fixes placement covariance within 1e-6 metres. The unit-initial-slope quintic with zero endpoint value/acceleration has coefficients 16/81 and 5/32 at thirds/halves. The authored mat height fixes the actual full-bound minimum. COM/floor arithmetic uses 1e-7 metres, with four such errors propagated through second differences. Canonical resolver, profile placement and the complete bounds geometry remain shared oracle owners, so this does not independently certify all of their internal geometry; full min/max bounds independently observe the new min-Y-only path.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rotated/translated fixed flight, two Human proportions, changing joint/trunk mat geometry, positive/negative horizontal rates, start/interior/end/hold and repeated-time result mutation, plus continued/reopened/singleton/empty support runs. Existing action tests retain ROM, hand slip, takeoff continuity and whole-body physical admission coverage.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit borrows unchanged canonical Human fixtures and owns all source/query/result records. It uses existing public package exports, starts no host or process, replaces no method/global, and adds no test-only product export.
 */
export function test_motion_gymnastics_prepared_frames(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const model: resolveAutoMovieCenterOfMass.IModel = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const build: (yaw: number, at: IAutoMovieVector3) => HumanPerformance =
    (yaw: number, at: IAutoMovieVector3): HumanPerformance => new HumanPerformance({
      seed: "gymnastics-prepared-frames",
      laws: [HumanGymnastics.frontHandspring],
      performers: [{ subject: "a", body, at, yaw, proficiency: { level: "trained" } }],
      composition: HumanChain.subject("a").stand({ seconds: 0.3 }).registered("frontHandspring").node,
    });
  const ordinary: HumanPerformance = build(0, { x: 0, y: 0, z: 0 });
  const moved: HumanPerformance = build(37, { x: 1, y: 0, z: -2 });
  const original: HumanSegment.ISegment = ordinary.segments("a")[1]!;
  const placed: HumanSegment.ISegment = moved.segments("a")[1]!;
  const release: number = event(original, "release");
  const touchdown: number = event(original, "touchdown");
  const delta: number = (touchdown - release) / 4;
  TestValidator.predicate("handspring declares an actual positive flight", delta > 0 && Number.isFinite(delta));
  TestValidator.predicate("rigid placement preserves flight timing",
    nclose(event(placed, "release") - placed.start, release - original.start, 1e-9) &&
    nclose(event(placed, "touchdown") - placed.start, touchdown - original.start, 1e-9),
  );
  const centres: IAutoMovieVector3[] = [];
  for (const share of [1 / 4, 1 / 2, 3 / 4]) {
    const seconds: number = release + (touchdown - release) * share;
    const current: IReading = reading(body, model, ordinary.pose("a", seconds));
    const movedSecond: number = event(placed, "release") +
      (event(placed, "touchdown") - event(placed, "release")) * share;
    const shifted: IReading = reading(body, model, moved.pose("a", movedSecond));
    const radians: number = 37 * Math.PI / 180;
    TestValidator.predicate("fixed flight COM follows the authored rigid placement",
      vclose(shifted.centre, {
        x: 1 + current.centre.x * Math.cos(radians) + current.centre.z * Math.sin(radians),
        y: current.centre.y,
        z: -2 - current.centre.x * Math.sin(radians) + current.centre.z * Math.cos(radians),
      }, 1e-6),
    );
    centres.push(current.centre);
  }
  const first: IAutoMovieVector3 = centres[0]!;
  const middle: IAutoMovieVector3 = centres[1]!;
  const last: IAutoMovieVector3 = centres[2]!;
  TestValidator.predicate("fixed articulated flight keeps drag-free COM acceleration",
    nclose(first.x - 2 * middle.x + last.x, 0, 4e-7) &&
    nclose(first.y - 2 * middle.y + last.y, -9.81 * delta * delta, 4e-7) &&
    nclose(first.z - 2 * middle.z + last.z, 0, 4e-7),
  );

  for (const name of ["m-average", "f-small"] as const) mat(name);
  contacts();
}

/** Observe complete ordinary FK, then independent full-profile mass and exact collider bounds. */
function reading(body: IHumanBody, model: resolveAutoMovieCenterOfMass.IModel, pose: IAutoMoviePose): IReading {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolvePose(pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME))
    bones.set(bone.bone, bone);
  let lowest: number = Infinity;
  for (const segment of HumanColliders.placed(body, bones))
    for (const shape of segment.shapes)
      lowest = Math.min(lowest, physicalShapeBounds(segment.pose, shape).min.y);
  return { centre: resolveAutoMovieCenterOfMass.place(model, bones), lowest };
}

/** The declared event fixes the actual film clock; missing declarations fail rather than defaulting. */
function event(segment: HumanSegment.ISegment, name: string): number {
  const share: number | undefined = segment.plan.events.find(
    (value: HumanSegment.ISegment["plan"]["events"][number]): boolean => value.name === name,
  )?.share;
  if (share === undefined) throw new Error(`Missing handspring event ${name}`);
  return segment.start + share * segment.plan.duration;
}

/** Pin changing mat articulation to the authored floor and independent rational COM displacement. */
function mat(name: motionHumanBody.Name): void {
  const body: IHumanBody = motionHumanBody(name);
  const model: resolveAutoMovieCenterOfMass.IModel = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const height: number = 0.45;
  const from: IHumanPosture = {
    root: { x: 1.2, y: 0, z: -0.7 }, yaw: 17, pitch: -60, roll: 0,
    joints: {
      head: [5, 0, 0], leftUpperArm: [70, 10, 0], rightUpperArm: [55, 10, 0],
      leftUpperLeg: [25, 0, 0], rightUpperLeg: [15, 0, 0],
      leftLowerLeg: [30, 0, 0], rightLowerLeg: [20, 0, 0],
    },
    limbs: {},
  };
  from.root.y = height - reading(body, model, resolveHumanPosture(body, from)).lowest;
  const start: IReading = reading(body, model, resolveHumanPosture(body, from));
  const velocity: IAutoMovieVector3 = { x: 0.6, y: -1.2, z: -0.4 };
  const lie: ReturnType<typeof GymnasticsMat.lie> = GymnasticsMat.lie({
    body, model: body.massModel, from, velocity, height,
  });
  const duration: number = GymnasticsMat.SETTLE;
  const samples: readonly { seconds: number; carry: number }[] = [
    { seconds: 0, carry: 0 },
    { seconds: duration / 2, carry: 5 * duration / 32 },
    { seconds: duration, carry: 0 },
    { seconds: duration + GymnasticsMat.HOLD, carry: 0 },
    { seconds: duration / 3, carry: 16 * duration / 81 },
    { seconds: 0, carry: 0 },
  ];
  let earlier: IHumanPosture | undefined;
  for (const sample of samples) {
    const raw: IHumanPosture = lie(sample.seconds);
    const actual: IReading = reading(body, model, resolveHumanPosture(body, raw));
    TestValidator.predicate(`${name} changing mat shape keeps its actual lowest collider on the authored height`,
      nclose(actual.lowest, height, 1e-7),
    );
    TestValidator.predicate(`${name} actual horizontal COM follows the unit-entry-velocity quintic`,
      nclose(actual.centre.x, start.centre.x + velocity.x * sample.carry, 1e-7) &&
      nclose(actual.centre.z, start.centre.z + velocity.z * sample.carry, 1e-7),
    );
    if (earlier !== undefined)
      TestValidator.predicate("later mat queries neither share nor overwrite earlier caller records",
        raw !== earlier && raw.root !== earlier.root && raw.joints !== earlier.joints &&
        earlier.root.x === 123 && earlier.joints.head![0] === 999,
      );
    raw.root.x = 123;
    raw.joints.head = [999, 0, 0];
    earlier = raw;
  }
}

/** Literal geometric support runs fix contact endpoints independently of time-conversion strategy. */
function contacts(): void {
  const ground: IHumanContactWindow.Support = { kind: "ground" };
  const spokes: GymnasticsWheel.ISpoke[] = [
    { bones: ["leftFoot", "rightFoot"], height: 0, support: ground },
    { bones: ["leftFoot"], height: 0, support: ground },
    { bones: ["leftHand", "rightHand"], height: 0, support: ground },
    { bones: ["rightFoot"], height: 0, support: ground },
  ];
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rows: GymnasticsWheel.IRow[] = [
    { angle: 0, root: origin, bears: 0 }, { angle: 90, root: origin, bears: 1 },
    { angle: 180, root: origin, bears: 2 }, { angle: 270, root: origin, bears: 3 },
    { angle: 360, root: origin, bears: 0 },
  ];
  const wheel: GymnasticsWheel.IWheel = { rows, root: (): IAutoMovieVector3 => ({ ...origin }) };
  const actual: IHumanContactWindow[] = GymnasticsWheel.contacts(wheel, spokes, (angle: number): number => angle / 360);
  const expected: readonly [IHumanContactWindow["part"], number, number][] = [
    ["leftFoot", 0, 1 / 4], ["rightFoot", 0, 0], ["leftHand", 1 / 2, 1 / 2],
    ["rightHand", 1 / 2, 1 / 2], ["rightFoot", 3 / 4, 1], ["leftFoot", 1, 1],
  ];
  TestValidator.equals("all contiguous wheel support runs remain present", actual.length, expected.length);
  for (let index: number = 0; index < expected.length; index++) {
    const window: IHumanContactWindow = actual[index]!;
    const target: readonly [IHumanContactWindow["part"], number, number] = expected[index]!;
    TestValidator.predicate("wheel contact starts and ends at its literal bearing rows",
      window.part === target[0] && window.kind === "plant" && window.support.kind === "ground" &&
      nclose(window.from, target[1], 0) && nclose(window.to, target[2], 0),
    );
  }
  TestValidator.equals("an empty wheel emits no contact",
    GymnasticsWheel.contacts({ ...wheel, rows: [] }, spokes, (angle: number): number => angle / 360).length, 0,
  );
  const singleton: IHumanContactWindow[] = GymnasticsWheel.contacts(
    { ...wheel, rows: [rows[2]!] }, spokes, (angle: number): number => angle / 360,
  );
  TestValidator.predicate("a singleton hand support retains both zero-length contacts",
    singleton.length === 2 && singleton.every((window: IHumanContactWindow): boolean =>
      window.part.endsWith("Hand") && nclose(window.from, 1 / 2, 0) && nclose(window.to, 1 / 2, 0)),
  );
}

/** Full-profile observations of the displayed canonical pose, both in world metres. */
interface IReading {
  /** Actual mass-weighted world centre. */
  centre: IAutoMovieVector3;

  /** Actual minimum world collider Y. */
  lowest: number;
}
