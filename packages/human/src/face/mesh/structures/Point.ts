import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The head-frame point every facial construction is written in.
 *
 * It is the engine's vector under a name that says which space it is in:
 * millimetres in the head frame, +Z anterior, owned by whoever supplied it.
 * The alias exists so a reader of a curve or a patch sees the space rather than
 * a bare triple.
 *
 * @author Samchon
 */
export type Point = IAutoMovieVector3;
