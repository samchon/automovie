import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";
import type { IAutoMovieGeometrySelector } from "./IAutoMovieGeometrySelector";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Geometry-query operations over a borrowed map of compiled shots, retained for the reader's lifetime.
 *
 * Actor IDs resolve scene-node IDs. With no shot ID, an actor must occur in exactly one compiled shot; missing actors/models and ambiguous actors throw. Actor sampling requires finite shot-local seconds in [0, shot.duration]. Performance motion starts at max(0, time - startOffset); node object channels use shot time. Samples are recomputed from current records and no pose cache is retained. Returned borrowed records and vectors must be treated as read-only even where the structural types permit mutation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents lookup failures, shot/performance timebases, world-space answers, borrowing and reader lifetime; each operation states its sampling and ownership differences.
 * @evidence contracts/development/design.md#principled-representation Selectors use the canonical selector union, and spatial results preserve node TRS and rigid pose-root stages separately. The engine validates actor times and lookup references; direct spatial callers supply a resolved actor and matching rig.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Distance, reach, pose, camera, effect and formation measurements share actor lookup and spatial sampling through these five operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ambiguous multi-shot actors refuse instead of selecting by file order; separate transform stages avoid collapsing nonuniform node scale and pose-root rotation into an inaccurate TRS.
 */
export type IAutoMovieGeometryActorReader = {
  /**
   * Resolve a world-space point in metres. Point and landmark selectors return borrowed vectors and ignore sampling options; a missing landmark throws. Actor/bone results are sampled, and an absent rig or unresolved bone throws. Actor-root results may also alias a node translation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolve a world-space point in metres. Point and landmark selectors return borrowed vectors and ignore sampling options; a missing landmark throws. Actor/bone results are sampled, and an absent rig or unresolved bone throws. Actor-root results may also alias a node translation. Member documentation states the supplied records, units and absence meanings used by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts selector declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms selector declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work selector declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources selector declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback captures and their release; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation selector declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect provides the callback body and its numerical method; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure selector declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns the callback body and its decomposition; the invocation and result obligations remain on this member.
   */
  selector: (
    selector: IAutoMovieGeometrySelector,
    world: Pick<IAutoMovieWorldDesign, "landmarks"> | null,
    options?: {
      /** Compiled shot ID restricting actor lookup; absent searches all shots and requires a unique match. Does not affect point or landmark selectors. */
      shot?: string;

      /** Actor sample time in shot-local seconds; absent uses zero. Must be finite and within the shot's inclusive duration for actor selectors. */
      time?: number;
    },
  ) => IAutoMovieVector3;

  /**
   * Return a fresh wrapper borrowing the matching shot, node and resident model. An omitted shot searches every supplied shot; absent or multi-shot matches and missing node models throw. No sample time is read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Return a fresh wrapper borrowing the matching shot, node and resident model. An omitted shot searches every supplied shot; absent or multi-shot matches and missing node models throw. No sample time is read. Member documentation states the supplied records, units and absence meanings used by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts find declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms find declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work find declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources find declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback captures and their release; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation find declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect provides the callback body and its numerical method; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure find declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns the callback body and its decomposition; the invocation and result obligations remain on this member.
   */
  find: (
    actor: string,
    shot?: string,
  ) => IAutoMovieGeometryActorReader.ICompiledActor;

  /**
   * Sample a known node in the supplied compiled shot at finite shot-local seconds in [0, duration]. The caller must first resolve the actor and provide its model's skeleton, or null for an unrigged model; unlike find, this entry does not validate node membership. Missing referenced motion throws. Returns a shallow sample with borrowed nested records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Sample a known node in the supplied compiled shot at finite shot-local seconds in [0, duration]. The caller must first resolve the actor and provide its model's skeleton, or null for an unrigged model; unlike find, this entry does not validate node membership. Missing referenced motion throws. Returns a shallow sample with borrowed nested records. Member documentation states the supplied records, units and absence meanings used by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts spatial declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms spatial declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work spatial declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources spatial declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback captures and their release; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation spatial declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect provides the callback body and its numerical method; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure spatial declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns the callback body and its decomposition; the invocation and result obligations remain on this member.
   */
  spatial: (
    compiled: IAutoMovieCompiledShotSource,
    actor: string,
    time: number,
    skeleton: IAutoMovieSkeleton | null,
  ) => IAutoMovieGeometryActorReader.ISpatialSample;

  /**
   * Resolve the actor and model within this compiled shot, then return its world root point in metres at the supplied shot-local seconds. Node TRS transforms pose-root translation; the result can alias node translation when no pose root is present.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolve the actor and model within this compiled shot, then return its world root point in metres at the supplied shot-local seconds. Node TRS transforms pose-root translation; the result can alias node translation when no pose root is present. Member documentation states the supplied records, units and absence meanings used by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts position declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms position declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work position declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources position declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback captures and their release; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation position declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect provides the callback body and its numerical method; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure position declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns the callback body and its decomposition; the invocation and result obligations remain on this member.
   */
  position: (
    compiled: IAutoMovieCompiledShotSource,
    actor: string,
    time: number,
  ) => IAutoMovieVector3;

  /**
   * Return a fresh scalar summary at finite shot-local seconds in [0, duration]: shot/actor IDs, held (selected performance or node motion is null), world-metre rootX/rootY/rootZ, and the sampled pose's jointCount. An omitted shot requires a unique actor across the map; missing motion throws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Return a fresh scalar summary at finite shot-local seconds in [0, duration]: shot/actor IDs, held (selected performance or node motion is null), world-metre rootX/rootY/rootZ, and the sampled pose's jointCount. An omitted shot requires a unique actor across the map; missing motion throws. Member documentation states the supplied records, units and absence meanings used by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts pose declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect must justify constants and special cases in the supplied body; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms pose declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback traversal and allocation costs; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work pose declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns any callback memoization and its input equivalence; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources pose declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns callback captures and their release; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation pose declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect provides the callback body and its numerical method; the invocation and result obligations remain on this member.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure pose declares a callable signature with no body. The implementation supplied to or returned by createAutoMovieGeometryActorReader, measureAutoMovieGeometryCamera, measureAutoMovieGeometryDistance, measureAutoMovieGeometryEffect owns the callback body and its decomposition; the invocation and result obligations remain on this member.
   */
  pose: (
    actor: string,
    shot: string | undefined,
    time: number,
  ) => Record<string, number | string | boolean>;
};

