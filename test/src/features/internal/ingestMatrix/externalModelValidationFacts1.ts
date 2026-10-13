import { rejects } from "./rejects";
import { changed } from "./changed";
import { humanoidChanged } from "./humanoidChanged";

/**
 * Register original structural/reference/accessor negative twins against the public byte inspector.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export function externalModelValidationFacts1(): [string, () => boolean][] {
  return [
["rootMustBeObject", () : boolean => rejects(null, "glTF root must be an object")],
[
      "assetMustBeObject",
      () : boolean => rejects(changed(["asset"], null), "glTF asset must be an object"),
    ],
[
      "assetVersionMustBeTwo",
      () : boolean => rejects(changed(["asset", "version"], "1.0"), "asset.version"),
    ],
[
      "optionalInventoryMustBeArray",
      () : boolean => rejects(changed(["nodes"], {}), "nodes must be an array"),
    ],
[
      "nodeMustBeObject",
      () : boolean => rejects(changed(["nodes", 0], null), "nodes[0] must be an object"),
    ],
[
      "nodeMeshMustResolve",
      () : boolean => rejects(changed(["nodes", 0, "mesh"], 9), "nodes[0].mesh"),
    ],
[
      "nodeSkinMustResolve",
      () : boolean => rejects(changed(["nodes", 0, "skin"], 0), "nodes[0].skin"),
    ],
[
      "nodeChildrenMustBeArray",
      () : boolean =>
        rejects(
          changed(["nodes", 0, "children"], 0),
          "children must be an array",
        ),
    ],
[
      "nodeChildMustResolve",
      () : boolean => rejects(changed(["nodes", 0, "children"], [9]), "children[0]"),
    ],
[
      "sceneMustBeObject",
      () : boolean =>
        rejects(changed(["scenes", 0], null), "scenes[0] must be an object"),
    ],
[
      "sceneNodeMustResolve",
      () : boolean => rejects(changed(["scenes", 0, "nodes"], [9]), "scenes[0].nodes[0]"),
    ],
[
      "bufferMustBeObject",
      () : boolean =>
        rejects(changed(["buffers", 0], null), "buffers[0] must be an object"),
    ],
[
      "bufferLengthMustBeNumber",
      () : boolean =>
        rejects(
          changed(["buffers", 0, "byteLength"], "12"),
          "positive safe integer",
        ),
    ],
[
      "bufferLengthMustBeSafe",
      () : boolean =>
        rejects(
          changed(["buffers", 0, "byteLength"], 1.5),
          "positive safe integer",
        ),
    ],
[
      "bufferLengthMustBePositive",
      () : boolean =>
        rejects(
          changed(["buffers", 0, "byteLength"], 0),
          "positive safe integer",
        ),
    ],
[
      "jsonBufferNeedsUri",
      () : boolean =>
        rejects(changed(["buffers", 0, "uri"], undefined), "uri is required"),
    ],
[
      "meshMustBeObject",
      () : boolean =>
        rejects(changed(["meshes", 0], null), "meshes[0] must be an object"),
    ],
[
      "primitivesMustBeArray",
      () : boolean =>
        rejects(
          changed(["meshes", 0, "primitives"], null),
          "primitives must be an array",
        ),
    ],
[
      "meshNeedsPrimitive",
      () : boolean =>
        rejects(
          changed(["meshes", 0, "primitives"], []),
          "has no render primitive",
        ),
    ],
[
      "primitiveMustBeObject",
      () : boolean =>
        rejects(
          changed(["meshes", 0, "primitives", 0], null),
          "primitives[0] must be an object",
        ),
    ],
[
      "attributesMustBeObject",
      () : boolean =>
        rejects(
          changed(["meshes", 0, "primitives", 0, "attributes"], null),
          "attributes must be an object",
        ),
    ],
[
      "positionIsRequired",
      () : boolean =>
        rejects(
          changed(
            ["meshes", 0, "primitives", 0, "attributes", "POSITION"],
            undefined,
          ),
          "attributes.POSITION",
        ),
    ],
[
      "indicesMustResolve",
      () : boolean =>
        rejects(
          changed(["meshes", 0, "primitives", 0, "indices"], 9),
          ".indices",
        ),
    ],
[
      "skinMustBeObject",
      () : boolean =>
        rejects(
          humanoidChanged(["skins", 0], null),
          "skins[0] must be an object",
          "gltf-humanoid-v1",
        ),
    ],
[
      "skinJointsMustBeArray",
      () : boolean =>
        rejects(
          humanoidChanged(["skins", 0, "joints"], null),
          "joints must be an array",
          "gltf-humanoid-v1",
        ),
    ],
[
      "skinNeedsJoint",
      () : boolean =>
        rejects(
          humanoidChanged(["skins", 0, "joints"], []),
          "has no joints",
          "gltf-humanoid-v1",
        ),
    ],
[
      "skinJointMustResolve",
      () : boolean =>
        rejects(
          humanoidChanged(["skins", 0, "joints"], [9]),
          "joints[0]",
          "gltf-humanoid-v1",
        ),
    ],
[
      "bufferViewMustBeObject",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0], null),
          "bufferViews[0] must be an object",
        ),
    ],
[
      "bufferViewBufferMustResolve",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "buffer"], 9),
          "bufferViews[0].buffer",
        ),
    ],
[
      "bufferViewLengthMustBePositive",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteLength"], 0),
          "positive safe integer",
        ),
    ],
[
      "bufferViewOffsetMustBeNumber",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteOffset"], "0"),
          "non-negative safe integer",
        ),
    ],
[
      "bufferViewOffsetMustBeSafe",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteOffset"], 0.5),
          "non-negative safe integer",
        ),
    ],
[
      "bufferViewOffsetMustBeNonnegative",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteOffset"], -1),
          "non-negative safe integer",
        ),
    ],
...["wide", "small", "large", "unaligned"].map(
      (name: string, index: number): [string, () => boolean] => [
        `byteStride${name}`,
        () : boolean =>
          rejects(
            changed(["bufferViews", 0, "byteStride"], ["4", 3, 256, 6][index]),
            "byteStride must be a 4-byte-aligned integer",
          ),
      ],
    ),
[
      "accessorMustBeObject",
      () : boolean =>
        rejects(
          changed(["accessors", 0], null),
          "accessors[0] must be an object",
        ),
    ],
[
      "accessorBufferViewMustResolve",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "bufferView"], 9),
          "accessors[0].bufferView",
        ),
    ],
[
      "accessorCountMustBePositive",
      () : boolean =>
        rejects(changed(["accessors", 0, "count"], 0), "positive safe integer"),
    ],
[
      "accessorOffsetMustBeNonnegative",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "byteOffset"], -1),
          "non-negative safe integer",
        ),
    ],
[
      "componentTypeMustBeNumber",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "componentType"], "FLOAT"),
          "unsupported componentType",
        ),
    ],
[
      "componentTypeMustBeSupported",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "componentType"], 999),
          "unsupported componentType",
        ),
    ],
[
      "accessorShapeMustBeString",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "type"], 3),
          "unsupported componentType or shape",
        ),
    ],
[
      "accessorShapeMustBeSupported",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "type"], "VEC5"),
          "unsupported componentType or shape",
        ),
    ],
[
      "accessorNeedsStorage",
      () : boolean =>
        rejects(
          changed(["accessors", 0, "bufferView"], undefined),
          "needs a bufferView",
        ),
    ],
[
      "strideMustCoverElement",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteStride"], 8),
          "element size 12 exceeds",
        ),
    ]
  ];
}
