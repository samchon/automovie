import type { IAutoMovieShotPerformance } from "../cinematics/IAutoMovieShotPerformance";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieSceneNode } from "../scene/IAutoMovieSceneNode";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieShotSpatialSelector } from "./IAutoMovieShotSpatialSelector";
import type { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * Where the subjects a shot contract names stand in its compiled artifacts, at
 * any shot-local second, built once per {@link realizeShotContract} call by
 * {@link createShotContractSubjectReader}.
 *
 * Every lookup by id takes the first record carrying that id, so a duplicated
 * id grades against its first record and stays the artifact validators'
 * refusal. A node's world placement at a second is its staged transform, each
 * of translation, rotation and scale overridden by the object-motion channel
 * active then, with a rigged node's posed root folded in at identity scale. A
 * method that cannot place what it was asked about throws an `Error` naming the
 * missing node, rig, motion, landmark or formation; the grade catches it and
 * records the predicate or camera subject as failing rather than guessing a
 * position.
 */
export interface IAutoMovieShotContractSubjectReader {
  /**
   * The compiled scene node with this id, or `undefined` when the scene has
   * none.
   */
  node(id: string): IAutoMovieSceneNode | undefined;

  /**
   * The compiled formation with this id, or `undefined` when no compiled
   * formation carries it, including when `compiled.formations` is omitted.
   */
  formation(id: string): IAutoMovieCompiledFormation | undefined;

  /**
   * The shot's performance of this scene node, or `undefined` when the node is
   * not performed in this shot.
   */
  performance(node: string): IAutoMovieShotPerformance | undefined;

  /**
   * The node's rig: its model's skeleton when the model is among the compiled
   * models, otherwise the caller's `skeleton` lookup, otherwise `null`.
   */
  skeleton(node: IAutoMovieSceneNode): IAutoMovieSkeleton | null;

  /**
   * The node's pose at a shot-local second. A performed node samples the motion
   * its performance names at `time - startOffset`, clamped to zero; an
   * unperformed node samples its own motion at `time`. With no motion, the
   * node's held pose answers, or an empty pose of its rig when it holds none.
   *
   * Throws when the node has no rig or its motion is not compiled.
   */
  poseAt(node: IAutoMovieSceneNode, time: number): IAutoMoviePose;

  /**
   * The world point, in metres, a predicate selector names at a shot-local
   * second: a literal point, a world landmark, a node's placed translation, or
   * a formation's compiled centroid carried by its cue at that second.
   *
   * Throws when the landmark, node or compiled formation it names is absent, or
   * the node's pose cannot be sampled.
   */
  spatialAt(
    selector: IAutoMovieShotSpatialSelector,
    time: number,
  ): IAutoMovieVector3;

  /**
   * The placement a required camera subject is boxed through: for a subject
   * with a formation design, its sampled centroid with an identity rotation and
   * scale, which the formation box never reads; otherwise the node's world
   * placement.
   *
   * Throws when the subject cannot be placed.
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
   * because the solve raised its aim and stood back by them. A formation is its
   * whole transformed footprint from `formationSubjectBox` at `time`, widened
   * by a member's radius and raised by a member's height.
   */
  subjectBox(
    subject: string,
    placement: IAutoMovieTransform,
    time: number,
  ): IAutoMovieSubjectBox;
}
