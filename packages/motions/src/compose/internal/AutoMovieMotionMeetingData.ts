import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieEngineVector3 } from "@automovie/engine";

export namespace AutoMovieMotionMeetingData {
  /*
   * The mean of points.
   */
  export const mean = (points: readonly IAutoMovieVector3[]): IAutoMovieVector3 =>
    AutoMovieEngineVector3.scale(
      points.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / points.length,
    );
}
