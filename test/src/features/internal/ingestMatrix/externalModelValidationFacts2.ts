import { rejects } from "./rejects";
import { changed } from "./changed";
import { conflictingBuffers } from "./conflictingBuffers";
import { baseDocument } from "./baseDocument";
import { resolveOnlyBuffer } from "./resolveOnlyBuffer";
import { basePayload } from "./basePayload";
import { dataDocument } from "./dataDocument";
import { accepts } from "./accepts";
import { withoutMesh } from "./withoutMesh";
import { inspect } from "./inspect";
import { rejectsGlb } from "./rejectsGlb";
import { embeddedDocument } from "./embeddedDocument";
import { acceptsGlb } from "./acceptsGlb";
import { secondEmbeddedBuffer } from "./secondEmbeddedBuffer";
import { sparseDocument } from "./sparseDocument";
import { set } from "./set";
import { matrixDocument } from "./matrixDocument";

/**
 * Register original resident payload, GLB, data-URI, sparse and matrix-storage cases.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export function externalModelValidationFacts2(): [string, () => boolean][] {
  return [
[
      "accessorMustFitView",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteLength"], 8),
          "requires 12 bytes",
        ),
    ],
[
      "imageMustBeObject",
      () : boolean => rejects(changed(["images"], [null]), "images[0] must be an object"),
    ],
[
      "embeddedImageNeedsView",
      () : boolean => rejects(changed(["images"], [{}]), "images[0].bufferView"),
    ],
[
      "extensionsMustBeObject",
      () : boolean =>
        rejects(changed(["extensions"], []), "extensions must be an object"),
    ],
[
      "extensionNameMustBeString",
      () : boolean => rejects(changed(["extensionsUsed"], [1]), "extensionsUsed[0]"),
    ],
[
      "extensionNameMustBeNonblank",
      () : boolean => rejects(changed(["extensionsUsed"], [" "]), "extensionsUsed[0]"),
    ],
[
      "bufferUriMustBeString",
      () : boolean =>
        rejects(
          changed(["buffers", 0, "uri"], 3),
          "must be a non-empty URI string",
        ),
    ],
[
      "bufferUriMustBeNonempty",
      () : boolean =>
        rejects(
          changed(["buffers", 0, "uri"], ""),
          "must be a non-empty URI string",
        ),
    ],
[
      "conflictingBufferLengths",
      () : boolean =>
        rejects(conflictingBuffers(), "conflicting resource roles or lengths"),
    ],
[
      "bufferImageRoleConflict",
      () : boolean =>
        rejects(
          changed(["images"], [{ uri: "mesh.bin" }]),
          "declared as both a buffer and an image",
        ),
    ],
[
      "missingExternalBuffer",
      () : boolean =>
        rejects(
          baseDocument(),
          "has no builder-resolved resident bytes",
          "gltf-static-v1",
          (): Uint8Array | null => null,
        ),
    ],
[
      "externalBufferLengthMismatch",
      () : boolean =>
        rejects(
          baseDocument(),
          "has 1 bytes, not declared",
          "gltf-static-v1",
          (): Uint8Array => Buffer.alloc(1),
        ),
    ],
[
      "missingExternalImage",
      () : boolean =>
        rejects(
          changed(["images"], [{ uri: "image.png" }]),
          "has no non-empty builder-resolved resident bytes",
          "gltf-static-v1",
          resolveOnlyBuffer,
        ),
    ],
[
      "emptyExternalImage",
      () : boolean =>
        rejects(
          changed(["images"], [{ uri: "image.png" }]),
          "has no non-empty builder-resolved resident bytes",
          "gltf-static-v1",
          (uri: string): Uint8Array | null => (uri === "mesh.bin" ? basePayload() : Buffer.alloc(0)),
        ),
    ],
[
      "incompleteDataUri",
      () : boolean =>
        rejects(
          changed(["buffers", 0, "uri"], "data:"),
          "not a complete data URI",
        ),
    ],
[
      "noncanonicalBase64Length",
      () : boolean =>
        rejects(
          dataDocument("data:application/octet-stream;base64,A"),
          "base64 payload is not canonical",
        ),
    ],
[
      "noncanonicalBase64Alphabet",
      () : boolean =>
        rejects(
          dataDocument("data:application/octet-stream;base64,!!!!!!!!!!!!"),
          "base64 payload is not canonical",
        ),
    ],
[
      "base64LengthMismatch",
      () : boolean =>
        rejects(
          dataDocument("data:application/octet-stream;base64,AA=="),
          "data URI has 1 bytes",
        ),
    ],
[
      "invalidPercentEscape",
      () : boolean =>
        rejects(
          dataDocument("data:application/octet-stream,%0"),
          "percent escape is incomplete",
        ),
    ],
[
      "validBase64Data",
      () : boolean =>
        accepts(
          dataDocument(
            `data:application/octet-stream;base64,${basePayload().toString("base64")}`,
          ),
        ),
    ],
[
      "validPercentData",
      () : boolean =>
        accepts(
          dataDocument(
            "data:application/octet-stream,%00%00%00%00%00%00%00%00%00%00%00%00",
          ),
        ),
    ],
[
      "validRawData",
      () : boolean => accepts(dataDocument("data:application/octet-stream,abcdefghijkl")),
    ],
[
      "rawAstralDataEncodesWholeCodePoints",
      () : boolean =>
        accepts(
          dataDocument(
            "data:application/octet-stream,\u{1F600}\u{1F600}\u{1F600}",
          ),
        ),
    ],
[
      "embeddedImageData",
      () : boolean =>
        accepts(changed(["images"], [{ uri: "data:image/png;base64,AQ==" }])),
    ],
[
      "embeddedImageCanonicalSinglePadding",
      (): boolean =>
        accepts(changed(["images"], [{ uri: "data:image/png;base64,AQI=" }])),
    ],
[
      "base64TwoPaddingBitsMustBeZero",
      (): boolean =>
        rejects(
          changed(["images"], [{ uri: "data:image/png;base64,AR==" }]),
          "base64 payload is not canonical",
        ),
    ],
[
      "base64SinglePaddingBitsMustBeZero",
      (): boolean =>
        rejects(
          changed(["images"], [{ uri: "data:image/png;base64,AQJ=" }]),
          "base64 payload is not canonical",
        ),
    ],
[
      "embeddedImageBufferView",
      () : boolean => accepts(changed(["images"], [{ bufferView: 0 }])),
    ],
[
      "bufferViewMustFitBuffer",
      () : boolean =>
        rejects(
          changed(["bufferViews", 0, "byteLength"], 16),
          "exceeds buffers[0]",
        ),
    ],
[
      "staticProfileNeedsMesh",
      () : boolean => rejects(withoutMesh(), "has no mesh to render or review"),
    ],
[
      "staticProfileLeavesAnimationForItsLoader",
      () : boolean => inspect(changed(["animations"], [{}])).motion === undefined,
    ],
[
      "glbNeedsBin",
      () : boolean => rejectsGlb(embeddedDocument(), null, "has no BIN chunk"),
    ],
[
      "glbBinAllowsPadding",
      () : boolean => acceptsGlb(embeddedDocument(9), Buffer.alloc(12)),
    ],
[
      "glbBinMustCoverDeclaredLength",
      () : boolean =>
        rejectsGlb(embeddedDocument(13), Buffer.alloc(12), "does not cover"),
    ],
[
      "glbBinPaddingIsBounded",
      () : boolean => rejectsGlb(embeddedDocument(8), Buffer.alloc(12), "does not cover"),
    ],
[
      "glbBinNeedsBuffer",
      () : boolean =>
        rejectsGlb(
          { asset: { version: "2.0" }, nodes: [] },
          Buffer.alloc(4),
          "declares no buffer",
        ),
    ],
[
      "glbBinCannotBeOrphaned",
      () : boolean =>
        rejectsGlb(
          baseDocument(),
          Buffer.alloc(12),
          "BIN chunk is orphaned",
          resolveOnlyBuffer,
        ),
    ],
[
      "glbSecondBufferCannotUseBin",
      () : boolean =>
        rejectsGlb(
          secondEmbeddedBuffer(),
          Buffer.alloc(12),
          "cannot use the GLB BIN chunk",
        ),
    ],
["validSparseAccessor", () : boolean => accepts(sparseDocument())],
[
      "sparseCountCannotExceedAccessor",
      () : boolean =>
        rejects(
          set(sparseDocument(), ["accessors", 0, "sparse", "count"], 2),
          "sparse.count exceeds",
        ),
    ],
[
      "sparseIndicesMustBeObject",
      () : boolean =>
        rejects(
          set(sparseDocument(), ["accessors", 0, "sparse", "indices"], null),
          "sparse.indices must be an object",
        ),
    ],
[
      "sparseValuesMustBeObject",
      () : boolean =>
        rejects(
          set(sparseDocument(), ["accessors", 0, "sparse", "values"], null),
          "sparse.values must be an object",
        ),
    ],
[
      "sparseIndexTypeMustBeUnsigned",
      () : boolean =>
        rejects(
          set(
            sparseDocument(),
            ["accessors", 0, "sparse", "indices", "componentType"],
            5122,
          ),
          "must be unsigned byte",
        ),
    ],
[
      "sparseIndexRangeMustFit",
      () : boolean =>
        rejects(
          set(
            sparseDocument(),
            ["accessors", 0, "sparse", "indices", "byteOffset"],
            12,
          ),
          "indices exceeds its bufferView",
        ),
    ],
[
      "sparseValueRangeMustFit",
      () : boolean =>
        rejects(
          set(
            sparseDocument(),
            ["accessors", 0, "sparse", "values", "byteOffset"],
            4,
          ),
          "values exceeds its bufferView",
        ),
    ],
[
      "matrixPaddingShapes",
      () : boolean => accepts(matrixDocument(), (): Uint8Array => Buffer.alloc(56)),
    ]
  ];
}

