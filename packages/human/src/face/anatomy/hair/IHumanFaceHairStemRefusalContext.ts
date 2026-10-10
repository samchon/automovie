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
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** The walk's shared lock budget. */
  budget: IAutoMovieMeshQueryBudget;

  /** The refusing station's look-ahead decision, as the walk made it. */
  lookahead: IHumanFaceHairRootedLookaheadDecision;

  /** Every trial chord at the refusing station, in order. */
  trials: IHumanFaceHairStemTrial[];
}
