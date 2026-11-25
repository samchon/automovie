import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import type { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import type { IAutoMovieShotSourceOutput } from "./IAutoMovieShotSourceOutput";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * What {@link realizeShotContract} grades: one shot contract against the
 * compiled artifacts that claim to realize it.
 *
 * Two callers build it at two moments. `compileDefinedShot` passes the direct
 * source-stage output with `production: null`, a raster in `frameFormat`, and a
 * `skeleton` lookup because no builder-owned models exist yet.
 * `AutoMovieProductionBuilder` passes the materialized source with the full
 * production, whose models carry every rig. Every field is read only; the grade
 * never mutates the contract or the artifacts.
 */
export interface IAutoMovieRealizeShotContractProps {
  /**
   * The contract whose opening and closing states, events, camera requirements
   * and participants are graded. Its `id` names the failure target
   * `shot:<id>`.
   */
  contract: IAutoMovieShotContract;

  /**
   * Full production design for builder-materialized output, or `null` for the
   * direct source-stage pass, before builder-owned formation heroes exist. With
   * `null`, promoted hero nodes are not required, and the raster comes from
   * {@link frameFormat}.
   */
  production: IAutoMovieProductionDesign | null;

  /**
   * Raster the camera grade measures against when `production` is `null`.
   * Ignored when `production` is supplied. When neither supplies one, every
   * camera sample fails.
   */
  frameFormat?: Pick<
    IAutoMovieProductionDesign["frameFormat"],
    "crop" | "width" | "height"
  >;

  /**
   * World design whose landmarks a `landmark` selector resolves against, or
   * `null` when the shot has none; a landmark selector then fails its
   * predicate.
   */
  world: IAutoMovieWorldDesign | null;

  /**
   * Formation designs by id. A camera subject named here is placed and boxed as
   * a formation rather than as a scene node, and each formation participant is
   * held to its design's count and model group.
   */
  formations: ReadonlyMap<string, IAutoMovieFormationDesign>;

  /**
   * The compiled source being graded: scene, shot, motions, event samples and
   * formation cues, plus the builder-owned models and compiled formations when
   * they exist. A missing `models` list leaves rigs to {@link skeleton}; a
   * missing `formations` list makes every formation subject unresolved.
   */
  compiled: IAutoMovieShotSourceOutput &
    Partial<Pick<IAutoMovieCompiledShotSource, "models" | "formations">>;

  /**
   * Rig lookup by scene-node id for the direct source-stage pass. Consulted
   * only for a node whose model is not in `compiled.models`; `null` means the
   * node has no rig, so its joint-angle predicates fail and its pose root is
   * not folded into its placement.
   */
  skeleton?: (node: string) => IAutoMovieSkeleton | null;

  /**
   * Formation slot ids the builder found colliding with coding-agent scene
   * nodes. Each one becomes a `contract-realization-failed` diagnostic.
   */
  collisions: readonly string[];
}
