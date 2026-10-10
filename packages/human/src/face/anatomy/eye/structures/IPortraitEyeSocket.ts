/**
 * One subject-owned eye socket. Ordered lid curves run from negative to positive
 * local X; the component receives their identities instead of embedding them.
 *
 * @author Samchon
 */
export interface IPortraitEyeSocket {
  /** Anatomical side; positive host X is left. */
  name: "left" | "right";

  /** Upper aperture rim from negative X to positive X, including both corners. */
  top: number[];

  /** Lower rim in the same direction, including the same corner identities. */
  bottom: number[];

  /** Non-skin measured gaze marker. */
  iris: number;

  /** Upper brow boundary, in the same X order. */
  browTop: number[];

  /** Lower brow boundary, in the same X order. */
  browBottom: number[];
}
