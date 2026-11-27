import type {
  AutoMovieEasing,
  IAutoMovieExpression,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

/*
 * Multiply an admitted clip's seconds clock by a positive finite factor.
 * Keyframe times, duration and optional stride period/phase scale together;
 * pose and expression values are borrowed and unchanged.
 */
export function timeScaleMotion(
  clip: IAutoMovieMotion,
  k: number,
): IAutoMovieMotion {
  return {
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
  };
}
