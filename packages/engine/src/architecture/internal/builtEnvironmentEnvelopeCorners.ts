import {
  type IAutoMovieBuiltEnvelopeCorner,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { builtEnvelopeFaceCorners } from "./builtEnvelopeFaceCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";

/**
 * Every meeting of two exposed facades of one building unit.
 *
 * Facades of the same building qualify by vertex proximity within the thicker
 * separation plus numeric slack. This is an observation allowance, not a
 * construction-error proof. Exterior/reentrant classification uses the first
 * probe-oriented normal's sign toward the second centroid from the proxy
 * meeting point; it does not establish intersection or a global envelope
 * topology.
 *
 * A corner's id is `<boundary>+<boundary>` in code-unit order, its position
 * averages approximately nearest vertex-pair midpoints within the
 * wall-thickness proximity allowance, and its normal bisects the two
 * probe-oriented face normals. This proxy does not prove a shared edge or exact
 * geometric intersection. Results are sorted by id; an exposed face's unowned
 * space throws through {@link builtEnvironmentEnvelopeFaces}.
 */
export function builtEnvironmentEnvelopeCorners(
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeCorner[] {
  return builtEnvelopeFaceCorners(builtEnvironmentEnvelopeFaces(environment));
}
