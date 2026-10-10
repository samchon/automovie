import type { IAutoMovieHumanPersonSourceStarWeight } from "./IAutoMovieHumanPersonSourceStarWeight";

/**
 * How one sample reads the source normal field under one incident parent: the
 * weighted stars it requires, their identity, and the chart coordinates and
 * corner keys it interpolates them with.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceStarBinding {
  /** The required stars, sorted by key. */
  weights: IAutoMovieHumanPersonSourceStarWeight[];

  /** The serialized weighted-key list, equal for equal stars. */
  identity: string;

  /** The sample's two chart coordinates in the parent. */
  coordinates: readonly [number, number];

  /** The star key of each of the parent's three chart corners. */
  keys: string[];
}
