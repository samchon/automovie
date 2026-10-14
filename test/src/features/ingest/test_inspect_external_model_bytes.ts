import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * External model inspection binds exact containers, profiles and sidecars.
 *
 * Scenarios:
 *
 * 1. A JSON glTF resolves its exact inventory, sidecar bytes and static profile.
 * 2. A VRM accepts mandatory space padding while a GLB rejects NUL padding, pinning the glTF 2.0 JSON chunk boundary.
 * 3. A humanoid glTF resolves a weighted skin joint.
 * 4. Truncated containers, unknown profiles, absent rigs, short resources, missing BIN payloads and unweighted humanoid joints are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resident byte inspection across glTF/GLB/VRM and profiles, observing inventory/resources/weighted hips or refusal; incorrect container padding, ignored sidecars or invented rigs fail.
 * @evidence contracts/testing.md#independent-expectations The authored buffer layout, exact resource lengths, scene inventory and weighted joint define observations; GLB 2.0 requires space-padded JSON, contrasting the explicit NUL twin.
 * @evidence contracts/testing.md#distinguishing-cases Accepted static/humanoid/VRM inputs contrast truncated containers, unknown profiles, absent rigs, short resources, missing BIN and unweighted joints; detailed header diagnostics and motion adoption are owned separately.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_inspect_external_model_bytes entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_inspect_external_model_bytes(): void {
  const source: ReturnType<typeof modelDocument> = modelDocument();
  const gltf: Buffer<ArrayBuffer> = Buffer.from(JSON.stringify(source), "utf8");
  const inspection: import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =
    inspectAutoMovieExternalModelBytes({
      path: "public/models/actor.gltf",
      bytes: gltf,
      profile: "gltf-static-v1",
      resolveResource: (uri: string): Buffer<ArrayBufferLike> | null =>
        uri === "actor.bin"
          ? modelPayload()
          : uri === "actor.png"
            ? Buffer.from([1])
            : null,
    });
  TestValidator.predicate(
    "glTF inventory",
    test12ValuesClose(inspection, {
      profile: "gltf-static-v1",
      format: "gltf",
      version: "2.0",
      counts: { nodes: 2, meshes: 1, skins: 1, animations: 0 },
      extensions: [],
      resources: [
        { uri: "actor.bin", kind: "buffer", byteLength: 60 },
        { uri: "actor.png", kind: "image", byteLength: null },
      ],
      humanoidBones: [],
    }),
  );

  const vrm: Buffer<ArrayBufferLike> = glb({
    ...source,
    extensionsUsed: ["VRMC_vrm"],
    extensions: {
      VRMC_vrm: {
        specVersion: "1.0",
        humanoid: { humanBones: { hips: { node: 1 } } },
      },
    },
  });
  TestValidator.predicate(
    "VRM container/profile is parsed from resident bytes",
    inspectAutoMovieExternalModelBytes({
      path: "public/models/actor.vrm",
      bytes: vrm,
      profile: "vrm-humanoid-v1",
      resolveResource: (uri: string): Buffer<ArrayBufferLike> | null =>
        uri === "actor.bin"
          ? modelPayload()
          : uri === "actor.png"
            ? Buffer.from([1])
            : null,
    }).format === "vrm",
  );
  const inspectStaticGlb: (
    paddingByte: number,
  ) => import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection = (
    paddingByte: number,
  ): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
    inspectAutoMovieExternalModelBytes({
      path: "public/models/actor.glb",
      bytes: glb(source, paddingByte),
      profile: "gltf-static-v1",
      resolveResource: (uri: string): Buffer<ArrayBufferLike> | null =>
        uri === "actor.bin"
          ? modelPayload()
          : uri === "actor.png"
            ? Buffer.from([1])
            : null,
    });
  TestValidator.predicate(
    "GLB JSON chunks accept mandatory space padding",
    test12ValuesClose(inspectStaticGlb(0x20).format, "glb"),
  );
  let nulPaddingError: string | null = null;
  try {
    inspectStaticGlb(0x00);
  } catch (error) {
    nulPaddingError = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(
    "GLB JSON chunks reject NUL instead of mandatory space padding",
    nulPaddingError?.startsWith("External model JSON is invalid:") === true,
  );
  TestValidator.predicate(
    "humanoid glTF profile resolves a skin joint",
    inspectAutoMovieExternalModelBytes({
      path: "public/models/actor.gltf",
      bytes: gltf,
      profile: "gltf-humanoid-v1",
      resolveResource: (uri: string): Buffer<ArrayBufferLike> | null =>
        uri === "actor.bin"
          ? modelPayload()
          : uri === "actor.png"
            ? Buffer.from([1])
            : null,
    }).humanoidBones.some(
      (mapping: {
        bone: import("@automovie/interface").AutoMovieHumanoidBone;
        node: number;
        weighted: boolean;
      }): boolean =>
        mapping.bone === "hips" && mapping.node === 1 && mapping.weighted,
    ),
  );
  TestValidator.predicate(
    "malformed bytes, unsupported profiles and missing rigs are refused",
    test12ValuesClose(
      namedFacts([
        [
          "truncatedGlbLength",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.glb",
                  bytes: vrm.subarray(0, vrm.length - 1),
                  profile: "vrm-humanoid-v1",
                }),
              "GLB declared length does not match resident bytes.",
            ),
        ],
        [
          "unsupportedProfile",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.gltf",
                  bytes: gltf,
                  profile: "future-profile",
                }),
              "Unsupported external-model ingest profile",
            ),
        ],
        [
          "missingHumanoidRig",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.gltf",
                  bytes: Buffer.from(
                    JSON.stringify({
                      ...source,
                      nodes: [{ mesh: 0, name: "Actor" }],
                      skins: undefined,
                      scenes: [{ nodes: [0] }],
                    }),
                  ),
                  profile: "gltf-humanoid-v1",
                  resolveResource: (uri: string): Buffer<ArrayBufferLike> =>
                    uri === "actor.bin" ? modelPayload() : Buffer.from([1]),
                }),
              'Profile "gltf-humanoid-v1" requires a skin and a normalized hips/pelvis joint.',
            ),
        ],
        [
          "shortBufferSidecar",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.gltf",
                  bytes: gltf,
                  profile: "gltf-static-v1",
                  resolveResource: (uri: string): Buffer<ArrayBuffer> =>
                    uri === "actor.bin" ? Buffer.alloc(1) : Buffer.from([1]),
                }),
              'External buffer "actor.bin" has 1 bytes, not declared byteLength 60.',
            ),
        ],
        [
          "missingBinPayload",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.glb",
                  bytes: glb({
                    ...source,
                    buffers: [{ byteLength: 60 }],
                    images: [],
                  }),
                  profile: "gltf-static-v1",
                }),
              "buffers[0] declares 60 bytes but the GLB has no BIN chunk.",
            ),
        ],
        [
          "zeroSkinInfluences",
          (): boolean =>
            throwsError(
              (): import("../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection =>
                inspectAutoMovieExternalModelBytes({
                  path: "public/models/actor.gltf",
                  bytes: gltf,
                  profile: "gltf-humanoid-v1",
                  resolveResource: (uri: string): Buffer<ArrayBuffer> =>
                    uri === "actor.bin" ? Buffer.alloc(60) : Buffer.from([1]),
                }),
              "Skinned primitive 0:0 vertex 0 has no positive skin weight.",
            ),
        ],
      ]),
      {
        truncatedGlbLength: true,
        unsupportedProfile: true,
        missingHumanoidRig: true,
        shortBufferSidecar: true,
        missingBinPayload: true,
        zeroSkinInfluences: true,
      },
    ),
  );
}

