/** Project a detailed shape onto the simple tier. */
export interface IBodySimpleProjectMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "project";

  /** The detailed channel weights to project. */
  shape: Record<string, number>;
}
