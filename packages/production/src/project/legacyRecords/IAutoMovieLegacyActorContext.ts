/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieRestFrame } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieLegacyGait } from "./IAutoMovieLegacyGait";

/**
 * Actor context the v1 store performed against.
 *
 * This is the JSON-safe subset of the engine's actor context. Gait cubic-bezier
 * tuple fields are intentionally omitted; use named easing curves for
 * Gait limbs as the v1 record carried them.
 *
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
   * Where the actor stands at the start of the shot (world meters). A RESIDENT
   * `perform` may omit it (#1176): the previous beat's committed end-state
   * seeds it, so a walking character resumes exactly where it stopped. An
   * explicit call (or a beat with no committed predecessor) must pass it.
   */
  position?: IAutoMovieVector3;

  /**
   * Locomotion speed (m/s): how fast a `locomote` carries the actor.
   */
  speed: number;

  /**
   * Heading the actor faces, degrees about +Y (0 = +Z). Omittable in a RESIDENT
   * `perform` exactly like `position` (#1176), seeded from the previous beat's
   * committed end-state facing.
   */
  facingDeg?: number;

  /**
   * Seconds into the looping gait cycle at the shot's start, a beat that opens
   * mid-stride resumes the walk at this phase instead of restarting it.
   * Omittable in a RESIDENT `perform` exactly like `position` (#1176): seeded
   * from the previous beat's committed end-state `gaitPhase` when it recorded
   * one. `null` (or omission with nothing recorded) starts the cycle at zero.
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
   * The actor's resolved skeleton geometry: the rig bones and their ROM
   * constraints. Required by the physics/IK verbs that measure or clamp against
   * the body (`react` folds a flinch bounded by each joint's ROM) and by
   * `enact`; one of those without a `rig` synthesises nothing. `lookAt` reads
   * it too, spreading a steep aim across the `neck` and `head` ranges you
   * declare instead of putting the whole angle on the head.
   */
  rig?: IAutoMovieSkeleton;

  /**
   * Per-bone rest frames that let the IK/arm verbs (`reach`/`point`/`strike`)
   * emit their arm angles in **clinical** space, lifted by `sign·r + neutral`
   * so a downstream renderer reads them up through the same frames (abduction
   * `180` raises either arm overhead regardless of side). Omission uses the
   * canonical humanoid clinical frame; supply `{}` only for raw rig-space
   * angles. A custom table must be paired with the same frames on the player.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