const modelDocument: () => {
  asset: { version: string };
  buffers: { byteLength: number; uri: string }[];
  bufferViews: { buffer: number; byteOffset: number; byteLength: number }[];
  accessors: (
    | {
        bufferView: number;
        componentType: number;
        count: number;
        type: string;
        normalized?: undefined;
      }
    | {
        bufferView: number;
        componentType: number;
        normalized: boolean;
        count: number;
        type: string;
      }
  )[];
  images: { uri: string }[];
  meshes: {
    primitives: {
      attributes: { POSITION: number; JOINTS_0: number; WEIGHTS_0: number };
    }[];
  }[];
  nodes: (
    | { mesh: number; skin: number; name: string }
    | { name: string; mesh?: undefined; skin?: undefined }
  )[];
  skins: { joints: number[] }[];
  scenes: { nodes: number[] }[];
} = (): {
  asset: { version: string };
  buffers: { byteLength: number; uri: string }[];
  bufferViews: { buffer: number; byteOffset: number; byteLength: number }[];
  accessors: (
    | {
        bufferView: number;
        componentType: number;
        count: number;
        type: string;
        normalized?: undefined;
      }
    | {
        bufferView: number;
        componentType: number;
        normalized: boolean;
        count: number;
        type: string;
      }
  )[];
  images: { uri: string }[];
  meshes: {
    primitives: {
      attributes: { POSITION: number; JOINTS_0: number; WEIGHTS_0: number };
    }[];
  }[];
  nodes: (
    | { mesh: number; skin: number; name: string }
    | { name: string; mesh?: undefined; skin?: undefined }
  )[];
  skins: { joints: number[] }[];
  scenes: { nodes: number[] }[];
} => ({
  asset: { version: "2.0" },
  buffers: [{ byteLength: 60, uri: "actor.bin" }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: 36 },
    { buffer: 0, byteOffset: 36, byteLength: 12 },
    { buffer: 0, byteOffset: 48, byteLength: 12 },
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: "VEC3",
    },
    {
      bufferView: 1,
      componentType: 5121,
      count: 3,
      type: "VEC4",
    },
    {
      bufferView: 2,
      componentType: 5121,
      normalized: true,
      count: 3,
      type: "VEC4",
    },
  ],
  images: [{ uri: "actor.png" }],
  meshes: [
    {
      primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }],
    },
  ],
  nodes: [{ mesh: 0, skin: 0, name: "Actor" }, { name: "Hips" }],
  skins: [{ joints: [1] }],
  scenes: [{ nodes: [0, 1] }],
});

const modelPayload: () => Buffer = (): Buffer => {
  const bytes: Buffer<ArrayBuffer> = Buffer.alloc(60);
  for (let vertex: number = 0; vertex < 3; ++vertex)
    bytes[48 + vertex * 4] = 255;
  return bytes;
};

const glb: (document: object, paddingByte?: number) => Buffer = (
  document: object,
  paddingByte: number = 0x20,
): Buffer => {
  const source: Buffer<ArrayBuffer> = Buffer.from(
    JSON.stringify(document),
    "utf8",
  );
  const padding: number = 4 - (source.length % 4);
  const json: Buffer<ArrayBuffer> = Buffer.concat([
    source,
    Buffer.alloc(padding, paddingByte),
  ]);
  const output: Buffer<ArrayBuffer> = Buffer.alloc(20 + json.length);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(json.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  json.copy(output, 20);
  return output;
};
