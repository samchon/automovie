import type {
  IAutoMovieMeasurePhysicalMotionConstraint,
  IAutoMovieMotionAudit,
  IAutoMovieMotionGeometry,
} from "@automovie/interface";

import { admitMotionGeometry } from "./internal/admitMotionGeometry";
import { motionAuditGeometry } from "./motionAuditGeometry";
import { validatePhysicalProfile } from "./internal/validatePhysicalProfile";

/**
 * Invalid promises cannot produce a successful sampled audit by making
 * comparisons false: intervals, limits, references and witnesses are admitted
 * before any sample is read.
 */
export function admitPhysicalMotionAudit(
  input: IAutoMovieMotionAudit.IInput,
): void {
  if (input.end < input.start || input.rate <= 0)
    throw new Error("Invalid motion audit sampling interval or population");
  const ids: Set<string> = new Set();
  for (const body of input.bodies) {
    if (
      !body.id.trim() ||
      ids.has(body.id) ||
      (body.profile !== undefined) === (body.geometry !== undefined) ||
      (body.profile !== undefined &&
        validatePhysicalProfile(body.profile).length > 0) ||
      body.jointTolerance < 0 ||
      body.floorTolerance < 0 ||
      body.overlapTolerance < 0
    )
      throw new Error("Invalid motion audit body or acceptance limits");
    ids.add(body.id);
    if (body.geometry !== undefined) admitMotionGeometry(body.geometry);
    const carriers: Set<string> = new Set(
      motionAuditGeometry(body).segments.map(
        (segment: IAutoMovieMotionGeometry["segments"][number]): string =>
          segment.bone,
      ),
    );
    const bones: Set<string> = new Set(carriers);
    for (const witness of motionAuditGeometry(body).witnesses ?? [])
      bones.add(witness);
    for (const [bone, limit] of Object.entries(body.speeds))
      if (!carriers.has(bone) || limit < 0)
        throw new Error("Invalid motion audit speed limit");
    for (const support of body.supports)
      if (
        !carriers.has(support.bone) ||
        support.end < support.start ||
        support.tolerance < 0
      )
        throw new Error("Invalid motion audit support promise");
    for (const constraint of body.constraints ?? []) {
      if (
        !constraint.label.trim() ||
        constraint.end < constraint.start ||
        (constraint.minimum === undefined &&
          constraint.maximum === undefined) ||
        (constraint.minimum ?? -Infinity) > (constraint.maximum ?? Infinity)
      )
        throw new Error("Invalid motion audit constraint");
      const anchors: IAutoMovieMeasurePhysicalMotionConstraint.IAnchor[] =
        constraint.kind === "goal"
          ? [constraint.point]
          : constraint.kind === "distance"
            ? [constraint.from, constraint.to]
            : [constraint.from, constraint.pivot, constraint.to];
      for (const anchor of anchors) {
        if (
          !bones.has(anchor.bone) ||
          Number(anchor.localPoint !== undefined) +
            Number(anchor.ray !== undefined) +
            Number(anchor.blend !== undefined) >
            1
        )
          throw new Error("Invalid motion audit point witness");
        if (
          anchor.ray &&
          (!bones.has(anchor.ray.from) ||
            anchor.ray.from === anchor.bone ||
            anchor.ray.distance < 0)
        )
          throw new Error("Invalid motion audit ray witness");
        if (
          anchor.blend &&
          (!bones.has(anchor.blend.other) ||
            anchor.blend.weight < 0 ||
            anchor.blend.weight > 1)
        )
          throw new Error("Invalid motion audit blended witness");
      }
    }
  }
}
