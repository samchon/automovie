import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A scene-only distance endpoint: a staged node, a literal point, or a group
 * centroid, the kinds `resolveTargetPoint` places without a rig, a shot clock,
 * or an actor's facing.
 *
 * Its only user is {@link IAutoMovieMeasureDistanceRequest}, which no source in
 * this repository answers yet.
 *
 * @evidence contracts/common.md#principled-implementation Derived with `Extract` from the action target union on `kind`, so it is exactly the subset `resolveTargetPoint` maps to one point and follows any change to those three records.
 * @evidence contracts/common.md#clear-and-simple-design A type alias over the existing target records rather than a parallel union, so a distance endpoint and an action target never disagree about a node, point or group shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bone and relative targets are excluded by type instead of being accepted and answered with a guessed point, since a distance between scene positions has no clock, rig or facing to resolve them.
 * @evidence contracts/common.md#meaningful-documentation States which kinds it admits and why the others are excluded, the function that resolves it, its one user, and that nothing answers that request yet.
 * @author Samchon
 */
export type IAutoMovieDistanceTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "point" | "group" }
>;
