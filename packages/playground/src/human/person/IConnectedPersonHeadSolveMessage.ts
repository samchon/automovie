/**
 * Solve a person's head channels for head measurement targets.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadSolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solvePersonHead";

  /** Serialized person document. */
  document: string;

  /** Target in metres per head measurement name (`HUMAN_PERSON_HEAD_SOLVE`). */
  targets: Record<string, number>;
}
