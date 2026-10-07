import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import type { IHumanSourceFaceProjectionReceipt } from "./structures/IHumanSourceFaceProjectionReceipt.ts";

/**
 * Project the exact ordinary face basis from a compiled head into a new gzip.
 *
 * The face is serialized unchanged: its source identity, canonical frame,
 * arrays, endpoints, materials, registrations and qualifications are retained.
 * This is an asset representation projection, with no resolver, generation
 * recomputation, pose request or geometric authoring. Gzip follows the source
 * producer's level-nine, timestamp-free encoding. The original head is read
 * only and an existing destination or receipt refuses before any write.
 *
 * The normal FaceBasis consumer still owns admission of this artifact and its
 * numerical document. Its isolated observations do not complete the omitted
 * person's body, shared-control alias/driver transport or neck assembly.
 */
export function exportHumanSourceFaceProjection(
  headFile: string,
  faceFile: string,
): IHumanSourceFaceProjectionReceipt {
  const receiptFile = `${faceFile}.receipt.json`;
  if (fs.existsSync(faceFile) || fs.existsSync(receiptFile))
    throw new Error(
      "Source face projection needs a new destination and receipt.",
    );
  const headBytes = fs.readFileSync(headFile);
  const head = JSON.parse(
    zlib.gunzipSync(headBytes).toString("utf8"),
  ) as IAutoMovieHumanPersonHeadView;
  if (
    typeof head.id !== "string" ||
    head.id.length === 0 ||
    head.face === undefined ||
    typeof head.face.id !== "string" ||
    head.face.id.length === 0 ||
    !Array.isArray(head.face.surfaces)
  )
    throw new Error(
      "Source face projection needs an actual compiled person head view.",
    );
  for (const surface of head.face.surfaces)
    if (
      surface.sourcePartition !== undefined &&
      surface.sourcePartition.generation !== head.id
    )
      throw new Error(
        "Source face projection has a partition from another generation.",
      );
  const faceJson = JSON.stringify(head.face) + "\n";
  const faceBytes = zlib.gzipSync(faceJson, { level: 9 });
  const sha = (value: Buffer | string): string =>
    crypto.createHash("sha256").update(value).digest("hex");
  const receipt: IHumanSourceFaceProjectionReceipt = {
    generation: head.id,
    face: head.face.id,
    headSha256: sha(headBytes),
    faceJsonSha256: sha(faceJson),
    faceGzipSha256: sha(faceBytes),
    faceGzipBytes: faceBytes.length,
    qualification:
      "Exact head.face content projection in its original canonical frame; isolated face admission/rendering and whole-person shared-control/neck/body acceptance remain separate.",
  };
  publishHumanSourceFiles({
    directory: path.dirname(path.resolve(faceFile)),
    authorityName: `${path.basename(faceFile)}.publication.json`,
    generation: head.id,
    completeGeneration: false,
    inspectionOnly: true,
    files: new Map<string, string | Uint8Array>([
      [path.basename(faceFile), faceBytes],
      [path.basename(receiptFile), JSON.stringify(receipt, null, 1) + "\n"],
    ]),
    verifyInputs: () => {
      if (sha(fs.readFileSync(headFile)) !== receipt.headSha256)
        throw new Error(
          "Source face projection input changed during publication.",
        );
    },
  });
  return receipt;
}
