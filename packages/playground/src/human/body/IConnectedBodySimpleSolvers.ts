import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";
import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * The simple tier and the detailed measurement inverse, solved off the page's
 * thread.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Names the simple-tier expansion, projection and measurement inverse the editor calls.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Types each inversion as an asynchronous off-thread request that can fail without losing the last valid state.
 * @author Samchon
 */
export interface IConnectedBodySimpleSolvers {
  /** Expand simple values over a detailed shape. */
  expand: (
    simple: IAutoMovieHumanBodySimpleShape,
    over: Record<string, number>,
  ) => Promise<Record<string, number>>;

  /** Read the simple values of a body's weights with its anatomy solved in. */
  project: (body: IBodySimpleBody) => Promise<IAutoMovieHumanBodySimpleShape>;

  /**
   * Where stature and mass are read (the whole person and the head it is read
   * with), shown beside those readings.
   */
  wholeSource: string;

  /** Solve one measured channel for a target in metres. */
  solveMeasurement: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;
}
