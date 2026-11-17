import type { IAutoMovieServiceNetwork } from "./IAutoMovieServiceNetwork";

/**
 * System-root traversal input with an optional closed-node blocking policy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation System-root traversal input with an optional closed-node blocking policy. The system id must resolve or serviceSystemReach throws; omitted or false closedValvesBlock follows design connectivity, while true stops expansion at any node whose state opening equals zero.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing roots return an empty result and unresolved segment endpoints are skipped; a blocking node is itself reached, and the policy applies to any state-bearing node, not just valve kinds.
 * @evidence contracts/development/design.md#principled-representation The system id must resolve or serviceSystemReach throws; omitted or false closedValvesBlock follows design connectivity, while true stops expansion at any node whose state opening equals zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Capacity checks and serviceNetworkSchematic share this traversal, which returns reached node ids in network declaration order.
 */
export namespace IAutoMovieServiceSystemReach {
  /**
   * System-root traversal input with an optional closed-node blocking policy.
   *
   * Reachability is what separates a drawn network from a working one, and its
   * direction is the system's own: a supply main is walked forward from the root,
   * a drainage stack backward into it, a ring either way. The answer is returned
   * in declaration order so two runs of the same design produce the same list.
   *
   * `closedValvesBlock` is the difference between the design question and the
   * operating one. Left off — the default — an isolating valve is walked straight
   * through, because a valve someone happened to shut is not a design defect.
   * Set, a node whose state opening is exactly zero stops expansion at itself
   * while remaining reached. Nodes beyond it can still be reached through other
   * unblocked paths; the traversal does not remove those alternate connections.
   *
   * A system whose root does not resolve reaches nothing rather than reaching a
   * name; the validator owns reporting the dangling root itself.
   * An unknown system id throws. Nodes, ports and segment references must already
   * be structurally admitted; the queue walk is not an arbitrary-JSON gate.
   *
   * @evidence contracts/development/design.md#principled-representation The system id must resolve or serviceSystemReach throws; omitted or false closedValvesBlock follows design connectivity, while true stops expansion at any node whose state opening equals zero.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Capacity checks and serviceNetworkSchematic share this traversal, which returns reached node ids in network declaration order.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing roots return an empty result and unresolved segment endpoints are skipped; a blocking node is itself reached, and the policy applies to any state-bearing node, not just valve kinds.
   * @evidence contracts/development/common.md#meaningful-documentation System-root traversal input with an optional closed-node blocking policy. The system id must resolve or serviceSystemReach throws; omitted or false closedValvesBlock follows design connectivity, while true stops expansion at any node whose state opening equals zero.
   */
  export type IProps = {
    /** Borrowed graph; dangling segment endpoints are skipped and a missing selected-system root returns no reached nodes. */
    network: IAutoMovieServiceNetwork;

    /** Exact system id controlling root and traversal direction; unknown ids throw. */
    system: string;

    /** Undefined or false ignores node opening state. True stops expansion at any node with state.opening exactly zero, including the root; that node remains reached. */
    closedValvesBlock?: boolean | undefined;
  };
}
