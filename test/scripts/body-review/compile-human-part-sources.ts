/**
 * Compile every acquired anatomical surface into one shared atlas metre frame.
 *
 * From test/: pnpm exec ttsx -P tsconfig.scripts.json
 * scripts/body-review/compile-human-part-sources.ts INVENTORY RAW_DIRECTORY OUTPUT
 *
 * The inventory comes from actual closed part declarations and archive membership.
 * Source files retain independent identities, disconnected subdivisions and rights
 * notices. A single right-handed (x,z,-y)/1000 conversion preserves all relative
 * source positions. No per-part bbox translation, personal fitting, inferred
 * joint centre, clinical certification or body generation publication occurs.
 * The downstream shared rest graph owns source-to-body registration and motion;
 * these surfaces are its acquired inputs, not completed body/person outputs.
 */
import {
  inspectAutoMovieMeshTopology,
  validateMeshTopology,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import typia from "typia";

import type { IHumanBodyPartSourceInventory } from "./IHumanBodyPartSourceInventory";
import { readHumanBodyAtlasObj } from "./readHumanBodyAtlasObj";

const [inventoryFile, rawDirectory, output] = process.argv.slice(2);
if (!inventoryFile || !rawDirectory || !output)
  throw new Error("Expected INVENTORY RAW_DIRECTORY OUTPUT.");
const inventoryBytes = fs.readFileSync(inventoryFile);
const inventory = typia.assert<IHumanBodyPartSourceInventory>(
  JSON.parse(inventoryBytes.toString("utf8")),
);
if (
  new Set(inventory.parts.map((part) => part.id)).size !==
  inventory.parts.length
)
  throw new Error("Anatomical source inventory repeats a declared part.");
fs.mkdirSync(output, { recursive: true });
const meshes = new Map<string, IAutoMovieMesh>();
const meshReceipts = [];
const parts = [];
const missing = [];
for (const part of inventory.parts) {
  const sources = part.actualAcquiredFiles ?? [];
  if (sources.length === 0) {
    missing.push({
      id: part.id,
      reason: "acquired-source-unavailable",
      nextOwner: "offline-anatomical-authoring",
    });
    continue;
  }
  const sourceIds = new Set<string>();
  for (const source of sources) {
    if (sourceIds.has(source.file)) continue;
    sourceIds.add(source.file);
    const bytes = fs.readFileSync(
      path.join(rawDirectory, source.file + ".obj"),
    );
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== source.sha256)
      throw new Error(
        "Anatomical source bytes changed: " + part.id + "/" + source.file,
      );
    const text = bytes.toString("utf8");
    if (
      !text.includes("# File ID : " + source.file) ||
      source.sourceHeader.some((line) => !text.includes(line))
    )
      throw new Error(
        "Anatomical source identity/header changed: " + source.file,
      );
    if (meshes.has(source.file)) continue;
    const original = readHumanBodyAtlasObj(text);
    if (
      original.positions.length / 3 !== source.vertices ||
      original.indices!.length / 3 !== source.triangles
    )
      throw new Error("Anatomical source population changed: " + source.file);
    const convert = (values: number[], scale: number): number[] => {
      const converted: number[] = [];
      for (let at = 0; at < values.length; at += 3)
        converted.push(
          values[at] * scale,
          values[at + 2] * scale,
          -values[at + 1] * scale,
        );
      return converted;
    };
    const normals = convert(original.normals!, 1);
    for (let at = 0; at < normals.length; at += 3) {
      const length = Math.hypot(normals[at], normals[at + 1], normals[at + 2]);
      if (!(length > 0))
        throw new Error("Anatomical source has zero normal: " + source.file);
      normals[at] /= length;
      normals[at + 1] /= length;
      normals[at + 2] /= length;
    }
    const mesh: IAutoMovieMesh = {
      ...original,
      positions: convert(original.positions, 0.001),
      normals,
    };
    const json = JSON.stringify(mesh);
    const meshSha256 = createHash("sha256").update(json).digest("hex");
    fs.writeFileSync(
      path.join(output, source.file + ".mesh.json.gz"),
      gzipSync(json),
    );
    const reloaded = JSON.parse(
      gunzipSync(
        fs.readFileSync(path.join(output, source.file + ".mesh.json.gz")),
      ).toString("utf8"),
    );
    if (
      createHash("sha256").update(JSON.stringify(reloaded)).digest("hex") !==
      meshSha256
    )
      throw new Error("Compiled source readback differs: " + source.file);
    meshes.set(source.file, mesh);
    const topology = inspectAutoMovieMeshTopology(mesh);
    const validation = validateMeshTopology({ mesh, expectClosed: true });
    meshReceipts.push({
      ...source,
      meshSha256,
      frame: "atlas-neutral-metres-x-z-minus-y",
      handedness:
        "right-handed determinant +1; original oriented index triples retained",
      normalProtocol: "normalize-rounded-original-directions",
      topology,
      closedSurfaceValidation: validation,
      admission: validation.success
        ? "closed-source-surface"
        : "source-topology-refused-before-solid-generation",
    });
  }
  parts.push({
    id: part.id,
    family: part.family,
    sourceFiles: [...sourceIds],
    qualification: "acquired-atlas-reference-only",
    clinical: "unavailable",
  });
}
const receipt = {
  version: 1,
  inventorySha256: createHash("sha256").update(inventoryBytes).digest("hex"),
  coordinateProtocol:
    "one common (x,z,-y)/1000 rigid axis/unit conversion; no per-part translation",
  rights: {
    currentLicense: "CC-BY-4.0",
    currentLicenseUri:
      "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
    embeddedNotice: "preserved per original file; CC-BY-SA-2.1-JP",
    acquisition:
      "BodyParts3D 4.0 MRI-derived illustrator atlas, not a personal scan",
  },
  declaredParts: inventory.parts.length,
  acquiredParts: parts.length,
  sourceFiles: meshReceipts,
  parts,
  missing,
  consumerQualification:
    "shared-rig registration and body/person/editor/export not yet consumed",
};
fs.writeFileSync(
  path.join(output, "source-receipt.json"),
  JSON.stringify(receipt, null, 2),
);
process.stdout.write(
  JSON.stringify({
    declaredParts: inventory.parts.length,
    acquiredParts: parts.length,
    actualSourceFiles: meshes.size,
    missing: missing.length,
  }) + "\n",
);
