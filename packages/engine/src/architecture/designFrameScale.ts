import {
  IAutoMovieDesignScaleCandidate,
  IAutoMovieDesignSourceFrame,
} from "@automovie/interface";

/**
 * The metres-per-unit a frame has actually settled on, or null.
 *
 * Returns `metersPerUnit` of the scale candidate whose id equals `frame.scale`.
 * Null means no world position exists for the frame's points: either the author
 * left `scale` null because the scale is unknown, or `scale` names an id no
 * candidate carries, which `validateDesignReference` refuses. The first
 * candidate with the id wins.
 *
 * @param frame Source frame whose settled scale is read.
 * @returns Metres per source unit, or null when the scale is unsettled.
 */
export const designFrameScale: (
  frame: IAutoMovieDesignSourceFrame,
) => number | null = (frame: IAutoMovieDesignSourceFrame): number | null => {
  if (frame.scale === null) return null;
  const candidate: IAutoMovieDesignScaleCandidate | undefined =
    frame.scaleCandidates.find(
      (entry: IAutoMovieDesignScaleCandidate): boolean =>
        entry.id === frame.scale,
    );
  return candidate === undefined ? null : candidate.metersPerUnit;
};
