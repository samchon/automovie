import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  convexHull2D,
  decomposeJointRotation,
  isPhysicalProfilePairExcluded,
  jointRomOvershoot,
  measurePhysicalJointLimits,
  physicalShapePairDistance,
} from "@automovie/engine";
import { fitHumanPhysicalStandingPose } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { nclose } from "../../../features/internal/nclose";

/** Signed floor and contact distance allowed by #3095, in metres. */
const CONTACT: number = 0.0002;

/** Bounded native preparation accuracy, metres. */
const FIT_TOLERANCE: number = 0.000025;

/**
 * How far the handoff may turn a thigh, radians: the planting turn is taken
 * by the ankle and the shank, and the thigh moves only as the native fit
 * brings an authored ankle that stands a fraction of a milliradian past its
 * range back inside it.
 */
const LEG_TURN: number = 0.001;

/**
 * How much less of a drop a leg must need than the other for the handoff to
 * bend it, metres: a micrometre, far above the fit's 1e-9 m reach roundoff,
 * past which a leg left unbent would miss its ankle and fail the native
 * anchor check.
 */
const REACH: number = 0.000001;

/** One independently transformed hull vertex and its source shape. */
interface IVertex {
  /** The shape id from the actual physical profile. */
  shape: string;

  /** World vertex in metres. */
  point: IAutoMovieVector3;
}

/**
 * Public quiet Stand settles on its sole sockets, and the physical handoff
 * plants the collider soles under it.
 *
 * Scenarios:
 * 1. The canonical Human settles from its ordinary entry to the declared
 *    floor: heel, ball and toe sockets level on it, the COM over them, and
 *    the ankle and toe joints admitted.
 * 2. A different heading and stage elevation settle the same way.
 * 3. The physical transfer sets the pelvis straight down without turning it
 *    and plants each foot by a turn in its ankle's flexion direction about
 *    its forefoot's bearing point, the thighs keeping their place, so the
 *    heel
 *    and forefoot hulls both touch the floor and carry the COM, whose drawn
 *    heel stands above the sockets' plane; every native joint is satisfied
 *    and no collider pair the profile does not declare overlapping starts
 *    in contact. A falsely raised floor refuses the transfer and leaves the
 *    original pose untouched.
 * 4. A tall body and a large body, whose forearms hang against a wider
 *    waist, settle and transfer the same way.
 * 5. After a planted 80 mm weight shift the legs need different drops: the
 *    body goes down by the deeper need, computed from the authored knee and
 *    the planted ankle, and the other leg bends its knee further to reach its
 *    planted ankle, with every other check of scenario 3.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the public producer, independent observations and differing world frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public film's displayed rigid transforms at entry, during settling, at the event and after settling. It observes support, slip and clinical angles before the handoff. The public physical handoff supplies a separate pose for native limits and retained world support.
 * @evidence contracts/development/testing.md#independent-expectations Transforms each source vertex directly and compares it with the declared world plane. The combined mass center uses actual segment masses and placed local centers.
 * @evidence contracts/development/testing.md#distinguishing-cases Detects a tilted or floating socket sole, a nonzero floor interpreted in a different heading, a handoff that leaves the heel hull up, turns or shifts the pelvis sideways, turns a thigh in a symmetric stance, sets the body down by other than the deeper leg need, leaves the shorter leg unbent in an asymmetric stance, or moves a bearing point, an undeclared self-overlap at the native start, and a large body's forearm against the waist.
 * @evidence contracts/development/testing.md#execution-ownership Uses in-memory motion evaluation and the real Human profile. It opens no render or simulated physics world.
 */
