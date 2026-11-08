import type { IAutoMovieMotionGeometry } from "@automovie/interface";

import type { AutoMovieMotionAudit as Audit } from "./AutoMovieMotionAudit";

/** Resolve the already admitted exclusive description; a physical profile structurally supplies the same collision and joint facts. */
export function motionAuditGeometry(
  body: Audit.IBody,
): IAutoMovieMotionGeometry {
  if (body.profile !== undefined) return body.profile;
  return body.geometry!;
}
