import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * A real static-profile control: one nondegenerate triangle with resident little-endian POSITION bytes and one mesh instance.
 */
const document: () => object = (): object => {
  const positions: Buffer = Buffer.alloc(36);
  positions.writeFloatLE(1, 12);
  positions.writeFloatLE(1, 28);
  return {
    asset: { version: "2.0" },
    buffers: [
      {
        byteLength: 36,
        uri: `data:application/octet-stream;base64,${positions.toString("base64")}`,
      },
    ],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ name: "root", mesh: 0 }],
  };
};

/**
 * Build a GLB around one JSON chunk, with every header field addressable.
 */
const container: (props: {
  binChunks?: readonly { length: number; type: number }[];
  declaredLength?: number;
  jsonChunkType?: number;
  jsonLength?: number;
  magic?: number;
  /** Bytes after the last chunk, counted in the declared length. */ trailingBytes?: number;
  version?: number;
}) => Buffer = (props: {
  binChunks?: readonly { length: number; type: number }[];
  declaredLength?: number;
  jsonChunkType?: number;
  jsonLength?: number;
  magic?: number;
  /**
   * Bytes after the last chunk, counted in the declared length.
   */
  trailingBytes?: number;
  version?: number;
}): Buffer => {
  const source: Buffer<ArrayBuffer> = Buffer.from(
    JSON.stringify(document()),
    "utf8",
  );
  const json: Buffer<ArrayBuffer> = Buffer.concat([
    source,
    Buffer.alloc(4 - (source.length % 4), 0x20),
  ]);
  const trailing: number = (props.binChunks ?? []).reduce(
    (total: number, chunk: { length: number; type: number }): number =>
      total + 8 + chunk.length,
    0,
  );
  const output: Buffer<ArrayBuffer> = Buffer.alloc(
    20 + json.length + trailing + (props.trailingBytes ?? 0),
  );
  output.writeUInt32LE(props.magic ?? 0x46546c67, 0);
  output.writeUInt32LE(props.version ?? 2, 4);
  output.writeUInt32LE(props.declaredLength ?? output.length, 8);
  output.writeUInt32LE(props.jsonLength ?? json.length, 12);
  output.writeUInt32LE(props.jsonChunkType ?? 0x4e4f534a, 16);
  json.copy(output, 20);
  let cursor: number = 20 + json.length;
  for (const chunk of props.binChunks ?? []) {
    output.writeUInt32LE(chunk.length, cursor);
    output.writeUInt32LE(chunk.type, cursor + 4);
    cursor += 8 + chunk.length;
  }
  return output;
};

const inspect: (bytes: Uint8Array, path?: string) => void = (
  bytes: Uint8Array,
  path: string = "public/models/actor.glb",
): void => {
  inspectAutoMovieExternalModelBytes({
    path,
    bytes,
    profile: "gltf-static-v1",
  });
};

