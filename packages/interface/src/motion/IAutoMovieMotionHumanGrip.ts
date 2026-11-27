import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * A hand closing on an object: which digits close for a grip kind, each digit's
 * phalanges as the body's own colliders, and the finger angles at contact,
 * solved, never authored.
 *
 * Closure is the engine's `curlChainUntilContact` (the auto-grasp stopping
 * rule of Miller and Allen 2004): the digits named by the grip kind close proximal to distal
 * until each phalanx first touches the object, the four fingers before the
 * thumb so the thumb closes over them as in a power grip (Napier 1956; the
 * Cutkosky and Feix oppositions the grip kinds name):
 *
 * - `power`, `lateral` and `two-hand`: the four fingers, then the thumb;
 * - `hook`: the four fingers, the thumb left relaxed;
 * - `precision`: the thumb, the index and the middle finger, the ring and little
 *   fingers left relaxed.
 *
 * The curl runs on the hand alone, from its rest or from the open shape a law
 * passes (an offered hand opens its thumb before it closes), with the object
 * carried into the rest hand's frame by the planned grasp (the hand's world
 * wrist and rotation), so the angles depend only on where the object sits in
 * the hand, which a grip keeps fixed, and are computed once per grasp. Each
 * phalanx is the capsule the body's physical profile declares on that digit
 * bone, its radius and its far end read from the collider, so contact meets
 * what is drawn; a body whose profile declares no digit colliders is refused,
 * since its finger thickness is unknown.
 */
export namespace IAutoMovieMotionHumanGrip {
  /** A digit. */
  export type Digit = "Index" | "Middle" | "Ring" | "Little" | "Thumb";

  /**
   * Close a hand's digits on an object. Result returned by HumanGrip.close. The
   * closed finger angles of that hand and each closing digit's final gap,
   * metres.
   */
  export type ICloseResult = {
    /** Closed finger-joint rotations in clinical degrees. */
    joints: IAutoMovieMotionHumanPosture["joints"];
    /**
     * Final signed digit-to-collider gaps in metres, positive while separated;
     * only digits participating in this grip are present.
     */
    gaps: Partial<Record<IAutoMovieMotionHumanGrip.Digit, number>>;
  };
}
