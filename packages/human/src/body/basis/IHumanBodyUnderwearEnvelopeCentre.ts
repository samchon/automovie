/**
 * One qualified exterior ball centre and its exact resident identity.
 *
 * @evidence contracts/common.md#principled-implementation Original ordinal and exact posed-meter point bounds preserve a qualified center through spatial hierarchy partitioning.
 * @evidence contracts/common.md#clear-and-simple-design Center position and query bounds share one resident record used by deterministic nearest-branch selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Qualification cannot be preserved by snapping or displacing the center after insertion.
 * @evidence contracts/common.md#meaningful-documentation Members give original insertion identity and lower/upper/center coordinates in the same posed skin frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Center-record typing performs no spatial partition or clearance qualification.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Resident identity supplies query correspondence without storing completed nearest-distance results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This center schema acquires no spatial hierarchy node or continuous-field task.
 * @author Samchon
 */
export interface IHumanBodyUnderwearEnvelopeCentre {
  /** Original insertion ordinal, retained through spatial partitioning. */
  id: number;

  /** Exact lower XYZ point bounds in posed skin metres. */
  low: number[];

  /** Exact upper XYZ point bounds in the same posed skin frame. */
  high: number[];

  /** Actual qualified centre position, without a later snap or displacement. */
  centre: number[];
}
