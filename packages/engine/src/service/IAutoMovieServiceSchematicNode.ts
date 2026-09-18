import { AutoMovieServiceNodeKind } from "@automovie/interface";

/**
 * One node in a plan schematic, projected onto the horizontal plane.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `IAutoMovieServiceSchematicNode` exposes one routed fitting or terminal at a stable plan position for inspection of the service layout.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `IAutoMovieServiceSchematicNode` projects a typed network node from world space onto the schematic's horizontal plane.
 */
export interface IAutoMovieServiceSchematicNode {
  /**
   * Stable node identity.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `id` keeps a schematic node traceable to the authored fitting, terminal, or junction it depicts.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `id` retains the source service-node identifier through plan projection.
   */
  id: string;
  /**
   * Computational family the node was declared with.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `kind` tells the schematic reader whether the routed node is equipment, a terminal, a fitting, or another declared computational family.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `kind` preserves the closed service-node discriminator used by network checks.
   */
  kind: AutoMovieServiceNodeKind;
  /**
   * World `x` in metres.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `x` places the service node at its metre-valued east-west world coordinate on the plan.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `x` copies the network node's world `x` without geometric reinterpretation.
   */
  x: number;
  /**
   * World `z` in metres, the schematic's vertical axis.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `y` places the service node at its metre-valued north-south world coordinate on the plan.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `y` maps the network node's world `z` onto the schematic vertical axis.
   */
  y: number;
}
