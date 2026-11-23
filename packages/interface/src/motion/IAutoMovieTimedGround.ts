import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** An explicit static-ground selection evaluated on a motion's local clock. */
export interface IAutoMovieTimedGround {
  /** Additional exact sample times in seconds within the clip. */
  boundaries: readonly number[];

  /**
   * Read the eligible ground's model Y in metres. Root samples are observed for
   * path admission and feet for stance. Null means no static ground.
   */
  at: (
    seconds: number,
    point: IAutoMovieVector3,
    kind: "root" | "foot",
  ) => number | null;
}
