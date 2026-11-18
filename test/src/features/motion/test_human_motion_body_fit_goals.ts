import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBodyFit,
  HumanChain,
  HumanHand,
  HumanPerformance,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Geometric angle and physical centre goals share the whole-body fit with
 * contact constraints, without changing joint ranges or treating one bone
 * as the centre of mass.
 *
 * Each body starts from a lifted standing posture with its legs' goals
 * resolved into joints, the posture the fit reads.
 *
 * Scenarios:
 * 1. On three different bodies, a centre goal projected onto a diagonal
 *    direction moves a lifted body's root by the analytically required
 *    translation. Scaling the projection direction changes nothing.
 * 2. A right-angled triangle carried by the head, whose vertex is the mean
 *    of two symmetric points, remains 90 degrees under translated and
 *    turned root frames.
 * 3. The left elbow reaches an included angle of 120 degrees while the
 *    mass centre reaches its new z coordinate in the same fit. A canonical
 *    hinged elbow therefore has 60 degrees of clinical flexion.
 * 4. An interval reaches its nearest admissible boundary rather than its
 *    midpoint. The same angle with only root translation is reported unmet;
 *    coincident landmark rays are rejected explicitly.
 * 5. The sprint consumer on small, average and short-armed bodies keeps all
 *    four contacts, front knee 90, rear knee 117 +/- 11, front hip 43 +/- 6
 *    degrees and the sex-matched centre projection within 1 mm. A translated
 *    90-degree heading exercises the constraint's coordinate frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the five scenarios, the independent geometric and mass expectations and every physical bound.
 * @evidence contracts/development/testing.md#behavioral-verification Fits actual bodies through HumanBodyFit and reads displayed bones through the public pose and mass owners; then performs the sprint law through HumanPerformance, so an unwired row, incorrect Jacobian or law that discards the fitted contacts fails.
 * @evidence contracts/development/testing.md#independent-expectations Translation follows scalar projection algebra, a rigid right triangle stays 90 degrees and an elbow's included angle is 180 minus flexion. Sprint angles are Cavedon et al. 2019 table 2; centre positions are Ciacci 2017 and Slawinski 2010 as reported by Valamatos et al. 2022; 1 mm is the existing sprint contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Three body proportions and masses, a composite landmark, non-unit directional axes, simultaneous angle and centre targets, an impossible frozen angle, a degenerate ray and a rotated translated sprint.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory CPU tests on the existing polygon-body fixtures; no renderer, private compiler or mutated global is used.
 */
