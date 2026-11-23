import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { assertPhysicalFiniteMotion } from "./assertPhysicalFiniteMotion";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * After raw poses/effort maps are admitted, validate their composed transforms,
 * interval twists, COM transport and implicit motor damping before creating a
 * native world.
 */
export function admitPhysicalTargetMotion(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: IAutoMoviePhysicalSimulationInput.IBody,
): void {
  const native: boolean = input.bodies.some(
    (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      candidate.mode.kind !== "kinematic",
  );
  for (const [step, target] of body.targets.entries()) {
    for (const segment of body.profile.segments) {
      const pose: IAutoMovieRigidTransform = target.segments[segment.bone]!;
      const motion: IAutoMovieSamplePhysicalTarget.IResult =
        samplePhysicalTarget(
          step === 0 ? pose : body.targets[step - 1]!.segments[segment.bone]!,
          step === 0 ? body.targets[1]!.segments[segment.bone]! : pose,
          step === 0 ? 0 : 1,
          input.rate,
        );
      const seeded: boolean =
        step === 0 &&
        (body.mode.kind === "kinematic" ||
          body.targets[0]!.dynamicSegments !== undefined);
      const authored: boolean =
        body.mode.kind === "kinematic" ||
        (target.dynamicSegments !== undefined &&
          !target.dynamicSegments.includes(segment.bone));
      const transferred: boolean = native && (seeded || authored);
      assertPhysicalFiniteMotion(
        segment,
        pose,
        transferred ? motion.velocity : undefined,
        transferred ? motion.angularVelocity : undefined,
      );
    }
    for (const joint of body.profile.joints)
      for (const [bone, frame] of [
        [joint.parent, joint.parentFrame],
        [joint.child, joint.childFrame],
      ] as const) {
        const anchor: IAutoMovieRigidTransform["position"] =
          physicalSupportPoint(target.segments[bone]!, frame.position);
        if (![anchor.x, anchor.y, anchor.z].every(Number.isFinite))
          throw new Error(
            `${body.id}/${joint.id}: derived joint anchor is not finite`,
          );
      }
  }
  if (!native) return;
  const dt: number = 1 / (input.rate * input.substeps!);
  for (const joint of body.profile.joints) {
    const strength: number = body.targets.reduce(
      (
        maximum: number,
        target: IAutoMoviePhysicalSimulationInput.ITarget,
      ): number =>
        Math.max(
          maximum,
          target.jointStrength?.[joint.id] ?? target.strength,
          target.releasedJointStrength?.[joint.id] ?? 0,
        ),
      0,
    );
    for (const axis of joint.axes)
      if (
        !Number.isFinite(
          axis.damping * strength +
            (axis.passiveDamping ?? 0) +
            axis.stiffness * strength * dt,
        )
      )
        throw new Error(
          `${body.id}/${joint.id}: derived motor damping is not finite`,
        );
  }
}
