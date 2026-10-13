/**
 * One soft surface constrained by authored collider rest-clearance floors.
 *
 * A floor is the smaller of the shape-only rest signed clearance and collider cover; source-authored rest penetration can remain. The evaluator verifies known simultaneous floors and actual Euclidean movement against `budgetMetres`, using a direct feature-gradient correction or shared constrained solve. No verified witness within the budget means refusal. Pointwise floors and one-ring smoothing establish no coupled tissue mechanics or globally embedded skin.
 *
 * @evidence contracts/common.md#principled-implementation Surface identity and allowed movement budget constrain the existing actual signed-floor correction, whose floors retain source rest/cover rather than requiring all source tissue to begin outside.
 * @evidence contracts/common.md#clear-and-simple-design This owner supplies only soft-surface identity and budget; collider acquisition, simultaneous-floor solve and staged commit stay with contact evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Solver status alone validates no move, unknown sheet sides supply no default floor, and bounded correction certifies neither tissue mechanics nor whole-surface embedding.
 * @evidence contracts/common.md#meaningful-documentation The comment explains floor/cover, retained rest penetration, actual net movement and verification; members give exact source identity and metre budget.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input type executes no signed query, QP or smoothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The soft-surface record defines no contact query cache or shared correction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns identity/budget while the evaluator owns staging buffers; no handle/task is opened by this type.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactSoftSurface {
  /** ID of the soft surface. */
  surface: string;

  /** Maximum actual Euclidean contact movement in metres before refusal. */
  budgetMetres: number;
}
