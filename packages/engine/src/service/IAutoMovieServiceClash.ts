/**
 * One clashing pair of runs, in the order the network declares them.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `IAutoMovieServiceClash` identifies the two routed runs that occupy the same physical volume and therefore cannot coexist as authored.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `IAutoMovieServiceClash` carries one deterministically ordered segment pair emitted by service-network interference analysis.
 */
export interface IAutoMovieServiceClash {
  /**
   * Id of the earlier-declared segment.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `left` names the earlier-declared run in an obstructing service pair so the author can locate the first route to move.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `left` preserves the lower declaration index of the two overlapping segment volumes.
   */
  left: string;
  /**
   * Id of the later-declared segment.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `right` names the later-declared run in an obstructing service pair so the conflicting route is unambiguous.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `right` preserves the higher declaration index of the two overlapping segment volumes.
   */
  right: string;
}
