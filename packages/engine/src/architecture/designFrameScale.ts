import { IAutoMovieDesignSourceFrame } from "@automovie/interface";

/** The metres-per-unit a frame has actually settled on, or null. */
export const designFrameScale = (
  frame: IAutoMovieDesignSourceFrame,
): number | null => {
  if (frame.scale === null) return null;
  const candidate = frame.scaleCandidates.find(
    (entry) => entry.id === frame.scale,
  );
  return candidate === undefined ? null : candidate.metersPerUnit;
};
