import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
  scanJointRom,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieScanJointRom,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFoot,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A fractional twist keeps its winding and supplies the floor stance's yaw.
 *
 * Scenarios:
 * 1. An authored +2¼ twist on the floor, at the origin and with a translated,
 *    yawed entry, and −2¼ in the transformed scene. Unwrap observed root
 *    heading increments to distinguish either winding from a short turn.
 * 2. The take-off heading follows travel; the airborne left limit, touchdown
 *    and absorption end use the corresponding upright terminal heading.
 *    Check clinical range, foot seam and unchanging flat floor footprints.
 * 3. A half somersault and a fractional twist with a raised destination
 *    without a supporting prop refuse on their offending axes before flight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the signed cases, transformed placement, displayed winding, body range, support and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public chain and reads the displayed body. Resetting yaw at touchdown, discarding full turns, keeping the original unturned footprints, moving or lifting a foot in absorption, or admitting a tilted or unsupported endpoint violates an assertion.
 * @evidence contracts/development/testing.md#independent-expectations A quarter rotation about +Y sends forward toward +X and each foot's lateral offset toward −Z; the equations apply that same general transform at the destination. The leap keeps its complete signed angle. The 5 mm placement allowance is the campaign's ground and continuity bound; 1e−6 rad is the staged flight attitude bound. Default clinical ROM comes from the product table.
 * @evidence contracts/development/testing.md#distinguishing-cases Two windings of equal magnitude, the same turn before and after rigid placement, the seam's left limit and planted recovery, and two refusals. The staged-flight and physical momentum specifications cover integer and conservation behavior independently.
 * @evidence contracts/development/testing.md#execution-ownership One portable exported unit uses one shared canonical body, three finite jumps and two refused plans, without hosts, counters, instrumented laws, or foreign replacement.
 */
