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

/**
 * Current builder-supplied design and compact runtime inputs for a coding-agent-owned shot source; readonly maps are a TypeScript contract, not a deep runtime freeze.
 *
 * @evidence contracts/common.md#principled-implementation Production assembles the current shot contract, admitted recipes, world, verified derivations and compact population runtimes with shared geometry helpers before invoking the selected synchronous source export.
 * @evidence contracts/common.md#clear-and-simple-design Keeps authored design, builder-materialized runtime data and query helpers distinct so source can stage a thin program without reconstructing population placement or reading undeclared generated files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinary Node source evaluator does not deeply freeze these records or enforce deterministic isolation; current admission and input snapshot checks validate output and freshness rather than claiming a sandbox guarantee.
 * @evidence contracts/common.md#meaningful-documentation Defines current design versus generated-runtime ownership, verified artifact paths, optional story lighting and the compile-time-only readonly limitation.
 * @author Samchon
 */
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
   * The shot contract carries the story pin. Current assembly inherits the production's opening state at shot second zero; source-owned lightMotions supplies continued local animation. Absent when production lighting is undeclared.
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
