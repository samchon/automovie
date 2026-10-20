import type { AutoMovieGuidePass } from "@automovie/interface";

import type { IAutoMovieGuidePassOutput } from "./IAutoMovieGuidePassOutput";
import { guidePassFrameName } from "./guidePassFrameName";
import { guidePassFramePattern } from "./guidePassFramePattern";
import { normalizeGuidePasses } from "./normalizeGuidePasses";

/**
 * Plan where each requested pass writes its frames inside one frame directory: one capture per pass per frame, at pass-tagged paths.
 *
 * Passes are normalized by `normalizeGuidePasses`, so repeats fold and an unknown name throws; an empty request yields an empty plan. Throws when `frameCount` is not a positive integer. Paths use the default `png` extension and five-digit numbering.
 *
 * @evidence contracts/common.md#principled-implementation Each output's first, last and pattern paths come from the same naming functions the capture writer uses, so the plan addresses exactly the files a capture of `frameCount` frames writes.
 * @evidence contracts/common.md#clear-and-simple-design Validation of passes is delegated to `normalizeGuidePasses` and naming to `guidePassFrameName` and `guidePassFramePattern`; this function only checks the frame count and joins paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass, directory or frame count is special-cased, and an invalid count throws instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation The doc states the pass normalization and its refusals, the empty-request result, the frame-count refusal, and the fixed extension and padding.
 * @evidence contracts/performance.md#efficient-algorithms Cost is O(P) for P requested names plus three short strings per distinct pass, at most six.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call plans one frame directory from its own arguments, and the strings are cheaper to rebuild than to cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing after returning the plan its caller owns and opens no handle or task.
 */
export const planGuidePassOutputs: (props: {
  frameDir: string;
  frameCount: number;
  passes: readonly string[];
}) => IAutoMovieGuidePassOutput[] = (props: {
  /** Directory where the render's frame files are written. */
  frameDir: string;

  /** Number of frames each pass captures; a positive integer. */
  frameCount: number;

  /** Requested passes, in capture order. */
  passes: readonly string[];
}): IAutoMovieGuidePassOutput[] => {
  if (Number.isInteger(props.frameCount) === false || props.frameCount <= 0)
    throw new Error(
      `guide pass frameCount must be a positive integer, but was ${props.frameCount}`,
    );
  return normalizeGuidePasses(props.passes).map(
    (pass: AutoMovieGuidePass): IAutoMovieGuidePassOutput => ({
      pass,
      firstFrame: `${props.frameDir}/${guidePassFrameName(0, pass)}`,
      lastFrame: `${props.frameDir}/${guidePassFrameName(props.frameCount - 1, pass)}`,
      inputPattern: `${props.frameDir}/${guidePassFramePattern(pass)}`,
    }),
  );
};
