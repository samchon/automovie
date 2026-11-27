import { createActorExtendClip as createActorExtendClipImplementation } from "../perform/internal/createActorExtendClip";
import { createActorJabClip as createActorJabClipImplementation } from "../perform/internal/createActorJabClip";
import { createDynamicActorExtendClip as createDynamicActorExtendClipImplementation } from "../perform/internal/createDynamicActorExtendClip";
import { createDynamicActorJabClip as createDynamicActorJabClipImplementation } from "../perform/internal/createDynamicActorJabClip";
import { createDynamicActorPoseClip as createDynamicActorPoseClipImplementation } from "../perform/internal/createDynamicActorPoseClip";
import { arrangeMotion as arrangeMotionImplementation } from "./internal/arrangeMotion";
import { bindProfileGaits as bindProfileGaitsImplementation } from "./internal/bindProfileGaits";
import { gaitMotion as gaitMotionImplementation } from "./internal/gaitMotion";
import { gaitLimbFlexion as gaitLimbFlexionImplementation } from "./internal/gaitLimbFlexion";
import { gestureMotion as gestureMotionImplementation } from "./internal/gestureMotion";
import { holdMotion as holdMotionImplementation } from "./internal/holdMotion";
import { reactMotion as reactMotionImplementation } from "./internal/reactMotion";

import { sequenceMotion as sequenceMotionImplementation } from "./internal/sequenceMotion";

import { importedNodeClipToAutoMovieMotion as importedNodeClipToAutoMovieMotionImplementation } from "./internal/importedNodeClipToAutoMovieMotion";

import { type IAutoMovieMotionClipBridge, type IAutoMovieMotionToClip, type IAutoMovieMotion, type IAutoMovieImportedNodeMotionProps, type IAutoMoviePose, type IAutoMovieCreateDynamicActorExtendClip, type IAutoMovieCreateDynamicActorJabClip, type IAutoMovieCreateDynamicActorPoseClip, type IAutoMoviePlacement, type IAutoMovieProfile, type IAutoMovieGait, type IAutoMovieGaitLimb, type IAutoMovieSkeleton, type IAutoMovieRecoilPush, type AutoMovieHumanoidBone } from "@automovie/interface";
import { motionToClip as motionToClipImplementation } from "./internal/motionToClip";

/** Public operations for Auto Movie Engine Motion Clip. */
export namespace AutoMovieEngineMotionClip {
  /** Evaluate a gait limb's eased axis angle at a cycle time, in degrees. */
  export function gaitLimbFlexion(
    limb: IAutoMovieGaitLimb,
    seconds: number,
    period: number,
  ): number {
    return gaitLimbFlexionImplementation(limb, seconds, period);
  }

  /**
   * Bake admitted clinical motion into general node tracks at a positive sample
   * rate, default24Hz, with matching rig clinical tables. Full local bone
   * rotations and rigid root translation/rotation reproduce FK at bake times;
   * bone/root scale is ignored as in resolvePose, expressions are omitted, and
   * inter-sample quaternion interpolation approximates clinical easing rather
   * than preserving it exactly.
   */
  export function motionToClip(props: IAutoMovieMotionToClip.IProps): IAutoMovieMotionClipBridge {
    return motionToClipImplementation(props);
  }

  /**
   * Lower admitted imported node tracks into clinical keyframes at the sorted
   * union of source key times. Every mapped node needs a rotation track; only
   * hips translation is supported, all tracks share step or linear interpolation,
   * and unsupported/missing/duplicate/nonfinite content throws. Key orientations
   * are retained within clinical inversion tolerance; inter-key linear clinical
   * interpolation generally differs from quaternion slerp.
   */
  export function importedNodeClipToAutoMovieMotion(props: IAutoMovieImportedNodeMotionProps): IAutoMovieMotion {
    return importedNodeClipToAutoMovieMotionImplementation(props);
  }

  /**
   * Concatenate nonempty admitted same-skeleton clips in seconds. Durations must
   * be finite and positive; later time-zero seam frames transfer their easing to
   * the retained previous endpoint. Pose and expression values remain borrowed.
   */
  export function sequenceMotion(id: string, parts: IAutoMovieMotion[], loop?: boolean): IAutoMovieMotion {
    return sequenceMotionImplementation(id, parts, loop);
  }

  /**
   * Build a non-looping rest-to-arm-pose clip that reaches its supplied clinical
   * pose halfway through a positive second duration, then holds. The endpoint
   * pose is borrowed; the empty rest pose is local.
   */
  export function createActorExtendClip(id: string, skeleton: string, pose: IAutoMoviePose, duration: number): IAutoMovieMotion {
    return createActorExtendClipImplementation(id, skeleton, pose, duration);
  }

