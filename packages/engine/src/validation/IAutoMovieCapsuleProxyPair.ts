import { IAutoMovieCapsuleProxy } from "./validateCapsule";

/**
 * Explicit capsule pair to test for overlap.
 *
 * Pairing is explicit because adjacent anatomical capsules often share joints
 * and should not be treated as self-intersections.
 *
 * @author Samchon
 */
export interface IAutoMovieCapsuleProxyPair {
  /** First capsule in the pair. */
  first: IAutoMovieCapsuleProxy;

  /** Second capsule in the pair. */
  second: IAutoMovieCapsuleProxy;
}