export function test_motion_support_stand_support_geometry(): void {
  const failures: string[] = [];
  for (const { name, floor, yaw } of [
    { name: "m-average", floor: 0, yaw: 0 },
    { name: "m-average", floor: 0.42, yaw: 37 },
    { name: "f-small", floor: 0, yaw: 37 },
    { name: "m-tall", floor: 0, yaw: 0 },
    { name: "m-large", floor: 0, yaw: 0 },
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const subject: string = "standing";
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "standing support geometry",
      [{ subject, body, yaw, at: { x: 1, y: floor, z: -2 } }],
      HumanChain.subject(subject).stand({ hold: 1, sway: 0 }),
    );
    const settled: number = motionHumanLaw.event(film, "settled", subject);
    const times: number[] = [
      ...[0, 0.15, 0.35, 0.55, 0.75, 0.9, 1].map(
        (share: number): number => share * settled,
      ),
      (settled + film.duration) / 2,
    ];
    const poses: motionHumanLaw.Bones[] = times.map(
      (time: number): motionHumanLaw.Bones => film.bones(subject, time),
    );
    const hold: motionHumanLaw.Bones = poses.at(-1)!;

    // The motion foot model stands a foot flat on its sockets: once settled,
    // heel, ball and toe share one height on the floor, within the model's
    // bearing allowance and never below it.
    const support: IAutoMovieVector3[] = [];
    for (const side of ["left", "right"] as const) {
      const sockets: IAutoMovieVector3[] = HumanFoot.sockets(
        body,
        hold,
        side,
      ).map(
        (
          socket: ReturnType<typeof HumanFoot.sockets>[number],
        ): IAutoMovieVector3 => socket.point,
      );
      const heights: number[] = sockets.map(
        (point: IAutoMovieVector3): number => point.y,
      );
      if (
        Math.max(...heights) - Math.min(...heights) > CONTACT ||
        Math.min(...heights) < floor - CONTACT ||
        Math.max(...heights) > floor + HumanFoot.BEARING
      )
        failures.push(
          `yaw ${yaw}: ${side} sole sockets at ${JSON.stringify(heights)} over ${floor}`,
        );
      support.push(...sockets);
    }

    if (
      !supportsCenter(
        body,
        support,
        (bone: string): IAutoMovieRigidTransform => transform(hold, bone),
      )
    )
      failures.push(`yaw ${yaw}: mass center outside the real base of support`);

    for (const [index, bones] of poses.entries())
      for (const joint of body.profile.joints) {
        if (!/^(left|right)(Foot|Toes)$/.test(joint.child)) continue;
        const parent: IAutoMovieRigidTransform = transform(bones, joint.parent);
        const child: IAutoMovieRigidTransform = transform(bones, joint.child);
        const gap: number = anchorGap(joint, parent, child);
        const local: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
          Quaternion.inverse(parent.rotation),
          child.rotation,
        );
        const bone: AutoMovieHumanoidBone =
          joint.child as AutoMovieHumanoidBone;
        const constraint: IAutoMovieJointConstraint | null =
          DEFAULT_HUMANOID_ROM[bone] ?? null;
        const angular: IAutoMovieResolvedJointAngles = decomposeJointRotation(
          local,
          HUMANOID_JOINT_AXES[bone],
          HUMANOID_REST_FRAME[bone],
          { bone, constraint },
        );
        const overshoot: number = jointRomOvershoot(
          { bone, ...angular },
          constraint,
        );
        if (gap > CONTACT || overshoot > 1e-6)
          failures.push(
            `${name} yaw ${yaw} at ${times[index]}s ${joint.id}: anchor ${gap} m, clinical excess ${overshoot} degrees`,
          );
      }
    checkTransfer(body, hold, floor, failures);
  }

  // An asymmetric stance: after a planted 80 mm weight shift the two legs
  // need different drops, so the leg left nearer its ankle bends.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const shifted: HumanPerformance = new HumanPerformance({
    seed: "stand-support-shift",
    performers: [
      {
        subject: "standing",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanStance.shiftStandingWeight],
    composition: HumanChain.subject("standing")
      .stand({ hold: 0.6, sway: 0 })
      .registered("shiftStandingWeight", {
        by: -0.08,
        duration: 0.8,
        hold: 0.6,
      }).node,
  });
  checkTransfer(
    body,
    shifted.bones("standing", shifted.segments("standing")[1]!.start + 1.1),
    0,
    failures,
    true,
  );
  TestValidator.equals("displayed quiet Stand support", failures, []);
}

