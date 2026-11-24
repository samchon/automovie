import type {
  AutoMovieViseme,
  IAutoMovieDialogueMouthRange,
  IAutoMovieHumanVisemeWeights,
  IAutoMovieSampleDialogueExpression,
} from "@automovie/interface";

import { AUTOMOVIE_COARTICULATION } from "./AUTOMOVIE_COARTICULATION";

/**
 * Blend a line's visemes at one film frame by coarticulation, in closed form.
 *
 * Each range is a target whose dominance is `magnitude × exp(−|t − centre| /
 * τ)` around its centre, with its viseme's own magnitude and time constant
 * (Cohen and Massaro, 1993, with the parameters of `AUTOMOVIE_COARTICULATION`,
 * where `PP` and `FF` dominate strongly over a shorter reach). The silence
 * before the first range and after the last are `sil` targets that hold full
 * dominance inside themselves and decay from their inner edge. A viseme's
 * weight at `t` is the sum of its targets' dominance over the sum of all
 * dominance, so the weights lie in [0, 1] and sum to 1, and every boundary
 * blends instead of jumping. Frame `f` stands for film time `f / fps`, the
 * instant its picture shows.
 *
 * @param props The joined timeline, the frame and the film rate.
 * @returns The weight of every viseme the line uses, `sil` included.
 */
export function sampleAutoMovieDialogueVisemeWeights(
  props: Pick<
    IAutoMovieSampleDialogueExpression.IProps,
    "timeline" | "frame" | "fps"
  >,
): IAutoMovieHumanVisemeWeights {
  if (!Number.isFinite(props.frame) || !(props.fps > 0))
    throw new Error(
      "dialogue viseme frame and rate must be finite and positive",
    );
  const { ranges }: typeof props.timeline = props.timeline;

  // Time constants in frames, so distances in frames divide them directly.
  const tau: (viseme: AutoMovieViseme) => number = (
    viseme: AutoMovieViseme,
  ): number =>
    (AUTOMOVIE_COARTICULATION.timeConstantSeconds[viseme] ??
      AUTOMOVIE_COARTICULATION.defaultTimeConstantSeconds) * props.fps;
  const magnitude: (viseme: AutoMovieViseme) => number = (
    viseme: AutoMovieViseme,
  ): number =>
    AUTOMOVIE_COARTICULATION.magnitude[viseme] ??
    AUTOMOVIE_COARTICULATION.defaultMagnitude;
  const dominance: Map<AutoMovieViseme, number> = new Map();
  const add: (viseme: AutoMovieViseme, distance: number) => void = (
    viseme: AutoMovieViseme,
    distance: number,
  ): void => {
    dominance.set(
      viseme,
      (dominance.get(viseme) ?? 0) +
        magnitude(viseme) * Math.exp(-distance / tau(viseme)),
    );
  };

  const first: IAutoMovieDialogueMouthRange | undefined = ranges[0];
  const last: IAutoMovieDialogueMouthRange | undefined = ranges.at(-1);
  if (first === undefined || last === undefined) return { sil: 1 };
  add("sil", Math.max(0, props.frame - first.startFrame));
  add("sil", Math.max(0, last.endFrame - props.frame));
  for (const range of ranges)
    add(
      range.viseme,
      Math.abs(props.frame - (range.startFrame + range.endFrame) / 2),
    );

  let total: number = 0;
  for (const value of dominance.values()) total += value;
  const weights: IAutoMovieHumanVisemeWeights = {};
  for (const [viseme, value] of dominance) weights[viseme] = value / total;
  return weights;
}
