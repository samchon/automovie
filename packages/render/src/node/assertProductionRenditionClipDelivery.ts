import { resolveProductionFrameRate } from "@automovie/engine";
import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { assertProductionVideoProfile } from "../delivery/assertProductionVideoProfile";
import { resolveProductionVideoProfile } from "../delivery/resolveProductionVideoProfile";
import type { IProductionRenditionClip } from "./IProductionRenditionClip";
import { parseProductionRenditionClip } from "./parseProductionRenditionClip";

/**
 * Refuse repaint clip bytes that cannot be spliced into the cut losslessly or
 * that differ from the shot's declared raster, clock, length or runtime.
 *
 * The clip must parse as a lossless splice clip, have exactly `width` by
 * `height` pixels and `frameCount` samples, and have a movie duration equal to
 * `frameCount` frames at the rational frame rate resolved from `frameRate`, or
 * from `fps` when absent. `runtimeSeconds` must equal `frameCount *
 * denominator / numerator` as one correctly rounded division, so a shot
 * duration that is not a whole number of frames is refused. Finally the clip
 * must pass the delivery video profile for that raster and rate.
 *
 * Throws the clip parser's refusal labelled `Repaint clip "<shot>"`, then
 * `Repaint clip "<shot>" does not match its exact raster, rational frame
 * clock, frame count, and runtime contract.`, then any
 * `unsupported-video-profile.<field>` error.
 *
 * @evidence contracts/common.md#principled-implementation Movie runtime equality uses BigInt cross products of integer clock and frame-rate terms. Declared runtime instead must equal the binary64 frameCount*denominator/numerator expression, whose multiplication and division can round; equality proves consistency with that expression rather than exact mathematical representability of an arbitrary decimal duration.
 * @evidence contracts/common.md#clear-and-simple-design Splice admissibility is `parseProductionRenditionClip`, the container profile is `assertProductionVideoProfile`, and this function adds only the shot's own contract, judged before the generic profile so a drift is attributed to the named shot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is rounded, rescaled or tolerated; a clip that misses any field is refused, and no shot or adapter is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states each requirement, how the frame rate is resolved, the exact runtime comparison and its consequence for fractional-frame shots, and the refusals in the order they are raised.
 * @evidence contracts/performance.md#efficient-algorithms The clip parser performs one parse plus its O(M + S log(M+1)) residency proof for S samples and M media boxes, sample-entry checks and composition-slot validation. This assertion adds fixed runtime/raster comparisons, rate reduction and profile checks over the probe's brand/edit populations; the complete operation is not strictly linear in clip bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one clip for one admission or revalidation and returns nothing to share; the production callers probe the same bytes separately because they need the probe record, which this assertion does not return.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parsed clip and its sample table are released on return, and the function opens no handle or task.
 */
export const assertProductionRenditionClipDelivery: (props: {
  bytes: Uint8Array;
  shot: string;
  width: number;
  height: number;
  fps: number;
  frameRate?: IAutoMovieProductionFrameRate;
  frameCount: number;
  runtimeSeconds: number;
}) => void = (props: {
  /** Repaint clip MP4 bytes as the adapter delivered them. */
  bytes: Uint8Array;

  /** Shot id, used only to name the clip in refusals. */
  shot: string;

  /** Declared raster width in pixels. */
  width: number;

  /** Declared raster height in pixels. */
  height: number;

  /** Declared frames per second, used when `frameRate` is absent. */
  fps: number;

  /** Exact rational frame rate; takes precedence over `fps`. */
  frameRate?: IAutoMovieProductionFrameRate;

  /** Declared number of frames in the shot. */
  frameCount: number;

  /** Declared shot runtime in seconds. */
  runtimeSeconds: number;
}): void => {
  const clip: IProductionRenditionClip = parseProductionRenditionClip(
    props.bytes,
    `Repaint clip "${props.shot}"`,
  );
  const frameRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(props);
  // The shot's own contract is judged first and by name, so a raster, clock,
  // count, or runtime drift is attributed to the clip before the generic
  // delivery profile speaks.
  if (
    clip.probe.width !== props.width ||
    clip.probe.height !== props.height ||
    clip.probe.frameCount !== props.frameCount ||
    props.runtimeSeconds !==
      (props.frameCount * frameRate.denominator) / frameRate.numerator ||
    BigInt(clip.probe.presentation.movieDuration) *
      BigInt(frameRate.numerator) !==
      BigInt(props.frameCount) *
        BigInt(frameRate.denominator) *
        BigInt(clip.probe.presentation.movieTimescale)
  )
    throw new Error(
      `Repaint clip "${props.shot}" does not match its exact raster, rational frame clock, frame count, and runtime contract.`,
    );
  assertProductionVideoProfile({
    expected: resolveProductionVideoProfile({
      width: props.width,
      height: props.height,
      frameRate,
    }),
    actual: clip.probe,
  });
};
