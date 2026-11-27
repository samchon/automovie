import { type AutoMovieGuidePass, type IAutoMovieGuidePassOutput, type IAutoMoviePlanGuidePassOutputsProps } from "@automovie/interface";
import { isGuidePass as isGuidePassImplementation } from "../internal/isGuidePass.js";
import { guidePassFramePattern as guidePassFramePatternImplementation } from "../internal/guidePassFramePattern.js";
import { normalizeGuidePasses as normalizeGuidePassesImplementation } from "../internal/normalizeGuidePasses.js";
import { planGuidePassOutputs as planGuidePassOutputsImplementation } from "../internal/planGuidePassOutputs.js";
import { guidePassFrameName as guidePassFrameNameImplementation } from "../internal/guidePassFrameName.js";
import { AUTOMOVIE_GUIDE_PASSES } from "../AUTOMOVIE_GUIDE_PASSES.js";

import { frameName as frameNameImpl } from "../frameName.js";
import { framePattern as framePatternImpl } from "../framePattern.js";
import { renderPathStem as renderPathStemImpl } from "../renderPathStem.js";

/** Utilities that name rendered media and output locations. */
export namespace AutoMovieRenderMedia {
  /** The ordered runtime registry of admitted guide passes. */
  export function guidePasses(): readonly AutoMovieGuidePass[] {
    return AUTOMOVIE_GUIDE_PASSES;
  }

  /** Name a frame for a guide pass, keeping beauty untagged. */
  export function guidePassFrameName(
    index: number,
    pass: AutoMovieGuidePass,
    ext?: string,
    pad?: number,
  ): string {
    return guidePassFrameNameImplementation(index, pass, ext, pad);
  }

  /** Name one frame in an FFmpeg image sequence. */
  export function frameName(index: number, ext?: string, pad?: number): string {
    return frameNameImpl(index, ext, pad);
  }

  /** Build the FFmpeg image-sequence input pattern. */
  export function framePattern(ext?: string, pad?: number): string {
    return framePatternImpl(ext, pad);
  }

  /** Create one file-system-safe component for a render target. */
  export function renderPathStem(target: string): string {
    return renderPathStemImpl(target);
  }

  /**
   * Whether a string names a guide pass, narrowing it to `AutoMovieGuidePass`.
   *
   * The comparison is exact and case-sensitive against `AUTOMOVIE_GUIDE_PASSES`.
   */
  export function isGuidePass(value: string): value is AutoMovieGuidePass {
    return isGuidePassImplementation(value);
  }

  /**
   * The ffmpeg `-i` input pattern matching every `guidePassFrameName` of one
   * pass, such as `frame_%05d.depth.png`.
   *
   * `ext` and `pad` must equal those the frames were named with.
   */
  export function guidePassFramePattern(pass: AutoMovieGuidePass, ext?: string, pad?: number): string {
    return guidePassFramePatternImplementation(pass, ext, pad);
  }

  /**
   * Validate a requested pass list and fold repeats, keeping each pass at its
   * first position.
   *
   * Throws `unknown guide pass "<name>"` for a name outside
   * `AUTOMOVIE_GUIDE_PASSES`. `planGuidePassOutputs` and the chunked sequence
   * planner both normalize through it, so a request means the same pass order
   * everywhere. The production planner's `assertSingleGuidePass` is a narrower
   * rule and does not use it.
   */
  export function normalizeGuidePasses(passes: readonly string[]): AutoMovieGuidePass[] {
    return normalizeGuidePassesImplementation(passes);
  }

  /**
   * Plan where each requested pass writes its frames inside one frame directory:
   * one capture per pass per frame, at pass-tagged paths.
   *
   * Passes are normalized by `normalizeGuidePasses`, so repeats fold and an
   * unknown name throws; an empty request yields an empty plan. Throws when
   * `frameCount` is not a positive integer. Paths use the default `png` extension
   * and five-digit numbering.
   */
  export function planGuidePassOutputs(props: IAutoMoviePlanGuidePassOutputsProps): IAutoMovieGuidePassOutput[] {
    return planGuidePassOutputsImplementation(props);
  }
}
