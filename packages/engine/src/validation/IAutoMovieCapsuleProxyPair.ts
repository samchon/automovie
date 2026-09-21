import { IAutoMovieCapsuleProxy } from "./validateCapsule";

/**
 * Explicit capsule pair to test for overlap.
 *
 * Pairing is explicit because adjacent anatomical capsules often share joints
 * and should not be treated as self-intersections.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `IAutoMovieCapsuleProxyPair` binds the two explicitly selected body proxies to one self-overlap validation entry.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `IAutoMovieCapsuleProxyPair` provides the pair index and endpoint identities needed to reconstruct an affected capsule relation.
 * @author Samchon
 */
export interface IAutoMovieCapsuleProxyPair {
  /**
   * First capsule in the pair.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `first` identifies the first bone segment and radius participating in the declared overlap test.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `first` retains its own endpoint fields so malformed proxy input is reported under the first pair arm.
   */
  first: IAutoMovieCapsuleProxy;

  /**
   * Second capsule in the pair.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `second` identifies the comparison segment whose distance from the first proxy determines penetration.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `second` keeps its endpoint and radius address separate from the other arm of the capsule relation.
   */
  second: IAutoMovieCapsuleProxy;
}
