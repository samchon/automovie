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
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateReport {
  /**
   * The concrete generator that produced the surface; the request document
   * must name the same revision before the builder evaluates it.
   */
  readonly generatorRevision: "source-conditioned-exterior/1";
  /**
   * Qualification of the emitted surface: a physical candidate whose skin and
   * parts are not geometrically validated, never an accepted reconstruction.
   */
  readonly status: "candidate-only";
  /** Basis, frame and protocol under which `fulfilled` was read. */
  readonly reference: IAutoMovieHumanBodyExteriorCandidateReference;
  /** Original complete request, including unsupported context. */
  readonly requested: IAutoMovieHumanBodyAnatomicalDocument;
  /** The single target the emitted skin was solved to satisfy, with its readings. */
  readonly fulfilled: IAutoMovieHumanBodyExteriorCandidateMeasurement;
  /** Original supplied measurement paths not geometrically consumed. */
  readonly unfulfilledContext: readonly string[];
  /** Clinical resolution semantics remain independent of the rendered skin. */
  readonly anatomy: IAutoMovieHumanBodyGeneratedAnatomy;
}
