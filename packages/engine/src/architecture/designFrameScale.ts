import { IAutoMovieDesignSourceFrame } from "@automovie/interface";

/**
 * The metres-per-unit a frame has actually settled on, or null.
 *
 * Returns `metersPerUnit` of the scale candidate whose id equals
 * `frame.scale`. Null means no world position exists for the frame's points:
 * either the author left `scale` null because the scale is unknown, or
 * `scale` names an id no candidate carries, which `validateDesignReference`
 * refuses.
 */
export const designFrameScale = (
  frame: IAutoMovieDesignSourceFrame,
): number | null => {
  if (frame.scale === null) return null;
  const candidate = frame.scaleCandidates.find(
    (entry) => entry.id === frame.scale,
  );
  return candidate === undefined ? null : candidate.metersPerUnit;
};
