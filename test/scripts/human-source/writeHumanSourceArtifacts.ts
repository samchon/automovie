import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";
import type { IHumanSourceP1 } from "./structures/IHumanSourceP1.ts";
import type { IHumanSourcePersonViews } from "./structures/IHumanSourcePersonViews.ts";
import type { IHumanSourceReproductionReport } from "./structures/IHumanSourceReproductionReport.ts";
import type { IHumanSourceSampleFile } from "./structures/IHumanSourceSampleFile.ts";

/**
 * Write one compiled generation into a new directory: the one-skin bundle,
 * the P1 basis pair, the person generation's head and body views (the files
 * the product consumes), the reproduction record and its per-row TSV, then a
 * manifest of every written file's bytes and SHA-256. Gzip uses level 9 with
 * no timestamp so equal content yields equal bytes. An existing directory is
 * refused so outputs of different runs never mix.
 */
export function writeHumanSourceArtifacts(
  output: string,
  generation: IHumanSourceGeneration,
  p1: IHumanSourceP1,
  views: IHumanSourcePersonViews,
  report: IHumanSourceReproductionReport,
): Record<string, IHumanSourceSampleFile> {
  if (fs.existsSync(output)) throw new Error(`Compile output already exists: ${output}`);
  fs.mkdirSync(output, { recursive: true });
  const gzip = (name: string, value: unknown): void =>
    fs.writeFileSync(path.join(output, name), zlib.gzipSync(JSON.stringify(value) + "\n", { level: 9 }));
  gzip("g1-generation.json.gz", generation);
  gzip("p1-face-basis.json.gz", p1.face);
  gzip("p1-body-basis.json.gz", p1.body);
  gzip("head.json.gz", views.head);
  gzip("body.json.gz", views.body);
  fs.writeFileSync(path.join(output, "reproduction.json"), JSON.stringify(report, null, 1) + "\n");
  const number = (x: number | undefined): string => (x === undefined ? "" : x === 0 ? "0" : x.toExponential(3));
  const lines = [
    [
      "basis", "surface", "row", "role", "provenance", "recipe",
      "regen_max_m", "regen_rms_m", "regen_f32_max_m", "regen_differing",
      "p2_max_m", "p2_f32_max_m", "p1_max_m", "p1_f32_max_m", "p1_differing",
      "new_support", "note",
    ].join("\t"),
    ...report.rows.map((r) =>
      [
        r.basis, r.surface, r.row, r.role, r.provenance, r.recipe ?? "",
        number(r.regeneration?.maximumMetres), number(r.regeneration?.rmsMetres),
        number(r.regeneration?.float32MaximumMetres), r.regeneration?.differingVertices ?? "",
        number(r.p2?.maximumMetres), number(r.p2?.float32MaximumMetres),
        number(r.p1?.maximumMetres), number(r.p1?.float32MaximumMetres), r.p1?.differingVertices ?? "",
        r.newSupport, r.note,
      ].join("\t"),
    ),
  ];
  fs.writeFileSync(path.join(output, "reproduction-rows.tsv"), lines.join("\n") + "\n");
  const files: Record<string, IHumanSourceSampleFile> = {};
  for (const name of fs.readdirSync(output).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))) {
    const data = fs.readFileSync(path.join(output, name));
    files[name] = { bytes: data.length, sha256: crypto.createHash("sha256").update(data).digest("hex") };
  }
  return files;
}
