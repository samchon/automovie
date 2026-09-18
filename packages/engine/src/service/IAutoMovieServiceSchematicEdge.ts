/**
 * One run in a plan schematic, projected onto the horizontal plane.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `IAutoMovieServiceSchematicEdge` presents one installed run with its endpoints, plan path, and real developed length.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `IAutoMovieServiceSchematicEdge` is the deterministic planar projection of one typed service segment.
 */
export interface IAutoMovieServiceSchematicEdge {
  /**
   * Stable segment identity.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `id` lets a schematic run be traced back to the exact authored segment that must be inspected or revised.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `id` preserves the segment identifier while its geometry is projected.
   */
  id: string;
  /**
   * Node the run leaves.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `from` identifies the node from which the depicted run leaves, preserving the readable direction of service flow.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `from` resolves the segment's source port to its owning service node.
   */
  from: string;
  /**
   * Node the run enters.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `to` identifies the node entered by the depicted run, completing the connection shown to the reader.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `to` resolves the segment's destination port to its owning service node.
   */
  to: string;
  /**
   * Projected centre line, in declaration order.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `points` shows every authored turn of the run in declaration order on the plan.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `points` projects each route point's world `x` and `z` into schematic coordinates.
   */
  points: Array<{ x: number; y: number }>;
  /**
   * Developed length of the **unprojected** centre line, in metres.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `length` reports how many metres of routed service the segment actually develops through three-dimensional space.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `length` retains the unprojected centre-line length even when risers collapse to points on the plan.
   */
  length: number;
}
