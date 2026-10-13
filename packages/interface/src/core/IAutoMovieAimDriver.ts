import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Orient an owner so one of its axes points at a target (eyes, head, camera).
 *
 * Resolved in the world-space pass after the hierarchy is composed. The owner's
 * world rotation becomes the shortest arc taking `aimAxis` onto the direction
 * toward the target's world position, followed by a twist about that direction
 * that brings `upAxis` nearest to `worldUp`. The result is slerped from the
 * owner's composed rotation by `influence`, the owner's world position and
 * scale are kept, and its subtree recomposes. Channel limits run before this
 * pass, so they never clamp the aimed rotation. A non-finite or zero axis, or
 * an influence outside `[0, 1]`, throws.
 *
 * When `worldUp` is parallel to the aim direction the twist is undefined and
 * skipped. A target at the owner's own position gives no direction, and the
 * owner then turns toward the identity world rotation.
 *
 * @author Samchon
 */
export interface IAutoMovieAimDriver {
  /** Discriminator. */
  type: "aim";

  /** Node to orient; a semantic key when the driver belongs to a profile. */
  owner: string;

  /** Node whose world position is aimed at. */
  target: string;

  /** Owner-local axis aimed at the target (e.g. camera `(0,0,-1)`). */
  aimAxis: IAutoMovieVector3;

  /**
   * Owner-local up axis, kept aligned to `worldUp` to fix the remaining roll.
   */
  upAxis: IAutoMovieVector3;

  /** World reference up the `upAxis` aligns to. */
  worldUp: IAutoMovieVector3;

  /**
   * Blend factor `[0, 1]`: `0` keeps the composed rotation, `1` applies the
   * full aim.
   */
  influence: number;
}
