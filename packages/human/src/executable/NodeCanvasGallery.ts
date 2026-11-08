import fs from "node:fs/promises";
import path from "node:path";

import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanNodePaths } from "./HumanNodePaths";

/** Links completed actual comparison images without rendering, copying or changing their bytes. */
export async function NodeCanvasGallery(directory: string): Promise<void> {
  const task: string = await fs.realpath(
    HumanNodePaths.resolve("packages/human/.shots/node_canvas_xhigh"),
  );
  const packet: string = await fs.realpath(path.resolve(directory));
  if (!packet.startsWith(task + path.sep))
    throw new Error("Gallery packet is outside the verified task directory");
  const manifest: unknown = JSON.parse(
    await fs.readFile(path.join(packet, "manifest.json"), "utf8"),
  );
  if (
    !isRecord(manifest) ||
    !isRecord(manifest.source) ||
    !Array.isArray(manifest.source.vitePairs) ||
    !Array.isArray(manifest.frames)
  )
    throw new Error("Completed packet has no comparison pairs");
  const frames: unknown[] = manifest.frames;
  const pairs: unknown[] = manifest.source.vitePairs;
  const rows: {
    id: string;
    stage: string;
    nodePath: string;
    nodeSha256: string;
    vitePath: string;
    viteSha256: string;
    snapshotPath: string;
    names: string[];
    width: number;
    height: number;
  }[] = [];
  const unavailable: unknown[] = [];
  for (const pair of pairs) {
    if (isRecord(pair) && pair.status !== "rendered-not-parity-accepted") {
      unavailable.push(pair);
      continue;
    }
    if (
      !isRecord(pair) ||
      pair.status !== "rendered-not-parity-accepted" ||
      typeof pair.id !== "string" ||
      typeof pair.stage !== "string" ||
      typeof pair.vitePngPath !== "string" ||
      typeof pair.vitePngSha256 !== "string" ||
      typeof pair.snapshotPath !== "string" ||
      typeof pair.snapshotSha256 !== "string"
    )
      throw new Error(
        "Gallery requires successful, independently recorded image pairs",
      );
    const frame: unknown = frames.find(
      (value: unknown): boolean =>
        isRecord(value) && value.scope === "vite-pair." + pair.id,
    );
    if (
      !isRecord(frame) ||
      typeof frame.file !== "string" ||
      path.basename(frame.file) !== frame.file ||
      typeof frame.sha256 !== "string"
    )
      throw new Error("Pair has no saved Node frame");
    if (
      !Array.isArray(pair.names) ||
      !pair.names.every((name: unknown): boolean => typeof name === "string") ||
      !isRecord(frame.camera) ||
      typeof frame.camera.width !== "number" ||
      typeof frame.camera.height !== "number"
    )
      throw new Error("Pair has no recorded source names or frame canvas");
    const nodePath: string = path.join(packet, frame.file);
    if (
      R.hash(await fs.readFile(nodePath)) !== frame.sha256 ||
      R.hash(await fs.readFile(pair.vitePngPath)) !== pair.vitePngSha256 ||
      R.hash(await fs.readFile(pair.snapshotPath)) !== pair.snapshotSha256
    )
      throw new Error("Comparison PNG or receipt bytes changed");
    rows.push({
      id: pair.id,
      stage: pair.stage,
      nodePath,
      nodeSha256: frame.sha256,
      vitePath: pair.vitePngPath,
      viteSha256: pair.vitePngSha256,
      snapshotPath: pair.snapshotPath,
      names: pair.names.map((name: unknown): string => String(name)),
      width: frame.camera.width,
      height: frame.camera.height,
    });
  }
  if (rows.length === 0) throw new Error("No successful pairs to display");
  /** Relative file links preserve the original files and work when this packet is opened locally. */
  const link: (file: string) => string = (file: string): string =>
    path
      .relative(packet, file)
      .split(path.sep)
      .map((segment: string): string => encodeURIComponent(segment))
      .join("/");
  const document: string =
    "<!doctype html><html lang=en><meta charset=utf-8><title>f1 Node and Vite actual comparisons</title><style>body{font:16px Arial;margin:24px;background:#dbe0e7;color:#18202b}section{margin:32px 0}main{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{width:100%;max-width:720px;height:auto}p,figcaption{overflow-wrap:anywhere}a{color:#124b87}</style><h1>f1 Node / Vite actual PNG comparison</h1><p>" +
    rows.length +
    " captured pairs from " +
    pairs.length +
    " requested rows in this packet. Each row names its actual source selection and canvas below. Click an image for its unchanged full PNG. Unavailable rows remain in the linked comparison facts.</p><p>Node: CPU z-buffer, opaque flat Lambert clay and 1 px lines. Vite presentation, including alpha, depth and shading, is recorded per row; unsupported or historical unknown demands remain explicit in the manifest. Colours, lighting, face normals and the existing compile banner differ. Production source epochs differ. These images do not establish numeric geometry equality, final skin acceptance, PBR parity, speed parity or complete Vite replacement.</p><p><a href=manifest.json>Node manifest</a> · <a href=comparison.json>Verified PNG and receipt links</a> · <a href=index.html>Node image index</a></p>" +
    rows
      .map(
        (row: (typeof rows)[number]): string =>
          "<section><h2>" +
          escapeHtml(row.id) +
          "</h2><p>" +
          escapeHtml(
            row.stage +
              " | " +
              row.names.join(", ") +
              " | " +
              row.width +
              " × " +
              row.height,
          ) +
          ' · <a href="' +
          link(row.snapshotPath) +
          '">Actual Vite camera receipt</a></p><main>' +
          [
            { title: "Node CPU", file: row.nodePath, sha256: row.nodeSha256 },
            { title: "Vite GPU", file: row.vitePath, sha256: row.viteSha256 },
          ]
            .map(
              (item: { title: string; file: string; sha256: string }): string =>
                "<figure><h3>" +
                item.title +
                '</h3><a href="' +
                link(item.file) +
                '"><img loading=lazy alt="' +
                escapeHtml(item.title + " " + row.id) +
                '" src="' +
                link(item.file) +
                '"></a><figcaption>SHA-256 ' +
                item.sha256 +
                "</figcaption></figure>",
            )
            .join("") +
          "</main></section>",
      )
      .join("") +
    "</html>";
  await fs.writeFile(path.join(packet, "comparison.html"), document);
  await fs.writeFile(
    path.join(packet, "comparison.json"),
    JSON.stringify(
      {
        observedUtc: new Date().toISOString(),
        method:
          "Existing PNG and receipt hashes verified; original bytes linked without copying or rerendering",
        rows,
        unavailable,
        acceptance:
          "Actual PNG links and hashes only; per-row demand differences and unknown historical metadata remain in manifest.source.vitePairs",
      },
      null,
      2,
    ),
  );
  const indexPath: string = path.join(packet, "index.html");
  const index: string = await fs.readFile(indexPath, "utf8");
  if (!index.includes('href="comparison.html"'))
    await fs.writeFile(
      indexPath,
      index +
        '<p><a href="comparison.html">Compare actual Node and Vite PNGs side by side</a></p>',
    );
  process.stdout.write(
    JSON.stringify({
      event: "comparison-gallery",
      packet,
      rows: rows.length,
      pngWrites: 0,
      path: path.join(packet, "comparison.html"),
    }) + "\n",
  );
}

/** Narrows actual JSON object records without assuming the receipt or manifest schema. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Escapes labels from recorded manifests before writing the local comparison document. */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
