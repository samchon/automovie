import type { IAutoMovieHumanBodyAnatomicalDocument } from "../../structures/IAutoMovieHumanBodyAnatomicalDocument";
import type { IAutoMovieHumanBodyExteriorCandidateMeasurement } from "./IAutoMovieHumanBodyExteriorCandidateMeasurement";
import type { IAutoMovieHumanBodyExteriorCandidateReference } from "./IAutoMovieHumanBodyExteriorCandidateReference";
import type { IAutoMovieHumanBodyGeneratedAnatomy } from "./IAutoMovieHumanBodyGeneratedAnatomy";

/**
 * Source-conditioned exterior readings and anatomical availability.
 * The named report preserves the original request and states which quantity
 * the actual final skin fulfills without claiming clinical reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design Owns the candidate report independently of the rendered model container.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes measured exterior output from unavailable anatomy.
 */
export interface IAutoMovieHumanBodyExteriorCandidateReport {
  readonly generatorRevision: "source-conditioned-exterior/1";
  readonly status: "candidate-only";
  readonly reference: IAutoMovieHumanBodyExteriorCandidateReference;
  /** Original complete request, including unsupported context. */
  readonly requested: IAutoMovieHumanBodyAnatomicalDocument;
  readonly fulfilled: IAutoMovieHumanBodyExteriorCandidateMeasurement;
  /** Original supplied measurement paths not geometrically consumed. */
  readonly unfulfilledContext: readonly string[];
  /** Clinical resolution semantics remain independent of the rendered skin. */
  readonly anatomy: IAutoMovieHumanBodyGeneratedAnatomy;
}
