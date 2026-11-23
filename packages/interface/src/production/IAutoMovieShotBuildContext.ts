import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import type { IAutoMovieSourceOracle } from "./IAutoMovieSourceOracle";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Host-supplied design and compact runtime inputs read by subject render
 * methods; readonly maps are a TypeScript contract, not a deep runtime freeze.
 */
export interface IAutoMovieShotBuildContext {
  /** Current shot contract. */
  contract: IAutoMovieShotContract;

  /**
   * Current model groups keyed by the id that populations and LOD tiers name;
   * scene nodes cite each group by its own `id`.
   */
  models: Readonly<Record<string, IAutoMovieModel>>;

  /** Current verified deterministic artifacts keyed by canonical output path. */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;

  /**
   * The production's story-clock light sources, when it declares any.
   *
   * The shot contract carries the story pin. This optional metadata does not
   * sample lights automatically; the host supplies lighting inputs and
   * shot-local lightMotions explicitly.
   */
  lighting?: IAutoMovieProductionLighting;

  /** Current world design. */
  world: IAutoMovieWorldDesign;

  /** Current formations keyed by id. */
  formations: Readonly<Record<string, IAutoMovieFormationDesign>>;

  /** Compact builder-derived formation runtimes keyed by formation id. */
  formationRuntime: Readonly<Record<string, IAutoMovieCompiledFormation>>;

  /** Compact builder-derived general instance runtimes keyed by set id. */
  instanceSetRuntime: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;

  /** Deterministic geometry helpers. */
  engine: IAutoMovieSourceOracle;
}
