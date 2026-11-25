import { physicalBalancePlan } from "@automovie/engine";
import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Gravity's magnitude, metres per second squared. */
const GRAVITY: number = 9.81;

/** The authored mass center's height over the floor, metres. */
const HEIGHT: number = 0.9;

/** Half a sole's length along world z, metres. */
const HALF: number = 0.125;

/**
 * The plan phase keeps a body supported while its capture point stands over its
 * planted soles (`physicalBalancePlan`).
 *
 * Two soles 0.1 by 0.25 m stand 0.1 m either side of the mass center, 0.9 m up,
 * the authored mass center at rest above it.
 *
 * Scenarios:
 *
 * 1. Quiet: at rest, the capture point is the mass center's foot, inside the
 *    soles: the body is supported, nothing lies outside, a stale outside clock
 *    and failed landing are cleared, the rate is sqrt(g / h) at the authored
 *    height and the plan's capture point is the authored center's.
 * 2. Pushed: moving 1 m/s forward at a held rate of 3 per second, the capture
 *    point stands 1 / 3 m ahead, outside the soles' front edge by that less
 *    their half length; the body stays supported and its outside clock runs
 *    on.
 * 3. Failed landing: the same push after a failed landing is unrecoverable, and
 *    the failure is kept.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the soles, the three states and what each assessment must show.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalBalancePlan` and reads its state and assessment.
 * @evidence contracts/development/testing.md#independent-expectations The rate is sqrt(g / h), the capture point c + v / omega and the distance outside the front edge its z less the half length, all closed forms of the stated soles and motion.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a capture point inside from one outside, a first rate from a held one, and a failed landing kept outside from one cleared inside.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on synthetic readings in memory; no native world, viewer or simulation run.
 */
export function test_unit_engine_physics_physical_balance_plan(): void {
  const failures: string[] = [];
  const near = (name: string, actual: number, expected: number): void => {
    if (!(Math.abs(actual - expected) <= 1e-9))
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  const sole = (x: number): IAutoMovieVector3[] =>
    [x - 0.05, x + 0.05].flatMap((across: number): IAutoMovieVector3[] =>
      [-HALF, HALF].map(
        (ahead: number): IAutoMovieVector3 => ({ x: across, y: 0, z: ahead }),
      ),
    );
  const stance: Parameters<typeof physicalBalancePlan>[0]["stance"] = {
    planted: [
      { bone: "leftFoot", points: sole(0.1), position: { x: 0.1, y: 0, z: 0 } },
      {
        bone: "rightFoot",
        points: sole(-0.1),
        position: { x: -0.1, y: 0, z: 0 },
      },
    ],
    plane: 0,
    tilt: 0,
  };
  const plan = (
    state: IAutoMoviePhysicalRecoveryState,
    velocity: number,
  ): physicalBalancePlan.IResult => {
    const center: IAutoMovieVector3 = { x: 0, y: HEIGHT, z: 0 };
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    // The authored command's centre stands in for the profile's segments.
    const sense: physicalBalancePlan.ISense = {
      center,
      velocity: { x: 0, y: 0, z: velocity },
      gravity: GRAVITY,
      floor: 0,
      seconds: 0,
      command: { center, velocity: zero, acceleration: zero },
      profile: { segments: [], mass: 1 },
      targets: {},
    };
    return physicalBalancePlan({ state, sense, stance });
  };
  const stale = (failed: boolean): IAutoMoviePhysicalRecoveryState => ({
    last: "supported",
    steps: [],
    offsets: {},
    outsideSince: 0.1,
    ...(failed ? { failedLanding: true } : {}),
  });

  // 1. Quiet.
  const given: IAutoMoviePhysicalRecoveryState = stale(true);
  const quiet: physicalBalancePlan.IResult = plan(given, 0);
  if (
    quiet.state.last !== "supported" ||
    quiet.assessment.state !== "supported"
  )
    failures.push(
      `quiet: ${quiet.state.last}, assessed ${quiet.assessment.state}`,
    );
  near("quiet outside", quiet.assessment.outside, 0);
  if (
    quiet.state.outsideSince !== undefined ||
    quiet.state.failedLanding !== undefined
  )
    failures.push("quiet: the outside clock or the failed landing stayed");
  if (given.outsideSince !== 0.1 || given.failedLanding !== true)
    failures.push("quiet: the input state was written");
  near("quiet rate", quiet.state.omega!, Math.sqrt(GRAVITY / HEIGHT));
  near("quiet planned capture x", quiet.state.desired!.position.x, 0);
  near("quiet planned capture z", quiet.state.desired!.position.z, 0);
  near("quiet capture z", quiet.assessment.capturePoint.z, 0);

  // 2. Pushed, at a held rate.
  const pushed: physicalBalancePlan.IResult = plan(
    { ...stale(false), omega: 3 },
    1,
  );
  if (pushed.state.last !== "supported")
    failures.push(`pushed: ${pushed.state.last}`);
  near("pushed capture z", pushed.assessment.capturePoint.z, 1 / 3);
  near("pushed outside", pushed.assessment.outside, 1 / 3 - HALF);
  if (pushed.state.outsideSince !== 0.1)
    failures.push("pushed: the outside clock was cleared");

  // 3. Failed landing.
  const failed: physicalBalancePlan.IResult = plan(
    { ...stale(true), omega: 3 },
    1,
  );
  if (
    failed.state.last !== "unrecoverable" ||
    failed.assessment.state !== "unrecoverable" ||
    failed.state.failedLanding !== true
  )
    failures.push(`failed landing: ${failed.state.last}`);
  TestValidator.equals("balance plan assessment", failures, []);
}
