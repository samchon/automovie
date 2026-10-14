/**
 * Rebuild the website's derived transports directly from the three native production producers before dev or build. Output lives in an ignored public directory and is regenerated every time, never used as authored model input. Gzip retains serialized mesh precision while reducing the download; textures retain production-relative names. SHA-256 covers the current native JSON and sorted immediate texture filenames/bytes for ancient/modern, with future texture bytes already inside the native payload. This digest is transport provenance rather than a source-tree or visual-equivalence proof. Copying does not remove obsolete output textures from a prior run.
 */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import type { Hash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

import {
  type AncientSource,
  type FutureSource,
  type ModernSource,
  exportTourData,
} from "../src/tourExport";
import type { Building, TourData } from "../src/tourData";

const require: NodeJS.Require = createRequire(import.meta.url);
const root: string = resolve(import.meta.dirname, "../..");
const definitions: readonly (readonly [Building, string])[] = [
  ["ancient", "ancient-civic-temple"],
  ["modern", "modern-suburban-house"],
  ["future", "future-citizen-house"],
] as const;

for (const [building, directory] of definitions) {
  const production: string = resolve(root, "experimental", directory);
  let data: TourData;
  if (building === "ancient") {
    const producer: { createViewerPayload(): AncientSource } = require(resolve(production, "src/viewer/payload.ts")) as {
      createViewerPayload(): AncientSource;
    };
    data = exportTourData({ building, native: producer.createViewerPayload() });
  } else if (building === "modern") {
    const producer: { buildHouseScene(basis: string): ModernSource } = require(
      resolve(production, "src/viewer/buildHouseScene.ts"),
    ) as { buildHouseScene(basis: string): ModernSource };
    data = exportTourData({
      building,
      native: producer.buildHouseScene("website"),
    });
  } else {
    const producer: { createViewerPayload(): FutureSource } = require(resolve(production, "src/viewer/payload.ts")) as {
      createViewerPayload(): FutureSource;
    };
    data = exportTourData({ building, native: producer.createViewerPayload() });
  }
  const hash: Hash = createHash("sha256").update(JSON.stringify(data.native));
  if (building !== "future")
    for (const file of readdirSync(
      resolve(production, "public/textures"),
    ).sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0))
      hash
        .update(file)
        .update(readFileSync(resolve(production, "public/textures", file)));
  const basis: string = hash.digest("hex");
  const output: string = resolve(root, "website/public/buildings", building);
  mkdirSync(output, { recursive: true });
  writeFileSync(
    resolve(output, "scene.bin"),
    gzipSync(JSON.stringify({ ...data, basis })),
  );
  if (building !== "future")
    cpSync(
      resolve(production, "public/textures"),
      resolve(output, "textures"),
      { recursive: true },
    );
  console.log(
    `${data.title}: ${data.views.length} authored views exported (${basis.slice(0, 12)})`,
  );
}