/** Compare the entire fitted pose to the displayed source without reposing the source. */
function checkTransfer(
  body: IAutoMovieMotionHumanBody,
  bones: motionHumanLaw.Bones,
  floor: number,
  failures: string[],
  asymmetric: boolean = false,
): void {
  const profile: IAutoMovieMotionHumanBody["profile"] = body.profile;
  const goals: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        transform(bones, segment.bone),
      ],
    ),
  );
  const original: string = JSON.stringify(goals);
  const transferred: ReturnType<typeof fitHumanPhysicalStandingPose> =
    fitHumanPhysicalStandingPose({
      profile,
      targets: goals,
      floor,
      tolerance: FIT_TOLERANCE,
      iterations: 32,
    });
  if (transferred.kind !== "fitted") {
    failures.push(
      `${profile.id}: transfer refused ${transferred.reason} with residual ${transferred.residual}`,
    );
    return;
  }
  const native: Record<string, IAutoMovieRigidTransform> = transferred.targets;

  // A live self-contact pair overlapping at the native start ejects the
  // limbs on the first substep: every pair the profile does not declare
  // overlapping must start apart.
  for (const [i, a] of profile.segments.entries())
    for (const b of profile.segments.slice(i + 1)) {
      if (isPhysicalProfilePairExcluded(profile, a.bone, b.bone)) continue;
      for (const x of a.shapes)
        for (const y of b.shapes) {
          const separation: number = physicalShapePairDistance(
            native[a.bone]!,
            x,
            native[b.bone]!,
            y,
          );
          if (separation < -CONTACT)
            failures.push(
              `${profile.id} native ${a.bone}/${x.id}~${b.bone}/${y.id}: live self-contact ${separation} m deep`,
            );
        }
    }

  for (const joint of profile.joints) {
    const parent: IAutoMovieRigidTransform = native[joint.parent]!;
    const child: IAutoMovieRigidTransform = native[joint.child]!;
    const gap: number = anchorGap(joint, parent, child);
    for (const coordinate of measurePhysicalJointLimits(joint, parent, child))
      if (gap > 1e-9 || coordinate.violation > 1e-9)
        failures.push(
          `${profile.id} native ${joint.id}/${coordinate.axis}: anchor ${gap} m, excess ${coordinate.violation} rad`,
        );
  }

  // The pelvis keeps its orientation and horizontal place and is only set
  // down. Each foot is only planted: turned about a horizontal axis, its
  // ankle keeping its place over the floor.
  {
    const moved: IAutoMovieVector3 = Vector3.subtract(
      native.hips!.position,
      goals.hips!.position,
    );
    if (
      Math.hypot(moved.x, moved.z) > FIT_TOLERANCE ||
      moved.y > FIT_TOLERANCE ||
      turnAngle(goals.hips!.rotation, native.hips!.rotation) > 1e-6
    )
      failures.push(
        `${profile.id} transfer moved the pelvis ${JSON.stringify(moved)}`,
      );
  }
  const thighs: Record<"left" | "right", number> = { left: 0, right: 0 };
  const knees: Record<"left" | "right", number> = { left: 0, right: 0 };
  for (const side of ["left", "right"] as const) {
    const source: IVertex[] = vertices(
      body,
      (bone: string): IAutoMovieRigidTransform => goals[bone]!,
      side,
    );
    const fitted: IVertex[] = vertices(
      body,
      (bone: string): IAutoMovieRigidTransform => native[bone]!,
      side,
    );
    const index: number = source.reduce(
      (best: number, vertex: IVertex, i: number): number =>
        vertex.shape.startsWith(`${side}Midfoot`) &&
        (best < 0 || vertex.point.y < source[best]!.point.y)
          ? i
          : best,
      -1,
    );
    const from: IAutoMovieVector3 = source[index]!.point;
    const to: IAutoMovieVector3 = fitted[index]!.point;
    thighs[side] = turnAngle(
      goals[`${side}UpperLeg`]!.rotation,
      native[`${side}UpperLeg`]!.rotation,
    );
    knees[side] = knee(native, side) - knee(goals, side);
    if (Math.hypot(to.x - from.x, to.z - from.z) > CONTACT)
      failures.push(
        `${profile.id} transfer ${side}: bearing point moved ${Math.hypot(to.x - from.x, to.z - from.z)} m sideways`,
      );
  }

  // Each leg needs the body set down until its authored knee stands a
  // shank's length from its planted ankle; the body goes down by the larger
  // need. A symmetric stance's legs need it alike and keep their thighs. In
  // an asymmetric one the other leg is left nearer its ankle than a straight
  // reach, so it bends its knee further than the leg that set the drop.
  const needs: Record<"left" | "right", number> = {
    left: need(profile, goals, native, "left"),
    right: need(profile, goals, native, "right"),
  };
  const drop: number = goals.hips!.position.y - native.hips!.position.y;
  const deeper: "left" | "right" = needs.left >= needs.right ? "left" : "right";
  const other: "left" | "right" = deeper === "left" ? "right" : "left";
  if (Math.abs(drop - needs[deeper]) > CONTACT)
    failures.push(
      `${profile.id} transfer: body set down ${drop} m, the legs need ${JSON.stringify(needs)} m`,
    );
  if (
    asymmetric
      ? !(
          needs[deeper] - needs[other] > REACH &&
          knees[other] - knees[deeper] > LEG_TURN
        )
      : thighs.left > LEG_TURN || thighs.right > LEG_TURN
  )
    failures.push(
      `${profile.id} transfer: legs need ${JSON.stringify(needs)} m, thighs turned ${JSON.stringify(thighs)} rad, knees bent ${JSON.stringify(knees)} rad more`,
    );

  const nativeSupport: IAutoMovieVector3[] = [];
  for (const side of ["left", "right"] as const) {
    const points: IVertex[] = vertices(
      body,
      (bone: string): IAutoMovieRigidTransform => native[bone]!,
      side,
    );
    const minimumY: number = minimum(points);
    nativeSupport.push(
      ...points
        .filter((point: IVertex): boolean =>
          nclose(point.point.y, floor, CONTACT),
        )
        .map((point: IVertex): IAutoMovieVector3 => point.point),
    );
    if (minimumY < floor - CONTACT)
      failures.push(
        `${profile.id} native ${side}: penetrates ${floor - minimumY} m`,
      );
    for (const part of [`${side}Subtalar`, `${side}Midfoot`])
      if (
        !points.some(
          (point: IVertex): boolean =>
            (point.shape === part || point.shape.startsWith(`${part}.`)) &&
            nclose(point.point.y, floor, CONTACT),
        )
      )
        failures.push(`${profile.id} native ${part}: no actual contact`);
  }

  if (
    !supportsCenter(
      body,
      nativeSupport,
      (bone: string): IAutoMovieRigidTransform => native[bone]!,
    )
  )
    failures.push(`${profile.id}: native mass center outside shared support`);

  const refused: ReturnType<typeof fitHumanPhysicalStandingPose> =
    fitHumanPhysicalStandingPose({
      profile,
      targets: goals,
      floor: floor + 0.01,
      tolerance: FIT_TOLERANCE,
      iterations: 32,
    });
  if (refused.kind !== "unresolved" || refused.reason !== "support-plane")
    failures.push(
      `${profile.id}: transfer accepted a raised floor through the source sole`,
    );
  if (
    transferred.residual > FIT_TOLERANCE ||
    JSON.stringify(goals) !== original
  )
    failures.push(
      `${profile.id}: transfer changed the owned goals or exceeded residual accuracy`,
    );
}

