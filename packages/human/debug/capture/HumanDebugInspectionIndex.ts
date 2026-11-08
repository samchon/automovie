import fs from "node:fs/promises";
import path from "node:path";
import type { IHumanDebugInspectionPlan as P } from "./IHumanDebugInspectionPlan";

/** Durable local manifest and a static, script-free browser index of unchanged capture files. */
export namespace HumanDebugInspectionIndex {
  /** Persist one completed result before the next admission, with no growing manifest copy. */
  export async function record(manifest: P.Manifest, row: P.Row): Promise<void> {
    const directory: string = path.join(manifest.out, "progress");
    await fs.mkdir(directory, { recursive: true });
    const progress: P.Progress = { row, source: manifest.source, frame: row.stage === "inventory" || row.stage === "framing" ? manifest.frames[row.frameKey] ?? null : null, preparation: manifest.preparations.find((event: P.Manifest["preparations"][number]): boolean => event.row === row.id) ?? null };
    await write(path.join(directory, row.id + ".json"), JSON.stringify(progress) + "\n");
  }

  /** Read durable row records once; the caller restores inventory before merging later rows. */
  export async function progress(out: string): Promise<P.Progress[]> {
    const directory: string = path.join(out, "progress");
    const files: string[] = await fs.readdir(directory).catch((error: unknown): string[] => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    });
    const records: P.Progress[] = [];
    for (const file of files)
      if (/^s\d+\.json$/.test(file)) records.push(JSON.parse(await fs.readFile(path.join(directory, file), "utf8")) as P.Progress);
    return records;
  }

  /** Write one checkpoint atomically, preserving all pending, failed and unavailable rows. */
  export async function save(manifest: P.Manifest, render: boolean = false): Promise<void> {
    manifest.updatedUtc = new Date().toISOString();
    await fs.mkdir(manifest.out, { recursive: true });
    await write(path.join(manifest.out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    if (!render) return;
    const grouped: Record<"scope" | "stage" | "camera", Map<string, P.Row[]>> = { scope: new Map(), stage: new Map(), camera: new Map() };
    const counts: Record<string, number> = {};
    for (const row of manifest.rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      for (const field of ["scope", "stage", "camera"] as const) {
        const rows: P.Row[] = grouped[field].get(row[field]) ?? [];
        rows.push(row);
        grouped[field].set(row[field], rows);
      }
    }
    const links: (title: string, values: readonly string[], field: "scope" | "stage" | "camera") => string = (title: string, values: readonly string[], field: "scope" | "stage" | "camera"): string =>
      "<nav><strong>" + title + "</strong> " + values.map((value: string): string => "<a href='#" + field + "-" + escape(value) + "'>" + escape(value) + "</a>").join(" ") + "</nav>";
    const sections: string[] = [];
    for (const field of ["scope", "stage", "camera"] as const) {
      for (const [value, rows] of grouped[field]) {
        sections.push("<section id='" + field + "-" + escape(value) + "'><h2>" + escape(field + ": " + value) + "</h2>" + rows.map((row: P.Row): string => card(manifest.out, row)).join("") + "</section>");
      }
    }
    const summary: string = ["pending", "done", "failed", "unavailable"].map((status: string): string => status + "=" + (counts[status] ?? 0)).join(" ");
    const html: string = "<!doctype html><meta charset='utf-8'><title>Human inspection " + escape(manifest.plan.id) + "</title><style>body{font:14px system-ui;margin:24px;background:#f1f3f6}nav{margin:12px}nav a{margin-right:12px}section{display:flow-root}article{display:inline-block;vertical-align:top;width:300px;margin:8px;padding:12px;background:white;overflow-wrap:anywhere}img{width:280px}code{display:block;white-space:pre-wrap}small{display:block}</style><h1>" + escape(manifest.plan.id) + "</h1><p>" + escape(summary) + "</p><p>Source " + escape(manifest.source ?? "unavailable") + ". Capture status is not anatomical acceptance. Raw operands are prejoin; subtraction operands are positive surfaces. Framing probes have no reference underlay. Manifest/index are block checkpoints; progress/ contains durable individual results.</p><a href='manifest.json'>manifest.json</a> <a href='plan.json'>plan.json</a>" + links("Parts / curves", [...grouped.scope.keys()], "scope") + links("Stages", [...grouped.stage.keys()], "stage") + links("Cameras", [...grouped.camera.keys()], "camera") + sections.join("");
    await write(path.join(manifest.out, "index.html"), html);
  }

  /** Link to original successful bytes and full receipts without copying private geometry. */
  function card(out: string, row: P.Row): string {
    const relative: (file: string) => string = (file: string): string => path.relative(out, file).split(path.sep).map(encodeURIComponent).join("/");
    const artifact: P.Artifact | null = row.artifact;
    return "<article><h3>" + escape(row.id + " " + row.stage + " " + row.camera) + "</h3><strong>" + escape(row.status) + "</strong><small>" + escape(row.scope) + "</small>" + (artifact === null ? "" : "<a href='" + relative(artifact.png) + "'><img loading='lazy' src='" + relative(artifact.png) + "'></a><a href='" + relative(artifact.receipt) + "'>full snapshot</a> <a href='" + relative(artifact.response) + "'>response</a><small>" + escape(artifact.frame.source + " " + artifact.frame.capturedUtc) + "</small>") + (row.status === "failed" ? "<a href='responses/" + encodeURIComponent(row.id) + "-failure.txt'>original failure</a>" : "") + "<code>" + escape((row.curveIds ?? row.names).join("\n")) + "</code><p>" + escape(row.error ?? "Unreviewed: no shape judgment recorded.") + "</p></article>";
  }

  /** Atomic replacement prevents an interrupted checkpoint leaving truncated JSON. */
  async function write(file: string, value: string): Promise<void> {
    await fs.writeFile(file + ".tmp", value, "utf8");
    await fs.rename(file + ".tmp", file);
  }

  /** Escape text and attributes in a generated evidence index. */
  function escape(value: string): string {
    return value.replace(/[&<>"']/g, (character: string): string => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
  }
}
