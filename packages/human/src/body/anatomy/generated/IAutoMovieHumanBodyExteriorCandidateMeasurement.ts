import type { IAutoMovieHumanBodyExteriorCandidateSection } from "./IAutoMovieHumanBodyExteriorCandidateSection";

/**
 * Requested and achieved readings of the candidate's source-defined girth.
 * All lengths are metres; final and Float32 output share the same instrument.
 * @evidence contracts/common.md#clear-and-simple-design Names the fulfilled measurement instead of embedding an anonymous object type.
 * @evidence contracts/common.md#meaningful-documentation Records target, output, precision boundary and signed residual.
 */
export interface IAutoMovieHumanBodyExteriorCandidateMeasurement {
  readonly path: "targets.surface.trunk.bustGirth" | "targets.bustAtNippleLevelMetres";
  readonly targetMetres: number;
  readonly finalMetres: number;
  readonly float32Metres: number;
  readonly residualMetres: number;
  readonly section: IAutoMovieHumanBodyExteriorCandidateSection;
}
