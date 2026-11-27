import type {
  IAutoMoviePhysicalHullNearest,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMoviePhysicalHullFaces } from "../AutoMoviePhysicalHullFaces";
import { readPhysicalHullFacesPoint } from "./readPhysicalHullFacesPoint";

/** The scalar signature: the signed distance alone. */
export function readPhysicalHullPoint(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
  details: false,
): number;

/** Shared proximity computation, including the original full and scalar results. */
export function readPhysicalHullPoint(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
  details: boolean,
): IAutoMoviePhysicalHullNearest.IResult | number;

/**
 * Compute the original nearest hull point or signed distance of a point set,
 * searching its hull afresh.
 */
export function readPhysicalHullPoint(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
  details: boolean,
): IAutoMoviePhysicalHullNearest.IResult | number {
  return readPhysicalHullFacesPoint(AutoMoviePhysicalHullFaces.build(points), p, details);
}
