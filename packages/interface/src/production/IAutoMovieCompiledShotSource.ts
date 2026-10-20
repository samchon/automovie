import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";

/**
 * Host-composed shot artifact consumed by render and numerical oracle services. Resolved models and compact populations travel with source-authored scene and motion, so consumers read one supplied snapshot.
 *
 * @evidence contracts/common.md#principled-implementation The record combines shot source output, resolved models, regenerable populations, formation cues and deterministic effects for Engine measurement and render adapters. The production composer is retired; a host must assemble and explicitly admit these fields, and optional source attribution is declared metadata rather than a surviving graph-selection proof.
 * @evidence contracts/common.md#clear-and-simple-design Extending shot output preserves its scene and motion representation, while compiler-only resolution and provenance fields stay on the compiled artifact rather than expanding the source authoring API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Render and measurement consume the supplied artifact without executing acceptance exports. This type supplies no source-owner admission, review/final publication gate or automatic formation-cue validation after production retirement; the host owns those checks.
 * @evidence contracts/common.md#meaningful-documentation States host composition, optional unverified source/acceptance attribution, model and compact-population membership, explicit cue admission ownership and deterministic effect records.
 */
export interface IAutoMovieCompiledShotSource extends IAutoMovieShotSourceOutput {
  /**
   * Optional source export and authored-unit attribution supplied by the host. No surviving production graph or publication gate proves this metadata or requires its presence.
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

  /** Compact formation-level cues; the composing host supplies an empty list for none and owns explicit validation. */
  formationMotions: IAutoMovieFormationMotion[];

  /** Sparse per-member exceptions; the composing host supplies an empty list for none and owns explicit validation. */
  formationSlotMotions: IAutoMovieFormationSlotMotion[];

  /** Compiler-owned deterministic effect runtimes. */
  effects: IAutoMovieCompiledEffect[];
}
