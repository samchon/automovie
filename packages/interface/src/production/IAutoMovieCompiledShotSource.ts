import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import { IAutoMovieFormationSlotMotion } from "./IAutoMovieFormationSlotMotion";
import { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";

/** Fully builder-owned shot artifact consumed by render and oracle services. */
export interface IAutoMovieCompiledShotSource extends IAutoMovieShotSourceOutput {
  /**
   * Exact graph-selected source export and authored unit carried into the
   * materialized shot. Omitted only for legacy source-scope callers that did
   * not supply authoring evidence; review and final never publish without it.
   */
  sourceOwner?: {
    branch: string;
    path: string;
    export: string;
    digest: AutoMovieContentDigest;
    target: string;
  };

  /**
   * Completed non-entry exports bound to the same unit, retained as acceptance
   * attribution without executing them as shot builders.
   */
  acceptanceSources?: Array<{
    path: string;
    export: string;
    digest: AutoMovieContentDigest;
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
