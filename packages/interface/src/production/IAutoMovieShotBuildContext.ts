import { IAutoMovieModel } from "../model/IAutoMovieModel";
import { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import { IAutoMovieCompiledInstanceSet } from "./IAutoMovieCompiledInstanceSet";
import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieSourceOracle } from "./IAutoMovieSourceOracle";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Host-supplied design and compact runtime inputs read by subject render methods; readonly maps are a TypeScript contract, not a deep runtime freeze.
 *
 * @evidence contracts/common.md#principled-implementation AutoMovieSubject and AutoMovieSubjectGroup receive this explicit context for their render contributions. The production assembler is retired, so the caller must provide consistent contract, model groups, world, derived payloads, compact runtimes and geometry helpers; this type does not verify their currentness or byte identity.
 * @evidence contracts/common.md#clear-and-simple-design Keeps authored design, model groups, compiled population runtimes and query helpers distinct so source can stage a thin program without reconstructing population placement or reading undeclared generated files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readonly tables do not deeply freeze nested records, isolate arbitrary subject code or certify deterministic effects. No surviving production evaluator supplies an implicit current-input fence for this context; hosts own deterministic input preparation.
 * @evidence contracts/common.md#meaningful-documentation Defines design versus generated-runtime ownership, host-verification premises for artifact paths, optional story lighting and the compile-time-only readonly limitation.
 */
export interface IAutoMovieShotBuildContext {
  /** Current shot contract. */
  contract: IAutoMovieShotContract;

  /**
   * Current model groups keyed by the id that populations and LOD tiers name; scene nodes cite each group by its own `id`.
   */
  models: Readonly<Record<string, IAutoMovieModel>>;

  /**
   * Current verified deterministic artifacts keyed by canonical output path.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;

  /**
   * The production's story-clock light sources, when it declares any.
   *
   * The shot contract carries the story pin. This optional metadata does not sample lights automatically; the host supplies lighting inputs and shot-local lightMotions explicitly.
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
