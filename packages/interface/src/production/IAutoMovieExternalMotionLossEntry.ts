/**
 * One recorded source-level loss or approximation; this record alone does not prove that the user accepted it.
 *
 * @evidence contracts/common.md#principled-implementation A closed loss kind identifies affected source elements and their observable consequence separately from the authorization assertion; ordinary usable retarget physics warnings are compatibility findings rather than source-loss proof.
 * @evidence contracts/common.md#clear-and-simple-design Keeps a loss entry separate from compatibility characterization and the actor-bound adoption decision, so conversion effects and user choice are not conflated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The current builder emits an empty loss list for usable native or retargeted motion and adopts no motion on structural or ROM failure. These loss variants currently have no producer or authorization gate, so their presence promises no implemented lossy conversion or override workflow.
 * @evidence contracts/common.md#meaningful-documentation Defines recorded-loss purpose, affected source identities, downstream consequence and the unverified authorization assertion with current producer and consumer limits.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionLossEntry {
  /** Closed loss or approximation discriminator. */
  kind:
    | "channel-dropped"
    | "channel-approximated"
    | "precision-loss"
    | "semantic-loss";

  /** Stable source elements affected by the loss. */
  source: string[];

  /** Observable downstream consequence of the loss. */
  consequence: string;

  /** Claimed explicit user acceptance in a supplied loss record; current production emits no loss entries and exposes no authorization seam that verifies this assertion. */
  authorized: boolean;
}
