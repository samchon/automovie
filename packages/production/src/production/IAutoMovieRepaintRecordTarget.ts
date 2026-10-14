import { AutoMovieRepaintRecordKind } from "./AutoMovieRepaintRecordKind";

/**
 * Identity of one requested persisted record. The collector admits supported kind and exact nonempty shot/record text before all reader calls; this record carries no provider payload or filesystem locator, but its text is not independently credential-filtered.
 *
 * @evidence contracts/common.md#principled-implementation Kind, shot and family-local record identity address independent candidate/rendition observations with deterministic target sorting.
 * @evidence contracts/common.md#clear-and-simple-design The minimal target separates requested identity from reader paths, returned record values and classified findings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constructing the target supplies no current record or safe-locator proof; exact nonempty text is not a credential-content filter.
 * @evidence contracts/common.md#meaningful-documentation Members identify family, owning shot and local record identity with admission and text-safety limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no validation, copying, sorting or I/O.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Target fields declare no successful-reader cache or duplicate suppression.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased record shape allocates no target graph or reader resources.
 * @author Samchon
 */
export interface IAutoMovieRepaintRecordTarget {
  /** Record family the target belongs to. */
  kind: AutoMovieRepaintRecordKind;

  /** Shot that owns the record. */
  shot: string;

  /** Stable identity of the record within its family. */
  recordId: string;
}
