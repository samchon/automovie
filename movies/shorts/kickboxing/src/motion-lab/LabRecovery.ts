import type { MotionAction } from "../motion/core/MotionAction";
import type { LabArmWriter } from "./LabArmWriter";

/**
 * The original released arms borrowed by a later opposing attack.
 *
 * @evidence contracts/common.md#implementation-and-ownership Each immutable action retains its participant, anatomical side, original case clock and actual stopped state. Sampling receives the single realized body and returns only disjoint arm writers; it never restores either actor or starts another attack. The originating consumer owns the captured source context and disposal lifetime.
 * @evidence contracts/common.md#authoring-interface Times are original case-local seconds, including visible entry prefixes. Every arm must be strictly past release before this port is consumed. Only the original clinical withdrawal is supported; external strike or WORLD contact dwell cannot be borrowed. Retraction duration excludes later settling. The consuming frame explicitly binds the continuing clinical arm to the current body. Sampling after an action deadline may sustain its complete clinical guard but cannot extend contact dwell or create another event.
 */
export interface LabRecovery {
  /** Stable original performer; the new exchange receives this actor. */
  readonly actorId: string;
  /** Individual original action and contact lifetimes, never merged into a new identity. */
  readonly actions: readonly {
    /** Caller-unique original strike identity. */
    readonly actionId: string;
    /** Exclusive anatomical arm ownership during withdrawal. */
    readonly side: MotionAction.Side;
    /** Original fist-motion onset after preparation in the unchanged case clock. */
    readonly deliveryStartSeconds: number;
    /** Actual contact release or nominal free-strike release in the original case clock. */
    readonly releasedSeconds: number;
    /** Original independently resolved withdrawal duration, seconds. */
    readonly retractionSeconds: number;
    /** Original complete withdrawal and settling deadline in the case clock. */
    readonly endSeconds: number;
    /** Actual original constrained first contact; absent means no impact occurred. */
    readonly contact?: MotionAction.Immutable<MotionAction.ContactState>;
  }[];
  /** Latest action release; all borrowed arms are withdrawing after this instant. */
  readonly releasedSeconds: number;
  /** Last original action deadline; borrowing does not extend this lifetime. */
  readonly endSeconds: number;
  /**
   * Sample the same original arms on the receiving actor's one realized body.
   *
   * @evidence contracts/common.md#implementation-and-ownership The implementation captures immutable source contexts and stopped samples once, binds their post-release clinical withdrawal to the supplied actor frame, and samples the original absolute action clocks. It never reinterprets an old external WORLD task in a new root. The result contains arm requests only and is independent of playback order, previous pose or FPS.
   * @evidence contracts/common.md#authoring-interface originalCaseSeconds must be finite and strictly greater than releasedSeconds. Placement uses consumingFrame actor-local metres and original WORLD support tasks. Returned writers must contain that exact placement's root/support values; same-side external defense conflicts require an explicit handoff or refusal. This port alone proves neither physical admission nor continuous viewing.
   */
  sampleArms(originalCaseSeconds: number, realizedPlacement: MotionAction.BodyPlacement, consumingFrame: { origin: MotionAction.Vec3; yawRadians: number }): LabArmWriter[];
}
