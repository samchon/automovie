import { AutoMovieEngineKinematics, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanJacobian, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPrimitive, IAutoMovieVector3 } from "@automovie/interface";

import { HumanContactWindow } from "../../law/internal/HumanContactWindow";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanBodyFit } from "../../posture/internal/HumanBodyFit";
import { HumanFitVariables } from "../../posture/internal/HumanFitVariables";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanSupportPatch } from "../../posture/internal/HumanSupportPatch";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Fit the requested mass displacement while preserving a support key's active
 * anchors. Only an unsupported centre starts a constrained fit. The selected
 * hips or lumbar variables and the joints of limbs pinned to their places are
 * the movable coordinates.
 */
export function prepareSupportCorrection(
  body: IAutoMovieMotionHumanBody,
  window: NonNullable<HumanPhysics.Window>,
  plan: Pick<IAutoMovieMotionHumanActionPlan, "duration"> &
    Pick<IAutoMovieMotionHumanActionPlan, "contacts">,
  pins: readonly AutoMovieHumanoidBone[] = [],
): IAutoMovieMotionHumanPrimitive["write"] {
  const relevant: IAutoMovieMotionHumanContactWindow[] = plan.contacts.filter(
    (c) =>
      HumanPhysics.intersects(
        window,
        c.from * plan.duration,
        c.to * plan.duration,
      ),
  );
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set([
      ...HumanFoot.bones(body),
      ...pins,
      ...body.massModel.segments.map((s) => s.bone),
      ...relevant.map((c) => HumanSupportPatch.frame(body, c).bone),
    ]),
  );
  return (posture, seconds, _before, resolution, projection) => {
    const weight: number = HumanPhysics.weightAt(window, seconds);
    if (weight === 0) return posture;
    const share: number = seconds / plan.duration;
    const active: IAutoMovieMotionHumanContactWindow[] = relevant.filter(
      (c) => c.from <= share && share <= c.to,
    );
    const bearing: IAutoMovieMotionHumanContactWindow[] = active.filter(
      (c) =>
        c.load !== 0 &&
        (HumanContactWindow.BEARING.includes(c.kind) || c.load !== undefined),
    );
    if (bearing.length === 0) return posture;
    const model: IAutoMovieMotionHumanBody["massModel"] = body.massModel;
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const solved: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        read,
        undefined,
        projection,
      );
    const bones: ReturnType<typeof poseBones> = frames(solved.pose, read());
    const hull: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D(
      bearing.flatMap((c) => HumanSupportPatch(body, bones, c)),
    );
    if (hull.length === 0) return posture;
    const centre: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
      model,
      bones,
    );
    if (hull.length >= 3 && AutoMovieEngineMath.pointInHull(centre, hull)) return posture;
    const edge: ReturnType<typeof AutoMovieEngineMath.nearestHullEdge> = AutoMovieEngineMath.nearestHullEdge(
      centre,
      hull,
    );
    const target: IAutoMovieVector3 = AutoMovieEngineMath.closestPointOnSegmentXZ(
      centre,
      edge.start,
      edge.end,
    );
    const allowed: Set<AutoMovieHumanoidBone> = new Set(
      window.by === "trunk" ? ["spine"] : [],
    );
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = active.map(
      (contact) => {
        const frame: ReturnType<typeof HumanSupportPatch.frame> =
          HumanSupportPatch.frame(body, contact);
        for (const side of ["left", "right"] as const) {
          if (!contact.part.startsWith(side)) continue;
          if (contact.part.endsWith("Hand") || contact.part.endsWith("Arm")) {
            allowed.add(`${side}UpperArm`);
            allowed.add(`${side}LowerArm`);
            allowed.add(`${side}Hand`);
          } else if (window.by === "hips") {
            allowed.add(`${side}UpperLeg`);
            allowed.add(`${side}LowerLeg`);
            allowed.add(`${side}Foot`);
            allowed.add(`${side}Toes`);
          }
        }
        return {
          bone: frame.bone,
          point: frame.point,
          goal: HumanSupportPatch.point(body, bones, contact),
          ...(contact.part.endsWith("Foot") || contact.part.endsWith("Hand")
            ? { rotation: bones.get(frame.bone)!.worldRotation }
            : {}),
        };
      },
    );
    for (const bone of pins) {
      for (const side of ["left", "right"] as const)
        if (bone === `${side}LowerLeg`) {
          allowed.add(`${side}UpperLeg`);
          allowed.add(bone);
        }
      targets.push({ bone, goal: bones.get(bone)!.worldPosition });
    }
    const variables: IAutoMovieMotionHumanJacobian.IVariable[] =
      HumanFitVariables.BODY.filter((v) =>
        v.kind === "angle"
          ? allowed.has(v.bone)
          : v.kind === "place" && window.by === "hips",
      );
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of solved.pose.joints)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    const fitted: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: { ...posture, joints, limbs: {} },
      variables,
      targets,
      centre: { point: Vector3.lerp(centre, target, weight), axes: ["x", "z"] },
    });
    if (!fitted.feasible)
      HumanPhysics.unsupported(
        window.by,
        "the requested mass displacement cannot retain the active support contacts and joint limits",
      );
    return fitted.posture;
  };
}
