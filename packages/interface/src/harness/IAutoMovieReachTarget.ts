import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/** A reach-query target the geometry context can resolve successfully. */
export type IAutoMovieReachTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "bone" | "point" | "group" }
>;
