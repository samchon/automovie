import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/** A scene-only distance endpoint: no rig or relative direction required. */
export type IAutoMovieDistanceTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "point" | "group" }
>;
