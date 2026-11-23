import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryObservationProvenance,
  IAutoMovieRecoveryObservationTangents,
} from "../../index";

/** One working point entry before canonical ordering and output-row assembly. */
export interface IAutoMovieRecoveryObservationEntry {
  /** Canonical phase in [0, 1), before final increasing-order assembly. */
  phase: number;

  /** Physical position in millimetres. */
  point: Readonly<AutoMovieVector3Tuple>;

  /** Persistent current identity, or null for an unnamed or virtual point. */
  anchorId: string | null;

  /** Whether this point retains an original corner request. */
  corner: boolean;

  /** Whether this point is requested in the transported sampling schedule. */
  schedule: boolean;

  /** Unit directions on the two traversal sides. */
  tangents: IAutoMovieRecoveryObservationTangents;

  /** Original observation or explicit PL-interior origin. */
  provenance: IAutoMovieRecoveryObservationProvenance;
}
