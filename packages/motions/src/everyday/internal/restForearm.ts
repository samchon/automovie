import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * A resting arm's forearm by the two-link closed form.
 */
export namespace restForearm {
  /*
   * A vector's unit component across a unit normal.
   * Parameter normal: The unit normal.
   * Parameter vector: The vector.
   * Returns: Its component across the normal, normalized.
   */
  export function across(
    normal: IAutoMovieVector3,
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(
        vector,
        AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(vector, normal)),
      ),
    );
  }

  /*
   * The unit direction of a forearm, from the elbow to the wrist: the elbow
   * lies on the circle the arm's two segments allow about the line from the
   * shoulder to the wrist (the law of cosines), on the side of the bend hint.
   * Parameter upper: The upper arm's length, metres.
   * Parameter lower: The forearm's length, metres.
   * Parameter shoulder: The shoulder joint, world metres.
   * Parameter wrist: The wrist, world metres.
   * Parameter hint: A point on the side the elbow bends toward, world metres.
   * Returns: The forearm's unit direction.
   */
  export function direction(
    upper: number,
    lower: number,
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    hint: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const span: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(wrist, shoulder);
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(span);
    const reach: number = Math.min(
      upper + lower,
      Math.max(Math.abs(upper - lower), AutoMovieEngineVector3.length(span), 1e-9),
    );
    const along: number =
      (upper * upper - lower * lower + reach * reach) / (2 * reach);
    const off: number = Math.sqrt(Math.max(0, upper * upper - along * along));
    const elbow: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
      AutoMovieEngineVector3.addScaled(shoulder, axis, along),
      across(axis, AutoMovieEngineVector3.subtract(hint, shoulder)),
      off,
    );
    return AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(AutoMovieEngineVector3.addScaled(shoulder, axis, reach), elbow),
    );
  }
}
