import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { HumanDebugInspectionHttp } from "./HumanDebugInspectionHttp";
import { HumanDebugInspectionIndex } from "./HumanDebugInspectionIndex";
import { HumanDebugInspectionPlan } from "./HumanDebugInspectionPlan";
import { HumanDebugInspectionRows } from "./HumanDebugInspectionRows";
import { HumanDebugInspectionValidate } from "./HumanDebugInspectionValidate";
import type { IHumanDebugInspectionPlan as P } from "./IHumanDebugInspectionPlan";

/** One client loop over the existing single-viewer batch API; never creates a renderer or generator. */
export async function HumanDebugInspectionRun(root: string, plan: P, resume: boolean): Promise<P.Manifest> {
  const out: string = path.resolve(root, "packages/human/.shots/inspection/f1", plan.id);
  const identity: Awaited<ReturnType<typeof HumanDebugInspectionPlan.identity>> = await HumanDebugInspectionPlan.identity(root);
  const planSha256: string = HumanDebugInspectionPlan.digest(JSON.stringify(plan));
  const diskAnswer: HumanDebugInspectionHttp.Answer = await HumanDebugInspectionHttp.get("http://127.0.0.1:5197/human-debug/source.json");
  if (diskAnswer.status !== 200) throw new Error("Current disk source inventory is unavailable: " + diskAnswer.body);
  const diskSource: P.Manifest["diskSource"] = JSON.parse(diskAnswer.body) as P.Manifest["diskSource"];
  if (!/^[0-9a-f]{64}$/.test(diskSource.sourceSha256)) throw new Error("Current disk source identity is invalid");
  const status: { pid?: number; admitted?: number; running?: unknown; queued?: unknown[]; source?: string | null } = JSON.parse((await HumanDebugInspectionHttp.get("http://127.0.0.1:5197/human-debug/status.json")).body) as { pid?: number; admitted?: number; running?: unknown; queued?: unknown[]; source?: string | null };
  if (status.admitted !== 0 || status.running !== null || status.queued?.length !== 0) throw new Error("The shared viewer is not idle; no inspection request was admitted");
  let manifest: P.Manifest;
  if (resume) {
    manifest = JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8")) as P.Manifest;
    if (manifest.out !== out || manifest.planSha256 !== planSha256 || manifest.input.sha256 !== identity.input.sha256 || JSON.stringify(manifest.reference) !== JSON.stringify(identity.reference) || manifest.controllerSha256 !== identity.controllerSha256 || manifest.diskSource.sourceSha256 !== diskSource.sourceSha256) throw new Error("Resume directory/input/reference/plan/controller/current disk identity differs; create a new packet");
    const records: P.Progress[] = await HumanDebugInspectionIndex.progress(out);
    const inventory: P.Progress | undefined = records.find((record: P.Progress): boolean => record.row.stage === "inventory" && record.row.status === "done");
    if (manifest.rows.length === 1 && inventory?.row.artifact !== null && inventory?.row.artifact !== undefined)
      HumanDebugInspectionRows.expand(manifest, JSON.parse(await fs.readFile(inventory.row.artifact.receipt, "utf8")) as P.Receipt);
    const positions: Map<string, number> = new Map(manifest.rows.map((row: P.Row, index: number): [string, number] => [row.id, index]));
    const events: Map<string, P.Manifest["preparations"][number]> = new Map(manifest.preparations.map((event: P.Manifest["preparations"][number]): [string, P.Manifest["preparations"][number]] => [event.row, event]));
    for (const record of records) {
      const index: number | undefined = positions.get(record.row.id);
      const planned: P.Row | undefined = index === undefined ? undefined : manifest.rows[index];
      if (index === undefined || planned?.scope !== record.row.scope || planned.stage !== record.row.stage || JSON.stringify(planned.names) !== JSON.stringify(record.row.names) || JSON.stringify(planned.curveIds) !== JSON.stringify(record.row.curveIds)) throw new Error("Durable progress does not match the expanded immutable plan");
      if (record.source !== null && record.source !== diskSource.sourceSha256) throw new Error("Durable progress belongs to a different source epoch");
      manifest.rows[index] = record.row;
      manifest.source ??= record.source;
      if (record.frame !== null) manifest.frames[record.row.frameKey] = record.frame;
      if (record.preparation !== null) events.set(record.preparation.row, record.preparation);
    }
    manifest.preparations = [...events.values()];
    if (manifest.source !== null && status.source !== manifest.source) throw new Error("The packet's resident source is no longer present; do not mix a new page/source into this packet");
    for (const row of manifest.rows) {
      if (row.status !== "done" || row.artifact === null) continue;
      const receipt: P.Receipt = JSON.parse(await fs.readFile(row.artifact.receipt, "utf8")) as P.Receipt;
      if (receipt.source !== manifest.source || HumanDebugInspectionPlan.digest(await fs.readFile(row.artifact.png)) !== receipt.pngSha256) throw new Error("A completed artifact no longer matches its saved source/hash");
      HumanDebugInspectionValidate.frame(row, receipt, row.stage === "inventory" || row.stage === "framing" ? undefined : manifest.frames[row.frameKey], plan.size ?? 1200);
    }
    manifest.notes.push("Resumed completed artifacts were hash/source/camera checked; pending rows alone may run. Historical sources are not counted as current evidence.");
  } else {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.mkdir(out);
    const now: string = new Date().toISOString();
    manifest = { version: 1, plan, planSha256, out, createdUtc: now, updatedUtc: now, completedUtc: null, source: null, diskSource, ...identity, frames: {}, treeParts: [], originalIds: [], rows: [HumanDebugInspectionRows.initial()], preparations: [], notes: ["Capture done is not anatomy acceptance. Input runtime values/digest are unavailable. Source hashes identify disk inventory, not independently every transformed dependency. Reference pack digest conservatively includes all local JSON files. Automatic individual cameras maximize measured world-box projection, not a fixed source-front/world-front equivalence. Full manifest/index are block checkpoints; progress files are atomic durable row results. Original and raw prejoin producers report actual pose null even though the requested pose is bind; final Boolean preparation is a separate opt-in stage."] };
    await fs.writeFile(path.join(out, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
  }
  await fs.mkdir(path.join(out, "responses"), { recursive: true });
  await HumanDebugInspectionIndex.save(manifest, true);
  process.stdout.write(JSON.stringify({ packet: out, index: path.join(out, "index.html"), manifest: path.join(out, "manifest.json"), source: manifest.source, resumed: resume }) + "\n");
  const blocked: Map<string, string> = new Map();
  for (const row of manifest.rows)
    if (row.status === "failed" && row.failureKind === "producer") blocked.set(familyOf(row.stage), "Previous producer failure " + row.id + "; this producer is not retried on resume");
  let interrupted: boolean = false;
  const stop: () => void = (): void => { interrupted = true; };
  process.on("SIGINT", stop);
  try {
    for (let index: number = 0; index < manifest.rows.length; index++) {
      const row: P.Row = manifest.rows[index]!;
      if (row.status !== "pending") continue;
      if (interrupted) { manifest.notes.push("Stop requested; the admitted frame finished and unrequested rows remain pending."); break; }
      const family: string = familyOf(row.stage);
      const cause: string | undefined = blocked.get(family);
      if (cause !== undefined) { row.status = "unavailable"; row.error = "Producer already failed in this packet: " + cause; await HumanDebugInspectionIndex.record(manifest, row); continue; }
      if (row.stage !== "inventory" && row.stage !== "framing" && manifest.frames[row.frameKey] === undefined) {
        row.status = "unavailable";
        row.error = "The current-source visible-curve ROI was unavailable";
        await HumanDebugInspectionIndex.record(manifest, row);
        continue;
      }
      row.startedUtc = new Date().toISOString();
      const started: number = performance.now();
      let producerFailure: boolean = false;
      try {
        const frame: P.Frame | undefined = row.stage === "inventory" || row.stage === "framing" ? undefined : manifest.frames[row.frameKey];
        if (row.automaticCamera && frame !== undefined) row.camera = HumanDebugInspectionValidate.direction(frame);
        const query: URLSearchParams = options(row, manifest, frame);
        const round: string = plan.id + "-" + row.id;
        const prior: boolean = await fs.access(path.join(root, "packages/human/.shots/debug/f1", round)).then((): boolean => true).catch((error: unknown): boolean => {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
          throw error;
        });
        if (prior) throw new Error("A pre-existing batch round is not overwritten; inspect orphaned artifacts before resuming " + round);
        query.set("round", round);
        query.set("pieces", row.stage.startsWith("raw-") ? "source.parts*tree" : "whole");
        query.set("cameras", row.camera);
        query.set("keep", manifest.source === null ? "0" : "1");
        query.set("fresh", randomUUID());
        const url: string = "http://127.0.0.1:5197/human-debug/batch/f1.json?" + query.toString();
        const responseFile: string = path.join(out, "responses", row.id + ".json");
        await fs.writeFile(path.join(out, "responses", row.id + "-request.json"), JSON.stringify({ startedUtc: row.startedUtc, url, intendedCamera: row.camera, roi: frame ?? null }, null, 2));
        const answer: HumanDebugInspectionHttp.Answer = await HumanDebugInspectionHttp.get(url);
        await fs.writeFile(responseFile, answer.body);
        if (answer.status !== 200) { producerFailure = true; throw new Error("HTTP " + answer.status + ": " + answer.body); }
        const batch: { items?: { file: string | null; error: string | null }[] } = JSON.parse(answer.body) as { items?: { file: string | null; error: string | null }[] };
        if (!Array.isArray(batch.items) || batch.items.length !== 1) throw new Error("The existing registry did not yield exactly the intended single batch entry");
        const item: { file: string | null; error: string | null } = batch.items[0]!;
        if (item.error !== null || item.file === null) { producerFailure = true; throw new Error(item.error ?? "Batch produced no PNG"); }
        const png: string = path.resolve(item.file);
        const allowed: string = path.resolve(root, "packages/human/.shots/debug/f1") + path.sep;
        if (!png.toLowerCase().startsWith(allowed.toLowerCase())) throw new Error("Batch evidence path escaped the expected local f1 evidence directory");
        const receiptFile: string = png.replace(/\.png$/, ".json");
        const receipt: P.Receipt = JSON.parse(await fs.readFile(receiptFile, "utf8")) as P.Receipt;
        const snapshot: P.Receipt["snapshot"] = receipt.snapshot;
        const facts: Omit<P.Receipt, "snapshot"> = { source: receipt.source, pngSha256: receipt.pngSha256, capturedUtc: receipt.capturedUtc, cache: receipt.cache, attempts: receipt.attempts, query: receipt.query };
        row.artifact = { png, receipt: receiptFile, response: responseFile, url, frame: facts, camera: snapshot.camera, loadMilliseconds: snapshot.loadMilliseconds, shown: { parts: snapshot.shown.parts.length, curves: snapshot.shown.curves.length }, checks: [] };
        if (snapshot.loadMilliseconds !== null)
          manifest.preparations.push({ row: row.id, subject: JSON.stringify(snapshot.subject), loadMilliseconds: snapshot.loadMilliseconds, milliseconds: snapshot.provenance?.milliseconds ?? null });
        if (HumanDebugInspectionPlan.digest(await fs.readFile(png)) !== receipt.pngSha256) throw new Error("PNG bytes differ from the batch SHA-256");
        if (receipt.source !== manifest.diskSource.sourceSha256 || manifest.source !== null && receipt.source !== manifest.source) throw new Error("Source changed inside the packet; preserve these artifacts separately");
        manifest.source ??= receipt.source;
        row.artifact.checks = HumanDebugInspectionValidate.frame(row, receipt, frame, plan.size ?? 1200);
        if (row.stage === "inventory") {
          const display: { sha256?: string | null; attemptedArtifact?: { sha256?: string | null } | null } = (snapshot.provenance?.referenceDisplay ?? {}) as { sha256?: string | null; attemptedArtifact?: { sha256?: string | null } | null };
          const observedReference: string | null = display.sha256 ?? display.attemptedArtifact?.sha256 ?? null;
          if (observedReference !== null && observedReference !== manifest.reference.nativeSha256) throw new Error("Actual reference bytes differ from the packet input identity");
          manifest.frames.reference = HumanDebugInspectionValidate.bounds(receipt);
          HumanDebugInspectionRows.expand(manifest, receipt);
        } else if (row.stage === "framing") {
          const measured: P.Frame = HumanDebugInspectionValidate.bounds(receipt);
          manifest.frames[row.frameKey] = row.frameKey === "whole" ? HumanDebugInspectionValidate.union(manifest.frames.reference!, measured) : measured;
        }
        row.status = "done";
      } catch (error: unknown) {
        row.status = "failed";
        row.failureKind = producerFailure ? "producer" : "capture";
        row.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
        await fs.writeFile(path.join(out, "responses", row.id + "-failure.txt"), row.error);
        const answer: HumanDebugInspectionHttp.Answer = await HumanDebugInspectionHttp.get("http://127.0.0.1:5197/human-debug/status.json").catch((failure: unknown): HumanDebugInspectionHttp.Answer => ({ status: 0, body: String(failure) }));
        await fs.writeFile(path.join(out, "responses", row.id + "-status.json"), answer.body);
        if (producerFailure) blocked.set(family, row.id + ": " + row.error);
        if (row.stage === "inventory" && manifest.rows.length === 1) HumanDebugInspectionRows.blocked(manifest, "Inventory producer failed at " + row.id + "; no retry or substitute geometry");
        if (answer.status === 200) {
          const current: { source?: string | null; admitted?: number } = JSON.parse(answer.body) as { source?: string | null; admitted?: number };
          if (current.admitted !== 0 || manifest.source !== null && current.source !== manifest.source) {
            for (const pending of manifest.rows) if (pending.status === "pending") { pending.status = "unavailable"; pending.error = "The packet's resident source was lost after " + row.id; }
          }
        } else for (const pending of manifest.rows) if (pending.status === "pending") { pending.status = "unavailable"; pending.error = "Viewer state is unavailable after " + row.id + "; no additional request admitted"; }
      } finally {
        row.endedUtc = new Date().toISOString();
        row.elapsedMilliseconds = Math.round(performance.now() - started);
        const nextStage: P.Stage | undefined = manifest.rows[index + 1]?.stage;
        const nextFamily: string = nextStage === undefined ? "end" : familyOf(nextStage);
        await HumanDebugInspectionIndex.record(manifest, row);
        if (row.stage === "inventory" || nextStage !== undefined && nextFamily !== family) await HumanDebugInspectionIndex.save(manifest, true);
        process.stdout.write(JSON.stringify({ shot: row.id, stage: row.stage, scope: row.scope, camera: row.camera, status: row.status, source: manifest.source, elapsedMilliseconds: row.elapsedMilliseconds, error: row.error }) + "\n");
      }
    }
  } finally {
    process.off("SIGINT", stop);
    if (manifest.completedUtc === null && manifest.rows.every((row: P.Row): boolean => row.status !== "pending")) manifest.completedUtc = new Date().toISOString();
    await HumanDebugInspectionIndex.save(manifest, true);
  }
  return manifest;
}

/** Separate reference styles are distinct subjects; validation failures never block either producer. */
function familyOf(stage: P.Stage): string {
  return stage.startsWith("raw-") ? "raw" : stage === "final-clay" ? "final" : stage === "original-sections" ? "original-sections" : "original";
}

/** Keep original subject identity fixed; only visible IDs, intended camera and explicit ROI change. */
function options(row: P.Row, manifest: P.Manifest, frame: P.Frame | undefined): URLSearchParams {
  const raw: boolean = row.stage.startsWith("raw-");
  const final: boolean = row.stage === "final-clay";
  const sections: boolean = row.stage === "original-sections";
  const curves: string[] = row.curveIds !== null && row.curveIds.length === 1
    ? row.curveIds
    : row.names.map((name: string): string => (raw ? "" : "view.") + name + "/*");
  const none: boolean = row.stage === "inventory" || row.stage === "reference" || row.stage === "raw-clay" || final;
  const query: URLSearchParams = new URLSearchParams({ person: "f1", pose: "bind", parts: row.stage === "framing" || row.stage === "raw-curves" || sections ? "none" : raw ? row.names.map((name: string): string => name + "/*").join(",") : final ? "*" : "reference.*", curves: none ? "none" : [...curves, ...(sections ? ["reference.*/*"] : [])].join(","), labels: "0", viewLabels: "0", legend: "0", axes: "0", w: String(manifest.plan.size ?? 1200), h: String(manifest.plan.size ?? 1200), ui: "0", xray: "1", curveWidth: "0.08" });
  if (raw) query.set("piece", "source.parts:tree");
  else if (!final) {
    query.set("reference", "f1");
    query.set("referenceStyle", sections ? "loft" : "clay");
    query.set("referencePart", "*");
    query.set("part", "*");
  } else query.set("hide", "human.hair.*,human.garment.*,human.clothes.*,human.underwear*");
  for (const [name, value] of Object.entries(HumanDebugInspectionValidate.camera(row, frame).query)) query.set(name, value);

  // Original lines occupy about one pixel at their ROI centre; dense generated lofts retain thin tubes.
  if (frame !== undefined) {
    const pixelRadius: number = Number(query.get("dist")) * Math.tan(Math.PI / 12) / (manifest.plan.size ?? 1200);
    query.set("curveWidth", String(raw ? Math.min(0.08, pixelRadius) : pixelRadius));
  }
  return query;
}
