import type {
  IAutoMovieMotionAudit,
  IAutoMovieMotionGeometry,
} from "@automovie/interface";

/**
 * Resolve the already admitted exclusive description; a physical profile
 * structurally supplies the same collision and joint facts.
 */
export function motionAuditGeometry(
  body: IAutoMovieMotionAudit.IBody,
): IAutoMovieMotionGeometry {
  if (body.profile !== undefined) return body.profile;
  return body.geometry!;
}
