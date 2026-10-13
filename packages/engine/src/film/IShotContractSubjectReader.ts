import {
  IAutoMovieCompiledFormation,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  IAutoMovieShotPerformance,
  IAutoMovieShotSpatialSelector,
  IAutoMovieSkeleton,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Where the subjects a shot contract names stand in its compiled artifacts, at
 * any shot-local second, built once per {@link realizeShotContract} call by
 * {@link createShotContractSubjectReader}.
 *
 * Every lookup by id takes the first record carrying that id, so a duplicated
 * id grades against its first record and stays the artifact validators'
 * refusal. A node's world placement at a second
 * is its staged transform, each of translation, rotation and scale overridden
 * by the object-motion channel active then, with a rigged node's posed root
 * folded in at identity scale. A method that cannot place what it was asked
 * about throws an `Error` naming the missing node, rig, motion, landmark or
 * formation; the grade catches it and records the predicate or camera subject
 * as failing rather than guessing a position.
 *
 * @evidence contracts/common.md#principled-implementation Each method is a read of the compiled artifacts at one instant: a node's placement is its staged transform overridden by the object-motion authority sampled at that instant, with its posed root folded in by `foldRoot`; a formation is its compiled centroid carried by its sampled cue; a node box is `nodeSubjectBox` over the same `nodeSubjectExtent` the camera solve framed from; throwing on an unresolvable reference is what lets the grade fail it instead of substituting a default.
 * @evidence contracts/common.md#clear-and-simple-design Exposes only what the predicate grade, the camera grade and the participant checks read, so the index maps and caches are built once and the graders never repeat an id scan or pass the props record around to private helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, model or formation is special-cased; a formation is recognized only by its design entry, and the first-record rule applies to every table alike rather than being chosen for any fixture.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its lifetime, the duplicate-id rule, how a node is placed, and the throw-to-fail contract; each member states what it reads, its unit and clock, and when it throws.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface with no runtime body; the lookup and caching costs are answered on `createShotContractSubjectReader`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The cache identity and invalidation of what the methods share are decided by the factory that implements them, where they are answered.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface owns nothing; the implementation's maps and caches are answered on the factory that allocates them.
 */
export interface IShotContractSubjectReader {
  /**
   * The compiled scene node with this id, or `undefined` when the scene has
   * none.
   *
   * @evidence contracts/common.md#principled-implementation A map read over the scene nodes indexed once, keeping the first node of a repeated id.
   * @evidence contracts/common.md#clear-and-simple-design The one node lookup the predicate grade, the hero check, the actor check and the event-subject check share.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No node id is treated specially; an absent id answers `undefined` and the caller decides the failure.
   * @evidence contracts/common.md#meaningful-documentation States the source table and the `undefined` answer for an absent id.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A single read of the node map built from the compiled scene, with no scan.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A lookup in a table built once per reader, with no per-call work to share.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a reference into the caller's compiled scene and retains nothing new.
   */
  node(id: string): IAutoMovieSceneNode | undefined;

  /**
   * The compiled formation with this id, or `undefined` when no compiled
   * formation carries it, including when `compiled.formations` is omitted.
   *
   * @evidence contracts/common.md#principled-implementation A map read over the compiled formations indexed once, first record winning, so the participant grade and the subject reader see the same formation for an id.
   * @evidence contracts/common.md#clear-and-simple-design Shared by the formation participant grade, the event-subject check and the formation selector, so all three see one formation per id.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted formation list is read as empty, never as a stand-in formation.
   * @evidence contracts/common.md#meaningful-documentation States the source list and both `undefined` cases.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A single read of the formation map built from the compiled formation list, with no scan.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads a table the reader built once; nothing per call can be shared.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a reference to a caller-owned compiled formation without retaining it.
   */
  formation(id: string): IAutoMovieCompiledFormation | undefined;

  /**
   * The shot's performance of this scene node, or `undefined` when the node
   * is not performed in this shot.
   *
   * @evidence contracts/common.md#principled-implementation The shot performances indexed once by node, first entry winning, which is the performance the pose sampling also reads, so the actor check and the pose agree.
   * @evidence contracts/common.md#clear-and-simple-design The actor participant check asks only whether a performance exists, and the same table drives pose sampling inside the reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No node is assumed performed; an unperformed node answers `undefined`.
   * @evidence contracts/common.md#meaningful-documentation States what is looked up by which key and what `undefined` means.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A single read of the performance map keyed by node, with no scan of the shot's performances.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A read of the once-built performance table, coordinating no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a reference into the caller's compiled shot and retains nothing.
   */
  performance(node: string): IAutoMovieShotPerformance | undefined;

  /**
   * The node's rig: its model's skeleton when the model is among the compiled
   * models, otherwise the caller's `skeleton` lookup, otherwise `null`.
   *
   * @evidence contracts/common.md#principled-implementation A builder-owned model is the authority for its own rig, so the caller's lookup is consulted only for a node whose model is not compiled, the source-stage case it exists for.
   * @evidence contracts/common.md#clear-and-simple-design One rig rule read by joint-angle predicates, pose sampling, placement folding and extent measurement, so they cannot disagree about a node's rig.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No default skeleton replaces a missing rig; `null` makes the readers that need one fail.
   * @evidence contracts/common.md#meaningful-documentation States the precedence of the two sources and the `null` answer.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One map read and at most one call of the caller's lookup.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller's lookup is not memoized here because its cost and caching are the caller's, as `IAutoMovieShotRuntime.skeleton` states.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a model-owned or caller-owned rig and keeps no reference to it.
   */
  skeleton(node: IAutoMovieSceneNode): IAutoMovieSkeleton | null;

  /**
   * The node's pose at a shot-local second. A performed node samples the
   * motion its performance names at `time - startOffset`, clamped to zero; an
   * unperformed node samples its own motion at `time`. With no motion, the
   * node's held pose answers, or an empty pose of its rig when it holds none.
   *
   * Throws when the node has no rig or its motion is not compiled.
   *
   * @evidence contracts/common.md#principled-implementation Samples with `sampleMotion` on the clip clock the performance defines, clamping before the start offset to the clip's first instant as every beat reader does, and refuses a rig-less node because a pose has no meaning without one.
   * @evidence contracts/common.md#clear-and-simple-design The single pose read the joint-angle predicate and the placement fold share.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An uncompiled motion throws instead of falling back to the held pose, so a missing clip fails its predicate.
   * @evidence contracts/common.md#meaningful-documentation States the clock for performed and unperformed nodes, the clamp, the held and empty pose fallbacks, and when it throws.
   * @evidence contracts/performance.md#efficient-algorithms Two map reads and one `sampleMotion`, whose cost is linear in the clip's tracks.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Pose samples are not cached: repeated reads of one node at one instant are rare in a contract, and object-motion sampling, the shared cost, is cached by the placement path.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh sampled pose or the node's own held pose, retaining nothing.
   */
  poseAt(node: IAutoMovieSceneNode, time: number): IAutoMoviePose;

  /**
   * The world point, in metres, a predicate selector names at a shot-local
   * second: a literal point, a world landmark, a node's placed translation, or
   * a formation's compiled centroid carried by its cue at that second.
   *
   * Throws when the landmark, node or compiled formation it names is absent,
   * or the node's pose cannot be sampled.
   *
   * @evidence contracts/common.md#principled-implementation Each selector kind reads the artifact that owns that point: the world design's landmark, the node placement composed from staged transform, object motion and pose root, or `transformFormationPoint` over the sampled formation cue.
   * @evidence contracts/common.md#clear-and-simple-design One selector resolver for position and distance predicates and for formation camera subjects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent reference throws for the grade to fail; no origin or staged point stands in for it.
   * @evidence contracts/common.md#meaningful-documentation States what each selector kind resolves to, the unit and clock, and every throw.
   * @evidence contracts/performance.md#efficient-algorithms One map read plus, for a node, one cached object-motion sample and one pose sample, and for a formation one cue sample.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse is in the object-motion cache the node path reads; the resolved point itself is cheap to recompute.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a point; any sample it causes to be cached is bounded on the factory.
   */
  spatialAt(
    selector: IAutoMovieShotSpatialSelector,
    time: number,
  ): IAutoMovieVector3;

  /**
   * The placement a required camera subject is boxed through: for a subject
   * with a formation design, its sampled centroid with an identity rotation
   * and scale, which the formation box never reads; otherwise the node's
   * world placement.
   *
   * Throws when the subject cannot be placed.
   *
   * @evidence contracts/common.md#principled-implementation A node is boxed through its full placement because a yawed or scaled element fills a different world box; a formation states its own transformed bounds, so only its point is needed.
   * @evidence contracts/common.md#clear-and-simple-design Separates placing a subject from boxing it, because the camera grade counts a subject as resolved once it is placed, before the box is measured.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The identity orientation of a formation placement is never read, so it changes no measurement; a design without a compiled formation throws.
   * @evidence contracts/common.md#meaningful-documentation States how each subject kind is placed, why the formation's orientation is identity, and when it throws.
   * @evidence contracts/performance.md#efficient-algorithms One design-map test, then either one cue sample or one node placement with a cached object-motion sample.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shares the object-motion cache with every other node placement at the same second; the placement itself is not cached.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh transform or references to the node's staged vectors, retaining nothing new.
   */
  placementAt(subject: string, time: number): IAutoMovieTransform;

  /**
   * The world box a required camera subject fills at a shot-local second,
   * measured the way the camera solve measured it.
   *
   * A node is its drawn model-space box from `nodeSubjectExtent` carried
   * through `placement` by `nodeSubjectBox`; its model's rest geometry is the
   * source, its rig's joint span stands in without a model, and the stand-in
   * height without either. The floor and width of the drawn box are kept
   * because the solve raised its aim and stood back by them. A formation is
   * its whole transformed footprint from `formationSubjectBox` at `time`,
   * widened by a member's radius and raised by a member's height.
   *
   * @evidence contracts/common.md#principled-implementation Reads the subject through the same `nodeSubjectExtent`, `nodeSubjectBox` and `formationSubjectBox` that `performShot` framed from, so a camera solved to hold a mass is graded against that mass and not a segment at the node origin.
   * @evidence contracts/common.md#clear-and-simple-design The box is the one subject geometry the camera grade needs, kept beside placement so the grade never chooses between node and formation readings itself.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A node with nothing to measure keeps the horizontally degenerate stand-in segment rather than an invented width.
   * @evidence contracts/common.md#meaningful-documentation States the source for each subject kind, the fallback order for a node, why the floor and width are kept, and how a formation is widened and raised.
   * @evidence contracts/performance.md#efficient-algorithms Eight corner transforms for a node, or one formation footprint, after the cached extent; the rest-geometry walk runs once per node subject per reader.
   * @evidence contracts/performance.md#reuse-equivalent-work Node extents are cached by subject id and formation member extents by formation id, both pure functions of the reader's immutable inputs, so every camera sample after the first reuses them.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh box; the extent caches it fills are bounded on the factory.
   */
  subjectBox(
    subject: string,
    placement: IAutoMovieTransform,
    time: number,
  ): IAutoMovieSubjectBox;
}
