import type { IAutoMovieMeshQueryBudget } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { humanFaceHairContact } from "./humanFaceHairContact";

/**
 * A pre-tie gather candidate that `transportHumanFaceHairGatherStep` advances.
 *
 * Positions, travel and offset are current head-frame metres; directions are caller-supplied unit vectors and strength is dimensionless in [0,1]. The positive-strength path spends the shared budget through retraction and its closing query, and borrowed contact readers update their internal sample memo. Input vectors stay unchanged; zero strength returns the direct candidate without contact queries.
 *
 * @evidence contracts/common.md#principled-implementation Current station, unit directions, travel and free offset define one pre-tie transport step against its lock's unchanged contact rule.
 * @evidence contracts/common.md#clear-and-simple-design The explicit budget and contact keep query accounting shared with the walk while strength remains an admitted dimensionless input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero strength is the documented ordinary path; offset may never fall below clearance minus epsilon to disguise failed contact.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre quantities, unit-vector premises, strength range, unchanged input vectors, shared budget spending and contact memo effects, including the zero-strength branch.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The state contract implements no quadratic solve or contact retraction; the transport function owns those fixed-step calculations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same contact readers are reused within the lock, but state values are not merged across stations with different geometry or direction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the mutable budget and contact closure; transport state opens no additional task that survives return.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherTransportState {
  /** Current station, in head-frame metres. */
  point: IAutoMovieVector3;

  /** Requested unit travel direction from the gather blend. */
  direction: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Non-negative travel along `direction`, in metres. */
  parameter: number;

  /** Gather strength in [0, 1]; zero keeps the ordinary path. */
  strength: number;

  /** Current free offset from the skin, at least clearance minus epsilon. */
  offset: number;

  /** Same-collider contact readers of this lock. */
  contact: ReturnType<typeof humanFaceHairContact>;

  /** Shared lock budget spent by retraction and the closing skin query. */
  budget: IAutoMovieMeshQueryBudget;
}
