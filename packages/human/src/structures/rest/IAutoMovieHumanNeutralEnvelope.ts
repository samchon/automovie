import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/**
 * Independent convex-envelope observables in the supplying measurement protocol's local plane.
 *
 * The protocol identifies the site origin, plane normal and signed breadth and anterior axes, including their roll. A bone-normal plane alone does not determine those axes. Retain that protocol with the observations; an unrecorded origin or axis leaves spatial placement unresolved. Horizontal NeutralLevel observations use their separately declared pelvis datum.
 */
export interface IAutoMovieHumanNeutralEnvelope extends IAutoMovieHumanSurfaceEnvelope {
  /** Signed extent-midpoint displacement from the declared site origin along the protocol's breadth axis, mm. */
  breadthOffsetMm: number;

  /** Signed extent-midpoint displacement from the declared site origin along the protocol's anterior axis, mm. */
  anteriorOffsetMm: number;
}
