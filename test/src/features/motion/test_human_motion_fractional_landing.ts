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
  IAutoMovieMotionHumanProp,
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
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * A fractional twist keeps its winding and supplies the floor stance's yaw.
 *
 * Scenarios:
 * 1. An average man twists +2¼ on the floor in two rigid placements. A
 *    small woman twists −2¼ in the translated, yawed scene. Unwrap the
 *    displayed yaw to count every revolution.
 * 2. Read either side of touchdown and throughout the planted phases.
 *    Check root attitude and position, anatomical range and the sole frame.
 * 3. Refuse a tipped endpoint, a raised destination without a prop, and
 *    a fractional twist onto a named fixed platform.
 *
 * The staged integration of #3601 requires #3564 and a compatible landing
 * outcome declared by the jump. Preserve the achieved endpoints, signed
 * turn clock and refusal of fractional turns without a compatible landing.
 * Explicit physical mode needs separate qualification under its existing
 * impulse and conservation bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bodies, signed cases, rigid placement, displayed seam and recovery, and three refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads public poses and displayed bones. A yaw reset, shortened winding, unchanged targets, displaced or rotated soles, clinical overshoot or admitted unsupported landing fails an assertion.
 * @evidence contracts/development/testing.md#independent-expectations A quarter rotation about +Y sends forward toward +X and each foot's lateral offset toward −Z. The equations apply that transform at the destination. The campaign's continuity and ground bounds are 5 mm, the staged attitude bound is 1e−6 rad, and clinical limits come from the product table.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite signs and different proportions, the positive turn before and after rigid placement, both sides of touchdown, interior absorption and final recovery distinguish a turn's winding and outcome. Integer staged flight and physical conservation have their own specifications.
 * @evidence contracts/development/testing.md#execution-ownership One portable unit uses two existing canonical bodies, three finite jumps, a fixed box fixture and three refused plans. It reads only public performance outputs.
 */
