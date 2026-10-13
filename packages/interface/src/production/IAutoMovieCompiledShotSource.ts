import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";

/**
 * Builder-owned shot artifact consumed by render and numerical oracle services. Resolved models and compact populations travel with source-authored scene and motion, so consumers read one compiled snapshot.
 *
 * @evidence contracts/common.md#principled-implementation The builder combines admitted shot source with resolved models, regenerable populations, validated formation motion and deterministic effects; source-owner and acceptance attribution identify the exact graph-selected exports that produced or verified the authored unit.
 * @evidence contracts/common.md#clear-and-simple-design Extending shot output preserves its scene and motion representation, while compiler-only resolution and provenance fields stay on the compiled artifact rather than expanding the source authoring API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acceptance exports are attributed without executing them as shot builders, and review or final cannot publish the legacy source-only artifact that omits authoring ownership evidence.
 * @evidence contracts/common.md#meaningful-documentation States builder ownership, source-owner omission limits, acceptance attribution, model and compact-population membership, validated sparse motion exceptions and deterministic effect ownership.
 * @author Samchon
 */
export interface IAutoMovieCompiledShotSource extends IAutoMovieShotSourceOutput {
  /**
   * Exact graph-selected source export and authored unit carried into the materialized shot. Omitted only for legacy source-scope callers that did not supply authoring evidence; review and final never publish without it.
   */
  sourceOwner?: {
    /** Graph-selected source branch that owns this authored unit. */
    branch: string;

    /** Canonical source-module path relative to the project. */
    path: string;

    /** Exact named build declaration selected by the graph. */
    export: string;

    /** SHA-256 of the normalized source bytes. */
    digest: string;

    /** Authored unit address proved by this source declaration. */
    target: string;
  };

  /**
   * Completed non-entry exports bound to the same unit, retained as acceptance attribution without executing them as shot builders.
   */
  acceptanceSources?: Array<{
    /** Canonical module path of the completed acceptance source. */
    path: string;

    /** Named declaration attributed without calling it as a shot builder. */
    export: string;

    /** SHA-256 of the normalized acceptance source bytes. */
    digest: string;

    /** Same authored unit address to which this acceptance is bound. */
    target: string;
  }>;

  /** Models required by this shot. */
  models: IAutoMovieModel[];

  /** Compact formation runtimes required by this shot. */
  formations: IAutoMovieCompiledFormation[];

  /** Compact general instance runtimes placed by the production world. */
  instanceSets: IAutoMovieCompiledInstanceSet[];

  /** Validated compact formation-level cues, empty when source omitted them. */
  formationMotions: IAutoMovieFormationMotion[];

  /** Validated sparse per-member exceptions, empty when source omitted them. */
  formationSlotMotions: IAutoMovieFormationSlotMotion[];

  /** Compiler-owned deterministic effect runtimes. */
  effects: IAutoMovieCompiledEffect[];
}