export function test_human_motion_body_fit_goals(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const metre: number = HumanBodyFit.TOLERANCE;
  const degree: number = (metre * 180) / Math.PI;
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const included: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
  ) => number = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
  ): number => {
    const u: IAutoMovieVector3 = Vector3.subtract(a, b);
    const v: IAutoMovieVector3 = Vector3.subtract(c, b);
    return (
      (Math.atan2(Vector3.length(Vector3.cross(u, v)), Vector3.dot(u, v)) *
        180) /
      Math.PI
    );
  };
  const centre: (
    body: IAutoMovieMotionHumanBody,
    bones: Bones,
  ) => IAutoMovieVector3 = (
    body: IAutoMovieMotionHumanBody,
    bones: Bones,
  ): IAutoMovieVector3 =>
    resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
      bones,
    );
  const bonesOf: (
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ) => Bones = (
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Bones => poseBones(body, resolveHumanPosture(body, posture));
  const elbow: NonNullable<
    IAutoMovieMotionHumanBodyFitTypes.IProps["angles"]
  >[number] = {
    points: [
      [{ bone: "leftUpperArm" }],
      [{ bone: "leftLowerArm" }],
      [{ bone: "leftHand" }],
    ],
    degrees: 120,
  };
  for (const name of ["f-small", "m-average", "m-short-armed"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const yaw: number = name === "m-short-armed" ? 90 : 0;
    // The fit reads a posture by its joints, its limb goals already resolved
    // into them (`IAutoMovieMotionHumanBodyFitTypes.IProps.posture`), so the
    // standing legs' goals are resolved first and the fit starts from the
    // body the centre below is read on.
    const stood: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      { x: 0.7, y: body.measure.stature, z: -0.4 },
      yaw,
    );
    const entry: IAutoMovieMotionHumanPosture = {
      ...stood,
      joints: Object.fromEntries(
        resolveHumanPosture(body, stood).joints.map(
          (
            joint: IAutoMovieJointPose,
          ): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
            joint.bone,
            [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
          ],
        ),
      ),
      limbs: {},
    };
    const before: IAutoMovieVector3 = centre(body, bonesOf(body, entry));

    // 1. Projection onto (1, 0, 1)/sqrt(2): its minimum-norm translation
    // has equal x and z components of 0.03/sqrt(2), independent of mass.
    const travel: number = 0.03;
    const moved: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: entry,
      variables: [
        { kind: "place", axis: "x" },
        { kind: "place", axis: "z" },
      ],
      centre: {
        point: Vector3.add(before, {
          x: travel / Math.SQRT2,
          y: 0,
          z: travel / Math.SQRT2,
        }),
        axes: [{ x: 2, y: 0, z: 2 }],
      },
    });
    all.check(
      `${name} projected centre converged (${moved.reason})`,
      moved.converged,
    );
    for (const axis of ["x", "z"] as const) {
      const translated: number = moved.posture.root[axis] - entry.root[axis];
      all.check(
        `${name} root ${axis} translates by the analytical projection: ${(translated * 1000).toFixed(2)} mm, ${((travel / Math.SQRT2) * 1000).toFixed(2)} mm expected`,
        Math.abs(translated - travel / Math.SQRT2) <= metre,
      );
    }

    // 2. All three landmarks ride one rigid head; averaging +/-z points
    // gives its exact origin, so every heading preserves a right triangle.
    const rigid: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: entry,
      variables: [{ kind: "place", axis: "z" }],
      angles: [
        {
          points: [
            [{ bone: "head", point: { x: 1, y: 0, z: 0 } }],
            [
              { bone: "head", point: { x: 0, y: 0, z: 1 } },
              { bone: "head", point: { x: 0, y: 0, z: -1 } },
            ],
            [{ bone: "head", point: { x: 0, y: 1, z: 0 } }],
          ],
          degrees: 90,
        },
      ],
    });
    all.check(
      `${name} affine right-triangle landmark`,
      rigid.converged && rigid.angles[0]! <= degree,
    );

    // 3. Both requested quantities are measured after the same fit. The
    // arm's changed segment mass positions are part of the centre reading.
    const joint: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: entry,
      variables: [
        { kind: "place", axis: "z" },
        { kind: "angle", bone: "leftLowerArm", axis: 0 },
      ],
      angles: [elbow],
      centre: { point: { ...before, z: before.z + travel }, axes: ["z"] },
    });
    const shown: Bones = bonesOf(body, joint.posture);
    const got: number = included(
      shown.get("leftUpperArm")!.worldPosition,
      shown.get("leftLowerArm")!.worldPosition,
      shown.get("leftHand")!.worldPosition,
    );
    all.check(
      `${name} simultaneous angle and centre converged (${joint.reason})`,
      joint.converged,
    );
    all.check(
      `${name} displayed elbow ${got} degrees`,
      Math.abs(got - 120) <= degree,
    );
    all.check(
      `${name} displayed physical centre`,
      Math.abs(centre(body, shown).z - before.z - travel) <= metre,
    );
    all.check(
      `${name} canonical elbow flexion is 60 degrees`,
      Math.abs((joint.posture.joints.leftLowerArm?.[0] ?? 0) - 60) <= degree,
    );

    // 4. A rigid root translation cannot change an elbow angle.
    if (name === "m-average") {
      const interval: IAutoMovieMotionHumanBodyFitTypes.IResult =
        HumanBodyFit.fit({
          body,
          posture: entry,
          variables: [{ kind: "angle", bone: "leftLowerArm", axis: 0 }],
          angles: [{ ...elbow, degrees: [110, 130] }],
        });
      const intervalBones: Bones = bonesOf(body, interval.posture);
      const intervalAngle: number = included(
        intervalBones.get("leftUpperArm")!.worldPosition,
        intervalBones.get("leftLowerArm")!.worldPosition,
        intervalBones.get("leftHand")!.worldPosition,
      );
      all.check(
        `an angle interval preserves its nearest admissible boundary (${intervalAngle})`,
        interval.converged && Math.abs(intervalAngle - 130) <= degree,
      );
      const impossible: IAutoMovieMotionHumanBodyFitTypes.IResult =
        HumanBodyFit.fit({
          body,
          posture: entry,
          variables: [{ kind: "place", axis: "z" }],
          angles: [elbow],
        });
      all.check(
        "a frozen elbow is not reported converged",
        !impossible.converged && impossible.angles[0]! > degree,
      );
      let rejected: boolean = false;
      try {
        HumanBodyFit.fit({
          body,
          posture: entry,
          variables: [{ kind: "place", axis: "z" }],
          angles: [
            {
              points: [
                [{ bone: "head" }],
                [{ bone: "head" }],
                [{ bone: "leftHand" }],
              ],
              degrees: 90,
            },
          ],
        });
      } catch {
        rejected = true;
      }
      all.check("coincident angle rays are rejected", rejected);
    }

    // 5. Physical consumer: contacts and posture are read from the final
    // performance, rather than from the set solver's own preferred key.
    const at: IAutoMovieVector3 = { x: 0.8, y: 0, z: -0.6 };
    const sex: "female" | "male" = name.startsWith("f-") ? "female" : "male";
    try {
      const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "sprint-set-goals",
        performers: [
          { subject: "a", body, at, yaw, proficiency: { level: "elite" } },
        ],
        composition: HumanChain.subject("a").athletics({ sex }).node,
      });
      const segment: ReturnType<
        IAutoMovieMotionHumanPerformance["segments"]
      >[number] = film.segments("a")[0]!;
      const set: number =
        segment.start +
        segment.plan.duration *
          segment.plan.events.find(
            (event: IAutoMovieMotionEvent): boolean => event.name === "set",
          )!.share;
      const bones: Bones = film.bones("a", set);
      const shoulders: IAutoMovieVector3 = Vector3.lerp(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
        0.5,
      );
      const front: number = included(
        bones.get("leftUpperLeg")!.worldPosition,
        bones.get("leftLowerLeg")!.worldPosition,
        bones.get("leftFoot")!.worldPosition,
      );
      const rear: number = included(
        bones.get("rightUpperLeg")!.worldPosition,
        bones.get("rightLowerLeg")!.worldPosition,
        bones.get("rightFoot")!.worldPosition,
      );
      const hip: number = included(
        bones.get("leftLowerLeg")!.worldPosition,
        bones.get("leftUpperLeg")!.worldPosition,
        shoulders,
      );
      const thigh: number = body.measure.thigh;
      const shank: number = body.measure.shank;
      const kneeBand: number =
        (((0.001 * Math.hypot(thigh, shank)) / (thigh * shank)) * 180) /
        Math.PI;
      all.check(
        `${name} sprint front knee ${front}`,
        Math.abs(front - 90) <= kneeBand,
      );
      all.check(`${name} sprint rear knee ${rear}`, Math.abs(rear - 117) <= 11);
      all.check(`${name} sprint front hip ${hip}`, Math.abs(hip - 43) <= 6);
      const direction: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
        { x: 0, y: 0, z: 1 },
      );
      const behind: number =
        body.measure.footLength -
        Vector3.dot(Vector3.subtract(centre(body, bones), at), direction);
      all.check(
        `${name} sprint heading centre ${behind}`,
        Math.abs(behind - (sex === "female" ? 0.162 : 0.229)) <= 0.001,
      );
      for (const side of ["left", "right"] as const) {
        const palm: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "palm",
          "flat",
        ).point;
        const expected: IAutoMovieVector3 = Vector3.add(
          at,
          Quaternion.rotateVector(
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
            {
              x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth,
              y: 0,
              z: body.measure.footLength - body.measure.hand / 2,
            },
          ),
        );
        all.check(
          `${name} ${side} hard palm contact`,
          Vector3.length(Vector3.subtract(palm, expected)) <= 0.001,
        );
        const foot: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
        const end: Bones = film.bones("a", Math.min(segment.end, set + 0.5));
        all.check(
          `${name} ${side} block contact does not slip`,
          Vector3.length(
            Vector3.subtract(foot, end.get(`${side}Foot`)!.worldPosition),
          ) <= 0.001,
        );
      }
    } catch (error) {
      all.check(
        `${name} sprint consumer refused: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  all.assert("geometric angles, physical centre and sprint contacts");
}
