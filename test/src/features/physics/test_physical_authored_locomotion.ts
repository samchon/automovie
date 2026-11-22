import {
  AutoMoviePhysicalSimulation as Simulation,
  physicalSupportPoint,
} from "@automovie/engine";
import {
  AutoMovieHumanCanonicalBody,
  fitHumanPhysicalStandingPose,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanParameters,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import PEOPLE from "../internal/MOTION_HUMAN_PEOPLE.json";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures } from "../internal/PhysicalPerformanceFixtures";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * Actual Human and an independently built primitive body track the same
 * authored slow walk on a real floor under gravity.
 *
 * Scenarios:
 * 1. The engine stickman walks 0.12 m/s for two seconds from planner-placed
 *    footfalls. Every displayed segment origin stays within its drawn limb
 *    radius of the authored target, no planted support slides more than one
 *    percent of the 0.35 m stride, no joint motor's demand exceeds its
 *    torque cap, and every joint stays within two degrees of its authored
 *    rotation.
 * 2. The canonical Human walks the same authored footfalls from its fitted
 *    public Stand, with flat feet carried by the shank, and meets the same
 *    four bounds, its pose bound being its drawn ankle girth radius.
 * 3. A horizontal push on the stickman's hips displaces it in proportion to
 *    the impulse, and the pushed run returns within one millimetre of the
 *    unperturbed run before the walk ends.
 *
 * Visible-geometry tolerances are the segment-origin and planted-slip
 * bounds, measured on displayed cache frames; slip is the horizontal travel of
 * the ankle or shin endpoint while the planner holds it planted. The joint
 * error and torque-cap forecasts are simulation tolerances on native joints.
 * Both bodies run with the gravity, floor, substeps and iterations of the
 * quiet-stance qualification. Human push recovery belongs to the external
 * force recovery matrix of #4017.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the maintained slow-walk fixture for the stickman and for the canonical Human from its fitted public Stand, reads displayed cache frames, `trackingAt` joint errors and saturation forecasts, and repeats the stickman run with two explicit impulses against the unperturbed cache.
 * @evidence contracts/development/testing.md#independent-expectations Pose bounds are the stickman's declared 0.04 m limb radius and the Human's drawn ankle girth from `AutoMovieHumanCanonicalBody.prepare`; the slip bound is one percent of the fixture's 0.35 m stride; the joint bound is the two degrees of test_physical_human_profile; saturation is read against each joint's declared torque cap. Proportional response compares two impulses differing by a factor of two; recovery compares against the same run without the push.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers two independent providers, separates swing from planted samples through the planner's own phase, the unperturbed run from two pushed runs, and the near-linear peak response from the settled tail.
 * @evidence contracts/development/testing.md#execution-ownership The portable unit test test_physical_authored_locomotion builds its bodies and the Human Stand in memory and runs the public native Engine entry four times with no viewer or file host.
 * @evidence contracts/development/common.md#meaningful-documentation Documents both walks, the visible and simulation tolerances, the shared physical settings, the stickman push and its recovery, and where Human recovery is qualified.
 */
export async function test_physical_authored_locomotion(): Promise<void> {
  const duration: number = 2;
  const stride: number = 0.35;
  const radian: number = Math.PI / 180;

  // 1. The primitive baseline.
  const stickman: IAutoMoviePhysicalProfile =
    PhysicalModelFixtures.stickman().profile;
  const primitive: ReturnType<typeof PhysicalPerformanceFixtures.walk> =
    PhysicalPerformanceFixtures.walk(stickman, duration);
  const input: IAutoMoviePhysicalSimulationInput.IInput = physical(
    primitive.body,
    duration,
  );
  const result: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
  qualify("stickman", measure(primitive, result, input.rate), 0.04);

  // 2. The canonical Human from its fitted public Stand.
  const human: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const person: { mass: number; params: unknown } = PEOPLE["m-average"];
  const canonical: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(
      person.params as IAutoMovieHumanParameters,
      { mass: person.mass, id: "m-average" },
    );
  const ankle: number = Math.min(
    ...(["leftFoot", "rightFoot"] as const).map(
      (bone: string): number =>
        canonical.joints.find(
          (joint: IAutoMovieHumanCanonicalBody.IJoint): boolean =>
            joint.bone === bone,
        )!.radius,
    ),
  );
  const walk: ReturnType<typeof PhysicalPerformanceFixtures.walk> =
    PhysicalPerformanceFixtures.walk(human.profile, duration, 0, stand(human));
  const humanInput: IAutoMoviePhysicalSimulationInput.IInput = physical(
    walk.body,
    duration,
  );
  qualify(
    "Human",
    measure(walk, await Simulation.compute(humanInput), humanInput.rate),
    ankle,
  );

  // 3. Push the stickman and compare with its unperturbed walk.
  const at: number = 1;
  const id: string = primitive.body.id;
  const peaks: number[] = [];
  const tails: number[] = [];
  for (const scale of [1, 2]) {
    const pushed: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    pushed.impulses = [
      {
        step: Math.round(at * input.rate),
        body: id,
        bone: "hips",
        impulse: { x: 0, y: 0, z: 0.15 * scale * stickman.mass },
        point: result.cache.at(at).bodies[id]!.hips!.position,
      },
    ];
    const disturbed: IAutoMoviePhysicalSimulation =
      await Simulation.compute(pushed);
    let peak: number = 0;
    for (
      let step: number = Math.round(at * input.rate);
      step < primitive.body.targets.length;
      step++
    ) {
      const seconds: number = step / input.rate;
      peak = Math.max(
        peak,
        distance(
          disturbed.cache.at(seconds).bodies[id]!.hips!.position,
          result.cache.at(seconds).bodies[id]!.hips!.position,
        ),
      );
    }
    peaks.push(peak);
    tails.push(
      distance(
        disturbed.cache.at(duration).bodies[id]!.hips!.position,
        result.cache.at(duration).bodies[id]!.hips!.position,
      ),
    );
  }
  TestValidator.predicate(
    `the push displaces the hips in proportion (${peaks.join(", ")} m)`,
    peaks[0]! > 0 && Math.abs(peaks[1]! / peaks[0]! - 2) < 0.2,
  );
  TestValidator.predicate(
    `both pushed walks return to the unperturbed walk (${tails.join(", ")} m)`,
    tails.every((tail: number): boolean => tail < 0.001),
  );

  /** Assert one walk's four bounds. */
  function qualify(label: string, measured: IMeasured, pose: number): void {
    TestValidator.predicate(
      `${label} segment origins stay inside the drawn radius ${pose} m (${measured.pose} m)`,
      measured.pose < pose,
    );
    TestValidator.predicate(
      `${label} planted supports do not slide (${measured.slip} m over ${measured.planted} samples)`,
      measured.planted > 0 && measured.slip < 0.01 * stride,
    );
    TestValidator.predicate(
      `${label} joints stay within two degrees (${measured.joint} rad)`,
      measured.joint < 2 * radian,
    );
    TestValidator.equals(
      `${label} motor demands stay inside their torque caps`,
      measured.saturated,
      [],
    );
  }
}

