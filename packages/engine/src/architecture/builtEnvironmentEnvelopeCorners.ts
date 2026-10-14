import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { builtEnvelopeFaceCorners } from "./builtEnvelopeFaceCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";

/**
 * Every meeting of two exposed facades of one building unit.
 *
 * Facades of the same building qualify by vertex proximity within the thicker separation plus numeric slack. This is an observation allowance, not a construction-error proof. Exterior/reentrant classification uses the first probe-oriented normal's sign toward the second centroid from the proxy meeting point; it does not establish intersection or a global envelope topology.
 *
 * A corner's id is `<boundary>+<boundary>` in code-unit order, its position averages approximately nearest vertex-pair midpoints within the wall-thickness proximity allowance, and its normal bisects the two probe-oriented face normals. This proxy does not prove a shared edge or exact geometric intersection. Results are sorted by id; an exposed face's unowned space throws through {@link builtEnvironmentEnvelopeFaces}.
 *
 * @evidence contracts/common.md#principled-implementation Places the envelope with `builtEnvironmentEnvelopeFaces` and pairs its facades with `builtEnvelopeFaceCorners`, whose proximity and side tests read only the placed geometry.
 * @evidence contracts/common.md#clear-and-simple-design The environment-level entry point over the face-level pairing, which the census calls directly with faces it already holds, so the pairing rule has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building or boundary and adds nothing to the two shared steps; the unowned-space refusal passes through from the face query.
 * @evidence contracts/common.md#meaningful-documentation States the meeting rule and its slack, the exterior and reentrant reading, the id, position and normal of a corner, the sort, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Pays full `builtEnvironmentEnvelopeFaces` cost, including space indexing, distinct-space ownership lookups, containment probes and face sorting. Pairing adds facade-pair scans times their vertex-count products and sorting of the returned corners; it is not solely quadratic in facade count when outline sizes vary.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one environment per call and keeps nothing; a caller that already holds the faces calls `builtEnvelopeFaceCorners` instead of placing them again.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The placed faces are dropped on return; the caller owns the returned corners.
 */
export const builtEnvironmentEnvelopeCorners: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvelopeCorner[] = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeCorner[] =>
  builtEnvelopeFaceCorners(builtEnvironmentEnvelopeFaces(environment));
