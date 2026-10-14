/**
 * A named expression the connected face panel applies in one transaction.
 *
 * Applying replaces the complete authored expression map while preserving the other latest draft fields. The preset is application example data, and the face owner still admits every channel and supported range.
 *
 * @evidence contracts/common.md#principled-implementation A channel-weight map represents authored expression parameters and applying it replaces one document field through the normal face transaction.
 * @evidence contracts/common.md#clear-and-simple-design The preset contains only its visible name and expression values; document composition, history and numerical construction remain with the panel and Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named example weights do not bypass admission or embed a prebuilt facial mesh or subject-specific numerical branch.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies complete-map replacement, preservation of other fields, example ownership and channel/range admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This preset schema implements no expression merge or numerical evaluation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type declares no shared frame or cached numerical result for matching preset names.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Preset strings and weights retain no live handles; the mounting application owns their data lifetime.
 *
 * @author Samchon
 */
export interface IConnectedFaceExpressionPreset {
  /** The button label. */
  name: string;

  /** The expression weights, by channel id. */
  expression: Record<string, number>;
}