/**
 * GLB field refusals remain attributable to their owning boundary, with an accepted static mesh as the positive control.
 *
 * An external model arrives as opaque bytes from outside this project, so the container header is the first thing standing between a host's file and the ingest pipeline. Each refusal below names the exact field that disagrees -- the magic, the version, the declared length, the JSON chunk's alignment or type, a truncated or unaligned trailing chunk, a second BIN chunk, and JSON that is not decodable UTF-8 -- because an ingest failure that says only "invalid model" leaves the author with a hex editor and no lead.
 *
 * Scenarios:
 *
 * 1. Header: bytes shorter than the mandatory header, a wrong magic, a version other than 2, and a declared length that disagrees with the resident bytes.
 * 2. JSON chunk: a zero length, an unaligned length, a chunk type that is not JSON, and a length reaching past the container.
 * 3. Trailing chunks: a truncated header, an unaligned length, a chunk that is not BIN, and a second BIN chunk.
 * 4. Payload and profile: JSON that is not valid UTF-8, an unsupported profile, and a path whose extension names no container at all.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls static byte inspection first on a real mesh-bearing positive control and then on individually malformed container fields, requiring their owning diagnostics; an invalid baseline or unrelated profile error cannot validate the negative cases.
 * @evidence contracts/testing.md#independent-expectations Authored GLB magic/version/length/alignment/chunk types and explicit glTF mesh POSITION storage define independent accepted and refused boundaries, including invalid UTF-8.
 * @evidence contracts/testing.md#distinguishing-cases The positive mesh control accompanies short/wrong header fields, zero/unaligned JSON, truncated/unaligned/wrong/duplicate trailing chunks, invalid UTF-8, unsupported profile and unsupported extension; payload/rig semantics are owned by the byte and matrix units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_inspect_external_model_container entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_inspect_external_model_container(): void {
  const accepted: ReturnType<typeof inspectAutoMovieExternalModelBytes> =
    inspectAutoMovieExternalModelBytes({
      path: "public/models/actor.glb",
      bytes: container({}),
      profile: "gltf-static-v1",
    });
  TestValidator.predicate(
    "container control reaches static mesh admission",
    accepted.format === "glb" &&
      accepted.counts.meshes === 1 &&
      accepted.counts.nodes === 1,
  );
  const invalidUtf8: Buffer<ArrayBufferLike> = ((): Buffer => {
    const bytes: Buffer<ArrayBufferLike> = container({});
    bytes[21] = 0xff;
    return bytes;
  })();
  TestValidator.predicate(
    "an external model container is refused by the exact field that disagrees",
    test12ValuesClose(
      namedFacts([
        [
          "shorterThanHeader",
          (): boolean =>
            throwsError(
              (): void => inspect(Buffer.alloc(19)),
              "shorter than its mandatory header",
            ),
        ],
        [
          "wrongMagic",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ magic: 0x12345678 })),
              "invalid magic value",
            ),
        ],
        [
          "wrongVersion",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ version: 1 })),
              "container version 2 is supported",
            ),
        ],
        [
          "declaredLengthDisagrees",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ declaredLength: 999 })),
              "declared length does not match resident bytes",
            ),
        ],
        [
          "zeroJsonChunk",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ jsonLength: 0 })),
              "not one aligned JSON chunk",
            ),
        ],
        [
          "unalignedJsonChunk",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ jsonLength: 13 })),
              "not one aligned JSON chunk",
            ),
        ],
        [
          "jsonChunkTypeIsNotJson",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ jsonChunkType: 0x004e4942 })),
              "not one aligned JSON chunk",
            ),
        ],
        [
          "jsonChunkReachesPastContainer",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ jsonLength: 4096 })),
              "not one aligned JSON chunk",
            ),
        ],
        [
          "truncatedTrailingHeader",
          (): boolean =>
            throwsError(
              (): void => inspect(container({ trailingBytes: 4 })),
              "truncated chunk header",
            ),
        ],
        [
          "unalignedTrailingChunk",
          (): boolean =>
            throwsError(
              (): void =>
                inspect(
                  container({ binChunks: [{ length: 6, type: 0x004e4942 }] }),
                ),
              "unaligned or truncated chunk",
            ),
        ],
        [
          "trailingChunkIsNotBin",
          (): boolean =>
            throwsError(
              (): void =>
                inspect(
                  container({ binChunks: [{ length: 4, type: 0x4e4f534a }] }),
                ),
              "only one optional BIN chunk",
            ),
        ],
        [
          "secondBinChunk",
          (): boolean =>
            throwsError(
              (): void =>
                inspect(
                  container({
                    binChunks: [
                      { length: 4, type: 0x004e4942 },
                      { length: 4, type: 0x004e4942 },
                    ],
                  }),
                ),
              "only one optional BIN chunk",
            ),
        ],
        [
          "jsonIsNotUtf8",
          (): boolean =>
            throwsError((): void => inspect(invalidUtf8), "JSON is invalid"),
        ],
        [
          "unsupportedProfile",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.glb",
                  bytes: container({}),
                  profile: "sculpt-v9",
                }),
              "Unsupported external-model ingest profile",
            ),
        ],
        [
          "unknownExtension",
          (): boolean =>
            throwsError(
              (): void => inspect(container({}), "public/models/actor.fbx"),
              "must end in .gltf, .glb, or .vrm",
            ),
        ],
      ]),
      {
        shorterThanHeader: true,
        wrongMagic: true,
        wrongVersion: true,
        declaredLengthDisagrees: true,
        zeroJsonChunk: true,
        unalignedJsonChunk: true,
        jsonChunkTypeIsNotJson: true,
        jsonChunkReachesPastContainer: true,
        truncatedTrailingHeader: true,
        unalignedTrailingChunk: true,
        trailingChunkIsNotBin: true,
        secondBinChunk: true,
        jsonIsNotUtf8: true,
        unsupportedProfile: true,
        unknownExtension: true,
      },
    ),
  );
}
