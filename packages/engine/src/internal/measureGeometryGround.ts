import {
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  type IAutoMovieReadGeometryGround,
} from "@automovie/interface";

import { readGeometryGround } from "./readGeometryGround";

/*
 * Answer terrain height, surface id and walkability under a world XZ point in
 * metres, including the explicit off-world result.
 */
export function measureGeometryGround(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "ground" }>,
): IAutoMovieGeometryResult {
  const sample: IAutoMovieReadGeometryGround.IResult =
    readGeometryGround(props.design.world, request.point);

  return {
    kind: "ground",
    height: sample.height,
    surface: sample.surface,
    walkable: sample.walkable,
  };
}
