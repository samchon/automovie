import {
  IAutoMovieBlendshapeChannel,
  IAutoMovieExpression,
  type IAutoMovieValidateExpression,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { AUTOMOVIE_ARKIT_CHANNELS } from "./constants/AUTOMOVIE_ARKIT_CHANNELS";
import { AUTOMOVIE_EXPRESSION_PRESETS } from "./constants/AUTOMOVIE_EXPRESSION_PRESETS";

/**
 * Admit preset/channel membership, intensity/weight ranges and duplicate ARKit
 * channels.
 */
export const validateExpression: (
  props: IAutoMovieValidateExpression.IProps,
) => IAutoMovieViolationCollector = (
  props: IAutoMovieValidateExpression.IProps,
): IAutoMovieViolationCollector => {
  const path: string = props.path ?? "$input";
  const collector: IAutoMovieViolationCollector =
    props.collector ?? new ViolationCollector();
  const {
    expression,
  }: {
    expression: IAutoMovieExpression;
    path?: string;
    collector?: IAutoMovieViolationCollector;
  } = props;

  if (!AUTOMOVIE_EXPRESSION_PRESETS.has(expression.preset))
    collector.push(
      "type",
      `${path}.preset`,
      `unknown expression preset "${String(expression.preset)}"`,
      expression.preset,
    );
  collector.range(`${path}.intensity`, expression.intensity, 0, 1, "intensity");

  const seen: Set<string> = new Set<string>();
  (expression.blendshapes ?? []).forEach(
    (c: IAutoMovieBlendshapeChannel, i: number): void => {
      const cp: string = `${path}.blendshapes[${i}]`;
      if (!AUTOMOVIE_ARKIT_CHANNELS.has(c.channel))
        collector.push(
          "type",
          `${cp}.channel`,
          `unknown ARKit channel "${String(c.channel)}"`,
          c.channel,
        );
      collector.range(`${cp}.weight`, c.weight, 0, 1, "weight");
      if (seen.has(c.channel))
        collector.push(
          "type",
          `${cp}.channel`,
          `ARKit channel "${c.channel}" is set more than once`,
          c.channel,
        );
      seen.add(c.channel);
    },
  );

  return collector;
};
