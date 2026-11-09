/**
 * Medium direction relative to the node owning a service port.
 *
 * @evidence contracts/development/design.md#principled-representation In receives from the network, out supplies to it and bidirectional permits either relation; segment endpoint admission and system load use that same node-relative convention.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Port direction stays separate from root traversal direction so supply and drainage can share one unambiguous graph contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bidirectional fittings do not duplicate terminal demand in load aggregation, and direction is not guessed from waypoint ordering.
 * @evidence contracts/development/common.md#meaningful-documentation Defines node-relative direction and its use in segment compatibility and load ownership.
 */
export type AutoMovieServicePortDirection = "in" | "out" | "bidirectional";
