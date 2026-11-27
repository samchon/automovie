import {
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  type IAutoMovieReadGeometryGround,
} from "@automovie/interface";

import { readAutoMovieGeometryGround } from "./readAutoMovieGeometryGround";

/*
 * Answer terrain height, surface id and walkability under a world XZ point in
 * metres, including the explicit off-world result.
 */
export function measureAutoMovieGeometryGround(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "ground" }>,
): IAutoMovieGeometryResult {
  const sample: IAutoMovieReadGeometryGround.IResult =
    readAutoMovieGeometryGround(props.design.world, request.point);

  return {
    kind: "ground",
    height: sample.height,
    surface: sample.surface,
    walkable: sample.walkable,
  };
}
