/**
 * The last numerical build of one domain.
 *
 * @evidence contracts/common.md#principled-implementation Reports the document and latest successful numerical-reply milliseconds observed for one capture's domain.
 * @evidence contracts/common.md#clear-and-simple-design Separates domain build telemetry from complete render duration and per-document AO/time records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache-only captures create no new domain build; a duration is an observation rather than a predicted future construction time.
 * @evidence contracts/common.md#meaningful-documentation States document id and worker milliseconds, which may refer to the most recent successful numerical reply when several replies occurred.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The two-field projection uses fixed arithmetic/assignment; actual numerical work is measured by its owner.
 * @evidence contracts/performance.md#reuse-equivalent-work The capture owner keeps the latest produced reading per domain rather than sharing geometry based on equal document labels or durations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current producers use three domain slots; the record retains no model/image bytes and status borrows those latest values.
 *
 * @author Samchon
 */
export interface IHumanViewerDomainBuild {
  /** Document built. */
  doc: string;

  /** Worker milliseconds of the build. */
  ms: number;
}
