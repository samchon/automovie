import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A scene-only distance endpoint: a staged node, a literal point, or a group
 * centroid, the kinds `resolveTargetPoint` places without a rig, a shot clock,
 * or an actor's facing.
 *
 * Its only user is {@link IAutoMovieMeasureDistanceRequest}, which no source in
 * this repository answers yet.
 *
 * @evidence contracts/common.md#principled-implementation Derived with `Extract` from `IAutoMovieActionTarget` on the three positional kinds, so the endpoint stays in lockstep with the action target records and admits exactly what `resolveTargetPoint` can place.
 * @evidence contracts/common.md#clear-and-simple-design A type alias rather than a new union, because the three members are the action target records themselves and no field differs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No endpoint kind is special-cased; live bones and relative headings are excluded by the type, so a distance query cannot name a point the static resolver would answer with `null`.
 * @evidence contracts/common.md#meaningful-documentation States which kinds are allowed and why the others are excluded, and that its only user is the distance request, which has no resolver yet.
 * @author Samchon
 */
export type IAutoMovieDistanceTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "point" | "group" }
>;
