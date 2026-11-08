import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { assertPhysicalNativeMotion } from "./assertPhysicalNativeMotion";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * After raw poses/effort maps are admitted, validate their composed transforms, interval twists, COM transport and implicit motor damping before creating a native world.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (After raw poses/effort maps are admitted, validate their composed transforms, interval twists, COM transport and implicit motor damping before creating a native world) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (After raw poses/effort maps are admitted, validate their composed transforms, interval twists, COM transport and implicit motor damping before creating a native world) directly over its typed inputs (`input`, `body`) as nested iteration of depth 4 (some over input.bodies; for-of over body.targets.entries(); for-of over body.profile.segments), delegating to `samplePhysicalTarget`, `assertPhysicalNativeMotion`, `physicalSupportPoint`, `Math.fround`, `Math.max`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 71 lines and 5 top-level statements that reuses `samplePhysicalTarget`, `assertPhysicalNativeMotion`, `physicalSupportPoint`, `Math.fround`, `Math.max` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `body`; the dominant cost is nested iteration of depth 4 (some over input.bodies; for-of over body.targets.entries(); for-of over body.profile.segments), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
