import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * One row of the connected face controls: what it shows and how an entered value becomes a candidate document.
 *
 * Units depend on the owning control: simple coordinates and most fine channels are authored weights, while source-derived articulation or excursion rows use degrees or millimetres. Display bounds guide entry; the subsequent panel transaction admits the candidate.
 *
 * @evidence contracts/common.md#principled-implementation Display value and bounds use one owning unit conversion, and the edit function maps entry back to canonical document coordinates before shared admission.
 * @evidence contracts/common.md#clear-and-simple-design One row record combines presentation metadata and candidate assembly while DOM events and transactions remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source endpoint bounds are not universal clinical limits, and assembling a candidate does not establish numerical or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes authored weights from source degrees/millimetres, display bounds and later admission ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This row schema chooses no unit conversion or candidate-copy algorithm; the supplied edit function implements those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The row record declares no shared numerical reading or candidate memoization.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Metadata and edit closure references own no GPU or worker handles; the mounted controls decide row lifetime.
 *
 * @author Samchon
 */
export interface IConnectedFaceControlEntry {
  /** The control id: a channel id, or a simple coordinate id. */
  id: string;

  /** The label shown for the row. */
  label: string;

  /** What one unit of the control moves. */
  description: string;

  /** The smallest value the control offers, in its displayed unit. */
  minimum: number;

  /** The largest value the control offers, in its displayed unit. */
  maximum: number;

  /** The current value, in its displayed unit. */
  value: number;

  /** The component path the search also matches. */
  group?: string;

  /**
   * Assemble an entered display value into a candidate document; the panel performs numerical admission and can refuse it.
   *
   * @evidence contracts/common.md#principled-implementation Candidate assembly lowers the owning display coordinate into canonical authored document state without directly publishing geometry.
   * @evidence contracts/common.md#clear-and-simple-design Row-specific composition stays in this callback while the shared transaction owns full-document validation and history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned candidate is not reported as an already admitted or clinically measured state.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes assembly from later numerical admission and refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This edit signature chooses no clone or projection-lowering algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Candidate creation declares no merging of independent input effects or numerical cache reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned document data acquires no frame or transport task until the parent submits it.
   */
  edit: (value: number) => IAutoMovieHumanFaceBasisDocument;
}
