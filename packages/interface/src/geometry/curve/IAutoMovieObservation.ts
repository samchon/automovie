import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/** Per-call work and qualification, independent of renderable geometry. */
export type IAutoMovieObservation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;
