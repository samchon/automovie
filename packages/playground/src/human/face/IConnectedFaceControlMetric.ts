/**
 * The physical unit a fine face control displays instead of its weight: degrees for jaw opening and gaze, millimetres for jaw excursion.
 *
 * The factor can be signed for angular endpoints and is nonzero for an admitted conversion. It describes the selected basis endpoint, not measured personal capacity or a clinical limit.
 *
 * @evidence contracts/common.md#principled-implementation A degrees-or-millimetres-per-weight factor relates displayed coordinates to the same canonical authored weight, with signed angular factors preserved by the conversion owner.
 * @evidence contracts/common.md#clear-and-simple-design The record carries conversion and two presentation strings while source metadata reading and document lowering stay with the control producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source endpoints are not labelled personal measurements or universal clinical capacity, and zero-factor refusal remains with the owning reader.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies endpoint units, possible angular sign, nonzero admission premise and the limits of the physical interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This scalar conversion record chooses no metadata lookup or unit-lowering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type declares no cached measurement or numerical equivalence across basis revisions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalars and strings acquire no worker or renderer handle and remain with their owning row metadata.
 *
 * @author Samchon
 */
export interface IConnectedFaceControlMetric {
  /** Signed display units per canonical channel weight; admitted conversions exclude zero. */
  perWeight: number;

  /** The unit suffix written after a value. */
  unit: string;

  /** The unit written in the control label. */
  label: string;
}
