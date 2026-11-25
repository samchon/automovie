import { channelKey } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `channelKey` names a channel for identity: `node:<node>:<path>` for a node
 * property and `ptr:<pointer>` for a pointer.
 *
 * Scenarios:
 *
 * 1. A node channel keys by node and path.
 * 2. A pointer channel keys by its pointer, whatever its value type.
 */
export function test_engine_resolve_channel_key(): void {
  TestValidator.equals(
    "a node channel",
    channelKey({ kind: "node", node: "arm", path: "rotation" }),
    "node:arm:rotation",
  );
  TestValidator.equals(
    "a pointer channel",
    channelKey({
      kind: "pointer",
      pointer: "/lights/lamp/intensity",
      valueType: "scalar",
    }),
    "ptr:/lights/lamp/intensity",
  );
}
