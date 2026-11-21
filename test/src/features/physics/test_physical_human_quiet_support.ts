import {
  AutoMoviePhysicalSimulation,
  Quaternion,
  Vector3,
  physicalSupportPoint,
} from "@automovie/engine";
import { fitHumanPhysicalStandingPose } from "@automovie/human";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  shiftStandingWeight,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { createPhysicalBalanceInput } from "../internal/createPhysicalBalanceInput";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Native seconds simulated per stance: the support settles within the first tenth. */
const DURATION: number = 0.3;

/** The late window over which loads and drift are read, seconds. */
const WINDOW: number = 0.15;

/** How far the measured floor load may stand from the body's weight, as a share of it. */
const LOAD: number = 0.02;

/** How far a foot's measured share of the load may stand from its lever share. */
const SHARE: number = 0.03;

/** How far the mass center may move in the late window, metres. */
const DRIFT: number = 0.002;

/** The lateral pelvis shift of the weight-transfer stance, metres. */
const SHIFT: number = 0.02;

/**
 * A Human handed to physics from its public Stand stands on its own soles,
 * and carries its weight where its mass center puts it.
 *
 * Scenarios:
 * 1. The average and the tall man stand quietly from the fitted Stand: no
 *    recovery step, the floor carries the body's weight, and the mass
 *    center holds still.
 * 2. Each foot carries the share of the weight the lever rule gives it
 *    from the mass center's place between the two feet.
 * 3. After a planted 20 mm weight shift, the load follows the shifted mass
 *    center: the foot it moved toward carries the larger, lever share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three stances and what each must show.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the public Stand and weight shift handed over through `fitHumanPhysicalStandingPose`, and reads the solver's floor receipts, cache frames and recovery record.
 * @evidence contracts/development/testing.md#independent-expectations The weight is the profile's mass times the declared gravity; each foot's share follows from moment balance about the line between the feet's contact centroids, computed from the cache's own segment masses and frames.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body sizes, a symmetric and a shifted stance, and a share check that tells a balanced split from one foot bearing the body.
 * @evidence contracts/development/testing.md#execution-ownership Builds the performances in memory and runs three short native simulations with no viewer or file host.
 */
export async function test_physical_human_quiet_support(): Promise<void> {
  const failures: string[] = [];
  for (const name of ["m-average", "m-tall"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "quiet-support",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").stand({ seconds: 1, sway: 0 }).node,
    });
    await stance(body, performance, 0.9, name, failures);
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const shifted: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "quiet-support",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [shiftStandingWeight],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.6, sway: 0 })
      .registered("shiftStandingWeight", {
        by: -SHIFT,
        seconds: 0.8,
        hold: 0.6,
      }).node,
  });
  const shares: { left: number; lever: number } | undefined = await stance(
    body,
    shifted,
    shifted.segments("a")[1]!.start + 1.1,
    "shifted m-average",
    failures,
  );
  if (
    shares &&
    !(
      Math.abs(shares.lever - 0.5) > SHARE &&
      Math.sign(shares.left - 0.5) === Math.sign(shares.lever - 0.5)
    )
  )
    failures.push(
      `shifted m-average: the load did not follow the shifted mass center ${JSON.stringify(shares)}`,
    );
  TestValidator.equals("Human quiet support and weight transfer", failures, []);
}

