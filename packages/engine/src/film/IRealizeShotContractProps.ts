import {
  IAutoMovieCompiledShotSource,
  IAutoMovieFormationDesign,
  IAutoMovieProductionDesign,
  IAutoMovieShotContract,
  IAutoMovieShotSourceOutput,
  IAutoMovieSkeleton,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

/**
 * What {@link realizeShotContract} grades: one shot contract against the
 * compiled artifacts that claim to realize it.
 *
 * Two callers build it at two moments. `compileDefinedShot` passes the direct
 * source-stage output with `production: null`, a raster in `frameFormat`, and a
 * `skeleton` lookup because no builder-owned models exist yet.
 * `AutoMovieProductionBuilder` passes the materialized source with the full
 * production, whose models carry every rig. Every field is read only; the
 * grade never mutates the contract or the artifacts.
 *
 * @evidence contracts/development/design.md#principled-representation Names exactly the inputs the grade reads, so the two call sites are checked by the compiler against one declaration instead of each matching an anonymous parameter shape; the optional `frameFormat` and `skeleton` exist because the source-stage caller has no production object and no attached models, which is the real difference between the two moments.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One flat record with no defaults of its own: the production's raster wins over `frameFormat`, a model's rig wins over `skeleton`, and those precedences are applied where they are read, in the subject reader and the camera grade.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no field for a specific caller, test or fixture; `collisions` is the builder's own finding about formation slots passed through to the grade so it fails the same diagnostic channel.
 * @evidence contracts/development/common.md#meaningful-documentation States both producers and when each calls, which field wins when two could answer, what a `null` or omitted field means for the grade, and that nothing is mutated.
 */
export interface IRealizeShotContractProps {
  /**
   * The contract whose opening and closing states, events, camera
   * requirements and participants are graded. Its `id` names the failure
   * target `shot:<id>`.
   */
  contract: IAutoMovieShotContract;

  /**
   * Full production design for builder-materialized output, or `null` for the
   * direct source-stage pass, before builder-owned formation heroes exist.
   * With `null`, promoted hero nodes are not required, and the raster comes
   * from {@link frameFormat}.
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
   * Formation designs by id. A camera subject named here is placed and boxed
   * as a formation rather than as a scene node, and each formation participant
   * is held to its design's count and model group.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation The source-stage pass has rigs only through the runtime's `skeleton` lookup, so the grade borrows that lookup instead of requiring models that do not exist yet; a compiled model's own skeleton still takes precedence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A plain function of the node id, the same signature `IAutoMovieShotRuntime.skeleton` has, so `compileDefinedShot` passes the runtime's lookup through unchanged.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The grade substitutes no rig for a `null` answer; a predicate that needs one fails.
   * @evidence contracts/development/common.md#meaningful-documentation States when it is consulted, its precedence below compiled models, and the effect of a `null` answer on predicates and placement.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A caller-supplied lookup whose cost is the caller's; the grade calls it at most once per rig read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The grade does not memoize the answers; a caller with an expensive rig build memoizes behind the lookup.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned rig stays caller-owned and the realization record keeps no reference to it.
   */
  skeleton?: (node: string) => IAutoMovieSkeleton | null;

  /**
   * Formation slot ids the builder found colliding with coding-agent scene
   * nodes. Each one becomes a `contract-realization-failed` diagnostic.
   */
  collisions: readonly string[];
}
