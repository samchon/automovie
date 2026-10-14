import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Current design and admitted inputs supplied to ordinary Node film authoring.
 *
 * @evidence contracts/common.md#principled-implementation The builder groups current production, shot contracts, present asset paths, admitted derived payloads and effect zones for the synchronous source callback. Production and other nested records can remain borrowed; construction performs no deep freeze.
 * @evidence contracts/common.md#clear-and-simple-design Id-keyed readonly tables expose composition inputs without adding project-service methods to this shape; ordinary Node still gives the module ambient host capabilities independently of the context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Input acquisition checks declared presence and identity before source execution, but this record supplies neither filesystem isolation nor protection against mutation through another alias. Authors must preserve deterministic input use.
 * @evidence contracts/common.md#meaningful-documentation Defines current production, shot and artifact indexing, asset paths and effect zones, with readonly access distinguished from runtime immutability and sandboxing.
 * @author Samchon
 */
export interface IAutoMovieFilmBuildContext {
  /** Current production design. */
  production: IAutoMovieProductionDesign;

  /** Current shot contracts keyed by id. */
  shots: Readonly<Record<string, IAutoMovieShotContract>>;

  /** Declared, present render-content paths. */
  assets: readonly string[];

  /**
   * Current verified deterministic artifacts keyed by canonical output path.
   */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;

  /** Current registered deterministic effect zones. */
  effectZones: Readonly<IAutoMovieWorldDesign["effectZones"]>;
}
