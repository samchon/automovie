import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A forward single under sends the cord overhead and then from the toes to the
 * heels while both feet are in flight. Both handles stay with the hands.
 *
 * Scenarios:
 *
 * 1. After a standing cue, the average man skips once on a level floor. Read the
 *    rendered cord and handle transforms and the displayed foot and hand
 *    sockets at the overhead, front, takeoff, crossing, landing and rear
 *    instants, and where the cord reaches the sole edges.
 * 2. Read before the skip and seek backward to the crossing after reading landing.
 *    The cue has no rope frame and the crossing frame is repeatable.
 * 3. A slow turn holds overhead and passes in flight. Periods too large to
 *    represent the phase boundaries or quarter-flight samples are refused.
 *
 * Silva and Pellegrini (2009, Intervalo Temporal) measured 0.13 ± 0.02 s from
 * two-foot takeoff to the cord passing underfoot at the tested cadences. Tian
 * (2021, §2.2.2) describes one pass during flight.
 * https://periodicos.ufsc.br/index.php/rbcdh/article/download/1980-0037.2009v11n4p379/10901
 * https://www.techscience.com/mcb/v18n1/41384/html
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the action, study timing and displayed quantities that distinguish a skip.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered law through the public chain and measures the produced cord against the displayed sole outlines and the handles against displayed grip positions and axes.
 * @evidence contracts/development/testing.md#independent-expectations Uses the measured takeoff-to-pass interval and the physical cable radius and length. The sagittal circle bounds the low part of the staged turn against the observed sole envelope. The bound applies to the circular central span in this fixture.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the direction, overhead and under passes, the action seam, backwards seeks, a slow turn and two unrepresentable timing cases.
 * @evidence contracts/development/testing.md#execution-ownership Builds one portable performance for the measured turns and uses two refusals that stop before the hop plans.
 */
