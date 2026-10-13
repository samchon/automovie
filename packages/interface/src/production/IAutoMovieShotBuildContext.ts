import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieModelRecipe } from "./IAutoMovieModelRecipe";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieSourceOracle } from "./IAutoMovieSourceOracle";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/** Frozen input available to a coding-agent-owned shot source builder. */
export interface IAutoMovieShotBuildContext {
  /** Current shot contract. */
  contract: IAutoMovieShotContract;

  /** Current model recipes keyed by id. */
  models: Readonly<Record<string, IAutoMovieModelRecipe>>;

  /**
   * Current verified deterministic artifacts keyed by canonical output path.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;

  /**
   * The production's story-clock light sources, when it declares any.
   *
   * The source reads what the production is lit by at this shot's story moment
   * — its contract carries the pin — and states its own local light on top
   * through {@link IAutoMovieProductionShotProgram.lightMotions}. Absent when
   * the production declares no lighting, which is exactly the context a source
   * saw before the field existed.
   */
  lighting?: IAutoMovieProductionLighting;

  /** Current world design. */
  world: IAutoMovieWorldDesign;

  /** Current formations keyed by id. */
  formations: Readonly<Record<string, IAutoMovieFormationDesign>>;

  /** Compiler-generated primitive runtime models keyed by recipe id. */
  runtimeModels: Readonly<Record<string, IAutoMovieModel>>;

  /** Compact builder-derived formation runtimes keyed by formation id. */
  formationRuntime: Readonly<Record<string, IAutoMovieCompiledFormation>>;

  /** Compact builder-derived general instance runtimes keyed by set id. */
  instanceSetRuntime: Readonly<Record<string, IAutoMovieCompiledInstanceSet>>;

  /** Deterministic geometry helpers. */
  engine: IAutoMovieSourceOracle;
}
