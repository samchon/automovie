import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularSide } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularSide";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProtectedHairDomains } from "./readHumanSourceProtectedHairDomains.ts";
import { registerHumanSourceFacialHairDomains } from "./registerHumanSourceFacialHairDomains.ts";
import type { IHumanSourceFaceMetadataProjectionReceipt } from "./structures/IHumanSourceFaceMetadataProjectionReceipt.ts";

/**
 * Put one compiled face attachment registration into its original head host.
 * Exact serialized equality after removing only attachment-chart and native
 * displacement, clipped medial material, skin courses and source-authored
 * terminal-growth registrations proves
 * every other face value is unchanged. All head fields are
 * preserved directly, including id, aliases, drivers and headSkin. Input
 * bytes remain immutable and a fresh destination is required. This metadata
 * representation candidate is not a new root generation, geometry bake,
 * admitted person, or publication to tracked source assets.
 */
export function projectHumanSourceFaceMetadata(
  headFile: string,
  faceFile: string,
  outputFile: string,
): IHumanSourceFaceMetadataProjectionReceipt {
  const receiptFile = `${outputFile}.receipt.json`;
  if (fs.existsSync(outputFile) || fs.existsSync(receiptFile))
    throw new Error("Head metadata projection needs a new destination.");
  const headBytes = fs.readFileSync(headFile),
    faceBytes = fs.readFileSync(faceFile);
  const head = JSON.parse(
    zlib.gunzipSync(headBytes).toString("utf8"),
  ) as IAutoMovieHumanPersonHeadView;
  const face = JSON.parse(
    zlib.gunzipSync(faceBytes).toString("utf8"),
  ) as IAutoMovieHumanFaceBasis;
  if (
    head.id.trim() === "" ||
    head.face.id !== face.id ||
    face.periocular === undefined ||
    head.face.periocular === undefined
  )
    throw new Error(
      "Head metadata projection requires the original face identity and registered source generation.",
    );
  for (const side of ["left", "right"] as const) {
    const cage = face.periocular[side].cage;
    if (
      cage?.generation !== head.id ||
      cage.attachmentCharts === undefined ||
      [cage.attachmentCharts.upper, cage.attachmentCharts.lower].some(
        (chart) =>
          chart.generation !== head.id || chart.surface !== cage.surface,
      )
    )
      throw new Error(
        "Head metadata projection has no complete same-source attachment registration.",
      );
    if (
      cage.displacementPatch !== undefined &&
      (cage.displacementPatch.generation !== head.id ||
        cage.displacementPatch.surface !== cage.surface)
    )
      throw new Error(
        "Head metadata projection has a different-source native displacement registration.",
      );
    if (
      cage.medialBed?.materialPatch !== undefined &&
      (cage.medialBed.materialPatch.generation !== head.id ||
        cage.medialBed.materialPatch.surface !== cage.surface)
    )
      throw new Error(
        "Head metadata projection has a different-source medial material registration.",
      );
  }
  for (const surface of face.surfaces)
    for (const chart of Object.values(surface.materialCharts ?? {}))
      if (chart.generation !== surface.sourcePartition?.generation ||
          chart.surface !== surface.id)
        throw new Error("Head metadata projection has a different-source skin course disk.");
  // Verify every existing terminal territory against this actual source before
  // excluding that owned registration from the preserved-content comparison.
  // Legacy attachment-only candidates have no terminal registration to verify.
  const facialRegistered = face.surfaces.some((surface) =>
    surface.hairDomains?.some((domain) => domain.facialHairSite !== undefined),
  );
  if (!facialRegistered && head.face.surfaces.some((surface) =>
    surface.hairDomains?.some((domain) => domain.facialHairSite !== undefined),
  )) throw new Error("Head metadata projection cannot retire existing terminal growth registrations.");
  if (facialRegistered) registerHumanSourceFacialHairDomains(face);
  const stripSide = (
    side: IAutoMovieHumanFacePeriocularSide,
  ): IAutoMovieHumanFacePeriocularSide => ({
    ...side,
    cage:
      side.cage === undefined
        ? undefined
        : {
            ...side.cage,
            attachmentCharts: undefined,
            displacementPatch: undefined,
            medialBed:
              side.cage.medialBed === undefined
                ? undefined
                : { ...side.cage.medialBed, materialPatch: undefined },
          },
  });
  const preserved = (value: IAutoMovieHumanFaceBasis): string =>
    JSON.stringify({
      ...value,
      surfaces: value.surfaces.map((surface) => ({
        ...surface,
        materialCharts: undefined,
        hairDomains: readHumanSourceProtectedHairDomains(surface),
      })),
      periocular:
        value.periocular === undefined
          ? undefined
          : {
              ...value.periocular,
              left: stripSide(value.periocular.left),
              right: stripSide(value.periocular.right),
            },
    });
  const original = preserved(head.face),
    candidate = preserved(face);
  if (original !== candidate)
    throw new Error(
      "Face metadata candidate changed geometry, weights, fields, material, or another non-registration face value.",
    );
  const sha = (value: Buffer | string): string =>
    crypto.createHash("sha256").update(value).digest("hex");
  if (
    sha(fs.readFileSync(headFile)) !== sha(headBytes) ||
    sha(fs.readFileSync(faceFile)) !== sha(faceBytes)
  )
    throw new Error(
      "Head metadata projection input changed during processing.",
    );
  const outputBytes = zlib.gzipSync(JSON.stringify({ ...head, face }) + "\n", {
    level: 9,
  });
  const receipt: IHumanSourceFaceMetadataProjectionReceipt = {
    generation: head.id,
    face: face.id,
    originalHeadSha256: sha(headBytes),
    metadataFaceSha256: sha(faceBytes),
    preservedFaceContentSha256: sha(original),
    outputHeadSha256: sha(outputBytes),
    outputHeadBytes: outputBytes.length,
    qualification:
      "Lossless host-owned face attachment/displacement/medial material/skin-course metadata projection. Root geometry, weights, all non-registration face content including legacy bed counts/vertices, original untagged scalp domains and head identity/aliases/drivers/headSkin are preserved. Source terminal territories are independently recomputed and verified; their clinical population is unknown. Full source generation, whole-person admission and GPU/export acceptance remain separate.",
  };
  publishHumanSourceFiles({
    directory: path.dirname(path.resolve(outputFile)),
    authorityName: `${path.basename(outputFile)}.publication.json`,
    generation: head.id,
    completeGeneration: false,
    inspectionOnly: true,
    files: new Map<string, string | Uint8Array>([
      [path.basename(outputFile), outputBytes],
      [path.basename(receiptFile), JSON.stringify(receipt, null, 1) + "\n"],
    ]),
    verifyInputs: () => {
      if (
        sha(fs.readFileSync(headFile)) !== sha(headBytes) ||
        sha(fs.readFileSync(faceFile)) !== sha(faceBytes)
      )
        throw new Error(
          "Head metadata projection input changed during publication.",
        );
    },
  });
  return receipt;
}
