import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * One arm's geometry in a phrase: its origin, its place, its offset in the
 * performer's frame and its target at a point (`armPhrase`).
 */
export interface IArmPhraseArm {
  /*
   * The arm.
   */
  side: AutoMovieHumanSide;

  /*
   * The hand's place before and after.
   */
  origin: IAutoMovieMotionHumanArmTarget.IOrigin;

  /*
   * The working point's place (the surface's, or a held prop's point), world
   * metres.
   */
  place: IAutoMovieVector3;

  /*
   * A stroke's start from its place, world metres; zero for a visit or an
   * oscillation.
   */
  from: IAutoMovieVector3;

  /*
   * An oscillation's swing to one side of its place, world metres.
   */
  swing: IAutoMovieVector3;

  /*
   * The target that brings the working point to a point.
   */
  target: (point: IAutoMovieVector3) => IAutoMovieMotionHumanArmTarget.ITarget;

  /*
   * The distance from the surface's place before the phrase to its first goal,
   * metres.
   */
  prepare: number;

  /*
   * The distance from the surface's last goal back to its place before the
   * phrase, metres.
   */
  retract: number;
}
