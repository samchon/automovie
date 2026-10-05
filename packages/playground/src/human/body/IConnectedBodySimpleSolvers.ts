import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";

import type { IConnectedBodyMeasurement } from "./IConnectedBodyMeasurement";

/**
 * The simple tier and the detailed measurement inverse, solved off the page's
 * thread.
 *
 * @author Samchon
 */
export interface IConnectedBodySimpleSolvers {
  /** Expand simple values over a detailed shape. */
  expand: (
    simple: IAutoMovieHumanBodySimpleShape,
    over: Record<string, number>,
  ) => Promise<Record<string, number>>;

  /** Read the simple values of a detailed shape. */
  project: (
    shape: Record<string, number>,
  ) => Promise<IAutoMovieHumanBodySimpleShape>;

  /** Solve one measured channel for a target in metres. */
  solveMeasurement: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;
}
