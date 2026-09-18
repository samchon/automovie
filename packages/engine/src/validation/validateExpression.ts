import { IAutoMovieExpression } from "@automovie/interface";
import { ViolationCollector } from "./ViolationCollector";

/**
 * Validate an {@link IAutoMovieExpression}: Tier-1 range checks the rough types
 * intentionally do not encode.
 *
 * Preset and ARKit channel names are runtime-checked against their closed
 * menus, and magnitudes still sit in `[0, 1]`: preset intensity and every
 * blendshape weight. ARKit channels also must not be set twice.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateExpression` reports an unknown preset, unknown ARKit channel, or out-of-range weight at that expression member's path.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateExpression` retains the channel identity and observed magnitude beside the closed-menu or unit-interval constraint it violated.
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-input-finding `validateExpression` identifies malformed authored preset, channel, duplication, and weight inputs before they enter expression resolution.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-input-finding The validator reports declaration defects at their input member paths rather than misclassifying them as failures of a derived expression result.
 * @evidence requirements/actors/pose-expression-and-gaze.md#actor-expression-channels `validateExpression` admits only the declared neutral or named preset and closed ARKit channel vocabulary, rejects duplicate channels, and bounds every authored intensity or blendshape weight to the unit interval.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-pose-gaze-expression-state `validateExpression` enforces the representation-facing preset and detailed expression-channel state before the Engine accepts that face control input.
 * @author Samchon
 */
export const validateExpression = (props: {
  expression: IAutoMovieExpression;
  path?: string;
  collector?: ViolationCollector;
}): ViolationCollector => {
  const path = props.path ?? "$input";
  const collector = props.collector ?? new ViolationCollector();
  const { expression } = props;

  if (!EXPRESSION_PRESETS.has(expression.preset))
    collector.push(
      "type",
      `${path}.preset`,
      `unknown expression preset "${String(expression.preset)}"`,
      expression.preset,
    );
  collector.range(`${path}.intensity`, expression.intensity, 0, 1, "intensity");

  const seen = new Set<string>();
  (expression.blendshapes ?? []).forEach((c, i) => {
    const cp = `${path}.blendshapes[${i}]`;
    if (!ARKIT_CHANNELS.has(c.channel))
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
  });

  return collector;
};
