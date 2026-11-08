import { IAutoMovieCameraClearanceSphere } from "./IAutoMovieCameraClearanceSphere";

/**
 * Physical envelopes carried by one authored and resolved camera.
 *
 * The camera body always has an envelope. A parent rig is explicit when the camera rides a dolly, crane, vehicle mount, stabilizer, or other support whose volume can collide even while the camera body itself remains clear.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit body and optional support spheres are transformed from the camera frame and swept over the admitted sample plan against current scene obstacle bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separate body and parentRig volumes distinguish optical hardware from an independently collidable mount without importing renderer geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null parentRig declares no separate support, not a guessed zero-size rig; every supplied radius remains a positive conservative physical extent.
 * @evidence contracts/development/common.md#meaningful-documentation Defines carried camera hardware, optional parent support and the physical ownership of both local envelopes.
 */
export interface IAutoMovieCameraClearanceEnvelope {
  /** Optical body, lens, cage, and immediately carried camera hardware. */
  body: IAutoMovieCameraClearanceSphere;

  /** Parent support rig, or `null` when the camera has no separate host rig. */
  parentRig: IAutoMovieCameraClearanceSphere | null;
}