/** Borrowed lookup records and sampled affine stages produced by actor geometry queries. */
export namespace IAutoMovieGeometryActorReader {
  /**
   * A resolved actor's source records; the wrapper is fresh and all three members remain borrowed from the supplied shot map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States source ownership and the node-to-model relationship without promising deep copies.
   * @evidence contracts/development/design.md#principled-representation The node belongs to compiled.scene and its model ID resolves within compiled.models; find rejects missing models and ambiguous shots before constructing this result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reach and formation sampling use the compiled shot, scene placement and rig-bearing model together; these are indexed from existing canonical shot contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No synthetic model or fallback shot is introduced; consumers must not mutate borrowed source records through this wrapper.
   */
  export interface ICompiledActor {
    /** Shot snapshot owning both the node and model. */
    compiled: IAutoMovieCompiledShotSource;

    /** Borrowed scene node whose ID is the queried actor; supplies node TRS and authored pose/motion references. */
    node: IAutoMovieCompiledShotSource["scene"]["nodes"][number];

    /** Borrowed resident model whose ID equals node.model; supplies the rig or a null skeleton for an unrigged actor. */
    model: IAutoMovieCompiledShotSource["models"][number];
  }

  /**
   * One actor sample preserving node placement and pose-root placement as distinct stages.
   *
   * Bone queries first resolve the root-free pose in model coordinates, apply pose-root translation/rotation when present, then apply node TRS. Pose-root scale is ignored; node scale is applied. Wrappers are fresh, but joints, poseRoot and unsampled node-transform components can alias source records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the affine application order, units, null meaning and nested borrowing of a spatial sample.
   * @evidence contracts/development/design.md#principled-representation Separate pose, rigid root and node TRS retain the composition required under nonuniform scale; position stores only the resulting world root point in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Bone selectors and reach/formation measurements need all four views; the sample reuses canonical pose, transform and vector contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null pose root is explicit absence, not a fabricated transform, and root scale is not silently promoted into FK deformation.
   */
  export interface ISpatialSample {
    /** Shallow copy of the sampled or held pose with root set to null, ready for model-frame FK. Joint records remain shared; no motion/pose yields an empty joint list and the supplied skeleton ID, or "unrigged". */
    pose: IAutoMoviePose;

    /** World root point in metres: node TRS applied to pose-root translation, or nodeTransform.translation itself when poseRoot is null. Treat as borrowed because the latter case may alias source placement. */
    position: IAutoMovieVector3;

    /** Node-local to world TRS, using sampled object channels at shot time where present and borrowing authored components otherwise; translation is in metres and scale is dimensionless. */
    nodeTransform: IAutoMovieTransform;

    /** Borrowed sampled/held pose root, or null when no pose root is authored. Its model-space translation and rotation precede node placement; its scale is ignored by bone geometry queries. */
    poseRoot: IAutoMovieTransform | null;
  }
}
