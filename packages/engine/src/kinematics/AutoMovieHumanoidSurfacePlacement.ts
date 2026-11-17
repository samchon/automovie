import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { resolveAutoMovieHumanoidSurfaces } from "./resolveAutoMovieHumanoidSurfaces";

/** Existing bone-local surface data; geometry and direction admission belongs to its producer. */
type IFrame = IAutoMovieHumanoidSurfaces.IFrame;

/** The actual current placement fields read by every surface projection. */
type IBone = Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">;

/**
 * Place an admitted bone-local surface frame in the bone's world frame.
 * Point/normal reads precede the optional forward read as in the original
 * full placement. Every returned vector and wrapper is caller-owned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines world metres, admitted bone-local directions, field-read order, fresh ownership and the point, normal and pointNormal demand companions.
 * @evidence contracts/development/implementation.md#principled-implementation A point is bone position plus the bone quaternion's rotated local point; directions use that same quaternion with no translation or added normalization. All original scalar expressions remain with their quaternion owner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Point owns position placement, normal owns direction rotation, pointNormal reads them in order, and full placement adds optional forward to that same fresh wrapper. The resolver delegates without another representation or cache.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose fit, contact, numeric admission or normal calculation is skipped upstream. Field demands omit only unused output reads/rotations; full placement keeps both original forward property reads when it is present.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size work. Point adds into its exclusively owned rotated offset rather than allocating another vector. PointNormal omits unused forward reads/rotation; full placement adds forward directly without an extra spread wrapper. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Full placement and point-only hit/carry consumers share point's exact expression. Strike/touch, clinch and held-coupling observations share pointNormal; the guard reads only normal. Every call reads current frame/bone values without an identity, target or result memo.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only fresh numeric vectors and at most one fresh wrapper. No input frame/bone, source callback, reader, body or query history is retained.
 */
export function AutoMovieHumanoidSurfacePlacement(
  frame: IFrame,
  bone: IBone,
): { point: IAutoMovieVector3; normal: IAutoMovieVector3; forward?: IAutoMovieVector3 } {
  const placed: ReturnType<typeof AutoMovieHumanoidSurfacePlacement> =
    AutoMovieHumanoidSurfacePlacement.pointNormal(frame, bone);
  if (frame.forward !== undefined)
    placed.forward = Quaternion.rotateVector(bone.worldRotation, frame.forward);
  return placed;
}

/**
 * Field projections of the same local-to-world surface placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the fresh world point from the point/normal wrapper; omitted directions are neither read nor transformed.
 * @evidence contracts/development/design.md#principled-representation Existing IFrame and resolved-bone fields define local/world quantities. The outputs are the exact fields existing motion consumers inspect, without a new frame type or derived-answer flag.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieHumanoidSurfaces delegates point, normal, pointNormal and full place to this owner. Combat/carry/force, guard and strike/clinch/hold readers consume their actual fields; its full facade exposes no nested helper namespace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs remain current admitted geometry, not a supplied cached transform or claimed validity token. No caller can install a result, and no output borrows an input vector.
 */
export namespace AutoMovieHumanoidSurfacePlacement {
  /**
   * Fresh world point in metres, with no direction reads. Parent-position
   * reference is read before rotation; its XYZ sums follow the same order.
   */
  export function point(frame: IFrame, bone: IBone): IAutoMovieVector3 {
    const origin: IAutoMovieVector3 = bone.worldPosition;
    const placed: IAutoMovieVector3 = Quaternion.rotateVector(bone.worldRotation, frame.point);
    placed.x = origin.x + placed.x;
    placed.y = origin.y + placed.y;
    placed.z = origin.z + placed.z;
    return placed;
  }

  /** Fresh world normal; no point, parent position or forward field is observed. */
  export function normal(
    frame: Pick<IFrame, "normal">,
    bone: Pick<IBone, "worldRotation">,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(bone.worldRotation, frame.normal);
  }

  /** Fresh world point/normal only; forward is not observed. */
  export function pointNormal(
    frame: IFrame,
    bone: IBone,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    return {
      point: point(frame, bone),
      normal: normal(frame, bone),
    };
  }
}
