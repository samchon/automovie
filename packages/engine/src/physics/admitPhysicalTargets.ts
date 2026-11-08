import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { admitPhysicalContactBindings } from "./admitPhysicalContactBindings";
import { admitPhysicalTargetMotion } from "./admitPhysicalTargetMotion";
import { inPhysicalFloorBounds } from "./inPhysicalFloorBounds";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";

/** Admit every sampled ownership, effort and world pose before target fitting or native allocation. */
export function admitPhysicalTargets(
  input: Simulation.IInput,
  body: Simulation.IBody,
): void {
  for (const [step, target] of body.targets.entries()) {
    if (
      !target ||
      !Number.isFinite(target.strength) ||
      target.strength < 0 ||
      target.strength > 1 ||
      !target.segments ||
      Object.keys(target.segments).length !== body.profile.segments.length
    )
      throw new Error(`${body.id}: invalid target at ${step}`);
    if (
      target.dynamicSegments !== undefined &&
      (!Array.isArray(target.dynamicSegments) ||
        target.dynamicSegments.length > body.profile.segments.length ||
        new Set(target.dynamicSegments).size !==
          target.dynamicSegments.length ||
        Array.from(target.dynamicSegments).some(
          (bone: string): boolean =>
            typeof bone !== "string" ||
            !body.profile.segments.some(
              (segment: P.ISegment): boolean => segment.bone === bone,
            ),
        ) ||
        body.profile.joints.some(
          (joint: P.IJoint): boolean =>
            target.dynamicSegments!.includes(joint.parent) &&
            !target.dynamicSegments!.includes(joint.child),
        ))
    )
      throw new Error(`${body.id}: invalid dynamic segment subtree at ${step}`);
    admitPhysicalContactBindings(
      input,
      body,
      target.bindings,
      target.pointBounds,
    );
    const joints: Set<string> = new Set(
      body.profile.joints.map((joint: P.IJoint): string => joint.id),
    );
    const strengths: (
      values: Record<string, number>,
      names: ReadonlySet<string>,
    ) => boolean = (
      values: Record<string, number>,
      names: ReadonlySet<string>,
    ): boolean =>
      isAutoMovieRecord(values) &&
      Object.entries(values).every(
        ([name, value]: [string, number]): boolean =>
          names.has(name) && Number.isFinite(value) && value >= 0 && value <= 1,
      );
    if (
      target.jointStrength !== undefined &&
      !strengths(target.jointStrength, joints)
    )
      throw new Error(`${body.id}: invalid joint strength at ${step}`);
    if (
      target.releasedJointStrength !== undefined &&
      (!body.releaseOnContact ||
        !strengths(target.releasedJointStrength, joints))
    )
      throw new Error(
        `${body.id}: invalid contact-released joint effort at ${step}`,
      );
    if (
      target.supportStrength !== undefined &&
      !strengths(
        target.supportStrength,
        new Set(
          body.supportTracking?.pattern.limbs.map(
            (
              limb: NonNullable<
                Simulation.IBody["supportTracking"]
              >["pattern"]["limbs"][number],
            ): string => limb.bone,
          ),
        ),
      )
    )
      throw new Error(
        `${body.id}: invalid planted support strength at ${step}`,
      );
    if (
      target.unavailableSupports !== undefined &&
      (!Array.isArray(target.unavailableSupports) ||
        new Set(target.unavailableSupports).size !==
          target.unavailableSupports.length ||
        Array.from(target.unavailableSupports).some(
          (bone: string): boolean =>
            !body.balance?.pattern.limbs.some(
              (
                limb: NonNullable<
                  Simulation.IBody["balance"]
                >["pattern"]["limbs"][number],
              ): boolean => limb.bone === bone,
            ),
        ))
    )
      throw new Error(
        `${body.id}: invalid reserved support endpoint at ${step}`,
      );
    for (const segment of body.profile.segments) {
      const pose: P.ITransform | undefined = target.segments[segment.bone];
      if (
        !pose?.position ||
        !pose.rotation ||
        ![pose.position.x, pose.position.y, pose.position.z].every(scalar) ||
        ![
          pose.rotation.x,
          pose.rotation.y,
          pose.rotation.z,
          pose.rotation.w,
        ].every(Number.isFinite) ||
        Math.abs(
          Math.hypot(
            pose.rotation.x,
            pose.rotation.y,
            pose.rotation.z,
            pose.rotation.w,
          ) - 1,
        ) > 1e-6
      )
        throw new Error(
          `${body.id}/${segment.bone}: invalid native target at ${step}`,
        );
      if (
        segment.shapes.some(
          (shape: P.IShape): boolean =>
            !inPhysicalFloorBounds(pose, shape, input.floorBounds),
        )
      )
        throw new Error(
          `${body.id}/${segment.bone}: target outside physical floor domain at ${step}`,
        );
    }
  }
  admitPhysicalTargetMotion(input, body);
}
