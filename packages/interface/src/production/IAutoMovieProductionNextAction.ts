/**
 * One attributed correction derived from current production diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Inspection maps blocking diagnostics to an owning surface, executable API or command, exact target and reason so a coding agent can address the reported cause.
 * @evidence contracts/common.md#clear-and-simple-design Four fields separate responsibility, operation, operand and explanation without embedding another diagnostic or automatically executing the correction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An action is guidance, not proof that a correction ran or compilation passed; source and design work remain with their declared owners.
 * @evidence contracts/common.md#meaningful-documentation Defines owner vocabulary, concrete operation, exact correction target and the reason for its ordering.
 * @author Samchon
 */
export interface IAutoMovieProductionNextAction {
  /** Owning surface. */
  owner: "design" | "source" | "compile" | "review" | "render";

  /** Exact package API or coding-agent command to run. */
  action: string;

  /** Exact target or artifact to correct. */
  target: string;

  /** Why this action is next. */
  reason: string;
}
