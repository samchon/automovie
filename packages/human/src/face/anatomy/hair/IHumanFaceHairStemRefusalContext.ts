import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";
import type { IHumanFaceHairStemTrial } from "./IHumanFaceHairStemTrial";

/**
 * The walk state `describeHumanFaceHairStemRefusal` assembles a stem refusal
 * from, at the moment the stem refuses.
 *
 * `points` are the stem's admitted stations, root first, with the refusing
 * station last. `step` is the lock's sampling step and `length` its metric
 * target, from which each earlier station's nominal chord is recovered. The
 * refusing station's own look-ahead decision and trials are passed as the walk
 * made them; earlier stations' decisions are recomputed from their inputs.
 *
 * @evidence contracts/common.md#principled-implementation Supplies only the walk's own state and readers, so the refusal reports what the walk measured.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read on refusal only; no admitted lock passes through it.
 * @evidence contracts/common.md#meaningful-documentation States the order of points and which members are passed or recomputed.
 * @evidence contracts/modeling.md#spatial-conventions Positions and lengths are head-frame metres; directions are unit vectors.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A refused stem emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and interval own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemRefusalContext {
  /** Admitted stations, root first; the last is the refusing station. */
  points: readonly IAutoMovieVector3[];

  /** Unit outward skin normal at the root. */
  rootNormal: IAutoMovieVector3;

  /** The lock's sampling step, in metres. */
  step: number;

  /** The lock's metric target length, in metres. */
  length: number;

  /** Contact of the walk. */
  contact: IHumanFaceHairContact;

  /** Ray index over the same collider. */
  raycaster: Pick<ReturnType<typeof createAutoMovieMeshRayCaster>, "nearestHit">;

  /** The walk's shared lock budget. */
  budget: IAutoMovieMeshQueryBudget;

  /** The refusing station's look-ahead decision, as the walk made it. */
  lookahead: IHumanFaceHairRootedLookaheadDecision;

  /** Every trial chord at the refusing station, in order. */
  trials: IHumanFaceHairStemTrial[];
}
