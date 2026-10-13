import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One place the room is listened from.
 *
 * Each receiver yields one `room.soundPressureLevel` sample whose id is the
 * receiver's. A receiver within 1e-12 m of any source is refused, because the
 * inverse square law has no value there, and a study may declare at most
 * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` receivers.
 *
 * @evidence contracts/common.md#principled-implementation Each receiver is evaluated with the direct-plus-reverberant level `Lw + 10 log10(Q/(4 pi r^2) + 4/R)` summed over sources; the coincident-source refusal exists because the inverse square term is undefined at zero distance.
 * @evidence contracts/common.md#clear-and-simple-design An id and a position, the two facts a listening point has; the id doubles as the sample id so a reader maps a sample back to its receiver without another table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A receiver on a source throws instead of being nudged off the source or clamped to a minimum distance, and the receiver count limit is the shared analysis sample bound.
 * @evidence contracts/common.md#meaningful-documentation States the one sample each receiver yields and its id, the 1e-12 m coincidence refusal, the receiver count limit, the metre unit, and the finiteness requirement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; evaluating all receivers costs receivers times sources inside `analyzeAutoMovieAcoustics`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A receiver is read for one study and its level is computed once in that study; nothing persists for reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One id and one vector owned by the request; at most `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` of them per study.
 * @author Samchon
 */
export interface IAutoMovieAcousticReceiver {
  /** Stable receiver identity, unique among receivers and reused as sample id. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;
}
