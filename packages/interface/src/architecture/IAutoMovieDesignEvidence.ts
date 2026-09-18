/**
 * One authored citation from a normalized design element to the observation it
 * was decided from.
 *
 * The arrow points from design to evidence, never back. The author states which
 * reading was chosen and why it beat the recorded alternatives; the observation
 * itself is left exactly as it was read.
 *
 * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-observation-conditions Exposes `IAutoMovieDesignEvidence` as the portable data boundary for the evidence observation conditions requirement.
 * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-observation-record-contract Types `IAutoMovieDesignEvidence` for the evp observation record contract system contract.
 */
export interface IAutoMovieDesignEvidence {
  /**
   * Normalized design element, space, or boundary id this citation justifies.
   *
   * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-observation-conditions Exposes `subject` as the portable data boundary for the evidence observation conditions requirement.
   * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-observation-record-contract Types `subject` for the evp observation record contract system contract.
   */
  subject: string;
  /**
   * Design-reference document id.
   *
   * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-observation-conditions Exposes `document` as the portable data boundary for the evidence observation conditions requirement.
   * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-observation-record-contract Types `document` for the evp observation record contract system contract.
   */
  document: string;
  /**
   * Candidate ids cited as the basis of the authored decision; at least one.
   *
   * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-observation-conditions Exposes `candidates` as the portable data boundary for the evidence observation conditions requirement.
   * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-observation-record-contract Types `candidates` for the evp observation record contract system contract.
   */
  candidates: string[];
  /**
   * Why the author chose this reading over the recorded alternatives.
   *
   * @evidence requirements/evidence-and-provenance/observations-claims-and-human-judgments.md#evidence-observation-conditions Exposes `rationale` as the portable data boundary for the evidence observation conditions requirement.
   * @evidence specifications/evidence-and-provenance/observations-claims-and-human-judgments.md#evp-observation-record-contract Types `rationale` for the evp observation record contract system contract.
   */
  rationale: string;
}
