import { AutoMovieHumanoidBone, IAutoMovieBody, IAutoMovieMotion, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieCapsuleProxy } from "./capsuleProxy";

/**
 * One actor in an inter-body collision test: its rig, its motion, the capsule
 * proxies that stand in for its volume, and its physical body (mass etc.,
 * #595): `null` bodies fall back to a default human mass. `node` labels it in
 * emitted events. Each capsule's endpoints must be two distinct bones of
 * `skeleton` with a positive radius; {@link detectBodyCollision} validates this
 * itself (a malformed capsule is an error, returned before sampling) rather
 * than trusting an upstream pass.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieCollisionActor` binds a stable scene node to the rig, motion, proxies, and physical inputs inspected for one collision participant.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieCollisionActor` defines the named subject root from which capsule and motion member paths are reconstructed.
 * @author Samchon
 */
export interface IAutoMovieCollisionActor {
  /**
   * Scene node id, used to label emitted interaction events.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `node` labels the actor and target identities on every sampled contact event.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `node` distinguishes collision subjects even when their capsule layouts or display names coincide.
   */
  node: string;
  /**
   * Rig for forward kinematics.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `skeleton` supplies the bone identities against which malformed capsule endpoints are located.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `skeleton` establishes the rig root and hierarchy used to decide whether a named endpoint is FK-reachable.
   */
  skeleton: IAutoMovieSkeleton;
  /**
   * Motion clip to sample.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `motion` supplies the shot-clock pose samples from which this actor's contact times are identified.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `motion` bounds collision discovery to the participant's declared clip duration and sampled pose state.
   */
  motion: IAutoMovieMotion;
  /**
   * Capsule proxies over this actor's bones.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `capsules` retains the indexed body proxies whose endpoint or radius field can fail before sampling.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `capsules` provides the stable collection position and bone pair used to locate each overlap calculation.
   */
  capsules: readonly IAutoMovieCapsuleProxy[];
  /**
   * Physical body (mass, restitution). `null` → default mass.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `body` identifies the mass and restitution source used for the reported deepest-contact response.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `body` distinguishes declared physical parameters from the documented default-human fallback.
   */
  body: IAutoMovieBody | null;
  /**
   * Optional clinical-axis remap.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `jointAxes` names the optional per-bone axis remap used when resolving this participant's sampled capsules.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `jointAxes` keeps clinical-axis interpretation attached to the actor whose contact positions depend on it.
   */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  /**
   * Optional rest-frame remap.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `restFrames` names the optional per-bone rest basis applied to this actor before overlap is measured.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `restFrames` preserves the pose-resolution basis alongside the subject whose world-space proxy positions it changes.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
