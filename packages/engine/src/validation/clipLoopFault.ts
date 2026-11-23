import type { IAutoMovieClipShapeFault } from "@automovie/interface";

/**
 * Return a loop-shape fault unless the authored flag is boolean.
 */
export const clipLoopFault: (
  loop: unknown,
) => IAutoMovieClipShapeFault | null = (
  loop: unknown,
): IAutoMovieClipShapeFault | null =>
  typeof loop === "boolean"
    ? null
    : {
        kind: "type",
        field: "loop",
        message: `loop must be boolean, but was ${String(loop)}`,
        value: loop,
      };
