import type {
  AutoMovieEasing,
  IAutoMovieExpression,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * Multiply an admitted clip's seconds clock by a positive finite factor. Keyframe times, duration and optional stride period/phase scale together; pose and expression values are borrowed and unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Uniform clock multiplication preserves relative timing and whole-cycle phase while keeping the spatial trajectory; locomoteMotion compresses short strides and makeActorSynthesizer fits declared spans through this operation.
 * @evidence contracts/common.md#clear-and-simple-design This primitive owns only clock scaling, so callers choose sizing policy and playback remains unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no pose rebake or speed-specific clamp; callers must supply a representable positive scaled clock and downstream validation still owns clip-domain admission.
 * @evidence contracts/common.md#meaningful-documentation States the factor premise, seconds fields, shared pose ownership and unchanged spatial endpoint.
 * @evidence contracts/performance.md#efficient-algorithms For K keyframes, one O(K) clock-copy pass and O(K) output entries; stride metadata adds constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Nested pose/expression values are reused because changing only the clock leaves them equivalent; no repeated geometry solve or cross-call cache occurs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new clip and keyframes, while nested motion content remains borrowed; no retained workspace or task is acquired.
 */
export const timeScaleMotion: (
  clip: IAutoMovieMotion,
  k: number,
) => IAutoMovieMotion = (
  clip: IAutoMovieMotion,
  k: number,
): IAutoMovieMotion => ({
  ...clip,
  duration: clip.duration * k,
  keyframes: clip.keyframes.map(
    (
      kf: IAutoMovieKeyframe,
    ): {
      time: number;
      pose: IAutoMoviePose;
      expression: IAutoMovieExpression | null;
      easing: AutoMovieEasing;
      bezier: [number, number, number, number] | null;
    } => ({ ...kf, time: kf.time * k }),
  ),
  ...(clip.gaitCycle === null || clip.gaitCycle === undefined
    ? {}
    : {
        gaitCycle: {
          period: clip.gaitCycle.period * k,
          phaseAt: clip.gaitCycle.phaseAt * k,
        },
      }),
});
