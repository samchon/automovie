import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";

/**
 * What the simple tier reads on the whole person a body shape belongs to.
 *
 * A body basis has no head, so it cannot answer stature (floor to the top of
 * the head) or the volume of the closed person whose mass the simple tier
 * states. The caller that owns the person (a face subtree on a one-skin
 * generation) supplies both readings as functions of the body shape; the
 * simple tier never estimates the missing head.
 *
 * @evidence contracts/common.md#principled-implementation Caller-supplied functions read stature and closed volume on the whole person, including the head the body basis lacks.
 * @evidence contracts/common.md#clear-and-simple-design Whole-person composition owns these readings while body expansion consumes only their scalar results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing head geometry is not replaced by a fixed head allowance; an optional copied reach can narrow solving support.
 * @evidence contracts/common.md#meaningful-documentation Members state metres, cubic metres and same-source reach ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The whole-person reading contract definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The whole-person reading contract type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The whole-person reading contract declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleWhole {
  /**
   * Solve-only body domain of this whole evaluator, when narrower than the
   * body's independent authoring domain. The same body id and source views
   * supply both; expansion consumes these actual dependencies. A reader may
   * derive this support lazily so projection of a held valid shape does not
   * need an independent inverse-domain representation.
   */
  bodyReach?: IAutoMovieHumanBodyBasis;

  /**
   * The whole person's standing floor-to-vertex stature for a body shape, metres.
   *
   * @evidence contracts/common.md#principled-implementation A whole-person evaluator returns floor-to-crown stature in metres for the supplied read-only body weights.
   * @evidence contracts/common.md#clear-and-simple-design Composition owns the head and body evaluation behind this callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing head cannot be replaced with a constant allowance under this contract.
   * @evidence contracts/common.md#meaningful-documentation The signature states the input shape and the whole-person stature unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The whole stature callback specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The whole stature callback declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The whole stature callback acquires no resources and implements no storage lifetime.
   */
  stature: (shape: Readonly<Record<string, number>>) => number;

  /**
   * The volume the whole person's closed skin encloses for a body shape, cubic metres.
   *
   * @evidence contracts/common.md#principled-implementation A whole-person evaluator returns enclosed closed-skin volume in cubic metres for the supplied body weights.
   * @evidence contracts/common.md#clear-and-simple-design The composition owner provides the complete closed surface needed by this callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The body-only basis cannot supply a fabricated head volume through this reading.
   * @evidence contracts/common.md#meaningful-documentation The property documents closed-skin ownership and cubic-metre output.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The whole volume callback specifies an operation but selects no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The whole volume callback declares no cache or cross-request coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The whole volume callback acquires no resources and implements no storage lifetime.
   */
  volume: (shape: Readonly<Record<string, number>>) => number;
}