export function test_motion_workout_rope_skip(): void {
  const performer: IAutoMovieMotionHumanPerformer = {
    subject: "skipper",
    body: motionHumanBody("m-average"),
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const chain: ReturnType<
    typeof HumanChain.extend<{
      ropeSkip: typeof AutoMovieMotionHumanWorkout.ropeSkip;
    }>
  > = HumanChain.extend({ ropeSkip: AutoMovieMotionHumanWorkout.ropeSkip });
  for (const periodSeconds of [2 ** 54, 2 ** 50]) {
    let refusal: unknown;
    try {
      new HumanPerformance({
        seed: "unrepresentable skip",
        performers: [performer],
        laws: [AutoMovieMotionHumanWorkout.ropeSkip],
        composition: chain
          .subject(performer.subject)
          .ropeSkip({ periodSeconds }).node,
      });
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      `period ${periodSeconds} must retain ordered phase samples`,
      refusal instanceof HumanRefusal && refusal.axis === "periodSeconds",
    );
  }
  const performance: HumanPerformance = new HumanPerformance({
    seed: "single-under",
    performers: [performer],
    laws: [AutoMovieMotionHumanWorkout.ropeSkip],
    composition: chain
      .subject(performer.subject)
      .stand({ hold: 0.3 })
      .ropeSkip({}, "regular-turn")
      .ropeSkip({ periodSeconds: 8 }, "slow-turn").node,
  });
  const action: IAutoMovieMotionHumanSegment = performance
    .segments(performer.subject)
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.id === "regular-turn",
    )!;
  const period: number = 1 / 1.7;
  const length: number = 3.048;
  const radius: number = 0.001190625;
  const handleLength: number = 0.13335;
  const handleDiameter: number = 0.022225;
  const epsilon: number = 1e-6;
  const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
  const setup: Parameters<
    typeof AutoMovieMotionHumanWorkout.prepareRopeSkip
  >[0] = {
    performance,
    performer: performer.subject,
    action: action.id,
    subject: "skipping-cord",
    length,
    radius,
    handleLength,
    handleDiameter,
  };
  const sample: ReturnType<typeof AutoMovieMotionHumanWorkout.prepareRopeSkip> =
    AutoMovieMotionHumanWorkout.prepareRopeSkip(setup);
  TestValidator.predicate(
    "the cord owns only its visible action interval",
    sample(0.15) === undefined &&
      sample(action.end - 5e-13) === undefined &&
      sample(action.end) === undefined,
  );
  TestValidator.predicate(
    "one cycle after the cue at 1.7 Hz",
    nclose(action.start, 0.3) && nclose(action.end - action.start, period),
  );

  /** Convert a public action event into film time. */
  const at = (name: string): number => {
    const share: number | undefined = action.plan.events.find(
      (event): boolean => event.name === name,
    )?.share;
    if (share === undefined) throw new Error(`Missing rope skip event ${name}`);
    return action.start + share * (action.end - action.start);
  };
  const overhead: number = at("ropeOverhead");
  const takeoff: number = at("takeoff");
  const under: number = at("ropeUnder");
  const landed: number = at("landed");
  TestValidator.predicate(
    "under-foot pass is 110–150 ms after takeoff and precedes landing",
    under - takeoff >= 0.11 && under - takeoff <= 0.15 && under < landed,
  );

  /** Read the drawn cord and the body sockets at a film instant. */
  const read = (
    seconds: number,
  ): {
    points: IAutoMovieVector3[];
    sole: IAutoMovieVector3[];
    outline: IAutoMovieVector3[];
    mid: IAutoMovieVector3;
  } => {
    const frame: ReturnType<typeof sample> = sample(seconds);
    if (frame === undefined) throw new Error(`Missing rope at ${seconds} s`);
    const xyz: readonly number[] = frame.cord.surface.mesh.positions;
    TestValidator.predicate(
      "four finite cord points with the cable radius",
      xyz.length === 12 && nclose(frame.cord.cordRadius ?? Number.NaN, radius),
    );
    const points: IAutoMovieVector3[] = [0, 3, 6, 9].map(
      (i: number): IAutoMovieVector3 => ({
        x: xyz[i]!,
        y: xyz[i + 1]!,
        z: xyz[i + 2]!,
      }),
    );
    const lengthAt: number = points
      .slice(1)
      .reduce(
        (sum: number, point: IAutoMovieVector3, i: number): number =>
          sum + Vector3.length(Vector3.subtract(point, points[i]!)),
        0,
      );
    TestValidator.predicate(
      `cord keeps its length at ${seconds} s`,
      nclose(lengthAt, length),
    );
    TestValidator.predicate(
      `cord clears the floor at ${seconds} s`,
      points.every(
        (point: IAutoMovieVector3): boolean => point.y >= radius - epsilon,
      ),
    );
    const bones: ReturnType<typeof performance.bones> = performance.bones(
      performer.subject,
      seconds,
    );
    const ends: IAutoMovieVector3[] = [];
    for (const side of sides) {
      const handle: IAutoMovieRigidTransform = frame.handles[side];
      const grip: ReturnType<typeof HumanHand.frame> = HumanHand.frame(
        performer.body,
        bones,
        side,
        "grip",
      );
      // The observed grip socket stands 25 mm from the hand's defining ray.
      TestValidator.predicate(
        `${side} grip keeps the barrel tangent to its reference surface at ${seconds} s`,
        vclose(
          Vector3.subtract(
            handle.position,
            Vector3.scale(grip.normal, handleDiameter / 2),
          ),
          Vector3.subtract(grip.point, Vector3.scale(grip.normal, 0.025)),
        ),
      );
      const exit: IAutoMovieVector3 = Quaternion.rotateVector(handle.rotation, {
        x: 0,
        y: 0,
        z: 1,
      });
      TestValidator.predicate(
        `${side} barrel stays on the displayed grasp's wrapped axis`,
        vclose(exit, grip.forward),
      );
      ends.push(
        Vector3.add(handle.position, Vector3.scale(exit, handleLength / 2)),
      );
    }
    TestValidator.predicate(
      `the two distinct cord ends join the two handles at ${seconds} s`,
      (vclose(ends[0]!, points[0]!) && vclose(ends[1]!, points[3]!)) ||
        (vclose(ends[1]!, points[0]!) && vclose(ends[0]!, points[3]!)),
    );
    const sole: IAutoMovieVector3[] = sides.flatMap(
      (side: AutoMovieHumanSide): IAutoMovieVector3[] =>
        HumanFoot.sockets(performer.body, bones, side).map(
          (socket): IAutoMovieVector3 => socket.point,
        ),
    );
    const outline: IAutoMovieVector3[] = sides.flatMap(
      (side: AutoMovieHumanSide): IAutoMovieVector3[] =>
        HumanFoot.outline(performer.body, side).map(
          (frame): IAutoMovieVector3 =>
            resolveAutoMovieHumanoidSurfaces.place(
              frame,
              bones.get(frame.bone)!,
            ).point,
        ),
    );
    const mid: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(points[1]!, points[2]!),
      0.5,
    );
    return { points, sole, outline, mid };
  };
  const top: ReturnType<typeof read> = read(overhead);
  const front: ReturnType<typeof read> = read(under - period / 4);
  const launch: ReturnType<typeof read> = read(takeoff);
  const pass: ReturnType<typeof read> = read(under);
  const landing: ReturnType<typeof read> = read(landed);
  const rear: ReturnType<typeof read> = read(under + period / 4);
  const early: ReturnType<typeof read> = read(takeoff + (under - takeoff) / 3);
  TestValidator.predicate(
    "both soles leave the ground during the early rise",
    early.sole.every((point: IAutoMovieVector3): boolean => point.y > 0),
  );
  const [left, right] = [pass.points[1]!, pass.points[2]!];
  const heel: number = Math.min(
    ...pass.outline.map((point: IAutoMovieVector3): number => point.z),
  );
  const toe: number = Math.max(
    ...pass.outline.map((point: IAutoMovieVector3): number => point.z),
  );
  TestValidator.predicate(
    "cord crosses above the head",
    Math.min(top.points[1]!.y, top.points[2]!.y) - radius >
      performer.body.measure.stature,
  );
  TestValidator.predicate(
    "cord passes from in front of the toes to behind the heels",
    Math.min(front.points[1]!.z, front.points[2]!.z) > toe + radius &&
      Math.max(rear.points[1]!.z, rear.points[2]!.z) < heel - radius,
  );
  TestValidator.predicate(
    "the low cord spans the feet side to side below both soles",
    pass.outline.every(
      (foot: IAutoMovieVector3): boolean =>
        foot.x > Math.min(left.x, right.x) &&
        foot.x < Math.max(left.x, right.x) &&
        foot.y > Math.max(left.y, right.y) + radius,
    ) &&
      heel < pass.mid.z &&
      pass.mid.z < toe,
  );
  for (const support of [launch, landing]) {
    for (const side of [0, 3]) {
      const low: number = Math.min(
        ...support.sole
          .slice(side, side + 3)
          .map((point: IAutoMovieVector3): number => point.y),
      );
      TestValidator.predicate(
        "each foot contacts the floor at takeoff and landing",
        Math.abs(low) <= 0.005,
      );
    }
  }

  // At a fore-aft distance d from its low point, the circular center span
  // rises by R - sqrt(R² - d²). Its sole overlap around that low point must
  // start after takeoff, end before landing, and stay below the lowest sole.
  const orbitRadius: number = (front.mid.z - rear.mid.z) / 2;
  const overlap: number =
    Math.max(pass.mid.z - heel, toe - pass.mid.z) + radius;
  const edgeTime: number =
    (Math.asin(overlap / orbitRadius) * period) / (2 * Math.PI);
  const rise: number = orbitRadius - Math.sqrt(orbitRadius ** 2 - overlap ** 2);
  TestValidator.predicate(
    "the low part of the turn overlaps the feet only during flight",
    under - edgeTime > takeoff && under + edgeTime < landed,
  );
  for (const seconds of [under - edgeTime, under + edgeTime]) {
    const edge: ReturnType<typeof read> = read(seconds);
    const cordTop: number = Math.max(left.y, right.y) + rise + radius;
    TestValidator.predicate(
      "both feet clear the cable across the sole envelope",
      edge.outline.every(
        (foot: IAutoMovieVector3): boolean => foot.y > cordTop,
      ) &&
        edge.outline.every(
          (foot: IAutoMovieVector3): boolean =>
            foot.x + radius < Math.min(edge.points[0]!.x, edge.points[1]!.x) &&
            foot.x - radius > Math.max(edge.points[2]!.x, edge.points[3]!.x),
        ) &&
        nclose(edge.mid.y, pass.mid.y + rise),
    );
  }
  TestValidator.predicate(
    "seeking back reproduces the under-foot cord",
    read(under).points.every((point: IAutoMovieVector3, i: number): boolean =>
      vclose(point, pass.points[i]!),
    ),
  );
  const slow: ReturnType<typeof AutoMovieMotionHumanWorkout.prepareRopeSkip> =
    AutoMovieMotionHumanWorkout.prepareRopeSkip({
      ...setup,
      action: "slow-turn",
    });
  const from: number = action.end;
  const overheadHold: readonly number[] = slow(from + 0.5)!.cord.surface.mesh
    .positions;
  const slowBottom: readonly number[] = slow(from + 4)!.cord.surface.mesh
    .positions;
  const slowLaunch: readonly number[] = slow(from + 4 - 0.13)!.cord.surface.mesh
    .positions;
  const slowLanding: readonly number[] = slow(from + 4 + 0.13)!.cord.surface
    .mesh.positions;
  // The hand-to-hand axis can tilt the crossbar ends around its low point.
  const slowMidY: number = (slowBottom[4]! + slowBottom[7]!) / 2;
  TestValidator.predicate(
    "a long authored pause leaves the rope overhead before its airborne pass",
    Math.min(overheadHold[4]!, overheadHold[7]!) - radius >
      performer.body.measure.stature &&
      Math.abs(slowMidY - pass.mid.y) < radius &&
      Math.min(slowBottom[4]!, slowBottom[7]!) >= radius - epsilon &&
      Math.min(slowLaunch[5]!, slowLaunch[8]!) > toe + radius &&
      Math.max(slowLanding[5]!, slowLanding[8]!) < heel - radius,
  );
}
