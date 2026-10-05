/**
 * A named expression the person panel offers as one click: the face
 * subtree's expression weights it writes, replacing the current ones.
 *
 * @author Samchon
 */
export interface IConnectedPersonExpressionPreset {
  /** Button label. */
  name: string;

  /** Expression channel weights. */
  expression: Record<string, number>;
}