/** One walk's measured tracking. */
interface IMeasured {
  /** Greatest segment-origin distance from its authored target, metres. */
  pose: number;
  /** Greatest native joint error, radians. */
  joint: number;
  /** Greatest horizontal travel of a support while planted, metres. */
  slip: number;
  /** Planted samples measured. */
  planted: number;
  /** Torque-cap forecasts, as joint@seconds. */
  saturated: string[];
}

/** Use the gravity, floor, substeps and iterations of the quiet-stance qualification. */
function physical(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  duration: number,
): IAutoMoviePhysicalSimulationInput.IInput {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], duration);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    floor: 0,
    substeps: 32,
  });
  return input;
}

/** Read the displayed walk against its authored targets and planted phases. */
function measure(
  walk: ReturnType<typeof PhysicalPerformanceFixtures.walk>,
  result: IAutoMoviePhysicalSimulation,
  rate: number,
): IMeasured {
  const body: IAutoMoviePhysicalSimulationInput.IBody = walk.body;
  let pose: number = 0;
  let joint: number = 0;
  for (const [step, target] of body.targets.entries()) {
    const seconds: number = step / rate;
    const frame: Record<string, IAutoMoviePhysicalSegmentState> =
      result.cache.at(seconds).bodies[body.id]!;
    for (const [bone, authored] of Object.entries(target.segments))
      pose = Math.max(pose, distance(frame[bone]!.position, authored.position));
    for (const entry of result.trackingAt(seconds))
      if (entry.body === body.id) joint = Math.max(joint, entry.error);
  }
  let slip: number = 0;
  let planted: number = 0;
  for (const limb of walk.pattern.limbs) {
    let anchor: IAutoMovieVector3 | null = null;
    for (let step: number = 0; step < body.targets.length; step++) {
      const seconds: number = step / rate;
      const state: IAutoMovieStepPlanner.IState = walk.planner.at(
        limb.bone,
        seconds,
      );
      if (state.phase !== "planted") {
        anchor = null;
        continue;
      }
      const point: IAutoMovieVector3 = physicalSupportPoint(
        result.cache.at(seconds).bodies[body.id]![limb.bone]!,
        limb.localPoint,
      );
      planted++;
      if (anchor === null) anchor = point;
      else
        slip = Math.max(
          slip,
          Math.hypot(point.x - anchor.x, point.z - anchor.z),
        );
    }
  }
  return {
    pose,
    joint,
    slip,
    planted,
    saturated: result.tracking
      .filter(
        (entry: IAutoMoviePhysicalSimulationInput.IDiagnostic): boolean =>
          entry.body === body.id,
      )
      .map(
        (entry: IAutoMoviePhysicalSimulationInput.IDiagnostic): string =>
          `${entry.joint}@${entry.seconds}`,
      ),
  };
}

/** Fit the public settled Stand once, as test_human_motion_stand_support_geometry does. */
function stand(
  human: IAutoMovieMotionHumanBody,
): Record<string, IAutoMovieRigidTransform> {
  const { profile }: IAutoMovieMotionHumanBody = human;
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "physical-authored-locomotion",
    [{ subject: profile.id, body: human }],
    HumanChain.subject(profile.id).stand({ seconds: 1, sway: 0 }),
  );
  const settled: number = motionHumanLaw.event(film, "settled", profile.id);
  const bones: motionHumanLaw.Bones = film.bones(
    profile.id,
    settled + (film.duration - settled) / 2,
  );
  const fit: ReturnType<typeof fitHumanPhysicalStandingPose> =
    fitHumanPhysicalStandingPose({
      profile,
      targets: Object.fromEntries(
        profile.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => {
            const bone: IAutoMovieResolvedBone = bones.get(
              segment.bone as AutoMovieHumanoidBone,
            )!;
            return [
              segment.bone,
              { position: bone.worldPosition, rotation: bone.worldRotation },
            ];
          },
        ),
      ),
      floor: 0,
      iterations: 32,
      tolerance: 0.000025,
    });
  if (fit.kind === "unresolved")
    throw new Error(`The public Stand has no physical fit: ${fit.reason}`);
  return fit.targets;
}

function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
