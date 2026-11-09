import {
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
} from "@automovie/interface";

/**
 * What `forgeCast` returns: every stand-in rig validated and keyed by the cast
 * node it embodies, ready for the staged scene's `modelRef ?? node` join, or
 * every contradiction the forge plan carried.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminated union on the literal `success`; `forgeCast` runs the casting checks and `validateModel` on every entry before choosing a branch, so the failure branch holds the whole list.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The success-or-violations shape every engine stage gate returns, with the success branch keyed for the one join its consumer performs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No partial cast is returned: one missing, duplicated or invalid rig refuses the whole forge, so staging never joins a cast member against a rig that failed.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the join the success branch serves, and that the failure branch lists every contradiction.
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
   * @evidence contracts/development/design.md#principled-representation Keys each model by its cast node, which the gate made equal to the model id, so the staged scene's `modelRef ?? node` lookup resolves every stand-in by one exact string match.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record keyed by node is the whole output, because staging needs nothing but the model per cast member and the casting facts are already proven.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Models are passed through unchanged; the forge neither fills a missing skeleton nor rewrites an id to make the join succeed.
   * @evidence contracts/development/common.md#meaningful-documentation States every condition the branch certifies and that the record is keyed by cast node id and holds the plan's own model objects.
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
   * @evidence contracts/development/design.md#principled-representation Collects casting violations and every `validateModel` violation, remapping each model path from `$input` onto the entry's own `$input.entries[i].model` path so the correction round sees where the fault is.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The list is the only payload because a refused forge has nothing to stage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No violation is suppressed by kind or deduplicated by message, and a duplicate script cast node is reported on the script path rather than silently using one of them.
   * @evidence contracts/development/common.md#meaningful-documentation States that no models exist on this branch and what the violations cover.
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