  /**
   * Build a non-looping rest-to-strike-to-rest clip with a 40% peak over a
   * positive second duration. The supplied clinical strike pose is borrowed and
   * the empty rest pose is shared only within this clip.
   */
  export function createActorJabClip(id: string, skeleton: string, pose: IAutoMoviePose, duration: number): IAutoMovieMotion {
    return createActorJabClipImplementation(id, skeleton, pose, duration);
  }

  /**
   * Bake a moving arm goal with an easeInOut extension over the first half of a
   * positive second duration, then hold its sampled solved articulation. An
   * unresolved target sample returns null.
   */
  export function createDynamicActorExtendClip(props: IAutoMovieCreateDynamicActorExtendClip.IProps): IAutoMovieMotion | null {
    return createDynamicActorExtendClipImplementation(props);
  }

  /**
   * Bake a moving strike goal with an easeIn envelope to the 40% peak and easeOut
   * retraction over the remaining positive second duration. An unresolved target
   * sample returns null.
   */
  export function createDynamicActorJabClip(props: IAutoMovieCreateDynamicActorJabClip.IProps): IAutoMovieMotion | null {
    return createDynamicActorJabClipImplementation(props);
  }

  /**
   * Bake a live pose callback at 24 Hz plus exact caller landmarks over a
   * positive second duration. Return null if any callback sample cannot resolve;
   * successful samples form a non-looping linear clinical-pose clip.
   */
  export function createDynamicActorPoseClip(props: IAutoMovieCreateDynamicActorPoseClip.IProps): IAutoMovieMotion | null {
    return createDynamicActorPoseClipImplementation(props);
  }

  /**
   * Arrange admitted clips on one actor's shot clock in stable start order.
   * Keyframes shift by placement start, gaps hold the previous tail, and
   * coincident or overlapping later frames are dropped rather than layered; empty
   * placements return an empty zero-duration clip.
   */
  export function arrangeMotion(id: string, placements: IAutoMoviePlacement[]): IAutoMovieMotion {
    return arrangeMotionImplementation(id, placements);
  }

  /**
   * Synthesize each uniquely named profile gait into a clip targeting the
   * supplied skeleton id, keyed by the exact gait name; absent gaits yield an
   * empty object. This assigns clinical controls and identity without inspecting
   * body geometry.
   */
  export function bindProfileGaits(profile: IAutoMovieProfile, skeleton: string, samples: number): Record<string, IAutoMovieMotion> {
    return bindProfileGaitsImplementation(profile, skeleton, samples);
  }

  /**
   * Bake one declarative gait cycle into samples+1 evenly timed clinical poses,
   * including a closing copy of cycle phase. Optional phase is seconds into the
   * cycle; gaitCycle records the wrapped seed, and rig-specific ROM validation
   * remains the consumer's responsibility.
   */
  export function gaitMotion(id: string, skeleton: string, gait: IAutoMovieGait, samples: number, phase?: number): IAutoMovieMotion {
    return gaitMotionImplementation(id, skeleton, gait, samples, phase);
  }

  /**
   * Bake a supported generic gesture or jump over the requested duration using
   * engine-authored clinical stops; targeted strike and unknown kinds return
   * null. Angles fit the default humanoid ROM, while custom rig admission belongs
   * to validateMotion. The caller supplies finite positive duration.
   */
  export function gestureMotion(id: string, skeleton: string, kind: string, duration: number): IAutoMovieMotion | null {
    return gestureMotionImplementation(id, skeleton, kind, duration);
  }

  /**
   * Hold the supplied pose for a finite positive duration in seconds, retargeting
   * only its skeleton identity; two linear keyframes carry shallow pose copies
   * with shared nested root/joint records and no expression.
   */
  export function holdMotion(id: string, skeleton: string, pose: IAutoMoviePose, duration: number): IAutoMovieMotion {
    return holdMotionImplementation(id, skeleton, pose, duration);
  }

  /**
   * Bake a three-stop rest/flinch/rest reaction over positive seconds, using the
   * impact recoil clamped to the supplied rig. Peak defaults to min(0.16,
   * duration*0.4); neutral axes stay null even when a custom ROM excludes numeric
   * zero.
   */
  export function reactMotion(id: string, skeleton: IAutoMovieSkeleton, push: IAutoMovieRecoilPush, chain: AutoMovieHumanoidBone[], duration: number, peak?: number): IAutoMovieMotion {
    return reactMotionImplementation(id, skeleton, push, chain, duration, peak);
  }
}
