/**
 * What one reference comparison reads.
 */

export interface IReferenceComparison {
  /** Reference image number. */
  reference: "01" | "02" | "03" | "04" | "05";
  /** Observation questions compared with the reference. */
  observations: string[];
  /** Built records compared with the reference. */
  records: string[];
}