export function test_human_motion_fractional_landing(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const shifted: IAutoMovieVector3 = { x: 3, y: 0, z: -2 };
  for (const [at, yaw, twist] of [
    [origin, 0, 2.25],
    [shifted, 37, 2.25],
    [shifted, 37, -2.25],
  ] as const) {
    const to: IAutoMovieVector3 = {
      x: at.x + Math.sin(yaw * Math.PI / 180),
      y: 0,
      z: at.z + Math.cos(yaw * Math.PI / 180),
    };
    const film: HumanPerformance = perform(body, at, yaw, to, { twist });
    const takeoff: number = event(film, "takeoff");
    const touchdown: number = event(film, "touchdown");
    const settled: number = event(film, "settled");
    const heading: number = yaw * Math.PI / 180;
    const winding: number = 2 * Math.PI * twist;
    const label: string = `${twist} turns from ${yaw} degrees`;

    // Eight intervals resolve each signed increment strictly below half a turn.
    let sum: number = 0;
    let previous: number = heading;
    for (let index: number = 0; index <= 8; index++) {
      const u: number = index / 8;
      const pose: IAutoMoviePose = film.pose(
        "a",
        takeoff + (touchdown - takeoff) * u,
      );
      const root: IAutoMovieQuaternion = pose.root!.rotation;
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(root, {
        x: 0, y: 0, z: 1,
      });
      const current: number = Math.atan2(forward.x, forward.z);
      sum += Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
      previous = current;
      upright(label, root, heading + winding * u);
      for (const joint of pose.joints) {
        const constraint: IAutoMovieJointConstraint | undefined =
          DEFAULT_HUMANOID_ROM[joint.bone];
        if (constraint !== undefined)
          scanJointRom(
            joint,
            constraint,
            (part: IAutoMovieScanJointRom.Part): void => {
              throw new Error(
                `${label}: ${joint.bone} ${part} exceeds the clinical range`,
              );
            },
          );
      }
    }
    TestValidator.predicate(
      `${label}: the complete signed winding survives`,
      Math.abs(sum - winding) <= 1e-6,
    );

    const before: number = touchdown - 1e-6;
    const beforeAngle: number =
      heading + winding * (before - takeoff) / (touchdown - takeoff);
    upright(label, film.pose("a", before).root!.rotation, beforeAngle);
    upright(label, film.pose("a", settled).root!.rotation, heading + winding);
    const beforeBones: ReturnType<HumanPerformance["bones"]> = film.bones("a", before);
    const touchBones: ReturnType<HumanPerformance["bones"]> =
      film.bones("a", touchdown);
    const settledBones: ReturnType<HumanPerformance["bones"]> =
      film.bones("a", settled);
    for (const side of ["left", "right"] as const) {
      const foot: `${typeof side}Foot` = `${side}Foot`;
      const contact: IAutoMovieResolvedBone = touchBones.get(foot)!;
      const lateral: number = body.rest.get(foot)!.x;
      const landed: number = heading + winding;
      const expected: IAutoMovieVector3 = {
        x: to.x + lateral * Math.cos(landed),
        y: body.measure.ankleHeight,
        z: to.z - lateral * Math.sin(landed),
      };
      TestValidator.predicate(
        `${label}: ${foot} uses the turned target`,
        close(contact.worldPosition, expected),
      );
      TestValidator.predicate(
        `${label}: ${foot} enters the plant without a jump`,
        close(beforeBones.get(foot)!.worldPosition, contact.worldPosition),
      );
      TestValidator.predicate(
        `${label}: ${foot} stays at the plant through absorption`,
        close(settledBones.get(foot)!.worldPosition, contact.worldPosition),
      );
      for (const point of ["heel", "mtp"] as const) {
        for (const bone of [contact, settledBones.get(foot)!]) {
          const position: IAutoMovieVector3 = HumanFoot.point(body, side, point, {
            ankle: bone.worldPosition,
            rotation: bone.worldRotation,
          });
          TestValidator.predicate(
            `${label}: ${foot} ${point} lies on the floor`,
            Math.abs(position.y) <= 0.005,
          );
        }
      }
    }
  }

  refuse("turns", (): HumanPerformance =>
    perform(body, origin, 0, { x: 0, y: 0, z: 1 }, { somersault: 0.5 }),
  );
  refuse("to", (): HumanPerformance =>
    perform(body, origin, 0, { x: 0, y: 0.2, z: 1 }, { twist: 0.25 }),
  );
}

/** Build the public authored jump without replacing any producer. */
function perform(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
  yaw: number,
  to: IAutoMovieVector3,
  rotation: NonNullable<IAutoMovieMotionHumanJump.IParams["rotation"]>,
): HumanPerformance {
  return new HumanPerformance({
    seed: "fractional-landing",
    performers: [{ subject: "a", body, at, yaw, proficiency: { level: "trained" } }],
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .jump({ to, apex: 0.5, rotation }, "turn")
      .node,
  });
}

/** Read a declared jump phase without assuming a flight duration. */
function event(film: HumanPerformance, name: string): number {
  const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
  const found: IAutoMovieMotionEvent = segment.plan.events.find(
    (entry: IAutoMovieMotionEvent): boolean => entry.name === name,
  )!;
  return segment.start + found.share * segment.plan.duration;
}

/** Compare the displayed attitude with pure yaw about world up. */
function upright(label: string, rotation: IAutoMovieQuaternion, heading: number): void {
  const expected: IAutoMovieQuaternion = {
    x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2),
  };
  TestValidator.predicate(label, Quaternion.angle(rotation, expected) <= 1e-6);
}

/** The existing 5 mm continuity and contact bound, measured in world metres. */
function close(actual: IAutoMovieVector3, expected: IAutoMovieVector3): boolean {
  return Vector3.length(Vector3.subtract(actual, expected)) <= 0.005;
}

/** The mismatched outcome names the actionable input that needs repair. */
function refuse(axis: string, construct: () => HumanPerformance): void {
  let refusal: unknown;
  try {
    construct();
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    `the fractional landing refuses on ${axis}: ${String(refusal)}`,
    refusal instanceof HumanRefusal && refusal.axis === axis,
  );
}
