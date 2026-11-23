import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import type { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import type { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";

/**
 * Host-composed shot artifact consumed by render and numerical oracle services.
 * Resolved models and compact populations travel with source-authored scene and
 * motion, so consumers read one supplied snapshot.
 */
export interface IAutoMovieCompiledShotSource extends IAutoMovieShotSourceOutput {
  /**
   * Optional source export and authored-unit attribution supplied by the host.
   * No surviving production graph or publication gate proves this metadata or
   * requires its presence.
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
   * Completed non-entry exports bound to the same unit, retained as acceptance
   * attribution without executing them as shot builders.
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

  /**
   * Compact formation-level cues; the composing host supplies an empty list for
   * none and owns explicit validation.
   */
  formationMotions: IAutoMovieFormationMotion[];

  /**
   * Sparse per-member exceptions; the composing host supplies an empty list for
   * none and owns explicit validation.
   */
  formationSlotMotions: IAutoMovieFormationSlotMotion[];

  /** Compiler-owned deterministic effect runtimes. */
  effects: IAutoMovieCompiledEffect[];
}
