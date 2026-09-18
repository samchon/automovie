/**
 * One subject-owned eye socket. Ordered lid curves run from negative to positive
 * local X; the component receives their identities instead of embedding them.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds a replaceable eye to caller-owned canthi, aperture curves, gaze marker and brow boundaries.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines ordered resident upper/lower rim identities and anatomical handedness without embedding any person's landmark numbers.
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
