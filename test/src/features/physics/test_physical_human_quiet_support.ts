import {
  AutoMoviePhysicalSimulation,
  Vector3,
  physicalSupportPoint,
} from "@automovie/engine";
import { fitHumanPhysicalStandingPose } from "@automovie/human";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { PhysicalSupportLoads } from "../internal/PhysicalSupportLoads";
import { createPhysicalBalanceInput } from "../internal/createPhysicalBalanceInput";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Native seconds simulated per stance: the support settles within the first tenth. */
const DURATION: number = 0.3;

/** The late window over which loads and drift are read, seconds. */
const WINDOW: number = 0.15;

/** How far the measured floor load may stand from the body's weight, as a share of it. */
const LOAD: number = 0.02;

/** How far the shifted stance's lever share must stand from an even split for the stance to count as a weight transfer. */
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
 * 2. Each foot carries a share of the weight that moment balance allows.
 *    A foot bears its load anywhere across its support, so two feet are
 *    statically indeterminate: moment balance about the line between them
 *    fixes the left share only within the band the mass center's place
 *    gives with each foot's load at either end of its footprint, the same
 *    band the four-support primitive is held to.
 * 3. After a planted 20 mm weight shift, the load follows the shifted mass
 *    center: the foot it moved toward carries the larger share, as the
 *    lever share about the contact centroids does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three stances and what each must show.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the public Stand and weight shift handed over through `fitHumanPhysicalStandingPose`, and reads the solver's floor receipts, cache frames and recovery record.
 * @evidence contracts/development/testing.md#independent-expectations The weight is the profile's mass times the declared gravity; the band follows from moment balance with the mass center computed from the cache's own segment masses and frames and each footprint from the feet's own colliders on the floor; a centre of pressure is not read from the receipts' single manifold points.
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
      composition: HumanChain.subject("a").stand({ hold: 1, sway: 0 }).node,
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
    laws: [AutoMovieMotionHumanStance.shiftStandingWeight],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.6, sway: 0 })
      .registered("shiftStandingWeight", {
        by: -SHIFT,
        duration: 0.8,
        hold: 0.6,
      }).node,
  });
  const shares: IShares | undefined = await stance(
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
): Promise<IShares | undefined> {
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
  input.impulses.length = 0;
  const run: IAutoMoviePhysicalSimulation =
    await AutoMoviePhysicalSimulation.compute(input);

  const recovery = run.cache.recovery[subject.id];
  if (recovery?.last !== "supported" || recovery.steps.length !== 0)
    failures.push(`${label}: quiet stance stepped or lost support`);

  const weight: number = profile.mass * -input.gravity.y;
  const read: PhysicalSupportLoads.IResult = PhysicalSupportLoads.measure(
    run,
    profile,
    subject.id,
    DURATION - WINDOW,
    (bone: string): PhysicalSupportLoads.Side | undefined =>
      bone.startsWith("left")
        ? "left"
        : bone.startsWith("right")
          ? "right"
          : undefined,
    // A foot's contact centroid: the mean of its footprint.
    (poses, side: PhysicalSupportLoads.Side): IAutoMovieVector3 =>
      mean(footprint(profile, poses, side)),
  );
  if (Math.abs(read.total - weight) > weight * LOAD)
    failures.push(`${label}: floor load ${read.total} N against ${weight} N`);
  if (read.drift > DRIFT)
    failures.push(`${label}: mass center drifted ${read.drift} m`);

  // Moment balance about the line between the feet, with each foot bearing
  // its load anywhere across its own support: the left share is (c - r) /
  // (l - r) for some centre of pressure l on the left footprint and r on the
  // right, so it lies in the band those footprints' ends give.
  const last: Readonly<Record<string, IAutoMovieRigidTransform>> =
    run.cache.frames.at(-1)!.bodies[subject.id]!;
  const left: IAutoMovieVector3[] = footprint(profile, last, "left");
  const right: IAutoMovieVector3[] = footprint(profile, last, "right");
  const origin: IAutoMovieVector3 = mean(right);
  const across: IAutoMovieVector3 = Vector3.subtract(mean(left), origin);
  across.y = 0;
  const along = (point: IAutoMovieVector3): number =>
    Vector3.dot(Vector3.subtract(point, origin), across) /
    Vector3.dot(across, across);
  const center: number = along(PhysicalSupportLoads.center(profile, last));
  const ends = (points: IAutoMovieVector3[]): number[] => [
    Math.min(...points.map(along)),
    Math.max(...points.map(along)),
  ];
  const shares: number[] = ends(left).flatMap((l: number): number[] =>
    ends(right).map((r: number): number => (center - r) / (l - r)),
  );
  const band: [number, number] = [Math.min(...shares), Math.max(...shares)];
  if (!(read.left >= band[0] && read.left <= band[1]))
    failures.push(
      `${label}: left foot carries ${read.left} of the load, outside its moment-balance band ${JSON.stringify(band)}`,
    );
  return { left: read.left, lever: read.lever, band };
}

/** A stance's measured left share, its lever share about the feet's contact centroids, and the band moment balance allows it. */
interface IShares {
  /** The left foot's measured share of the floor load. */
  left: number;
  /** The left share with each foot's load at its contact centroid. */
  lever: number;
  /** The least and greatest left share moment balance allows with each foot's load anywhere on its footprint. */
  band: [number, number];
}

/** A foot's contact footprint: the vertices of its and its toes' colliders within the floor's touching depth. */
function footprint(
  profile: IAutoMovieMotionHumanBody["profile"],
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  side: PhysicalSupportLoads.Side,
): IAutoMovieVector3[] {
  return profile.segments
    .filter(
      (segment: IAutoMoviePhysicalSegment): boolean =>
        segment.bone === `${side}Foot` || segment.bone === `${side}Toes`,
    )
    .flatMap((segment: IAutoMoviePhysicalSegment): IAutoMovieVector3[] =>
      [...segment.shapes, ...(segment.contactShapes ?? [])].flatMap(
        (shape: IAutoMoviePhysicalShape): IAutoMovieVector3[] =>
          vertices(shape).map(
            (point: IAutoMovieVector3): IAutoMovieVector3 =>
              physicalSupportPoint(
                poses[segment.bone]!,
                physicalSupportPoint(shape.transform, point),
              ),
          ),
      ),
    )
    .filter((point: IAutoMovieVector3): boolean => point.y < 0.001);
}

/** A polytope collider's vertices in its own frame: a hull's points or a box's corners. */
function vertices(shape: IAutoMoviePhysicalShape): IAutoMovieVector3[] {
  if (shape.kind === "hull") return shape.points;
  if (shape.kind !== "box") return [];
  const half: IAutoMovieVector3 = shape.halfExtents;
  return [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
    [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
      [-1, 1].map(
        (z: number): IAutoMovieVector3 => ({
          x: x * half.x,
          y: y * half.y,
          z: z * half.z,
        }),
      ),
    ),
  );
}

/** The mean of points. */
function mean(points: readonly IAutoMovieVector3[]): IAutoMovieVector3 {
  return Vector3.scale(
    points.reduce(
      (sum: IAutoMovieVector3, point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(sum, point),
      { x: 0, y: 0, z: 0 },
    ),
    1 / points.length,
  );
}
