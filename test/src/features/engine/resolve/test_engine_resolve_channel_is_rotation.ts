import { AutoMovieEngineResolve } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `channelIsRotation` is true for a node `rotation` path and for a pointer of
 * quaternion value type, the channels sampled by spherical interpolation.
 *
 * Scenarios:
 *
 * 1. A node rotation is one and a node translation is not.
 * 2. A quaternion pointer is one and a scalar pointer is not.
 */
export function test_engine_resolve_channel_is_rotation(): void {
  TestValidator.predicate(
    "node channels",
    AutoMovieEngineResolve.channelIsRotation({ kind: "node", node: "n", path: "rotation" }) &&
      !AutoMovieEngineResolve.channelIsRotation({ kind: "node", node: "n", path: "translation" }),
  );
  TestValidator.predicate(
    "pointer channels",
    AutoMovieEngineResolve.channelIsRotation({
      kind: "pointer",
      pointer: "/p",
      valueType: "quaternion",
    }) &&
      !AutoMovieEngineResolve.channelIsRotation({
        kind: "pointer",
        pointer: "/p",
        valueType: "scalar",
      }),
  );
}
