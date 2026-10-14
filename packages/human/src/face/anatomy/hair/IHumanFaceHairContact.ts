import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRetraction } from "./IHumanFaceHairRetraction";

/**
 * The surface contact one hair curve keeps against its closed collider, returned by `humanFaceHairContact`.
 *
 * Distances are current head-frame metres. `clearance` is a station threshold: half the sampling step plus the requested gap, any terminal-shaft radius and twice `epsilon`. Endpoints admitted at that threshold within epsilon and separated by at most `step` retain the requested gap and shaft radius along their chord by the closed surface's 1-Lipschitz distance bound, rather than retaining the full augmented station threshold. Rooted transitions have separate admission.
 *
 * Readers share one collider instance, last-sample memory and a free-distance witness. Projection may return an already free input by identity; it does not force every accepted point onto an exact offset surface. The implementation assumes the supplied collider is closed, embedded and consistently oriented.
 *
 * @evidence contracts/common.md#principled-implementation One current closed collider supplies station distance thresholds and outward directions; half-step margin supports the requested gap along bounded free chords, while rooted transitions remain separate.
 * @evidence contracts/common.md#clear-and-simple-design Sampling, outward direction, projection and budgeted retraction share one contact instance rather than rebuilding a collider per station.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The contact contract preserves numerical refusals and caller budgets; it provides no fallback collider or fixture-specific clearance adjustment.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes augmented station threshold from chord-wide gap, states the collider premises and metre units, and identifies last-hit reuse, borrowed projection results and budgeted retraction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This service interface chooses no projection iteration limit itself; humanFaceHairContact owns the bounded loops and delegated signed-query cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One contact instance shares its collider, last sample and free witness; equivalence requires the same current collider and matching point coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The contact producer retains one last hit and one free witness per returned closure; this interface opens no separate handle or task.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContact {
  /** Augmented free-station threshold in metres; attached root/stem stations use their separate boundary admission. */
  clearance: number;

  /** Nominal free-chord bound in metres that converts the station margin into the requested gap; the walker accounts for its existing rounding allowance. */
  step: number;

  /** Rounding allowance scaled to the root, length, step and clearance. */
  epsilon: number;

  /**
   * Closed-collider query at a point; repeating the last point reuses its hit.
   *
   * @evidence contracts/common.md#principled-implementation A point is read against the contact's own closed collider, so repeated coordinates can use the same deterministic signed hit.
   * @evidence contracts/common.md#clear-and-simple-design One sample operation exposes the shared contact query instead of requiring projection and integration to own separate colliders.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling preserves the engine query result type and introduces no fixture hit or replaced foreign query method.
   * @evidence contracts/common.md#meaningful-documentation The member comment gives closed-collider semantics and explicitly limits last-hit reuse to the same sampled point.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The sampling signature implements no acceleration structure; humanFaceHairContact performs a three-coordinate comparison before delegating a miss.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Consecutive equal coordinates reuse the previous hit within this contact's collider instance; another collider's hit is not equivalent.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sample contract owns no cache object itself; its contact implementation retains exactly one owned point and shared hit.
   */
  sample: (
    p: IAutoMovieVector3,
  ) => ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;

  /**
   * Unit outward direction for the sampled point and hit. Exterior points use displacement from the feature to the point, interior points reverse it, and a point on the feature uses its normal.
   *
   * @evidence contracts/common.md#principled-implementation The outward operation interprets a hit from the same sampled point and collider to produce a unit escape direction in the head frame.
   * @evidence contracts/common.md#clear-and-simple-design Direction interpretation stays beside the signed sampler so projection and retraction use one convention for interior and exterior hits.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The contract does not supply a fixture normal or silently reinterpret an arbitrary different collider's hit.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies outward orientation, reversed interior displacement and the on-feature normal branch, with point and hit required from the same query.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No search algorithm is chosen by this direction type; the concrete contact computes a normal or normalized point-feature difference.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An existing hit is passed into outward instead of requiring another surface query; the signature declares no additional memoization.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Computing an outward direction through this member acquires no persistent resource or scheduled operation.
   */
  outward: (
    p: IAutoMovieVector3,
    hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>,
  ) => IAutoMovieVector3;

  /**
   * Admit a point at the clearance threshold within epsilon, moving it along nearest features only when needed. An already free point may be returned by identity; nonconvergence refuses.
   *
   * @evidence contracts/common.md#principled-implementation A same-collider Lipschitz witness or a signed read admits an already free point; otherwise nearest-feature proposals repeat until the station threshold is met within epsilon or construction refuses.
   * @evidence contracts/common.md#clear-and-simple-design A single projection seam lets guides and interpolated strands retain the same collider and clearance rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure remains a numerical refusal, not a shorter strand, a disabled collider or a lower-clearance retry.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies threshold admission, the numerical allowance, possible borrowed input identity and nonconvergence refusal rather than promising exact offset equality.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature itself chooses no loop; the implementation bounds projection at 64 iterations with signed-query cost dominating misses.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The producer may reuse its same-collider free witness when the distance lower bound proves clearance; the callable declaration owns no witness storage.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Projection's function type starts no long-lived operation; one free witness is held by the enclosing contact implementation.
   */
  project: (p: IAutoMovieVector3) => IAutoMovieVector3;

  /**
   * Same-collider offset proposal; every query spends the caller's lock budget.
   *
   * @evidence contracts/common.md#principled-implementation Offset retraction uses the same closed collider and caller's lock budget, requiring the requested offset to retain the unchanged free clearance.
   * @evidence contracts/common.md#clear-and-simple-design Budget and metric offset are explicit arguments so the contact owns feature projection while the walker owns total query admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Budget exhaustion and nonconvergence remain refusals; the retraction contract permits no hidden replenishment or clearance reduction.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies same-collider offset proposals and states that every attempted read spends the caller's shared lock budget.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No iteration policy is implemented in this callback type; the concrete retractor uses at most 64 pairs of budgeted surface reads.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Retraction shares its enclosing contact sampler, while accounting still consumes a budget unit on every read attempt even when the last hit is reused.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The budget is caller-owned mutable accounting, and retraction retains no separate task after return or refusal.
   */
  retract: (
    point: IAutoMovieVector3,
    offset: number,
    budget: IAutoMovieMeshQueryBudget,
  ) => IHumanFaceHairRetraction;
}
