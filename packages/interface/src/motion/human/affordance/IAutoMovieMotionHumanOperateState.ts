import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/** Contracts used by operateState.at. */
export namespace IAutoMovieMotionHumanOperateState {
  /**
   * The moving part's place at a progress of its movement. Input place of
   * operateState.at. The part's place at rest: its point and outward normal.
   */
  export type IAtPlace = {
    /** Unoperated contact point in world metres. */
    point: IAutoMovieVector3;
    /** Unoperated surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };

  /**
   * The moving part's place at a progress of its movement. Result returned by
   * operateState.at. The point and the normal, and the roll about the normal in
   * degrees.
   */
  export type IAtResult = {
    /** Operated contact point in world metres. */
    point: IAutoMovieVector3;
    /** Operated surface normal in world coordinates. */
    normal: IAutoMovieVector3;
    /** Knob rotation in degrees; zero for mechanisms without knob roll. */
    roll: number;
  };
}
