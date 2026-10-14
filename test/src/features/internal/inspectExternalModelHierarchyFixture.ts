import {
  type AutoMovieExternalModelIngestProfile,
  type IAutoMovieExternalModelInspection,
  inspectAutoMovieExternalModelBytes,
} from "@automovie/ingest";

import type { IExternalModelHierarchyFixture } from "./IExternalModelHierarchyFixture";

/** Inspect the existing resident declarations through the selected profile, wrapping the unchanged JSON in GLB only for VRM. */
export const inspectExternalModelHierarchyFixture: (
  fixture: IExternalModelHierarchyFixture,
  profile: AutoMovieExternalModelIngestProfile,
) => IAutoMovieExternalModelInspection = (
  fixture: IExternalModelHierarchyFixture,
  profile: AutoMovieExternalModelIngestProfile,
): IAutoMovieExternalModelInspection => {
  const vrm: boolean = profile === "vrm-humanoid-v1";
  const document: IExternalModelHierarchyFixture["document"] & {
    /** VRM extension names added only for the existing VRM profile case. */
    extensionsUsed?: string[];

    /** VRM 1.0 hips mapping used by that case. */
    extensions?: {
      VRMC_vrm: {
        specVersion: string;
        humanoid: { humanBones: { hips: { node: number } } };
      };
    };
  } = vrm
    ? {
        ...fixture.document,
        extensionsUsed: ["VRMC_vrm"],
        extensions: {
          VRMC_vrm: {
            specVersion: "1.0",
            humanoid: { humanBones: { hips: { node: 1 } } },
          },
        },
      }
    : fixture.document;
  const json: Buffer = Buffer.from(JSON.stringify(document), "utf8");
  return inspectAutoMovieExternalModelBytes({
    path: vrm ? "public/models/actor.vrm" : "public/models/actor.gltf",
    bytes: vrm ? glb(json) : json,
    profile,
    resolveResource: (): Buffer => fixture.payload,
  });
};

/** Encode the original single-JSON-chunk GLB container with space padding. */
const glb: (json: Buffer) => Buffer = (json: Buffer): Buffer => {
  const paddedLength: number = Math.ceil(json.length / 4) * 4;
  const bytes: Buffer = Buffer.alloc(20 + paddedLength, 0x20);
  bytes.writeUInt32LE(0x46546c67, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(paddedLength, 12);
  bytes.writeUInt32LE(0x4e4f534a, 16);
  json.copy(bytes, 20);
  return bytes;
};
