import { createIceSkate } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSurface,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * The same sheet supports a crossover on skate edges, a figure step
 * onto one blade, and a low delivery on a flat curling shoe.
 *
 * Scenarios:
 * 1. While the leading blade glides and cants, the released skate clears
 *    the ice and crosses the support before returning to the ice.
 * 2. An off-axis arc is refused when its radius crosses the inside skate.
 * 3. A separate figure step leaves and regains blade contact.
 * 4. A curling slide carries the leading sole flat and the trailing
 *    forefoot low as the pelvis drops, then recovers at the stop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the measured supports, phases and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed ankles and equipment edges, the two sole points, pelvis, travel, and the contact windows.
 * @evidence contracts/development/testing.md#independent-expectations Mounted runner edge comes from the production skate's leftEdge and rightEdge; the floor is y=0. Hua et al. (2025, Fig. 2) distinguishes flat leading sole support from trailing forefoot support in delivery (https://doi.org/10.3389/fnhum.2025.1587118). Use the existing 10 mm glide contact tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A lifted runner and a load-bearing runner differ at mid-flight, while a crossed placement differs on acquisition. The trailing shoe lifts its heel, unlike the leading shoe.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable in-memory test of registered surface actions on the rendered average Human and a seeded production skate.
 */
export function test_motion_support_ice_support(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("ice support", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const equipment: ReturnType<typeof createIceSkate> = createIceSkate({}, 8);
  const performed = (
    skate: IAutoMovieMotionHumanSurface.ISkateParams,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "ice-support",
      performers: [performer(body)],
      laws: [AutoMovieMotionHumanRide.HumanSurface.skate],
      composition: HumanChain.subject("skater").registered("skate", skate).node,
    });
  const entry: HumanPerformance = performed({ duration: 2, speed: 1 });
  const groundHeight: number = 0.01;
  const skatePivots: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: pivot("left", "rightEdge"),
    right: pivot("right", "rightEdge"),
  };
  const skate: IAutoMovieMotionHumanSurface.ISkateParams = {
    duration: 3,
    speed: 1.8,
    turn: 38,
    stop: true,
    edge: { degrees: 7, pivots: skatePivots },
    step: {
      side: "right",
      window: [0.9, 1.5],
      offset: { x: 0.29, z: 0.16 },
      clearance: 0.075,
    },
  };
  const film: HumanPerformance = performed(skate);
  collectTakeClean(`${key} ice crossover`, film, failures);
  const segment: IAutoMovieMotionHumanSegment = film.segments("skater")[0]!;
  const findings: string[] = [];
  const check = (label: string, valid: boolean): void => {
    if (!valid) findings.push(label);
  };
  const boardNames: readonly ["leftFoot", "rightFoot"] = [
    "leftFoot",
    "rightFoot",
  ];
  const before: ReturnType<typeof film.bones> = film.bones("skater", 0.9);
  const lifted: ReturnType<typeof film.bones> = film.bones("skater", 1.2);
  const after: ReturnType<typeof film.bones> = film.bones("skater", 1.5);
  const left: IAutoMovieResolvedBone = lifted.get("leftFoot")!;
  const right: IAutoMovieResolvedBone = lifted.get("rightFoot")!;
  check(
    "the pushing glide advances while one blade stays on the ice",
    Vector3.distance(
      before.get("leftFoot")!.worldPosition,
      left.worldPosition,
    ) > 0.3 &&
      nclose(point(left, skatePivots.left).y, 0, groundHeight) &&
      point(right, skatePivots.right).y > 0.05,
  );
  check(
    "the supporting skate rolls into its selected runner edge",
    Quaternion.rotateVector(left.worldRotation, { x: 1, y: 0, z: 0 }).y > 0.055,
  );
  const laterLeft: IAutoMovieResolvedBone = after.get("leftFoot")!;
  const laterRight: IAutoMovieResolvedBone = after.get("rightFoot")!;
  const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
    laterLeft.worldRotation,
    { x: 1, y: 0, z: 0 },
  );
  check(
    "the released right skate crosses over before bearing again",
    Vector3.dot(
      Vector3.subtract(laterRight.worldPosition, laterLeft.worldPosition),
      lateral,
    ) > 0 && nclose(point(laterRight, skatePivots.right).y, 0, groundHeight),
  );
  const bearing = (part: (typeof boardNames)[number], at: number): boolean =>
    segment.plan.contacts.some(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === part &&
        window.kind === "bear" &&
        window.from <= at / skate.duration &&
        at / skate.duration <= window.to,
    );
  check(
    "the contact clock distinguishes flying from gliding blades",
    bearing("leftFoot", 1.2) &&
      !bearing("rightFoot", 1.2) &&
      bearing("rightFoot", 0.85) &&
      bearing("rightFoot", 1.55),
  );
  const motion = (source: HumanPerformance, at: number): IAutoMovieVector3 =>
    source.bones("skater", at).get("hips")!.worldPosition;
  check(
    "braking brings the surface travel to rest",
    Vector3.distance(motion(film, 2.95), motion(film, 3)) < 0.002 &&
      Vector3.distance(motion(film, 1.75), motion(film, 1.8)) > 0.04,
  );

  const figure: HumanPerformance = performed({
    ...skate,
    turn: 16,
    step: {
      side: "left",
      window: [0.8, 1.35],
      offset: { x: 0.055, z: 0.13 },
      clearance: 0.055,
    },
  });
  collectTakeClean(`${key} ice figure step`, figure, failures);
  check(
    "a figure entry leaves and regains the left blade without lifting the right",
    point(figure.bones("skater", 1.075).get("leftFoot")!, skatePivots.left).y >
      0.04 &&
      nclose(
        point(
          figure.bones("skater", 1.075).get("rightFoot")!,
          skatePivots.right,
        ).y,
        0,
        groundHeight,
      ) &&
      nclose(
        point(figure.bones("skater", 1.35).get("leftFoot")!, skatePivots.left)
          .y,
        0,
        groundHeight,
      ),
  );
  let refusal: unknown;
  try {
    performed({ ...skate, speed: 0.03, turn: 180 });
  } catch (error) {
    refusal = error;
  }
  check(
    "an arc crossing a blade's path refuses the turn",
    refusal instanceof HumanRefusal && refusal.axis === "turn",
  );

  const slide: HumanPerformance = new HumanPerformance({
    seed: "curling",
    performers: [performer(body)],
    laws: [AutoMovieMotionHumanRide.HumanSurface.curlDelivery],
    composition: HumanChain.subject("skater").registered("curlDelivery", {
      duration: 2,
      speed: 1.2,
      stop: true,
      lead: "left",
      drop: 0.16,
      trail: 0.31,
      heel: 35,
    } satisfies IAutoMovieMotionHumanSurface.ICurlDeliveryParams).node,
  });
  collectTakeClean(`${key} ice support slide`, slide, failures);
  const shown: ReturnType<typeof slide.bones> = slide.bones("skater", 1);
  const leading: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
    body,
    shown,
    "left",
  );
  const trailing: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
    body,
    shown,
    "right",
  );
  const socketPoint = (
    sockets: typeof leading,
    socket: (typeof sockets)[number]["socket"],
  ): IAutoMovieVector3 =>
    sockets.find(
      (sample: (typeof sockets)[number]): boolean => sample.socket === socket,
    )!.point;
  const leadHeel: IAutoMovieVector3 = socketPoint(leading, "heel");
  const leadBall: IAutoMovieVector3 = socketPoint(leading, "ball");
  const trailHeel: IAutoMovieVector3 = socketPoint(trailing, "heel");
  const trailBall: IAutoMovieVector3 = socketPoint(trailing, "ball");
  check(
    "the leading sole and the trailing forefoot have different support",
    nclose(leadHeel.y, 0, groundHeight) &&
      nclose(leadBall.y, 0, groundHeight) &&
      nclose(trailBall.y, 0, groundHeight) &&
      trailHeel.y > 0.04 &&
      leadBall.z - trailBall.z > 0.23,
  );
  check(
    "the pelvis lowers through travel and rises from the delivery at rest",
    motion(slide, 0).y - motion(slide, 1).y > 0.16 &&
      motion(slide, 1).z - motion(slide, 0).z > 0.55 &&
      nclose(motion(slide, 0).y, motion(slide, 2).y, groundHeight),
  );
  TestValidator.equals("ice support observations", findings, []);

  /** Mount a runner on the neutral displayed foot at the measured initial floor. */
  function pivot(
    side: AutoMovieHumanSide,
    edge: createIceSkate.Affordance,
  ): IAutoMovieVector3 {
    const foot: IAutoMovieResolvedBone = entry
      .bones("skater", 0)
      .get(`${side}Foot`)!;
    const runner: IAutoMovieVector3 =
      equipment.affordance(edge).frame.translation;
    return Quaternion.rotateVector(Quaternion.inverse(foot.worldRotation), {
      x: runner.x,
      y: -foot.worldPosition.y,
      z: runner.z,
    });
  }
}

/** The same neutral, trained performer in each ice take. */
function performer(
  body: IAutoMovieMotionHumanBody,
): ConstructorParameters<typeof HumanPerformance>[0]["performers"][number] {
  return {
    subject: "skater",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
}

/** World position of a contact in the actually displayed foot. */
function point(
  foot: IAutoMovieResolvedBone,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    foot.worldPosition,
    Quaternion.rotateVector(foot.worldRotation, local),
  );
}