/**
 * How far the body must be set straight down for a leg's authored knee to
 * stand a shank's length from its planted ankle, metres: the smaller root
 * of |knee − drop·up − ankle| = shank.
 */
function need(
  profile: IAutoMovieMotionHumanBody["profile"],
  goals: Readonly<Record<string, IAutoMovieRigidTransform>>,
  native: Readonly<Record<string, IAutoMovieRigidTransform>>,
  side: "left" | "right",
): number {
  const anchor = (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    child: string,
  ): IAutoMovieVector3 => {
    const joint: IAutoMovieMotionHumanBody["profile"]["joints"][number] =
      profile.joints.find((candidate): boolean => candidate.child === child)!;
    return Vector3.add(
      poses[child]!.position,
      Quaternion.rotateVector(
        poses[child]!.rotation,
        joint.childFrame.position,
      ),
    );
  };
  const knee: IAutoMovieVector3 = anchor(goals, `${side}LowerLeg`);
  const shank: number = Vector3.length(
    Vector3.subtract(anchor(goals, `${side}Foot`), knee),
  );
  const v: IAutoMovieVector3 = Vector3.subtract(
    knee,
    anchor(native, `${side}Foot`),
  );
  return v.y - Math.sqrt(v.y * v.y - Vector3.dot(v, v) + shank * shank);
}

