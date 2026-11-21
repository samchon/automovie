import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Fixed alignment of a collider carrier with its canonical rig joint. */
const FRAME_PRECISION: number = 1e-9;

/** Rotational part of the unrotated canonical segment, in quaternion components. */
const ROTATION_PRECISION: number = 1e-8;

/** A convex point in the frame of the foot or its toes. */
interface IFootPoint {
  /** The rigid carrier that moves this point. */
  bone: AutoMovieHumanoidBone;

  /** Metres relative to the carrier's rig joint. */
  local: IAutoMovieVector3;

  /** The split bearing area when present on this collider. */
  region?: "heel" | "forefoot";
}

/**
 * Read the standing foot's original convex hull points once in their
 * individual carrier frames. The caller may move the toes independently.
 *
 * @returns The original geometric vertices, or undefined for a profile
 * whose support shapes do not use the canonical hull and joint frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the carrier convention, units and unsupported case.
 * @evidence contracts/development/implementation.md#principled-implementation Applies the convex collider's own transform and verifies alignment with the same rig before consuming its points.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One profile read supplies the sole rocker and the static balance witness.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every original hull vertex. Unsupported shapes or frames return undefined to the caller.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each selected hull point is read once before the caller's pose evaluations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both consumers reuse the same local transform. Each preparation serves the lifetime of one pose solve or action.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned points remain after this synchronous call.
 */
export function prepareHumanFootHull(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
): IFootPoint[] | undefined {
  const points: IFootPoint[] = [];
  for (const bone of [`${side}Foot`, `${side}Toes`] as const) {
    const segment: IAutoMoviePhysicalSegment | undefined =
      body.profile.segments.find(
        (candidate: IAutoMoviePhysicalSegment): boolean =>
          candidate.bone === bone,
      );
    const joint: IAutoMovieVector3 | undefined = body.rest.get(bone);
    if (
      !segment ||
      !joint ||
      Vector3.length(Vector3.subtract(segment.neutral.position, joint)) >
        FRAME_PRECISION ||
      Math.hypot(
        segment.neutral.rotation.x,
        segment.neutral.rotation.y,
        segment.neutral.rotation.z,
      ) > ROTATION_PRECISION
    )
      return undefined;
    for (const shape of segment.shapes) {
      if (shape.kind !== "hull") return undefined;
      const region: IFootPoint["region"] =
        shape.id === `${side}Subtalar` ||
        shape.id.startsWith(`${side}Subtalar.`)
          ? "heel"
          : shape.id === `${side}Midfoot` ||
              shape.id.startsWith(`${side}Midfoot.`)
            ? "forefoot"
            : undefined;
      for (const point of shape.points)
        points.push({
          bone,
          local: Vector3.add(
            shape.transform.position,
            Quaternion.rotateVector(shape.transform.rotation, point),
          ),
          region,
        });
    }
  }
  return points;
}
