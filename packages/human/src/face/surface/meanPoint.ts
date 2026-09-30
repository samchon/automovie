import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The component-wise mean of a nonempty list of points. An empty list divides
 * by zero, so callers pass at least one point. `fitPortraitEyeSphere` uses it
 * for the centre of the sample set.
 *
 * @author Samchon
 */
export const meanPoint = (points: IAutoMovieVector3[]): IAutoMovieVector3 =>
  Vector3.scale(
    points.reduce(Vector3.add, Vector3.create()),
    1 / points.length,
  );
