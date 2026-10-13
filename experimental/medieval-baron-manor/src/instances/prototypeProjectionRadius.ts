import type { IAutoMovieCompiledInstanceSet } from "@automovie/interface";

const AXES: readonly ["x", "y", "z"] = ["x", "y", "z"] as const;

/** Same box-v1 conservative prototype radius as the original native adapter. */
export const prototypeProjectionRadius: (bounds: IAutoMovieCompiledInstanceSet["bounds"]) => number = (bounds: IAutoMovieCompiledInstanceSet["bounds"]) : number =>
  Math.max(.01, Math.hypot(...AXES.map((k: "x" | "y" | "z") : number => Math.max(Math.abs(bounds.min[k]), Math.abs(bounds.max[k])))));
