import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicCaptureTransportFiles as TransportFiles } from "./FamilyConicCaptureTransportFiles";
import { FamilyConicDeviationCapture as Deviation } from "./FamilyConicDeviationCapture";
import { FamilyConicFigureCapture as Figure } from "./FamilyConicFigureCapture";
import { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";

/** Sequential native-case capture with one evaluated context and exact producer/file evidence. */
export namespace FamilyConicNativeCapture {
  /**
   * Both tools consume this one case context; no collection of cases or PNGs is cached.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The admitted production fields create one assembly/construction/realization/catalog shared by Figure, owner reporting and Deviation; a final receipt binds those outputs to the case, preflight, current source scope and actual bundle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Exact producer provenance precedes context creation and sequential consumers; a single final receipt records completion or the original failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No second ratio/solver, fallback F1, approval token, geometry reconstruction or per-consumer realization is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Current source hashes and exact bundle bytes are recorded separately; evidence completion grants no shape, clinical or full-domain approval.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cases run in separate invocations and one context lifetime; output hashing reads files sequentially and retains digests only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The callable Figure and Deviation consumers borrow the same mesh, catalog and reference-fitted camera/ROI records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited reads/writes close file handles, PNG buffers are not retained in context, and the only realized case leaves scope when this invocation settles.
   */
  export async function run(input: Input.IInput): Promise<void> {
    const recorded: TransportFiles.ILayer = await TransportFiles.load(
      input,
      false,
    );
    const started: number = performance.now();
    const stamp: string = new Date().toISOString().replaceAll(":", "-");
    const producer: Input.IProducer = await Input.producer(input.root);
    let source: Source.IState | null = null;
    let originalEvidence: Input.IFile | null = null;
    let context: Capture.IContext | null = null;
    let failure: Error | null = null;
    try {
      source = Source.prepare(input);
      source.recorded = recorded;
      originalEvidence = await Source.save(source, producer);
      context = await Capture.create(source, originalEvidence);
      await Figure.run(context);
      await Deviation.run(context);
    } catch (error: unknown) {
      failure = error instanceof Error ? error : new Error(String(error));
    }

    // A failed realization still gets input/producer provenance; no missing mesh is certified.
    const out: string = path.join(
      input.root,
      "packages/human/.shots/native-capture",
      context?.round ?? source?.round ?? stamp,
      "case-" + encodeURIComponent(input.selected.id),
    );
    await fs.mkdir(out, { recursive: true });
    const files: { file: string; sha256: string }[] = [];
    for (const directory of Object.values(context?.outputs ?? {}))
      for (const item of await fs.readdir(directory, { withFileTypes: true })) {
        if (!item.isFile()) continue;
        const file: string = path.join(directory, item.name);
        files.push({ file, sha256: Input.hash(await fs.readFile(file)) });
      }
    const receipt: unknown = {
      schema: "f1-native-capture-round/v1",
      state: failure === null ? "complete" : "failed",
      case: input.selected,
      artifact: input.artifact,
      fieldsHash: input.fieldsHash,
      sourceHashes: input.sourceHashes,
      preflight: input.preflight,
      bare: input.bare,
      producer,
      originalEvidence,
      capture: context === null ? null : Capture.metadata(context),
      outputs: context?.outputs ?? {},
      files,
      counts: {
        files: files.length,
        pngs: files.filter((file: { file: string; sha256: string }): boolean =>
          file.file.endsWith(".png"),
        ).length,
        rasterCalls: context?.frames.length ?? 0,
      },
      totalMs: performance.now() - started,
      memoryAfter: process.memoryUsage(),
      error:
        failure === null
          ? null
          : failure instanceof Error
            ? (failure.stack ?? failure.message)
            : String(failure),
      qualification:
        "Evidence completion is not shape acceptance; current source bytes and executed bundle bytes have separately recorded identities. Bare scope is diagnostic, independent of full-source acceptance.",
    };
    await fs.writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify(receipt, null, 2),
      { flag: "wx" },
    );
    process.stdout.write(
      JSON.stringify({
        out,
        state: failure === null ? "complete" : "failed",
        case: input.selected.id,
        files: files.length,
      }) + "\n",
    );
    if (failure !== null) throw failure;
  }
}
