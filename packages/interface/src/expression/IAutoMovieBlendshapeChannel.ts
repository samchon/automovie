import { AutoMovieArkitChannel } from "./AutoMovieArkitChannel";

/**
 * One ARKit blendshape channel set to a weight.
 *
 * validateExpression checks the closed 52-name channel vocabulary, finite unit-interval weights and duplicate channels in an expression list. The record declares a coefficient; it does not create a mesh target or prove a visible deformation.
 *
 * applyExpression replaces the expanded preset weight for the same channel, then writes matching morph names or explicit host sinks. Unmatched morph names have no effect, and host sinks own their name interpretation.
 *
 * @evidence contracts/common.md#principled-implementation validateExpression checks name membership, finite [0, 1] weight and duplicate channels. applyExpression overwrites the preset-expanded weight for the same name, clamps finite weights and maps nonfinite weights to zero before addressing existing morph targets or supplied sinks.
 * @evidence contracts/common.md#clear-and-simple-design A name and a weight are the whole control atom; ordering, layering over the preset and interpolation belong to `IAutoMovieExpression` and its consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A weight outside the range is reported by validation instead of being silently clamped at authoring time; the viewer's clamp only guards rendering of an unvalidated value.
 * @evidence contracts/common.md#meaningful-documentation States what a list of channels represents, the validator's three refusals, and the replace-not-add rule over the preset; members give the closed name menu and the weight's range and endpoints.
 * @author Samchon
 */
export interface IAutoMovieBlendshapeChannel {
  /** ARKit channel, from the closed 52-name menu. */
  channel: AutoMovieArkitChannel;

  /** Activation weight in `[0, 1]`: `0` inactive, `1` full. */
  weight: number;
}
