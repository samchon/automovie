import type { IAutoMovieHumanBodyExteriorCandidateSection } from "./IAutoMovieHumanBodyExteriorCandidateSection";

/**
 * Requested and achieved readings of the candidate's source-defined girth.
 * All lengths are metres; final and Float32 output share the same instrument.
 * @evidence contracts/common.md#clear-and-simple-design Names the fulfilled measurement instead of embedding an anonymous object type.
 * @evidence contracts/common.md#meaningful-documentation Records target, output, precision boundary and signed residual.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateMeasurement {
  /**
   * Caller-visible request path of the consumed target: the detailed tier's
   * `targets.surface.trunk.bustGirth`, or the simple tier's
   * `targets.bustAtNippleLevelMetres` before it was lifted. The report
   * excludes exactly this path from its unfulfilled context.
   */
  readonly path: "targets.surface.trunk.bustGirth" | "targets.bustAtNippleLevelMetres";
  /** Absolute girth the request asked for, copied from its non-observed target. */
  readonly targetMetres: number;
  /**
   * Tape-style convex-hull girth of the final double-precision skin at the
   * solved source weight, before Float32 quantization.
   */
  readonly finalMetres: number;
  /**
   * The same instrument on the skin after the Float32 mesh-buffer boundary
   * that export and preview consume. The inverse solves against this value.
   */
  readonly float32Metres: number;
  /**
   * `float32Metres - targetMetres`: positive when the emitted girth exceeds
   * the request. The inverse refuses a solve whose magnitude would exceed
   * half its 0.1 mm readout (0.05 mm).
   */
  readonly residualMetres: number;
  /** The cut the Float32 reading actually measured, for readback by consumers. */
  readonly section: IAutoMovieHumanBodyExteriorCandidateSection;
}
