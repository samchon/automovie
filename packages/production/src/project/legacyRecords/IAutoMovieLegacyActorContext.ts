import type { IAutoMovieRestFrame } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieLegacyGait } from "./IAutoMovieLegacyGait";

/**
 * Historical actor-context metadata preserved by the v1 resident store, with gait cubic-bezier tuple fields omitted from its compatibility representation. Position, facing and gait phase describe optional beat openings; the current store neither fills them from continuity nor executes the retired perform protocol.
 *
 * @evidence contracts/common.md#principled-implementation Persisted actor data separates optional per-beat openings from beat-invariant rig, gait and rest data; this historical shape does not itself synthesize or validate a performance.
 * @evidence contracts/common.md#clear-and-simple-design LegacyActorSpec removes the three opening fields for actor-file storage; AutoMovieProject and the legacy importer retain this boundary without exposing the retired perform protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored actor fields are preserved without claiming an active performance-tool consumer or inferring missing rigs.
 * @evidence contracts/common.md#meaningful-documentation States historical units, optional opening-state meaning and rig/rest-frame interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Actor facts execute no rig resolution, gait sampling or motion synthesis; those costs belong to active runtime owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stored actor context supplies values rather than a shared performance answer or freshness proof.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The actor value owns rig, rest pose and gait references; this schema opens no stream or handle.
 * @author Samchon
 */
export interface IAutoMovieLegacyActorContext {
  /**
   * Skeleton id every synthesized clip targets.
   */
  skeleton: string;

  /**
   * Gaits this actor can perform, without tuple-valued bezier controls.
   */
  gaits: IAutoMovieLegacyGait[];

  /**
   * Optional historical shot-opening world position in metres; the current store does not seed an omitted value from a previous beat.
   */
  position?: IAutoMovieVector3;

  /**
   * Locomotion speed (m/s): how fast a `locomote` carries the actor.
   */
  speed: number;

  /**
   * Optional historical opening heading in degrees about +Y, with zero along +Z; persistence alone supplies no missing heading.
   */
  facingDeg?: number;

  /**
   * Optional nullable historical gait-opening phase in seconds; null and omission are preserved metadata, with no current playback or continuity default applied by the store.
   */
  gaitPhase?: number | null;

  /**
   * Eye height above the actor's position (meters): where a `lookAt` aims from.
   */
  eyeHeight: number;

  /**
   * The pose the actor settles into for a `hold`.
   */
  restPose: IAutoMoviePose;

  /**
   * Optional historical rig geometry and joint range-of-motion data; storage neither resolves the skeleton nor admits or executes an IK action.
   */
  rig?: IAutoMovieSkeleton;

  /**
   * Optional historical per-bone rest-frame table, whose angle basis must agree with any external consumer; the resident store preserves the table without selecting clinical defaults or interpreting an empty table.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
