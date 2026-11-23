import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the ViewParallelAxis operations. */
export namespace IAutoMovieViewParallelAxis {
  /** Three source coordinates of an origin in world millimetres. */
  export interface IOrigin {
    /** World X by authored station, both millimetres. */
    x: IAutoMovieViewPart.IOutline;

    /** World Y by the same authored station, millimetres. */
    y: IAutoMovieViewPart.IOutline;

    /** World Z by the same authored station, millimetres. */
    z: IAutoMovieViewPart.IOutline;
  }
}
