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
import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { nclose } from "../internal/nclose";

/** Signed floor and contact distance allowed by #3095, in metres. */
const CONTACT: number = 0.0002;

/** Bounded native preparation accuracy, metres. */
const FIT_TOLERANCE: number = 0.000025;

/** One independently transformed hull vertex and its source shape. */
interface IVertex {
  /** The shape id from the actual physical profile. */
  shape: string;

  /** World vertex in metres. */
  point: IAutoMovieVector3;
}

/**
 * Public quiet Stand settles real soles and retains their supporting points.
 *
 * Scenarios:
 * 1. The canonical Human settles from its ordinary entry to the declared
 *    floor. Both heel and forefoot carry a coplanar point and support the COM.
 * 2. A different heading and stage elevation use the same actual geometry,
 *    maintaining the rocker pivot and admitted ankle and toe joints.
 * 3. A fixed-pelvis physical transfer of the authored stance retains the
 *    actual ground patches and satisfies every native joint. The hanging
 *    arms' roots and the two thighs start in no live self-contact. A falsely
 *    raised floor refuses the transfer and leaves the original pose untouched.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the public producer, independent observations and differing world frames.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public film's displayed rigid transforms at entry, during settling, at the event and after settling. It observes support, slip and clinical angles before the handoff. The public physical handoff supplies a separate pose for native limits and retained world support.
 * @evidence contracts/development/testing.md#independent-expectations Transforms each source vertex directly and compares it with the declared world plane. The combined mass center uses actual segment masses and placed local centers.
 * @evidence contracts/development/testing.md#distinguishing-cases Detects forefoot-only geometry at the held pose, penetration and slip across the rocker, a nonzero floor interpreted in a different heading, and an undeclared arm-root or thigh-root overlap at the native start.
 * @evidence contracts/development/testing.md#execution-ownership Uses in-memory motion evaluation and the real Human profile. It opens no render or simulated physics world.
 */
export function test_human_motion_stand_support_geometry(): void {
  const failures: string[] = [];
  for (const { name, floor, yaw } of [
    { name: "m-average", floor: 0, yaw: 0 },
    { name: "m-average", floor: 0.42, yaw: 37 },
    { name: "f-small", floor: 0, yaw: 37 },
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const subject: string = "standing";
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "standing support geometry",
      [{ subject, body, yaw, at: { x: 1, y: floor, z: -2 } }],
      HumanChain.subject(subject).stand({ seconds: 1, sway: 0 }),
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
    const support: IAutoMovieVector3[] = [];
    for (const side of ["left", "right"] as const) {
      const frames: IVertex[][] = poses.map(
        (bones: motionHumanLaw.Bones): IVertex[] =>
          vertices(
            body,
            (bone: string): IAutoMovieRigidTransform => transform(bones, bone),
            side,
          ),
      );
      const first: IVertex[] = frames[0]!;
      const last: IVertex[] = frames.at(-1)!;
      for (const part of [`${side}Subtalar`, `${side}Midfoot`]) {
        const touching: IVertex[] = last.filter(
          (vertex: IVertex): boolean =>
            (vertex.shape === part || vertex.shape.startsWith(`${part}.`)) &&
            nclose(vertex.point.y, floor, CONTACT),
        );
        if (touching.length === 0)
          failures.push(`yaw ${yaw}: ${part} is above the plane`);
        support.push(
          ...touching.map((vertex: IVertex): IAutoMovieVector3 => vertex.point),
        );
      }
      const initialY: number = minimum(first);
      const pivot: boolean = first.some(
        (vertex: IVertex, index: number): boolean =>
          nclose(vertex.point.y, initialY, CONTACT) &&
          frames.every((frame: IVertex[]): boolean => {
            const point: IAutoMovieVector3 = frame[index]!.point;
            return (
              nclose(point.y, minimum(frame), CONTACT) &&
              Math.hypot(point.x - vertex.point.x, point.z - vertex.point.z) <=
                CONTACT
            );
          }),
      );
      if (!pivot)
        failures.push(`yaw ${yaw}: ${side} foot moved its bearing point`);
      for (const [index, frame] of frames.entries()) {
        const height: number = minimum(frame);
        if (
          height < floor - CONTACT ||
          height > Math.max(initialY, floor) + CONTACT
        )
          failures.push(
            `yaw ${yaw}: ${side} foot at ${times[index]}s has height ${height}`,
          );
      }
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
  TestValidator.equals("displayed quiet Stand support", failures, []);
}

/** Compare the entire fitted pose to the displayed source without reposing the source. */
function checkTransfer(
  body: IAutoMovieMotionHumanBody,
  bones: motionHumanLaw.Bones,
  floor: number,
  failures: string[],
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
  // limbs on the first substep: the hanging arms' roots against the trunk
  // and the two thighs' roots must be declared or apart.
  for (const [a, b] of [
    ["spine", "leftUpperArm"],
    ["spine", "rightUpperArm"],
    ["hips", "leftUpperArm"],
    ["hips", "rightUpperArm"],
    ["leftUpperLeg", "rightUpperLeg"],
  ] as const) {
    if (isPhysicalProfilePairExcluded(profile, a, b)) continue;
    const shapes = (bone: string): IAutoMoviePhysicalSegment["shapes"] =>
      profile.segments.find(
        (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === bone,
      )!.shapes;
    const separation: number = Math.min(
      ...shapes(a).flatMap((x: IAutoMoviePhysicalSegment["shapes"][number]) =>
        shapes(b).map(
          (y: IAutoMoviePhysicalSegment["shapes"][number]): number =>
            physicalShapePairDistance(native[a]!, x, native[b]!, y),
        ),
      ),
    );
    if (separation < -CONTACT)
      failures.push(
        `${profile.id} native ${a}~${b}: live self-contact ${separation} m deep`,
      );
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

  for (const name of [
    "hips",
    "leftFoot",
    "leftToes",
    "rightFoot",
    "rightToes",
  ]) {
    const expected: IAutoMovieRigidTransform = goals[name]!;
    const fitted: IAutoMovieRigidTransform = native[name]!;
    const translation: number = Vector3.length(
      Vector3.subtract(fitted.position, expected.position),
    );
    const relative: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
      Quaternion.inverse(expected.rotation),
      fitted.rotation,
    );
    const turn: number =
      2 *
      Math.atan2(
        Math.hypot(relative.x, relative.y, relative.z),
        Math.abs(relative.w),
      );
    if (translation > FIT_TOLERANCE || turn > 1e-6)
      failures.push(
        `${profile.id} transfer ${name}: moved ${translation} m, turned ${turn} rad`,
      );
  }

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
