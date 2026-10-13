import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { IAutoMovieBuiltEnvelopeCorner } from "./IAutoMovieBuiltEnvelopeCorner";
import { builtEnvelopeFaceCorners } from "./builtEnvelopeFaceCorners";
import { builtEnvironmentEnvelopeFaces } from "./builtEnvironmentEnvelopeFaces";

/**
 * Every meeting of two exposed facades of one building unit.
 *
 * Two facades of the same building meet when a corner of one stands within
 * the thicker of the two separations of a corner of the other, which is exactly
 * the slack a wall's own construction introduces between two faces authored on
 * the same envelope corner. The side the corner turns toward is read from the
 * meeting point itself: a corner is exterior when the other facade's body lies
 * behind one facade's outward plane, and reentrant when it lies in front of it.
 *
 * A corner's id is `<boundary>+<boundary>` in code-unit order, its position is
 * the mean of the midpoints of the nearest vertex pairs along the shared edge,
 * its normal bisects the two outward normals, and the list is sorted by id.
 * Throws when an exposed face's space belongs to no building unit, as
 * {@link builtEnvironmentEnvelopeFaces} does.
 *
 * @evidence contracts/common.md#principled-implementation Places the envelope with `builtEnvironmentEnvelopeFaces` and pairs its facades with `builtEnvelopeFaceCorners`, whose proximity and side tests read only the placed geometry.
 * @evidence contracts/common.md#clear-and-simple-design The environment-level entry point over the face-level pairing, which the census calls directly with faces it already holds, so the pairing rule has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building or boundary and adds nothing to the two shared steps; the unowned-space refusal passes through from the face query.
 * @evidence contracts/common.md#meaningful-documentation States the meeting rule and its slack, the exterior and reentrant reading, the id, position and normal of a corner, the sort, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Costs one envelope placement, linear in the exposed faces' points plus one containment probe per face, and the pairing, quadratic in the facade count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one environment per call and keeps nothing; a caller that already holds the faces calls `builtEnvelopeFaceCorners` instead of placing them again.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The placed faces are dropped on return; the caller owns the returned corners.
 */
export const builtEnvironmentEnvelopeCorners = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeCorner[] =>
  builtEnvelopeFaceCorners(builtEnvironmentEnvelopeFaces(environment));