/** A knee's bend: the angle between the thigh and the shank at their anchors, radians. */
function knee(
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  side: "left" | "right",
): number {
  const hip: IAutoMovieVector3 = poses[`${side}UpperLeg`]!.position;
  const middle: IAutoMovieVector3 = poses[`${side}LowerLeg`]!.position;
  const ankle: IAutoMovieVector3 = poses[`${side}Foot`]!.position;
  const thigh: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(middle, hip),
  );
  const shank: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(ankle, middle),
  );
  return Math.acos(Math.max(-1, Math.min(1, Vector3.dot(thigh, shank))));
}

/** The angle of the rotation from one orientation to another, radians. */
function turnAngle(
  from: IAutoMovieRigidTransform["rotation"],
  to: IAutoMovieRigidTransform["rotation"],
): number {
  const relative: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(from),
    to,
  );
  return (
    2 *
    Math.atan2(
      Math.hypot(relative.x, relative.y, relative.z),
      Math.abs(relative.w),
    )
  );
}

/** Separate a joint's positional anchors from its angular rule. */
function anchorGap(
  joint: IAutoMoviePhysicalJoint,
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): number {
  return Vector3.length(
    Vector3.subtract(
      Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
      ),
      Vector3.add(
        child.position,
        Quaternion.rotateVector(child.rotation, joint.childFrame.position),
      ),
    ),
  );
}

/** Actual world pose of an admitted canonical bone. */
function transform(
  bones: motionHumanLaw.Bones,
  bone: string,
): IAutoMovieRigidTransform {
  const found: NonNullable<ReturnType<motionHumanLaw.Bones["get"]>> = bones.get(
    bone as AutoMovieHumanoidBone,
  )!;
  return { position: found.worldPosition, rotation: found.worldRotation };
}

/** Derive the mass center independently from the displayed segment placements. */
function supportsCenter(
  body: IAutoMovieMotionHumanBody,
  support: readonly IAutoMovieVector3[],
  at: (bone: string) => IAutoMovieRigidTransform,
): boolean {
  const hull: IAutoMovieVector3[] = convexHull2D(support);
  if (hull.length < 3) return false;
  const center: IAutoMovieVector3 = body.profile.segments.reduce(
    (
      sum: IAutoMovieVector3,
      segment: IAutoMoviePhysicalSegment,
    ): IAutoMovieVector3 => {
      const pose: IAutoMovieRigidTransform = at(segment.bone);
      const point: IAutoMovieVector3 = Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, segment.centerOfMass),
      );
      return Vector3.add(
        sum,
        Vector3.scale(point, segment.mass / body.profile.mass),
      );
    },
    { x: 0, y: 0, z: 0 },
  );
  return hull.every((a: IAutoMovieVector3, index: number): boolean => {
    const b: IAutoMovieVector3 = hull[(index + 1) % hull.length]!;
    return (b.x - a.x) * (center.z - a.z) - (b.z - a.z) * (center.x - a.x) > 0;
  });
}

/** Project the authored profile's foot and toes into the displayed pose. */
function vertices(
  body: IAutoMovieMotionHumanBody,
  at: (bone: string) => IAutoMovieRigidTransform,
  side: "left" | "right",
): IVertex[] {
  const output: IVertex[] = [];
  for (const segment of body.profile.segments) {
    if (segment.bone !== `${side}Foot` && segment.bone !== `${side}Toes`)
      continue;
    for (const shape of segment.shapes) {
      if (shape.kind !== "hull")
        throw new Error("Expected canonical sole hull");
      const pose: IAutoMovieRigidTransform = at(segment.bone);
      for (const point of shape.points)
        output.push({
          shape: shape.id,
          point: Vector3.add(
            pose.position,
            Quaternion.rotateVector(
              pose.rotation,
              Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, point),
              ),
            ),
          ),
        });
    }
  }
  return output;
}

/** The actual world's lowest vertex. */
function minimum(points: readonly IVertex[]): number {
  return Math.min(...points.map((vertex: IVertex): number => vertex.point.y));
}
