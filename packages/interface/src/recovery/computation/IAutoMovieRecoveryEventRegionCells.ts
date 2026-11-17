import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";

/**
 * Clip one ordered candidate population into fresh private query cells.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Query-local result under construction, shared by cell, topology and port observation phases. lower scalar-boundary node registry for this query, with original source incidence preserved.
 * @evidence contracts/development/design.md#principled-representation Query-local result under construction, shared by cell, topology and port observation phases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionCells, RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionCells's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryEventRegionCells {
  /**
   * Clip one ordered candidate population into fresh private query cells.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Query-local result under construction, shared by cell, topology and port observation phases. lower scalar-boundary node registry for this query, with original source incidence preserved.
   * @evidence contracts/development/design.md#principled-representation Query-local result under construction, shared by cell, topology and port observation phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionCells, RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionCells's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
    prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
    query: Parameters<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>[0],
  ) => {
    /** Query-local result under construction, shared by cell, topology and port observation phases. */
    result: ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;

    /** lower scalar-boundary node registry for this query, with original source incidence preserved. */
    lower: number;

    /** upper scalar-boundary node registry for this query, with original source incidence preserved. */
    upper: number;

    /** Observed node identity to the one query-local node record that owns its scalar value. */
    nodeMap: Map<string, IAutoMovieRecoveryEventRegionCells.Node>;

    /** Cell ordinal to its observed boundary-node sequence in the current scalar query. */
    cellNodes: Map<number, IAutoMovieRecoveryEventRegionCells.Node[]>;

    /** Original source-face ordinal to its cell ordinal in the current scalar query. */
    faceCells: Map<number, number>;

    /** Appends one query-local topology issue and returns its index; optional occurrence/port lists default to empty. */
    issue: (
      code: IAutoMovieRecoveryEventRegionCells.IssueCode,
      cells: number[],
      occurrences?: string[],
      ports?: string[],
    ) => number;
  };

  /**
   * Node within recovery event region cells. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Clip one ordered candidate population into fresh private query cells.
   * @evidence contracts/development/design.md#principled-representation Clip one ordered candidate population into fresh private query cells.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionCells, RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionCells's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Node = ReturnType<
    ReturnType<IAutoMovieRecoveryEventRegion.Operation>
  >["nodes"][number];

  /**
   * IssueCode within recovery event region cells. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Clip one ordered candidate population into fresh private query cells.
   * @evidence contracts/development/design.md#principled-representation Clip one ordered candidate population into fresh private query cells.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionCells, RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionCells's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type IssueCode = IAutoMovieRecoveryEventRegionCells.Issue["code"];

  /**
   * Issue within recovery event region cells. Its referenced contract retains the same units, ordering and absence semantics.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Clip one ordered candidate population into fresh private query cells.
   * @evidence contracts/development/design.md#principled-representation Clip one ordered candidate population into fresh private query cells.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegion, RecoveryEventRegionCells, RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionCells's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Issue = ReturnType<
    ReturnType<IAutoMovieRecoveryEventRegion.Operation>
  >["issues"][number];
}
