import {
  IAutoMovieBlendshapeChannel,
  IAutoMovieExpression,
  type IAutoMovieValidateExpression,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/** Admit intensity/weight ranges and duplicate ARKit channels. */
export function validateExpression(
  props: IAutoMovieValidateExpression.IProps,
): IAutoMovieViolationCollector {
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

  collector.range(`${path}.intensity`, expression.intensity, 0, 1, "intensity");

  const seen: Set<string> = new Set<string>();
  (expression.blendshapes ?? []).forEach(
    (c: IAutoMovieBlendshapeChannel, i: number): void => {
      const cp: string = `${path}.blendshapes[${i}]`;
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
}
