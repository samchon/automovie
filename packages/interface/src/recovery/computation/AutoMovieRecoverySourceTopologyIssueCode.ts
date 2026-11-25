/**
 * Finite categories emitted by scalar source-cell topology and port admission.
 * String literals distinguish degeneracy, nonmanifold incidence, orientation
 * and ownership failures; no units or numeric sentinel are involved.
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
