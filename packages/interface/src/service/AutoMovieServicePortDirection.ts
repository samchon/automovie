/**
 * Medium direction relative to the node owning a service port.
 *
 * @evidence contracts/common.md#principled-implementation In receives from the network, out supplies to it and bidirectional permits either relation; segment endpoint admission and system load use that same node-relative convention.
 * @evidence contracts/common.md#clear-and-simple-design Port direction stays separate from root traversal direction so supply and drainage can share one unambiguous graph contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bidirectional fittings do not duplicate terminal demand in load aggregation, and direction is not guessed from waypoint ordering.
 * @evidence contracts/common.md#meaningful-documentation Defines node-relative direction and its use in segment compatibility and load ownership.
 */
export type AutoMovieServicePortDirection = "in" | "out" | "bidirectional";
