import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieConstraintViolation } from "../validation/IAutoMovieConstraintViolation";

/**
 * What `forgeCast` returns: every stand-in rig validated and keyed by the cast
 * node it embodies, ready for the staged scene's `modelRef ?? node` join, or
 * every contradiction the forge plan carried.
 */
export type IAutoMovieForgedCast =
  | IAutoMovieForgedCast.ISuccess
  | IAutoMovieForgedCast.IFailure;

/** Data and callback contracts shared by the ForgedCast operations. */
export namespace IAutoMovieForgedCast {
  /**
   * Every `modelRef: null` cast member has exactly one rig, no rig names an
   * imported or unknown member, each model's id equals its cast node, its
   * origin is `"generated"`, it has a skeleton, and it passed `validateModel`.
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
