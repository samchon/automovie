import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyExteriorCandidateMeasurement } from "./IAutoMovieHumanBodyExteriorCandidateMeasurement";
import type { IAutoMovieHumanBodyExteriorCandidateReference } from "./IAutoMovieHumanBodyExteriorCandidateReference";
import type { IAutoMovieHumanBodyGeneratedAnatomy } from "./IAutoMovieHumanBodyGeneratedAnatomy";

/**
 * Source-conditioned exterior readings and anatomical availability. The named report preserves the original request and states which quantity the actual final skin fulfills without claiming clinical reconstruction.
 *
 * @evidence contracts/common.md#principled-implementation Generator revision, candidate-only status, source reference, owned request and ordered fulfillment coexist with independent anatomical availability.
 * @evidence contracts/common.md#clear-and-simple-design One report joins emitted-surface fulfillment with per-part resolution while keeping clinical qualification separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical target fulfillment cannot become accepted reconstruction or a validated internal anatomy certificate.
 * @evidence contracts/common.md#meaningful-documentation Members explain revision/status, admitted request, solve order and independent clinical availability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The candidate report describes results without executing exterior inversion algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Paired request/fulfillment provenance defines no equivalent-build memoization policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Report arrays and request snapshots belong to construction, without renderer resources.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateReport {
  /** The concrete generator that produced the surface: every bound target of the document's anatomy, met on one exterior. */
  readonly generatorRevision: "source-conditioned-exterior/2";

  /** Qualification of the emitted surface: a physical candidate whose skin and parts are not geometrically validated, never an accepted reconstruction. */
  readonly status: "candidate-only";

  /** Basis, frame and protocol under which `fulfilled` was read. */
  readonly reference: IAutoMovieHumanBodyExteriorCandidateReference;

  /** The body document the report was built from, as admitted. */
  readonly requested: IAutoMovieHumanBodyBasisDocument;

  /** Every bound target the emitted skin was solved to satisfy, in solve order. */
  readonly fulfilled: readonly IAutoMovieHumanBodyExteriorCandidateMeasurement[];

  /** Clinical resolution semantics remain independent of the rendered skin. */
  readonly anatomy: IAutoMovieHumanBodyGeneratedAnatomy;
}
