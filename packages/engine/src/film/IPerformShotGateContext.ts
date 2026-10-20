import {
  IAutoMovieCompiledFormation,
  IAutoMoviePerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { IPerformShotProps } from "./IPerformShotProps";

/**
 * The staged world and lookups `performShot` builds once and every one of its
 * input gates reads.
 *
 * `performShot` creates one per call after reading its inputs, and passes it to
 * the action, target, camera, blocking and overlap gates, so each gate judges
 * an action against the same tables and reports into the same collector. The
 * lookups are read-only for the gates; only `out` is written.
 *
 * @evidence contracts/common.md#principled-implementation The tables are derived once from the staged scene and the compiled formations, the placements by `scenePlacements` and the formation points by the same cue transform the ground gate uses, so every gate reads one placement per id.
 * @evidence contracts/common.md#clear-and-simple-design One record instead of a dozen parameters per gate, holding only what more than one gate reads; values a single gate needs stay that gate's parameters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the caller's own lookups and staged scene unchanged; no gate receives a different table or a fixture-specific override.
 * @evidence contracts/common.md#meaningful-documentation States who builds it and when, who reads it, that only the collector is written, and for each field its source, frame and the meaning of an absent lookup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record with no runtime body; its tables are built once per shot by `performShot`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is itself the reuse: one set of tables per shot shared by every gate, discarded with the call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lives for one `performShot` call; its maps hold one entry per staged placement or compiled formation.
 */
export interface IPerformShotGateContext {
  /** Collector every gate reports into, in gate order. */
  out: ViolationCollector;

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
  skeleton: IPerformShotProps["skeleton"];

  /**
   * Actor-registry membership; undefined when the caller supplies no actor
   * context, in which case a bone target is not checked against it.
   */
  hasActorContext: IPerformShotProps["hasActorContext"];

  /**
   * The gait names each actor supplies; undefined, or `undefined` for a node,
   * skips the `locomote` gait check.
   */
  gaits: IPerformShotProps["gaits"];

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
  targetAt: IPerformShotProps["targetAt"];
}
