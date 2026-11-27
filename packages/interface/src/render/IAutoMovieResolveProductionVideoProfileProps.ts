import type { IAutoMovieProductionFrameRate } from "../production/IAutoMovieProductionFrameRate";

/**
 * Already admitted video dimensions and rational frame rate.
 * resolveProductionVideoProfile adds fixed codec metadata without validating or
 * cloning these inputs; the returned profile shares frameRate with its caller.
 */
export interface IAutoMovieResolveProductionVideoProfileProps {
  /** Validated coded/display width in pixels; forwarded without admission. */
  width: number;

  /** Validated coded/display height in pixels; forwarded without admission. */
  height: number;

  /** Caller-owned rational frames-per-second identity, shared by reference. */
  frameRate: IAutoMovieProductionFrameRate;
}
