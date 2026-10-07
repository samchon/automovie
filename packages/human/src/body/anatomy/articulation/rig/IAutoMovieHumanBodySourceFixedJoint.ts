/** A source bone retains its relative rest placement under its parent's motion. */
export interface IAutoMovieHumanBodySourceFixedJoint {
  /** Parent carry only; authored motion on this bone is unsupported unless a declared driver consumes it elsewhere. */
  kind: "fixed";
}
