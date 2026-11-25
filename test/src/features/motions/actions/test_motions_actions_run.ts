import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import {
  resolveHumanPosture,
  run,
  stand,
  walkSteps,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";
import { vclose } from "../../internal/vclose";

/**
 * Carry the outgoing run's unplanted feet and scheduled next strike across a
 * legal double-flight cut.
 *
 * Scenarios:
 *
 * 1. A jog or sprint cut at 0.6 s preserves the next right-foot plant at 0.74 s
 *    when the successor changes its cadence or becomes a walk.
 * 2. Both displayed ankles enter in swing and arbitrary seeks keep the same next
 *    contact regardless of requested order.
 */
export async function test_motions_actions_run_flight_cut(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const origin = { x: 0, y: 0, z: 0 };
  const posture = stand.posture(body, origin, 0);
  const makeFoot = (
    x: number,
    z: number,
  ): IAutoMovieMotionHumanEntryState.IFoot => ({
    ankle: { x, y: body.measure.ankleHeight + 0.1, z },
    rotation: Quaternion.identity(),
    planted: false,
    velocity: { x: 0, y: 0, z: 1 },
    acceleration: origin,
    spin: origin,
  });
  const plan = syntheticHumanPlan({
    duration: 1,
    posture: {
      ...posture,
      limbs: {
        ...posture.limbs,
        rightLeg: {
          ...posture.limbs.rightLeg!,
          point: { x: -0.11, y: body.measure.ankleHeight + 0.027, z: 0.46 },
          rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 20),
        },
      },
    },
    contacts: [
      {
        kind: "plant",
        part: "leftFoot",
        support: { kind: "ground" },
        from: 0.34,
        to: 0.58,
      },
      {
        kind: "plant",
        part: "rightFoot",
        support: { kind: "ground" },
        from: 0.74,
        to: 0.92,
      },
    ],
  });
  const entry: IAutoMovieMotionHumanEntryState = {
    seconds: 0.6,
    pose: resolveHumanPosture(body, posture),
    velocity: {
      linear: { x: 0, y: 0.3, z: 2 },
      angular: origin,
      joints: new Map(),
      spins: new Map(),
    },
    acceleration: origin,
    posture,
    feet: { left: makeFoot(0.1, -0.16), right: makeFoot(-0.1, 0.12) },
    supports: [],
    holds: {},
    uses: {},
    base: { kind: "standing" },
    from: {
      name: "run",
      family: "run",
      params: { pace: "sprint" },
      plan,
      start: 0,
      share: 0.6,
    },
  };
  for (const swing of [0.8, 1.2, 1.5]) {
    const stepped: IAutoMovieMotionHumanWalkSteps.IPlan = walkSteps.plan({
      body,
      entry,
      to: { x: 0, y: 0, z: 5 },
      speed: 2,
      longest: 0.8,
      period: (): number => 0.35,
      swing,
    });
    const first = stepped.stances.reduce(
      (a, b): IAutoMovieMotionHumanWalkSteps.IStance =>
        a.from <= b.from ? a : b,
    );
    TestValidator.predicate(
      "the inherited flight ends at the outgoing next right-foot strike",
      first.side === "right" && nclose(first.from, 0.14, ROUNDING),
    );
    TestValidator.predicate(
      "the strike retains the outgoing displayed first landing",
      vclose(
        stepped.foot("right", first.from).placement.ankle,
        plan.posture(0.74).limbs.rightLeg!.point,
        ROUNDING,
      ),
    );
    for (const time of [0.1, 0, 0.139, 0.02])
      TestValidator.predicate(
        "both feet remain airborne before the inherited plant",
        stepped.foot("right", time).swing?.off === 0 &&
          stepped.foot("left", time).swing?.off === 0,
      );
    TestValidator.predicate(
      "both first swings open at the displayed ankle positions",
      vclose(
        stepped.foot("right", 0).placement.ankle,
        entry.feet.right.ankle,
        ROUNDING,
      ) &&
        vclose(
          stepped.foot("left", 0).placement.ankle,
          entry.feet.left.ankle,
          ROUNDING,
        ),
    );
  }
}

/**
 * Enter a walk through the public chain while the outgoing sprint is flying.
 *
 * Scenarios:
 *
 * 1. Find a double flight in the untouched sprint's measured schedule. Cut at the
 *    middle and carry the same remaining ground-contact gap.
 * 2. Both visible ankles stay continuous through the cut in shuffled reads.
 */
