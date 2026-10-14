import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairRootedLookaheadDecision } from "./IHumanFaceHairRootedLookaheadDecision";
import type { IHumanFaceHairStemTrial } from "./IHumanFaceHairStemTrial";

/**
 * The walk state `describeHumanFaceHairStemRefusal` assembles a stem refusal from, at the moment the stem refuses.
 *
 * `points` are the stem's admitted stations, root first, with the refusing station last. `step` is the lock's sampling step and `length` its metric target, from which each earlier station's nominal chord is recovered. The refusing station's own look-ahead decision and trials are passed as the walk made them; earlier stations' decisions are recomputed from their inputs.
 *
 * @evidence contracts/common.md#principled-implementation Existing stations, turn dimensions, same-collider readers and the actual last decision supply failure-only diagnostic reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design The request uses walk state already held rather than a second always-on station history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recomputation spends remaining shared budget and exhausted earlier lookahead may be null without replacing the original refusal.
 * @evidence contracts/common.md#meaningful-documentation Lengths are metres, rootNormal is unit direction and last trials or lookahead are supplied as made.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reconstruction traversal belongs to describeHumanFaceHairStemRefusal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The actual final decision is shared; only earlier decisions are replayed when budget permits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The walk owns borrowed stations, readers and budget; diagnostic output ownership belongs to the refusal record.
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
