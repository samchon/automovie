import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { assertPhysicalNativeMotion } from "./assertPhysicalNativeMotion";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/** After raw poses/effort maps are admitted, validate their composed transforms, interval twists, COM transport and implicit motor damping before creating a native world. */
export function admitPhysicalTargetMotion(
  input: Simulation.IInput,
  body: Simulation.IBody,
): void {
  const native: boolean = input.bodies.some(
    (candidate: Simulation.IBody): boolean =>
      candidate.mode.kind !== "kinematic",
  );
  for (const [step, target] of body.targets.entries()) {
    for (const segment of body.profile.segments) {
      const pose: P.ITransform = target.segments[segment.bone]!;
      const motion: ReturnType<typeof samplePhysicalTarget> =
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
      assertPhysicalNativeMotion(
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
        const anchor: P.ITransform["position"] = physicalSupportPoint(
          target.segments[bone]!,
          frame.position,
        );
        if (![anchor.x, anchor.y, anchor.z].every(scalar))
          throw new Error(
            `${body.id}/${joint.id}: derived native joint anchor exceeds f32 range`,
          );
      }
  }
  if (!native) return;
  const dt: number = Math.fround(1 / (input.rate * input.substeps!));
  for (const joint of body.profile.joints) {
    const strength: number = body.targets.reduce(
      (maximum: number, target: Simulation.ITarget): number =>
        Math.max(
          maximum,
          target.jointStrength?.[joint.id] ?? target.strength,
          target.releasedJointStrength?.[joint.id] ?? 0,
        ),
      0,
    );
    for (const axis of joint.axes)
      if (
        !scalar(
          axis.damping * strength +
            (axis.passiveDamping ?? 0) +
            axis.stiffness * strength * dt,
        )
      )
        throw new Error(
          `${body.id}/${joint.id}: derived native motor damping exceeds f32 range`,
        );
  }
}
