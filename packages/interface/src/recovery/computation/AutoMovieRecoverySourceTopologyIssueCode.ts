/**
 * Finite categories emitted by scalar source-cell topology and port admission.
 * String literals distinguish degeneracy, nonmanifold incidence, orientation and ownership failures; no units or numeric sentinel are involved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Finite categories emitted by scalar source-cell topology and port admission. String literals distinguish degeneracy, nonmanifold incidence, orientation and ownership failures; no units or numeric sentinel are involved.
 * @evidence contracts/development/design.md#principled-representation String literals distinguish degeneracy, nonmanifold incidence, orientation and ownership failures; no units or numeric sentinel are involved.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegionCells, RecoveryEventRegionTopology and RecoveryEventRegionPorts use this shared vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Codes describe observed failures, not an instruction to repair or automatically classify geometry.
 */
export type AutoMovieRecoverySourceTopologyIssueCode =
  | "collapsed-declared-incidence"
  | "duplicate-face-occurrence"
  | "source-geometry-rank-below-two"
  | "flat-source-face"
  | "repeated-cell-incidence-vertex"
  | "nonmanifold-edge-incidence"
  | "nonmanifold-source-edge"
  | "nonmanifold-vertex-link"
  | "boundary-is-not-a-simple-cycle"
  | "orientation-parity-obstruction"
  | "input-face-directions-inconsistent"
  | "point-contact-between-edge-components"
  | "port-ambiguous-ownership"
  | "port-missing-ownership"
  | "overlapping-port-boundary-claims";
