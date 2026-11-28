import { AutoMovieEngineResolve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `channelKey` names a channel for identity: `node:<node>:<path>` for a node
 * property and `ptr:<pointer>` for a pointer.
 *
 * Scenarios:
 *
 * 1. A node channel keys by node and path.
 * 2. The scalar pointer channel keys by its literal pointer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the node and pointer key formats exercised by one literal channel of each kind.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `channelKey` directly with an arm rotation channel and a scalar light pointer, then compares exact strings.
 * @evidence contracts/development/testing.md#independent-expectations The node key joins the node and path as node:arm:rotation. The pointer case prefixes the literal /lights/lamp/intensity with ptr:.
 */
export function test_engine_resolve_channel_key(): void {
  TestValidator.equals(
    "a node channel",
    AutoMovieEngineResolve.channelKey({ kind: "node", node: "arm", path: "rotation" }),
    "node:arm:rotation",
  );
  TestValidator.equals(
    "a pointer channel",
    AutoMovieEngineResolve.channelKey({
      kind: "pointer",
      pointer: "/lights/lamp/intensity",
      valueType: "scalar",
    }),
    "ptr:/lights/lamp/intensity",
  );
}
