import type {
  IAutoMovieMotionAudit,
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
} from "@automovie/interface";

import { motionAuditGeometry } from "./motionAuditGeometry";

/**
 * Refuse consumer frames off the sampled clock, missing a carrier, or with a
 * rotation off unit length before geometry, speed and angular comparisons.
 */
export function admitPhysicalMotionFrame(
  frame: IAutoMoviePhysicalFrame,
  bodies: readonly IAutoMovieMotionAudit.IBody[],
  seconds: number,
): void {
  if (
    Math.abs(frame.seconds - seconds) >
    64 * Number.EPSILON * Math.max(1, Math.abs(seconds))
  )
    throw new Error("Invalid motion audit sampled clock");
  for (const body of bodies)
    for (const bone of [
      ...motionAuditGeometry(body).segments.map(
        (segment: IAutoMovieMotionGeometry["segments"][number]): string =>
          segment.bone,
      ),
      ...(motionAuditGeometry(body).witnesses ?? []),
    ]) {
      const state: IAutoMoviePhysicalSegmentState | undefined =
        frame.bodies[body.id]?.[bone];
      if (
        state === undefined ||
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