export async function test_motions_actions_run_flight_cut_playback(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const input: Omit<IAutoMovieMotionHumanPerformance.IInput, "composition"> = {
    seed: "flight-cut",
    props: [],
    performers: [
      {
        subject: "runner",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
  };
  const sprint = HumanChain.subject("runner").run({
    to: { x: 0, y: 0, z: 7 },
    pace: "sprint",
  });
  const uninterrupted: HumanPerformance = new HumanPerformance({
    ...input,
    composition: sprint.node,
  });
  const full: IAutoMovieMotionHumanSegment =
    uninterrupted.segments("runner")[0]!;
  let before: number = 0;
  let next: IAutoMovieMotionHumanContactWindow | undefined;
  for (const window of [...full.plan.contacts].sort(
    (
      a: IAutoMovieMotionHumanContactWindow,
      b: IAutoMovieMotionHumanContactWindow,
    ): number => a.from - b.from,
  )) {
    if (window.from > before + 0.005 && before > 0) {
      next = window;
      break;
    }
    before = Math.max(before, window.to);
  }
  TestValidator.predicate(
    "the sprint has a double-flight gap",
    next !== undefined,
  );
  const share: number = (before + next!.from) / 2;
  const performance: HumanPerformance = new HumanPerformance({
    ...input,
    composition: sprint.until({ share }).walk({ to: { x: 0, y: 0, z: 8 } })
      .node,
  });
  const incoming: IAutoMovieMotionHumanSegment =
    performance.segments("runner")[1]!;
  const toPlant: IAutoMovieMotionHumanContactWindow =
    incoming.plan.contacts.reduce(
      (
        a: IAutoMovieMotionHumanContactWindow,
        b: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => (a.from <= b.from ? a : b),
    );
  TestValidator.predicate(
    "the public chain hands flight to the same next ground contact",
    next!.part === toPlant.part &&
      nclose(
        toPlant.from * incoming.plan.duration,
        (next!.from - share) * full.plan.duration,
        1e-10,
      ) &&
      !incoming.context.entry.feet.left.planted &&
      !incoming.context.entry.feet.right.planted,
  );
  const ankle = (
    side: AutoMovieHumanoidBone,
    time: number,
  ): IAutoMovieVector3 =>
    performance.bones("runner", incoming.entryTime + time).get(side)!
      .worldPosition;
  const delta: number = 0.00001;
  for (const side of ["leftFoot", "rightFoot"] as const) {
    const after: IAutoMovieVector3 = ankle(side, delta);
    const before: IAutoMovieVector3 = ankle(side, -delta);
    TestValidator.predicate(
      "the displayed ankle joins through the flight",
      Vector3.distance(before, after) < 0.002,
    );
    TestValidator.predicate(
      "shuffled playback retains the same ankle",
      vclose(ankle(side, delta), after, 1e-12),
    );
  }
}

/** Rounding of one square root, m/s. */
const ROUNDING: number = 1e-12;

/** The hip height, metres. */
const HIP: number = 0.9;

/**
 * `run.speed` is a pace's speed from its Froude number, `v = sqrt(Fr g l)` with
 * `l` the hip height.
 *
 * Scenarios, for a 0.9 m hip height:
 *
 * 1. The run (Fr 1.3) goes `sqrt(1.3 * 9.80665 * 0.9)`, and is the pace when none
 *    is given.
 * 2. The jog (Fr 0.6) and the sprint (Fr 5) go by their own numbers.
 */
export async function test_motions_actions_run(): Promise<void> {
  const body: run.IBody = { measure: { hipHeight: HIP } };
  const g: number = AutoMovieGravity.STANDARD;
  TestValidator.predicate(
    "the run",
    nclose(run.speed(body, "run"), Math.sqrt(1.3 * g * HIP), ROUNDING) &&
      run.speed(body) === run.speed(body, "run"),
  );
  TestValidator.predicate(
    "the jog and the sprint",
    nclose(run.speed(body, "jog"), Math.sqrt(0.6 * g * HIP), ROUNDING) &&
      nclose(run.speed(body, "sprint"), Math.sqrt(5 * g * HIP), ROUNDING),
  );
}
