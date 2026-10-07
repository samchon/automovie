/**
 * A named expression the connected face panel applies in one transaction.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Names an expression preset whose application either commits whole or keeps the last valid state.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Applies the preset as one transaction.
 * @author Samchon
 */
export interface IConnectedFaceExpressionPreset {
  /** The button label. */
  name: string;

  /** The expression weights, by channel id. */
  expression: Record<string, number>;
}
