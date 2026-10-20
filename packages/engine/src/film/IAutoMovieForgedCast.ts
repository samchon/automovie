import {
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
} from "@automovie/interface";

/**
 * What `forgeCast` returns: every stand-in rig validated and keyed by the cast
 * node it embodies, ready for the staged scene's `modelRef ?? node` join, or
 * every contradiction the forge plan carried.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`; `forgeCast` runs the casting checks and `validateModel` on every entry before choosing a branch, so the failure branch holds the whole list.
 * @evidence contracts/common.md#clear-and-simple-design The success-or-violations shape every engine stage gate returns, with the success branch keyed for the one join its consumer performs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No partial cast is returned: one missing, duplicated or invalid rig refuses the whole forge, so staging never joins a cast member against a rig that failed.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the join the success branch serves, and that the failure branch lists every contradiction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the per-entry checks are answered on `forgeCast`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds a fresh result and nothing caches forged casts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union adds no storage of its own; the success branch retains the plan's model objects and the failure branch its violation list, as each member states.
 */
export type IAutoMovieForgedCast =
  | IAutoMovieForgedCast.ISuccess
  | IAutoMovieForgedCast.IFailure;

export namespace IAutoMovieForgedCast {
  /**
   * Every `modelRef: null` cast member has exactly one rig, no rig names an
   * imported or unknown member, each model's id equals its cast node, its
   * origin is `"generated"`, it has a skeleton, and it passed `validateModel`.
   *
   * @evidence contracts/common.md#principled-implementation Keys each model by its cast node, which the gate made equal to the model id, so the staged scene's `modelRef ?? node` lookup resolves every stand-in by one exact string match.
   * @evidence contracts/common.md#clear-and-simple-design One record keyed by node is the whole output, because staging needs nothing but the model per cast member and the casting facts are already proven.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Models are passed through unchanged; the forge neither fills a missing skeleton nor rewrites an id to make the join succeed.
   * @evidence contracts/common.md#meaningful-documentation States every condition the branch certifies and that the record is keyed by cast node id and holds the plan's own model objects.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record; `forgeCast` fills it in one pass over the plan's entries.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh record per call; nothing shares it across scripts or plans.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds references to the forge plan's model objects without copying them, one per stand-in cast member, released with the caller's result.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /**
     * Validated stand-in models keyed by cast node id. Each value is the forge
     * plan's own model object, not a copy.
     */
    models: Record<string, IAutoMovieModel>;
  }

  /**
   * The forge plan contradicted the script, or a rig failed validation; no
   * models were emitted.
   *
   * @evidence contracts/common.md#principled-implementation Collects casting violations and every `validateModel` violation, remapping each model path from `$input` onto the entry's own `$input.entries[i].model` path so the correction round sees where the fault is.
   * @evidence contracts/common.md#clear-and-simple-design The list is the only payload because a refused forge has nothing to stage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No violation is suppressed by kind or deduplicated by message, and a duplicate script cast node is reported on the script path rather than silently using one of them.
   * @evidence contracts/common.md#meaningful-documentation States that no models exist on this branch and what the violations cover.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record; violations are pushed during the producer's single pass.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A refused forge is rebuilt from the corrected plan on the next call; nothing keeps an earlier violation list to compare against.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns the violation array, bounded by the checks run per cast member and entry plus each model's own validation output.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /**
     * Every violation found, with paths into the script (`$script.cast[i]`) or
     * the forge plan (`$input.entries[i]...`).
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
