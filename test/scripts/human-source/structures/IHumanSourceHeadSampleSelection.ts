/**
 * Provenance of a sparse head-skin sample set used by report-only readers.
 *
 * Unlike a filled region bounded by a proved loop, this selection records
 * only the explicitly read native samples. Its extent or projected polygon
 * is a source convention and supplies no closed tissue boundary or clinical
 * reconstruction. The manifest keeps these records separate from strict
 * filled-region records so the two qualifications cannot be confused.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadSampleSelection {
  /** Skin region name consumed by the report-only reader. */
  name: string;

  /** Neutral CC0 hm08 samples that were selected, not a closed loop. */
  originalVertices: number[];

  /** Sorted native head-view skin indices written to the region. */
  viewVertices: number[];

  /** Quantity the selected samples locate under the source convention. */
  definition: string;

  /** How the samples were selected and carried into this generation. */
  rule: string;

  /** Boundary and acquisition limitations that this set does not solve. */
  uncertainty: string;

  /** View descriptions of the source reading and its later critique. */
  frames: string;

  /** Index, frame and anatomical side conventions of this registration. */
  convention: string;
}
