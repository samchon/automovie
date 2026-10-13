import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Orient an owner so one of its axes points at a target (eyes, head, camera).
 */
export interface IAutoMovieAimDriver {
  /** Discriminator. */
  type: "aim";

  /** Node to orient. */
  owner: string;

  /** Node to point at. */
  target: string;

  /** Owner-local axis aimed at the target (e.g. camera `(0,0,-1)`). */
  aimAxis: IAutoMovieVector3;

  /**
   * Owner-local up axis, kept aligned to `worldUp` to fix the remaining roll.
   */
  upAxis: IAutoMovieVector3;

  /** World reference up the `upAxis` aligns to. */
  worldUp: IAutoMovieVector3;

  /** Blend factor `[0, 1]`. */
  influence: number;
}
