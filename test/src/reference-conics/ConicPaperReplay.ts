import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import type { ConicPaperFit as F } from "./ConicPaperFit";
import { ConicPaperInput as I } from "./ConicPaperInput";
import { ConicPaperLoft as L } from "./ConicPaperLoft";
import { ConicPaperRender as R } from "./ConicPaperRender";

/** Replay saved rational coefficients without rerunning either fitter, preserving the frozen baseline evidence. */
export async function ConicPaperReplay(): Promise<void> {
  const started: number = performance.now();
  const root: string = path.resolve(__dirname, "../../..");
  const source: string = process.argv[2] ?? "";
  if (!path.isAbsolute(source)) throw new Error("Supply the absolute completed experiment directory.");
  const previousReceipt: Buffer = await fs.readFile(path.join(source, "receipt.json"));
  const out: string = path.join(root, "test/.shots/conic-paper-study", new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-") + "-six-view-replay");
  await fs.mkdir(out, { recursive: true });
  const packet: I.Packet = await I.load(root);
  const studies: { name: string; loft: L.Result }[] = [];
  const coefficientIdentity: { file: string; sha256: string; bytes: number }[] = [];
  for (const name of ["source-closed-loft", "ahn", "ghosh"]) {
    let fitted: F.Result | undefined;
    if (name !== "source-closed-loft") {
      const file: string = path.join(source, name + ".coefficients.json.gz");
      const compressed: Buffer = await fs.readFile(file);
      coefficientIdentity.push({ file, bytes: compressed.length, sha256: createHash("sha256").update(compressed).digest("hex") });
      fitted = JSON.parse(gunzipSync(compressed).toString("utf8")) as F.Result;
    }
    const phase: object = { pid: process.pid, phase: "loft-replay", subject: name, startedUtc: new Date().toISOString(), externalDeadlineMs: 60000 };
    await fs.writeFile(path.join(out, "phase.json"), JSON.stringify(phase));
    process.stdout.write(JSON.stringify({ event: "conic-replay-loft-start", out, ...phase }) + "\n");
    const loft: L.Result = L.build(packet, name, fitted);
    studies.push({ name, loft });

    // The saved display geometry comes only from the selected coefficients and strip kernel.
    await fs.writeFile(path.join(out, name + ".generated-loft.json.gz"), gzipSync(JSON.stringify({ mesh: loft.mesh, curves: loft.curves })));
    process.stdout.write(JSON.stringify({ event: "conic-replay-loft-complete", name, milliseconds: loft.milliseconds, usedSurfaceCurves: loft.usedSurfaceCurves }) + "\n");
  }
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ pid: process.pid, phase: "render", startedUtc: new Date().toISOString() }));
  const render: R.Result = await R.run(root, out, studies);
  const receipt: object = { schema: "f1-conic-paper-six-view-replay-v1", sourceExperiment: source,
    sourceReceiptSha256: createHash("sha256").update(previousReceipt).digest("hex"), coefficientIdentity,
    refittingPerformed: false, input: { closedCurves: packet.loops.length, hashes: packet.hashes, loadMs: packet.loadMs },
    lofts: studies.map(({ name, loft }): object => { const { mesh, curves, ...summary }: L.Result = loft; return { name, ...summary, triangles: mesh.indices.length / 3, positions: mesh.positions.length / 3, displayCurves: curves.length }; }), render, milliseconds: performance.now() - started };
  await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
  await fs.writeFile(path.join(out, "phase.json"), JSON.stringify({ pid: process.pid, phase: "complete", completedUtc: new Date().toISOString() }));
  process.stdout.write(JSON.stringify({ event: "conic-replay-complete", out, milliseconds: performance.now() - started }) + "\n");
}

void ConicPaperReplay().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
