import type { IAutoMovieDerivedArtifactSource } from "./IAutoMovieDerivedArtifactSource";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Frozen current design and verified inputs available to deterministic film authoring.
 *
 * @evidence contracts/common.md#principled-implementation Production design, current shot contracts, present declared assets, verified derived payloads and registered effect zones form the admitted snapshot supplied to the sandboxed film builder.
 * @evidence contracts/common.md#clear-and-simple-design The context exposes only film-composition inputs, using id-keyed readonly shot and artifact tables rather than permitting mutable project services or filesystem access inside the authoring callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Film source cannot manufacture current asset ownership or regenerate stale derived artifacts through this context; the builder establishes their presence and content identity before sandbox execution.
 * @evidence contracts/common.md#meaningful-documentation States frozen snapshot ownership, active production, shot indexing, present render-content paths, verified derived input indexing and registered effect-zone scope.
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
