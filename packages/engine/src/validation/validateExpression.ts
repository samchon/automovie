import {
  IAutoMovieBlendshapeChannel,
  IAutoMovieExpression,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { AUTOMOVIE_ARKIT_CHANNELS } from "./constants/AUTOMOVIE_ARKIT_CHANNELS";
import { AUTOMOVIE_EXPRESSION_PRESETS } from "./constants/AUTOMOVIE_EXPRESSION_PRESETS";

/**
 * Admit preset/channel membership, intensity/weight ranges and duplicate ARKit channels.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Admit preset/channel membership, intensity/weight ranges and duplicate ARKit channels.
 * @evidence contracts/common.md#clear-and-simple-design Module-fixed vocabularies and a request-local seen set separate closed menus from per-expression uniqueness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This validates weights rather than generating facial geometry or certifying the resulting face's appearance.
 * @evidence contracts/common.md#meaningful-documentation Optional caller path/collector compose errors with parent validators; weights use inclusive[0,1].
 * @evidence contracts/performance.md#efficient-algorithms B blendshape rows cost expected O(B) membership work and O(B) seen storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Closed vocabularies remain shared; the seen set is rebuilt for changed expression contents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A supplied or fresh collector owns diagnostics; no face, morph buffer or animation handle is retained.
 */
export const validateExpression: (props: {
  expression: IAutoMovieExpression;
  path?: string;
  collector?: ViolationCollector;
}) => ViolationCollector = (props: {
  /** Borrowed preset and optional blendshape weights with inclusive 0..1 magnitudes. */
  expression: IAutoMovieExpression;

  /** Base diagnostic address, defaulting to $input. */
  path?: string;

  /** Optional caller-owned sink advanced by this validation. */
  collector?: ViolationCollector;
}): ViolationCollector => {
  const path: string = props.path ?? "$input";
  const collector: ViolationCollector =
    props.collector ?? new ViolationCollector();
  const {
    expression,
  }: {
    expression: IAutoMovieExpression;
    path?: string;
    collector?: ViolationCollector;
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
