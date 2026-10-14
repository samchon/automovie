/**
 * Highest production-compile gate requested for the current project snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Timed builds add source evaluation, current review evidence and final deliverable/media checks above design admission. Library dispatch uses design/source scopes and requires reviewed owners for both review and final, without running a timed film's final deliverable gates; the declared production kind selects that path.
 * @evidence contracts/common.md#clear-and-simple-design One closed scope chooses the highest required gate rather than exposing independent booleans that could request final delivery without source or review admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Scope does not invent a current compile or accepted review; each stricter gate depends on the current upstream inputs rather than reusing stale success.
 * @evidence contracts/common.md#meaningful-documentation Explains each scope's added responsibility: ordinary Node source execution and output admission, generated-artifact materialization, current review requirements and final byte receipts. Source determinism remains an author obligation.
 * @author Samchon
 */
export interface IAutoMovieBuildProjectInput {
  /**
   * Highest requested gate. Timed design checks the graph; source evaluates ordinary Node modules and validates generated candidates, review adds current evidence, and final adds deliverable/media admission. Library review/final instead require reviewed owner registrations. Writable build may publish admitted non-design output; lint does not publish. No scope makes authored Node effects sandboxed or whole-set publication atomically visible.
   */
  scope: "design" | "source" | "review" | "final";
}
