/**
 * A named expression the connected face panel applies in one transaction.
 *
 * @author Samchon
 */
export interface IConnectedFaceExpressionPreset {
  /** The button label. */
  name: string;

  /** The expression weights, by channel id. */
  expression: Record<string, number>;
}
