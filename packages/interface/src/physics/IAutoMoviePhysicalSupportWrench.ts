import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieWorldWrench } from "./IAutoMovieWorldWrench";

/**
 * Requested and geometrically allocated support wrench before native
 * integration.
 *
 * Origin is the actual pre-integration root COM in world metres; seconds is the
 * associated cache instant and residual equals requested minus allocated.
 * trackPhysicalWorld records the allocation from actual floor witnesses for
 * replay and diagnosis; contact receipts independently report transferred
 * impulse. Even zero residual does not prove achieved load after motor caps or
 * integration; pointCount may be zero and counts participating witnesses rather
 * than support limbs.
 */
export interface IAutoMoviePhysicalSupportWrench {
  /** Scene body requesting the root wrench. */
  body: string;

  /**
   * Local cache instant associated with the prediction, seconds; its origin and
   * allocation are evaluated before the corresponding integration.
   */
  seconds: number;

  /**
   * Actual root COM used as the allocation's moment origin, world metres before
   * integration.
   */
  origin: IAutoMovieVector3;

  /** Requested root force in N and moment in N m. */
  requested: IAutoMovieWorldWrench;

  /**
   * Geometrically feasible force allocation before native motor caps and
   * integration.
   */
  allocated: IAutoMovieWorldWrench;

  /**
   * Requested minus allocated, in the same SI units; zero is not a measured
   * physical success.
   */
  residual: IAutoMovieWorldWrench;

  /** Number of actual floor witnesses participating in this allocation, 0..1024. */
  pointCount: number;
}
