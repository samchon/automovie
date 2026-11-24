import { Quaternion, Vector3 } from "@automovie/engine";
import type {
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
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { nclose } from "../../../features/internal/nclose";

/** The 10 mm bound used for displayed foot contacts in the support-transfer regression. */
const CONTACT: number = 0.01;

/** Canonical forward of the displayed foot. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The public ice and snow actions carry both feet through intentional travel.
 *
 * Scenarios:
 * 1. A skating arc has two bearing feet and moves along the skate direction.
 *    The displayed soles remain at ice height, and the arc decelerates to rest.
 * 2. A straight snow glide transports the ankle markers parallel to an
 *    inclined plane and produces the independently specified grade.
 * 3. The measurement reports an introduced lateral displacement as sideways
 *    drift and a normal offset as a surface gap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the public glide cases, bearing and signed measurement behaviors.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves public performance bones and reads both foot rotations, ankle positions and the skate sole sockets. Detects glides that pin, sidestep, fail to descend or miss the stop and projections that ignore sideways travel.
 * @evidence contracts/development/testing.md#independent-expectations Positive tangent travel, the stated grade, motion near rest and the introduced 50 and 20 mm offsets follow the authored course and elementary plane geometry. The socket tolerance is the existing displayed support check. The inclined case measures ankle-plane covariance and leaves actual ski edge clearance to a staged equipment fixture.
 * @evidence contracts/development/testing.md#distinguishing-cases A turn on level ice and a straight descent require different displacement components, and braking is compared against an earlier interval. A positive across value distinguishes a side drift from forward travel.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable in-memory regression over publicly registered motion, FK and contact measurement, each glide on both canonical bodies with the shipped take verdicts.
 */
export function test_motion_ride_surface_glide(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("surface glide", failures, []);
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
  const ice: motionHumanLaw.IFilm = motionHumanLaw.film(
    new HumanPerformance({
      seed: "exercise-ice",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [AutoMovieMotionHumanRide.HumanSurface.skate],
      composition: HumanChain.subject("a").registered(
        AutoMovieMotionHumanRide.HumanSurface.skate.name,
        {
          duration: 2,
          speed: 2,
          turn: 30,
          stop: true,
        } satisfies IAutoMovieMotionHumanSurface.ISkateParams,
      ).node,
    }),
  );
  collectTakeClean(`${key} ice glide`, ice.performance, failures);
  const segment: IAutoMovieMotionHumanSegment =
    ice.performance.segments("a")[0]!;
  TestValidator.predicate(
    "two gliding feet bear throughout the skate without world-space plants on the arc",
    (["leftFoot", "rightFoot"] as const).every((part): boolean =>
      segment.plan.contacts.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === part &&
          window.kind === "bear" &&
          window.support.kind === "ground" &&
          window.from === 0 &&
          window.to === 1,
      ),
    ) &&
      !segment.plan.contacts.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.kind === "plant" && window.from < window.to,
      ),
  );
  const plane: IAutoMovieMotionHumanSurface.IGlidePlane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
  };
  for (const side of ["left", "right"] as const) {
    const from: motionHumanLaw.Bones = ice.bones("a", ice.duration * 0.35);
    const to: motionHumanLaw.Bones = ice.bones("a", ice.duration * 0.45);
    const before: IAutoMovieResolvedBone = from.get(`${side}Foot`)!;
    const after: IAutoMovieResolvedBone = to.get(`${side}Foot`)!;
    const measured: IAutoMovieMotionHumanSurface.IGlideMeasure =
      AutoMovieMotionHumanRide.HumanSurface.measureGlide(
        {
          point: before.worldPosition,
          forward: Quaternion.rotateVector(before.worldRotation, FORWARD),
        },
        {
          point: after.worldPosition,
          forward: Quaternion.rotateVector(after.worldRotation, FORWARD),
        },
        plane,
      );
    TestValidator.predicate(
      `${side} skate travels forward along its own displayed heading`,
      measured.along > 0.2 && nclose(measured.across, 0, CONTACT),
    );
    const height: number = Math.min(
      ...HumanFoot.sockets(body, to, side).map(
        (socket): number => socket.point.y,
      ),
    );
    TestValidator.predicate(
      `${side} sole stays within 10 mm of the ice plane`,
      nclose(height, 0, CONTACT),
    );
    const last: IAutoMovieVector3 = ice
      .bones("a", ice.duration)
      .get(`${side}Foot`)!.worldPosition;
    const near: IAutoMovieVector3 = ice
      .bones("a", ice.duration - 0.05)
      .get(`${side}Foot`)!.worldPosition;
    TestValidator.predicate(
      `${side} skate travels no more than 10 mm in the last 50 ms of the stop`,
      Vector3.distance(near, last) <= CONTACT,
    );
  }

  const snow: motionHumanLaw.IFilm = motionHumanLaw.film(
    new HumanPerformance({
      seed: "exercise-snow",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 1, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      // The descent glides on a slope the scene declares, at its grade.
      props: [
        {
          subject: "slope",
          fixed: true,
          frame: {
            position: { x: 0, y: 1, z: 0 },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 8),
          },
          points: {},
        },
      ],
      laws: [AutoMovieMotionHumanRide.HumanSurface.snowGlide],
      composition: HumanChain.subject("a").registered(
        AutoMovieMotionHumanRide.HumanSurface.snowGlide.name,
        {
          duration: 2,
          speed: 2,
          grade: 8,
          slope: "slope",
        } satisfies IAutoMovieMotionHumanSurface.ISnowGlideParams,
      ).node,
    }),
  );
  collectTakeClean(`${key} snow glide`, snow.performance, failures);
  for (const foot of ["leftFoot", "rightFoot"] as const) {
    const before: IAutoMovieVector3 = snow
      .bones("a", snow.duration * 0.4)
      .get(foot)!.worldPosition;
    const after: IAutoMovieVector3 = snow
      .bones("a", snow.duration * 0.8)
      .get(foot)!.worldPosition;
    const displacement: IAutoMovieVector3 = Vector3.subtract(after, before);
    const fall: number = -Math.tan((8 * Math.PI) / 180) * displacement.z;
    TestValidator.predicate(
      `${foot} moves downhill with the authored grade and no transverse travel`,
      displacement.z > 0.5 &&
        nclose(displacement.x, 0, CONTACT) &&
        nclose(displacement.y, fall, CONTACT),
    );
  }

  const drift: IAutoMovieMotionHumanSurface.IGlideMeasure =
    AutoMovieMotionHumanRide.HumanSurface.measureGlide(
      { point: plane.point, forward: FORWARD },
      { point: { x: 0.05, y: 0.02, z: 0.4 }, forward: FORWARD },
      plane,
    );
  TestValidator.predicate(
    "the glide reader distinguishes advance, side drift and normal clearance",
    nclose(drift.along, 0.4) &&
      nclose(drift.across, 0.05) &&
      nclose(drift.gap, 0.02),
  );
}