/** Hand one displayed stance to physics, run it and check its support; the measured foot shares. */
async function stance(
  body: IAutoMovieMotionHumanBody,
  performance: IAutoMovieMotionHumanPerformance,
  seconds: number,
  label: string,
  failures: string[],
): Promise<{ left: number; lever: number } | undefined> {
  const profile: IAutoMovieMotionHumanBody["profile"] = body.profile;
  const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
    performance.bones("a", seconds);
  const fit: ReturnType<typeof fitHumanPhysicalStandingPose> =
    fitHumanPhysicalStandingPose({
      profile,
      targets: Object.fromEntries(
        profile.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => {
            const bone = bones.get(segment.bone as never)!;
            return [
              segment.bone,
              { position: bone.worldPosition, rotation: bone.worldRotation },
            ];
          },
        ),
      ),
      floor: 0,
      tolerance: 0.000025,
      iterations: 32,
    });
  if (fit.kind !== "fitted") {
    failures.push(`${label}: the handoff refused ${fit.reason}`);
    return undefined;
  }
  const subject: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.canonical(profile, DURATION);
  for (const target of subject.targets)
    target.segments = structuredClone(fit.targets);
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    createPhysicalBalanceInput(profile, "internal", 0, DURATION, subject);
  input.iterations = 32;
  input.impulses.length = 0;
  const run: IAutoMoviePhysicalSimulation =
    await AutoMoviePhysicalSimulation.compute(input);

  const recovery = run.cache.recovery[subject.id];
  if (recovery?.last !== "supported" || recovery.steps.length !== 0)
    failures.push(`${label}: quiet stance stepped or lost support`);

  const weight: number = profile.mass * -input.gravity.y;
  const start: number = DURATION - WINDOW;
  const loads: Record<"left" | "right", number> = { left: 0, right: 0 };
  for (const receipt of run.cache.contacts) {
    if (receipt.source !== "solver") continue;
    const side: "a" | "b" | undefined =
      receipt.a.body === subject.id && receipt.b.body === "floor"
        ? "a"
        : receipt.b.body === subject.id && receipt.a.body === "floor"
          ? "b"
          : undefined;
    if (!side) continue;
    const foot: "left" | "right" = receipt[side].bone.startsWith("left")
      ? "left"
      : "right";
    for (const sample of receipt.samples ?? [])
      if (sample.seconds > start)
        loads[foot] +=
          ((sample.appliedImpulse?.[side] ?? sample.impulse) *
            (side === "a" ? -sample.normal.y : sample.normal.y)) /
          WINDOW;
  }
  const total: number = loads.left + loads.right;
  if (Math.abs(total - weight) > weight * LOAD)
    failures.push(`${label}: floor load ${total} N against ${weight} N`);

  const frames = run.cache.frames.filter((frame) => frame.seconds >= start);
  const centers: IAutoMovieVector3[] = frames.map((frame) =>
    center(profile, frame.bodies[subject.id]!),
  );
  const drift: number = Math.max(
    ...centers.map((c: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(c, centers[0]!)),
    ),
  );
  if (drift > DRIFT) failures.push(`${label}: mass center drifted ${drift} m`);

  // Moment balance about the line between the feet: each foot carries the
  // share of the weight the mass center's place between them gives it.
  const last = frames.at(-1)!.bodies[subject.id]!;
  const sole = (side: "left" | "right"): IAutoMovieVector3 => {
    const points: IAutoMovieVector3[] = profile.segments
      .filter(
        (segment) =>
          segment.bone === `${side}Foot` || segment.bone === `${side}Toes`,
      )
      .flatMap((segment) =>
        segment.shapes.flatMap((shape) =>
          shape.kind === "hull"
            ? shape.points
                .map((point) =>
                  physicalSupportPoint(
                    last[segment.bone]!,
                    physicalSupportPoint(shape.transform, point),
                  ),
                )
                .filter((point) => point.y < 0.001)
            : [],
        ),
      );
    return Vector3.scale(
      points.reduce((sum, point) => Vector3.add(sum, point), {
        x: 0,
        y: 0,
        z: 0,
      }),
      1 / points.length,
    );
  };
  const left: IAutoMovieVector3 = sole("left");
  const right: IAutoMovieVector3 = sole("right");
  const across: IAutoMovieVector3 = {
    x: left.x - right.x,
    y: 0,
    z: left.z - right.z,
  };
  const lever: number =
    Vector3.dot(Vector3.subtract(centers.at(-1)!, right), across) /
    Vector3.dot(across, across);
  const share: number = loads.left / total;
  if (Math.abs(share - lever) > SHARE)
    failures.push(
      `${label}: left foot carries ${share} of the load, its lever share is ${lever}`,
    );
  return { left: share, lever };
}

/** The mass center of a cache frame's segments, metres. */
function center(
  profile: IAutoMovieMotionHumanBody["profile"],
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IAutoMovieVector3 {
  return profile.segments.reduce(
    (
      sum: IAutoMovieVector3,
      segment: IAutoMoviePhysicalSegment,
    ): IAutoMovieVector3 =>
      Vector3.add(
        sum,
        Vector3.scale(
          Vector3.add(
            poses[segment.bone]!.position,
            Quaternion.rotateVector(
              poses[segment.bone]!.rotation,
              segment.centerOfMass,
            ),
          ),
          segment.mass / profile.mass,
        ),
      ),
    { x: 0, y: 0, z: 0 },
  );
}
