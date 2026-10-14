import type { IAutoMovieHumanBasisNormalTransport } from "../../common/basis/IAutoMovieHumanBasisNormalTransport";

/**
 * One skin half as normal-transport admission reads it: its emitted triangle vertex indices and its compiled fixed-source normal transport, if any.
 *
 * @evidence contracts/common.md#principled-implementation Emitted triangle indices accompany optional fixed-source transport so paired admission can check vertex and cell population against actual skin topology.
 * @evidence contracts/common.md#clear-and-simple-design The projection exposes only topology and transport metadata required by the normal validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted transport explicitly supports current-only shading; this record does not invent fixed cells for an incomplete pair.
 * @evidence contracts/common.md#meaningful-documentation Members state flat emitted index triples and the optional compiled transport record.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The emitted half topology and optional transport descriptor specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the emitted half topology and optional transport descriptor; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The emitted half topology and optional transport descriptor acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportHalf {
  /** Flat emitted triangle vertex index triples. */
  indices: readonly number[];

  /** Compiled fixed-source normal transport, or none. */
  transport?: IAutoMovieHumanBasisNormalTransport;
}
