import type { AutoMovieMotionAudit as Audit } from "./AutoMovieMotionAudit";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { motionAuditGeometry } from "./motionAuditGeometry";

/**
 * Refuse invalid consumer frames before geometry, speed and angular comparisons can hide a nonfinite measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Refuse invalid consumer frames before geometry, speed and angular comparisons can hide a nonfinite measurement) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Refuse invalid consumer frames before geometry, speed and angular comparisons can hide a nonfinite measurement) directly over its typed inputs (`frame`, `bodies`, `seconds`) as nested iteration of depth 3 (for-of over bodies; for-of over [ ...motionAuditGeometry(body).seg; map over motionAuditGeometry(body).segments), delegating to `Number.isFinite`, `Math.abs`, `Math.max`, `motionAuditGeometry`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 64, 0.00001, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 50 lines and 2 top-level statements that reuses `Number.isFinite`, `Math.abs`, `Math.max`, `motionAuditGeometry`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 64, 0.00001 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `frame`, `bodies`, `seconds`; the dominant cost is nested iteration of depth 3 (for-of over bodies; for-of over [ ...motionAuditGeometry(body).seg; map over motionAuditGeometry(body).segments), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
