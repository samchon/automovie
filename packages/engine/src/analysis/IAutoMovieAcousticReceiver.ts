import { IAutoMovieVector3 } from "@automovie/interface";

/**
 *
 * One place the room is listened from.
 *
 * Each receiver yields one `room.soundPressureLevel` sample whose id is the
 * receiver's. A receiver within 1e-12 m of any source is refused, because the
 * inverse square law has no value there, and a study may declare at most
 * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` receivers.
 *
 * @evidence contracts/common.md#principled-implementation A point receiver for the direct-plus-diffuse level, whose direct term needs only each source distance, so no orientation or area is carried.
 * @evidence contracts/common.md#clear-and-simple-design An id plus a position, the id doubling as the sample id so the field overlay and the run name a listening point the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-12 m coincidence refusal marks the inverse-square singularity rather than a tuned clearance; any farther receiver is accepted however close it stands.
 * @evidence contracts/common.md#meaningful-documentation States the sample each receiver yields, the coincidence refusal, the receiver bound, and the finite world position in metres.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record; the solver visits each receiver once per source, a cost of the acoustic analyzer. One receiver feeds one sample in one study, and nothing computed for it serves another study. An id and a position vector owned by the request for one study.
 * @author Samchon
 */
export interface IAutoMovieAcousticReceiver {
  /** Stable receiver identity, unique among receivers and reused as sample id. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;
}
