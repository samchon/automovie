/**
 * Rebuild the website's derived transports directly from the three native
 * production producers before dev or build. Output lives in an ignored public
 * directory and is regenerated every time, never used as authored model input.
 * Gzip keeps the original mesh precision while reducing the download. Image
 * files keep their production-relative names beneath each building directory.
 * SHA-256 of the native payload and external textures embeds the source basis.
 */
import { createHash } from "node:crypto";
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

const root = resolve(__dirname, "../..");
const definitions = [
  ["ancient", "ancient-civic-temple"],
  ["modern", "modern-suburban-house"],
  ["future", "future-citizen-house"],
] as const;

for (const [building, directory] of definitions) {
  const production = resolve(root, "experimental", directory);
  let data;
  if (building === "ancient") {
    const producer = require(resolve(production, "src/viewer/payload.ts")) as {
      createViewerPayload(): AncientSource;
    };
    data = exportTourData({ building, native: producer.createViewerPayload() });
  } else if (building === "modern") {
    const producer = require(
      resolve(production, "src/viewer/houseScene.cts"),
    ) as { buildHouseScene(basis: string): ModernSource };
    data = exportTourData({
      building,
      native: producer.buildHouseScene("website"),
    });
  } else {
    const producer = require(resolve(production, "src/viewer/payload.ts")) as {
      createViewerPayload(): FutureSource;
    };
    data = exportTourData({ building, native: producer.createViewerPayload() });
  }
  const hash = createHash("sha256").update(JSON.stringify(data.native));
  if (building !== "future")
    for (const file of readdirSync(
      resolve(production, "public/textures"),
    ).sort())
      hash
        .update(file)
        .update(readFileSync(resolve(production, "public/textures", file)));
  const basis = hash.digest("hex");
  const output = resolve(root, "website/public/buildings", building);
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
