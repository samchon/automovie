import type { AutoMovieMotionAudit as Audit } from "./AutoMovieMotionAudit";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { motionAuditGeometry } from "./motionAuditGeometry";

/** Refuse invalid consumer frames before geometry, speed and angular comparisons can hide a nonfinite measurement. */
export function admitPhysicalMotionFrame(
  frame: Cache.IFrame,
  bodies: readonly Audit.IBody[],
  seconds: number,
): void {
  if (
    !frame?.bodies ||
    !Number.isFinite(frame.seconds) ||
    Math.abs(frame.seconds - seconds) >
      64 * Number.EPSILON * Math.max(1, Math.abs(seconds))
  )
    throw new Error("Invalid motion audit sampled clock");
  for (const body of bodies)
    for (const bone of [
      ...motionAuditGeometry(body).segments.map(
        (
          segment: ReturnType<typeof motionAuditGeometry>["segments"][number],
        ): string => segment.bone,
      ),
      ...(motionAuditGeometry(body).witnesses ?? []),
    ]) {
      const state: Cache.ISegment | undefined = frame.bodies[body.id]?.[bone];
      if (
        !state?.position ||
        !state.rotation ||
        !state.velocity ||
        !state.angularVelocity ||
        ![state.position.x, state.position.y, state.position.z].every(scalar) ||
        ![
          state.rotation.x,
          state.rotation.y,
          state.rotation.z,
          state.rotation.w,
          state.velocity.x,
          state.velocity.y,
          state.velocity.z,
          state.angularVelocity.x,
          state.angularVelocity.y,
          state.angularVelocity.z,
        ].every(Number.isFinite) ||
        Math.abs(
          Math.hypot(
            state.rotation.x,
            state.rotation.y,
            state.rotation.z,
            state.rotation.w,
          ) - 1,
        ) > 1e-5
      )
        throw new Error(
          "Invalid motion audit sampled state: " + body.id + "/" + bone,
        );
    }
}
