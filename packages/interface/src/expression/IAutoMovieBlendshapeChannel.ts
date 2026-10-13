import { AutoMovieArkitChannel } from "./AutoMovieArkitChannel";

/**
 * One ARKit blendshape channel set to a weight.
 *
 * A list of these is a facial expression at ARKit resolution, the form
 * Audio2Face streams and a model can emit directly because the space is named,
 * bounded and 52 wide. The engine's `validateExpression` refuses an unknown
 * channel, a weight outside `[0, 1]`, and a channel set twice in one list.
 *
 * In the viewer a channel replaces, rather than adds to, the weight the
 * expression's preset gives the same channel.
 *
 * @evidence contracts/common.md#principled-implementation `validateExpression` checks the name against its runtime channel set, range-checks the weight to `[0, 1]` and rejects a repeated channel, and `applyExpression` writes the weight clamped to `[0, 1]` over the preset's contribution for that name.
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