export function test_human_motion_fractional_landing(): void {
  const average: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const small: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const shifted: IAutoMovieVector3 = { x: 3, y: 0, z: -2 };
  for (const [body, at, yaw, twist] of [
    [average, origin, 0, 2.25],
    [average, shifted, 37, 2.25],
    [small, shifted, 37, -2.25],
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

    // Eight intervals resolve each increment below half a turn. The final
    // sample is on the planted side, independent of the exact boundary branch.
    const after: number = touchdown + 1e-6;
    const afterPose: IAutoMoviePose = film.pose("a", after);
    let sum: number = 0;
    let previous: number = heading;
    for (let index: number = 0; index <= 8; index++) {
      const u: number = index / 8;
      const pose: IAutoMoviePose =
        index === 8
          ? afterPose
          : film.pose("a", takeoff + (touchdown - takeoff) * u);
      const root: IAutoMovieQuaternion = pose.root!.rotation;
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(root, {
        x: 0, y: 0, z: 1,
      });
      const current: number = Math.atan2(forward.x, forward.z);
      sum += Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
      previous = current;
      upright(label, root, heading + winding * u);
      legalRom(label, pose);
    }
    TestValidator.predicate(
      `${label}: the complete signed winding survives`,
      Math.abs(sum - winding) <= 1e-6,
    );

    const before: number = touchdown - 1e-6;
    const beforeAngle: number =
      heading + winding * (before - takeoff) / (touchdown - takeoff);
    const beforeRoot: NonNullable<IAutoMoviePose["root"]> =
      film.pose("a", before).root!;
    const afterRoot: NonNullable<IAutoMoviePose["root"]> = afterPose.root!;
    upright(`${label}: airborne left limit`, beforeRoot.rotation, beforeAngle);
    TestValidator.predicate(
      `${label}: the root enters absorption without a position jump`,
      close(beforeRoot.translation, afterRoot.translation),
    );
    const beforeBones: ReturnType<HumanPerformance["bones"]> =
      film.bones("a", before);
    const plantBones: ReturnType<HumanPerformance["bones"]> =
      film.bones("a", after);
    const recovery: ReturnType<HumanPerformance["bones"]>[] = [];
    for (const seconds of [(touchdown + settled) / 2, settled, film.duration]) {
      const pose: IAutoMoviePose = film.pose("a", seconds);
      upright(
        `${label}: planted at ${seconds} s`,
        pose.root!.rotation,
        heading + winding,
      );
      legalRom(`${label}: planted at ${seconds} s`, pose);
      recovery.push(film.bones("a", seconds));
    }
    for (const side of ["left", "right"] as const) {
      const foot: `${typeof side}Foot` = `${side}Foot`;
      const contact: IAutoMovieResolvedBone = plantBones.get(foot)!;
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
      const footYaw: number =
        landed + (side === "left" ? 1 : -1) * stand.TOE_OUT * Math.PI / 180;
      for (const point of ["heel", "mtp", "toe"] as const) {
        /** Place a sole landmark using the displayed foot frame. */
        const sole = (bone: IAutoMovieResolvedBone): IAutoMovieVector3 =>
          HumanFoot.point(body, side, point, {
            ankle: bone.worldPosition,
            rotation: bone.worldRotation,
          });
        const planted: IAutoMovieVector3 = sole(contact);
        const target: IAutoMovieVector3 = HumanFoot.point(body, side, point, {
          ankle: expected,
          rotation: yawRotation(footYaw),
        });
        TestValidator.predicate(
          `${label}: ${foot} ${point} uses the turned footprint frame`,
          close(planted, target),
        );
        TestValidator.predicate(
          `${label}: ${foot} ${point} enters the plant without a jump`,
          close(sole(beforeBones.get(foot)!), planted),
        );
        TestValidator.predicate(
          `${label}: ${foot} ${point} lies on the floor`,
          nclose(planted.y, 0, 0.005),
        );
        for (const bones of recovery) {
          const recovered: IAutoMovieVector3 = sole(bones.get(foot)!);
          TestValidator.predicate(
            `${label}: ${foot} ${point} stays planted throughout recovery`,
            close(recovered, planted) && nclose(recovered.y, 0, 0.005),
          );
        }
      }
    }
  }

  refuse("parameter", "turns", (): HumanPerformance =>
    perform(average, origin, 0, { x: 0, y: 0, z: 1 }, { somersault: 0.5 }),
  );
  const raised: IAutoMovieVector3 = { x: 0, y: 0.2, z: 1 };
  refuse("affordance", "to", (): HumanPerformance =>
    perform(average, origin, 0, raised, { twist: 0.25 }),
  );

  // The box's top coincides with the authored destination.
  const platform: IAutoMovieMotionHumanProp = {
    subject: "platform",
    fixed: true,
    frame: {
      position: { ...raised, y: raised.y / 2 },
      rotation: Quaternion.identity(),
    },
    points: {
      top: {
        point: { x: 0, y: raised.y / 2, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
      },
    },
    shapes: [
      {
        kind: "box",
        id: "platform",
        material: "scenery",
        transform: { position: origin, rotation: Quaternion.identity() },
        halfExtents: { x: 0.4, y: raised.y / 2, z: 0.4 },
      },
    ],
  };
  refuse("affordance", "on", (): HumanPerformance =>
    perform(average, origin, 0, raised, { twist: 0.25 }, platform),
  );
}

/** Build the public authored jump without replacing any producer. */
function perform(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
  yaw: number,
  to: IAutoMovieVector3,
  rotation: NonNullable<IAutoMovieMotionHumanJump.IParams["rotation"]>,
  platform?: IAutoMovieMotionHumanProp,
): HumanPerformance {
  return new HumanPerformance({
    seed: "fractional-landing",
    performers: [{ subject: "a", body, at, yaw, proficiency: { level: "trained" } }],
    ...(platform === undefined ? {} : { props: [platform] }),
    composition: HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .jump(
        {
          to,
          apex: 0.5,
          rotation,
          ...(platform === undefined ? {} : { on: platform.subject }),
        },
        "turn",
      )
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
  TestValidator.predicate(
    label,
    Quaternion.angle(rotation, yawRotation(heading)) <= 1e-6,
  );
}

/** Express the expected yaw about world +Y from an angle in radians. */
function yawRotation(heading: number): IAutoMovieQuaternion {
  return { x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2) };
}

/** Scan the displayed anatomical channels against the clinical limits. */
function legalRom(label: string, pose: IAutoMoviePose): void {
  for (const joint of pose.joints) {
    const constraint: IAutoMovieJointConstraint | undefined =
      DEFAULT_HUMANOID_ROM[joint.bone];
    if (constraint !== undefined)
      scanJointRom(joint, constraint, (part: IAutoMovieScanJointRom.Part): void => {
        throw new Error(`${label}: ${joint.bone} ${part} exceeds the clinical range`);
      });
  }
}

/** The existing 5 mm continuity and contact bound, measured in world metres. */
function close(actual: IAutoMovieVector3, expected: IAutoMovieVector3): boolean {
  return Vector3.length(Vector3.subtract(actual, expected)) <= 0.005;
}

/** The mismatched outcome names the actionable input that needs repair. */
function refuse(
  kind: HumanRefusal["kind"],
  axis: string,
  construct: () => HumanPerformance,
): void {
  let refusal: unknown;
  try {
    construct();
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    `the fractional landing refuses with ${kind} on ${axis}: ${String(refusal)}`,
    refusal instanceof HumanRefusal &&
      refusal.kind === kind &&
      refusal.axis === axis,
  );
}
