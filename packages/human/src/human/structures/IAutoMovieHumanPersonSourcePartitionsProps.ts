import type { IAutoMovieHumanPersonSourceSurface } from "./IAutoMovieHumanPersonSourceSurface";

/**
 * The two complementary skin surfaces whose source partitions are admitted together: the face's and the body's.
 *
 * @evidence contracts/common.md#principled-implementation Face and body surfaces enter admission as one pair so a missing or incompatible compiled half cannot silently select separate source identities.
 * @evidence contracts/common.md#clear-and-simple-design The two required fields match the complementary halves consumed by source partition admission and normal compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both halves are caller-supplied skin surfaces; this transport introduces no bundled basis or preferred person.
 * @evidence contracts/common.md#meaningful-documentation The declaration identifies the paired face and body skin surfaces whose partitions are validated together.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pairing surface references chooses no traversal; the source partition validator owns comparisons and coverage checks.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This input record exposes no cache or cross-request coordinator; normal compilation decides when captured surfaces can be reused.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Required surface references transfer no resource ownership; their caller and the compiled normal closure control retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourcePartitionsProps {
  /** The face's skin surface. */
  face: IAutoMovieHumanPersonSourceSurface;

  /** The body's skin surface. */
  body: IAutoMovieHumanPersonSourceSurface;
}
