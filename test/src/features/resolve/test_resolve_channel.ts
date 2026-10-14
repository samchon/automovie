import { IAutoMovieChannel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { channelIsRotation } from "@automovie/engine";
import { channelKey } from "@automovie/engine";
import { throwsError } from "../internal/throwsError";

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
 * 3. Unknown channel discriminator values reject instead of falling through to
 *    pointer behavior.
 * 4. Unknown node `path` and pointer `valueType` tags reject instead of being
 *    keyed or treated as non-rotation data.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls channelKey and channelIsRotation on authored node/pointer records; asserts address namespaces, rotation classification and refusal of forged discriminators, paths and value types.
 * @evidence contracts/testing.md#independent-expectations Literal node:id:path and ptr:pointer spellings and the declared rotation/quaternion kinds supply expectations independently of the helpers' results; this does not establish target existence or pointer syntax.
 * @evidence contracts/testing.md#distinguishing-cases Node rotation/translation and quaternion/scalar pointers distinguish both outcomes in each channel family, while forged kind/path/type neighbors must throw; other supported paths/types and numerical sampling are not exhaustive here.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_channel entry executes portable synchronous address/classification semantics through direct product imports, without installing a scene host or replacing foreign methods.
 */
export function test_resolve_channel(): void {
  // 1. keys
  TestValidator.equals(
    "node key",
    channelKey(node("hips", "rotation")),
    "node:hips:rotation",
  );
  TestValidator.equals(
    "pointer key",
    channelKey(pointer("/cameras/0/fovY", "scalar")),
    "ptr:/cameras/0/fovY",
  );

  // 2. rotation discrimination: both kinds, both outcomes
  TestValidator.equals(
    "node rotation is rotation",
    channelIsRotation(node("hips", "rotation")),
    true,
  );
  TestValidator.equals(
    "node translation is not rotation",
    channelIsRotation(node("hips", "translation")),
    false,
  );
  TestValidator.equals(
    "pointer quaternion is rotation",
    channelIsRotation(pointer("/nodes/0/rotation", "quaternion")),
    true,
  );
  TestValidator.equals(
    "pointer scalar is not rotation",
    channelIsRotation(pointer("/materials/0/metallic", "scalar")),
    false,
  );

  const forged: IAutoMovieChannel = {
    kind: "bone",
    pointer: "/bad",
    valueType: "scalar",
  } as unknown as IAutoMovieChannel;
  TestValidator.predicate(
    "unknown channel kind rejects keying",
    throwsError((): string => channelKey(forged), ["channel kind", "bone"]),
  );
  TestValidator.predicate(
    "unknown channel kind rejects rotation check",
    throwsError(
      (): boolean => channelIsRotation(forged),
      ["channel kind", "bone"],
    ),
  );

  const forgedPath: IAutoMovieChannel = {
    kind: "node",
    node: "hips",
    path: "visibility",
  } as unknown as IAutoMovieChannel;
  TestValidator.predicate(
    "unknown node path rejects keying",
    throwsError(
      (): string => channelKey(forgedPath),
      ["channel path", "visibility"],
    ),
  );
  TestValidator.predicate(
    "unknown node path rejects rotation check",
    throwsError(
      (): boolean => channelIsRotation(forgedPath),
      ["channel path", "visibility"],
    ),
  );

  const forgedValueType: IAutoMovieChannel = {
    kind: "pointer",
    pointer: "/nodes/0/rotation",
    valueType: "matrix",
  } as unknown as IAutoMovieChannel;
  TestValidator.predicate(
    "unknown pointer value type rejects keying",
    throwsError(
      (): string => channelKey(forgedValueType),
      ["channel valueType", "matrix"],
    ),
  );
  TestValidator.predicate(
    "unknown pointer value type rejects rotation check",
    throwsError(
      (): boolean => channelIsRotation(forgedValueType),
      ["channel valueType", "matrix"],
    ),
  );
}
