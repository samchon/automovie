import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * A scene-only distance endpoint: a staged node, a literal point, or a group
 * centroid, the kinds `resolveTargetPoint` places without a rig, a shot clock,
 * or an actor's facing.
 *
 * Its only user is {@link IAutoMovieMeasureDistanceRequest}, which no source in
 * this repository answers yet.
 *
 * @author Samchon
 */
export type IAutoMovieDistanceTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "point" | "group" }
>;
