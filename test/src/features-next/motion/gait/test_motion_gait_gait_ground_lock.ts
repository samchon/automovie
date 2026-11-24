import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanMilitaryDrill,
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanPerformance,
  HumanSignature,
  HumanVerdicts,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanFoot,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A planted sole stays in the ground frame and lifts during swing.
 *
 * Scenarios:
 * 1. Read one gait cycle of a straight walk.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A planted sole stays in the ground frame and lifts during swing.
 * @evidence contracts/development/testing.md#independent-expectations A ground contact has zero world drift; the five-millimetre bound permits the rig fit.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples on opposite sides of the event distinguish bearing from swing.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_gait_gait_ground_lock(): void {
  const body = motionHumanBody("m-average");
  checkLegClearance(body);
  const film = new HumanPerformance({
    seed: "recompose-travel",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 6 } })
      .node,
  });
  const segment = film.segments("a")[0]!;
  const event = (name: string): number => {
    const item = segment.plan.events.find((value) => value.name === name);
    if (item === undefined) throw new Error("missing gait event " + name);
    return segment.start + item.share * segment.plan.duration;
  };
  const toe = event("leftToeOff1"),
    heel = event("leftHeelStrike1"),
    next = event("leftToeOff2");
  const reader = HumanSignature.of(film, "a", body, 0);
  const sockets = (t: number) =>
    HumanFoot.sockets(body, film.bones("a", t), "left").map((s) => s.point);
  const supported = (heel + next) / 2;
  TestValidator.predicate(
    "planted socket stays over ground",
    HumanSignature.bears(reader, supported, "left", 0, 0),
  );
  const before = sockets(supported - 1 / 240),
    after = sockets(supported + 1 / 240);
  const slip = Math.min(
    ...before.map((p, i) => Math.hypot(p.x - after[i]!.x, p.z - after[i]!.z)),
  );
  TestValidator.predicate("stationary sole in stance", slip <= 0.005);
  TestValidator.predicate(
    "free sole clears during swing",
    !HumanSignature.bears(reader, (toe + heel) / 2, "left", 0, 0),
  );
  for (const squat of [true, false]) {
    const chain = HumanChain.subject("a");
    const work = new HumanPerformance({
      seed: "crouch-entry",
      performers: [...film.performers],
      laws: [
        AutoMovieMotionHumanWorkout.HumanSportGym.calfRaise,
        AutoMovieMotionHumanMilitaryDrill.HumanDrill.squats,
        AutoMovieMotionHumanFall.HumanFloorFall.goalkeeperDiveLeft,
      ],
      composition: (squat
        ? chain
            .registered("calfRaise", { count: 1 })
            .registered("squats", { count: 1 })
        : chain.stand({ hold: 0.3 }).registered("goalkeeperDiveLeft", {})
      ).node,
    });
    const phase = work.segments("a")[1]!;
    const instant =
      phase.start +
      phase.plan.events.find((e) => e.name === (squat ? "bottom1" : "takeOff"))!
        .share *
        phase.plan.duration;
    const entry = work.bones("a", phase.entryTime);
    for (const side of ["left", "right"] as const) {
      const angle = (t: number): number => {
        const display = work.bones("a", t),
          knee = display.get(`${side}LowerLeg`)!.worldPosition;
        const thigh = Vector3.subtract(
            display.get(`${side}UpperLeg`)!.worldPosition,
            knee,
          ),
          lower = Vector3.subtract(
            display.get(`${side}Foot`)!.worldPosition,
            knee,
          );
        return (
          180 -
          (Math.acos(
            Math.max(
              -1,
              Math.min(
                1,
                Vector3.dot(thigh, lower) /
                  (Vector3.length(thigh) * Vector3.length(lower)),
              ),
            ),
          ) *
            180) /
            Math.PI
        );
      };
      TestValidator.predicate(
        "crouch recruits both knees",
        squat
          ? angle(instant) >= 90
          : angle(instant) - angle(phase.entryTime) >= 20,
      );
      if (squat) {
        const fixed = entry.get(`${side}Toes`)!.worldPosition;
        for (let t = phase.entryTime; t <= phase.end; t += 1 / 24)
          TestValidator.predicate(
            "planted squat foot stays within five millimetres",
            Vector3.length(
              Vector3.subtract(
                work.bones("a", t).get(`${side}Toes`)!.worldPosition,
                fixed,
              ),
            ) <= 0.005,
          );
      }
    }
    const violations = HumanVerdicts.of(work, 24, {
      from: phase.entryTime,
      to: squat ? phase.end : instant + 0.1,
    }).findings.filter(
      (f) => f.check === "floor" || (!squat && f.check === "jump"),
    );
    TestValidator.equals(
      "entry and takeoff retain physical clearance",
      violations,
      [],
    );
  }
}

function checkLegClearance(body: IAutoMovieMotionHumanBody): void {
  const quiet: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const right: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, quiet),
  ).get("rightFoot")!.worldPosition;
  const legs = (posture: IAutoMovieMotionHumanPosture) => {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const leg = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanWalkLegClearance.ILeg => ({
      side,
      hip: bones.get(`${side}UpperLeg`)!.worldPosition,
      knee: bones.get(`${side}LowerLeg`)!.worldPosition,
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      thigh: bones.get(`${side}UpperLeg`)!.worldRotation,
      shank: bones.get(`${side}LowerLeg`)!.worldRotation,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
    });
    let audited: number = 0;
    for (const pair of AutoMovieMotionHumanAuditTangle.pose(body, bones))
      if (
        LEG.test(pair.a) &&
        LEG.test(pair.b) &&
        pair.a.slice(0, 4) !== pair.b.slice(0, 4)
      )
        audited = Math.max(audited, pair.depth);
    return { left: leg("left"), right: leg("right"), audited };
  };
  const prepared: ReturnType<
    typeof AutoMovieMotionHumanGait.walkLegClearance.prepare
  > = AutoMovieMotionHumanGait.walkLegClearance.prepare(body);
  const quietLegs = legs(quiet);
  TestValidator.equals(
    "the quiet stance reads none",
    AutoMovieMotionHumanGait.walkLegClearance.excess(
      prepared,
      quietLegs.left,
      quietLegs.right,
    ),
    0,
  );
  let binding: number = 0;
  for (const ahead of [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]) {
    const ankle: IAutoMovieVector3 = {
      x: right.x - 0.12,
      y: right.y,
      z: right.z + ahead,
    };
    const crossed: IAutoMovieMotionHumanPosture = {
      ...quiet,
      limbs: {
        ...quiet.limbs,
        leftLeg: {
          ...quiet.limbs.leftLeg!,
          point: ankle,
          bend: Vector3.add(ankle, { x: 0, y: 0.5, z: 1 }),
        },
      },
    };
    const read = legs(crossed);
    const excess: number = AutoMovieMotionHumanGait.walkLegClearance.excess(
      prepared,
      read.left,
      read.right,
    );
    TestValidator.predicate(
      `the clearance is the audit's reading ${ahead} m ahead`,
      Math.abs(excess - read.audited) <= 1e-9,
    );
    if (excess > 0) binding++;
  }
  TestValidator.predicate("some crossings pass into each other", binding > 0);
}

/** A leg's bones. */
const LEG: RegExp = /(UpperLeg|LowerLeg|Foot|Toes)$/u;
