import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";
import type { IAutoMovieGeometrySelector } from "./IAutoMovieGeometrySelector";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Geometry-query operations over a borrowed map of compiled shots, retained for
 * the reader's lifetime.
 *
 * Actor IDs resolve scene-node IDs. With no shot ID, an actor must occur in
 * exactly one compiled shot; missing actors/models and ambiguous actors throw.
 * Actor sampling requires finite shot-local seconds in [0, shot.duration].
 * Performance motion starts at max(0, time - startOffset); node object channels
 * use shot time. Samples are recomputed from current records and no pose cache
 * is retained. Returned borrowed records and vectors must be treated as
 * read-only even where the structural types permit mutation.
 */
export type IAutoMovieGeometryActorReader = {
  /**
   * Resolve a world-space point in metres. Point and landmark selectors return
   * borrowed vectors and ignore sampling options; a missing landmark throws.
   * Actor/bone results are sampled, and an absent rig or unresolved bone
   * throws. Actor-root results may also alias a node translation.
   */
  selector: (
    selector: IAutoMovieGeometrySelector,
    world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
    options?: {
      /**
       * Compiled shot ID restricting actor lookup; absent searches all shots
       * and requires a unique match. Does not affect point or landmark
       * selectors.
       */
      shot?: string;

      /**
       * Actor sample time in shot-local seconds; absent uses zero. Must be
       * finite and within the shot's inclusive duration for actor selectors.
       */
      time?: number;
    },
  ) => IAutoMovieVector3;

  /**
   * Return a fresh wrapper borrowing the matching shot, node and resident
   * model. An omitted shot searches every supplied shot; absent or multi-shot
   * matches and missing node models throw. No sample time is read.
   */
  find: (
    actor: string,
    shot?: string,
  ) => IAutoMovieGeometryActorReader.ICompiledActor;

  /**
   * Sample a known node in the supplied compiled shot at finite shot-local
   * seconds in [0, duration]. The caller must first resolve the actor and
   * provide its model's skeleton, or null for an unrigged model; unlike find,
   * this entry does not validate node membership. Missing referenced motion
   * throws. Returns a shallow sample with borrowed nested records.
   */
  spatial: (
    compiled: IAutoMovieCompiledShotSource,
    actor: string,
    time: number,
    skeleton: IAutoMovieSkeleton | null,
  ) => IAutoMovieGeometryActorReader.ISpatialSample;

  /**
   * Resolve the actor and model within this compiled shot, then return its
   * world root point in metres at the supplied shot-local seconds. Node TRS
   * transforms pose-root translation; the result can alias node translation
   * when no pose root is present.
   */
  position: (
    compiled: IAutoMovieCompiledShotSource,
    actor: string,
    time: number,
  ) => IAutoMovieVector3;

  /**
   * Return a fresh scalar summary at finite shot-local seconds in [0,
   * duration]: shot/actor IDs, held (selected performance or node motion is
   * null), world-metre rootX/rootY/rootZ, and the sampled pose's jointCount. An
   * omitted shot requires a unique actor across the map; missing motion
   * throws.
   */
  pose: (
    actor: string,
    shot: string | undefined,
    time: number,
  ) => Record<string, number | string | boolean>;
};

/**
 * Borrowed lookup records and sampled affine stages produced by actor geometry
 * queries.
 */
export namespace IAutoMovieGeometryActorReader {
  /**
   * A resolved actor's source records; the wrapper is fresh and all three
   * members remain borrowed from the supplied shot map.
   */
  export interface ICompiledActor {
    /** Shot snapshot owning both the node and model. */
    compiled: IAutoMovieCompiledShotSource;

    /**
     * Borrowed scene node whose ID is the queried actor; supplies node TRS and
     * authored pose/motion references.
     */
    node: IAutoMovieCompiledShotSource["scene"]["nodes"][number];

    /**
     * Borrowed resident model whose ID equals node.model; supplies the rig or a
     * null skeleton for an unrigged actor.
     */
    model: IAutoMovieCompiledShotSource["models"][number];
  }

  /**
   * One actor sample preserving node placement and pose-root placement as
   * distinct stages.
   *
   * Bone queries first resolve the root-free pose in model coordinates, apply
   * pose-root translation/rotation when present, then apply node TRS. Pose-root
   * scale is ignored; node scale is applied. Wrappers are fresh, but joints,
   * poseRoot and unsampled node-transform components can alias source records.
   */
  export interface ISpatialSample {
    /**
     * Shallow copy of the sampled or held pose with root set to null, ready for
     * model-frame FK. Joint records remain shared; no motion/pose yields an
     * empty joint list and the supplied skeleton ID, or "unrigged".
     */
    pose: IAutoMoviePose;

    /**
     * World root point in metres: node TRS applied to pose-root translation, or
     * nodeTransform.translation itself when poseRoot is null. Treat as borrowed
     * because the latter case may alias source placement.
     */
    position: IAutoMovieVector3;

    /**
     * Node-local to world TRS, using sampled object channels at shot time where
     * present and borrowing authored components otherwise; translation is in
     * metres and scale is dimensionless.
     */
    nodeTransform: IAutoMovieTransform;

    /**
     * Borrowed sampled/held pose root, or null when no pose root is authored.
     * Its model-space translation and rotation precede node placement; its
     * scale is ignored by bone geometry queries.
     */
    poseRoot: IAutoMovieTransform | null;
  }
}
