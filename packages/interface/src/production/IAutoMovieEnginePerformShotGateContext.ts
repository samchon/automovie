import type { IAutoMoviePerformance } from "../authoring/IAutoMoviePerformance";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieViolationAppendShotGateSink } from "../validation/IAutoMovieViolationAppendShotGateSink";
import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMoviePerformShotProps } from "./IAutoMoviePerformShotProps";
import type { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * The staged world and lookups `performShot` builds once and every one of its
 * input gates reads.
 *
 * `performShot` creates one per call after reading its inputs, and passes it to
 * the action, target, camera, blocking and overlap gates, so each gate judges
 * an action against the same tables and reports into the same collector. The
 * lookups are read-only for the gates; only `out` is written.
 */
export interface IAutoMovieEnginePerformShotGateContext {
  /** Collector every gate reports into, in gate order. */
  out: IAutoMovieViolationAppendShotGateSink;

  /** The validated stage result the shot performs on. */
  staged: IAutoMovieStagedSet.ISuccess;

  /** The beat's performance, whose actions and duration are gated. */
  performance: IAutoMoviePerformance;

  /**
   * Path prefix of the performing action list: `$input.revise.final` when the
   * revise pass produced one, `$input.draft` otherwise.
   */
  base: string;

  /** Rig lookup; null for a staged node with no skeleton. */
  skeleton: IAutoMoviePerformShotProps["skeleton"];

  /**
   * Actor-registry membership; undefined when the caller supplies no actor
   * context, in which case a bone target is not checked against it.
   */
  hasActorContext: IAutoMoviePerformShotProps["hasActorContext"];

  /**
   * The gait names each actor supplies; undefined, or `undefined` for a node,
   * skips the `locomote` gait check.
   */
  gaits: IAutoMoviePerformShotProps["gaits"];

  /** Ids of the staged scene nodes. */
  nodeIds: ReadonlySet<string>;

  /** Ids of the staged cameras. */
  cameraIds: ReadonlySet<string>;

  /** World position of every staged node and camera, in metres. */
  nodePositions: Map<string, IAutoMovieVector3>;

  /** The compiled formations this shot may frame, by id. */
  formationById: ReadonlyMap<string, IAutoMovieCompiledFormation>;

  /** Each compiled formation's world centroid at the shot's opening, metres. */
  formationPoints: ReadonlyMap<string, IAutoMovieVector3>;

  /**
   * Live resolver for a target whose point moves during the shot; undefined
   * when the caller supplies none, and its `null` falls back to the staged
   * placement.
   */
  targetAt: IAutoMoviePerformShotProps["targetAt"];
}
