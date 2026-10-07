import type { IAutoMovieHumanFaceOralExportPartQualification } from "./IAutoMovieHumanFaceOralExportPartQualification";

/**
 * Explicit qualification of an actual generated coarse oral static assembly.
 * Source hashes identify its canonical licensed provenance; clinical gaps
 * remain distinct from mathematical, runtime or Float32 admission. The
 * static geometry carries no promise to restore an editable person document.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralExportQualification {
  /** Independent namespace schema version. */
  version: 1;
  /** Authored anatomy is not clinical acquisition or validation. */
  qualification: "coarse-authored-oral-no-clinical-validation";
  /** Canonical generation of the actual oral registration. */
  generation: string;
  /** Producer SHA-256 of original dental neutral/target/attachment/region data. */
  dentalNativeSha256: string;
  /** Original licensed inputs and producer registration receipt hashes. */
  sourceSha256: string[];
  /** Publisher's native source license, not inferred from final appearance. */
  sourceLicense: "CC0-1.0";
  /** Named unknowns, rather than guessed populations, roots or tissue values. */
  clinicalGaps: string[];
  /** Exact native tongue region IDs consumed by this assembly, including person prefix. */
  tonguePartIds: string[];
  /** Source members in actual static primitive member order. */
  parts: IAutoMovieHumanFaceOralExportPartQualification[];
}
