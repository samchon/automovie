import { AutoMovieEngineResolve } from "@automovie/engine";
import { IAutoMovieChannel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

const node: (
  id: string,
  path: "translation" | "rotation" | "scale" | "weights",
) => IAutoMovieChannel = (
  id: string,
  path: "translation" | "rotation" | "scale" | "weights",
): IAutoMovieChannel => ({ kind: "node", node: id, path });

const pointer: (
  ptr: string,
  valueType: "scalar" | "vec2" | "vec3" | "vec4" | "quaternion" | "weights",
) => IAutoMovieChannel = (
  ptr: string,
  valueType: "scalar" | "vec2" | "vec3" | "vec4" | "quaternion" | "weights",
): IAutoMovieChannel => ({ kind: "pointer", pointer: ptr, valueType });

/**
 * Canonical channel keys and the rotation test that decides slerp vs lerp.
 *
 * Scenarios:
 *
 * 1. A node channel keys to `node:{id}:{path}`; a pointer channel keys to
 *    `ptr:{pointer}`. The two namespaces are disjoint, so a node and a pointer
 *    can never collide.
 * 2. Positive node rotation and pointer quaternion examples contrast with
 *    node translation and scalar pointer negatives; other valid path/type
 *    neighbors are not enumerated in this test.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls channelKey and channelIsRotation on authored node/pointer records; asserts address namespaces and rotation classification.
 * @evidence contracts/development/testing.md#independent-expectations Literal node:id:path and ptr:pointer spellings and the declared rotation/quaternion kinds supply expectations independently of the helpers' results; this does not establish target existence or pointer syntax.
 * @evidence contracts/development/testing.md#distinguishing-cases Node rotation/translation and quaternion/scalar pointers distinguish both outcomes in each channel family; other supported paths/types and numerical sampling are not exhaustive here.
 * @evidence contracts/development/testing.md#execution-ownership The named test_resolve_channel entry executes portable synchronous address/classification semantics through direct product imports, without installing a scene host or replacing foreign methods.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A node channel keys to `node:{id}:{path}`; a pointer channel keys to).
 */
export function test_resolve_channel(): void {
  // 1. keys
  TestValidator.equals(
    "node key",
    AutoMovieEngineResolve.channelKey(node("hips", "rotation")),
    "node:hips:rotation",
  );
  TestValidator.equals(
    "pointer key",
    AutoMovieEngineResolve.channelKey(pointer("/cameras/0/fovY", "scalar")),
    "ptr:/cameras/0/fovY",
  );

  // 2. rotation discrimination: both kinds, both outcomes
  TestValidator.equals(
    "node rotation is rotation",
    AutoMovieEngineResolve.channelIsRotation(node("hips", "rotation")),
    true,
  );
  TestValidator.equals(
    "node translation is not rotation",
    AutoMovieEngineResolve.channelIsRotation(node("hips", "translation")),
    false,
  );
  TestValidator.equals(
    "pointer quaternion is rotation",
    AutoMovieEngineResolve.channelIsRotation(pointer("/nodes/0/rotation", "quaternion")),
    true,
  );
  TestValidator.equals(
    "pointer scalar is not rotation",
    AutoMovieEngineResolve.channelIsRotation(pointer("/materials/0/metallic", "scalar")),
    false,
  );
}
