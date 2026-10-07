import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyExteriorCandidateMeasurement } from "./IAutoMovieHumanBodyExteriorCandidateMeasurement";
import type { IAutoMovieHumanBodyExteriorCandidateReference } from "./IAutoMovieHumanBodyExteriorCandidateReference";
import type { IAutoMovieHumanBodyGeneratedAnatomy } from "./IAutoMovieHumanBodyGeneratedAnatomy";

/**
 * Source-conditioned exterior readings and anatomical availability.
 * The named report preserves the original request and states which quantity
 * the actual final skin fulfills without claiming clinical reconstruction.
 *
 * @evidence contracts/common.md#clear-and-simple-design Owns the candidate report independently of the rendered model container.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes measured exterior output from unavailable anatomy.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateReport {
  /**
   * The concrete generator that produced the surface: every bound target of
   * the document's anatomy, met on one exterior.
   */
  readonly generatorRevision: "source-conditioned-exterior/2";

  /**
   * Qualification of the emitted surface: a physical candidate whose skin and
   * parts are not geometrically validated, never an accepted reconstruction.
   */
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
