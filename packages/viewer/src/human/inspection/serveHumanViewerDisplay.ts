import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { PNG } from "pngjs";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

import { judgeViewerRenderer } from "./judgeViewerRenderer.js";

/**
 * Atomically replace a tab's latest actual display image, keeping metadata and temporary files outside output. Metadata is published under the image hash before the image, so a visible PNG always has its matching record. Records left by a failed image publication do not claim a displayed image. Session/generation/sequence ordering and actual loaded-source metadata preserve the distinction between an actual retained viewport and the server's newer source. A source edit alone does not make that displayed frame invalid or stop its latest camera from being saved. Each record names the server revision and staleness observed at saving; older generation or sequence encodings cannot replace a newer display. Writes are serialized per tab; other viewer ports and tabs retain ownership.
 *
 * Ordering belongs to one viewer port and tab session. The encoded PNG digest is separate from reported source and view facts; this mutable latest-display slot computes no canonical decoded-pixel identity or immutable final-artifact collision verdict.
 *
 * @evidence contracts/common.md#principled-implementation Checks scalar envelope fields, reported-renderer classification and object presence for camera/address, verifies decoded PNG dimensions and serializes ordered publication; nested frame identity and physical hardware are not independently verified.
 * @evidence contracts/common.md#clear-and-simple-design One viewer-port adapter owns its per-session ordering and output paths while actual renderer evidence and displayed selection remain supplied by the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source edit alone does not discard a valid retained display; encoded PNG hashing is not claimed as canonical decoded-pixel identity or immutable complete provenance.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies tab/port ownership, ordering, metadata-before-image publication and current server-source staleness separate from the displayed source.
 * @evidence contracts/performance.md#efficient-algorithms Each request checks/decodes/hash-writes its PNG bytes and pixels, with sequential publication per session and independent sessions; the existing 48 MiB text limit bounds one admitted body.
 * @evidence contracts/performance.md#reuse-equivalent-work Only ordering completion is shared per session; distinct saves decode/write their own bytes and reject superseded generations/sequences rather than caching by image hash.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Settled queue entries are removed; both owned temporary files are independently removed on success/failure with primary cause retained. Saved session-order keys and queued request count have no independent population cap, and committed metadata cleanup is not added here.
 */
export function serveHumanViewerDisplay(props: {
  root: string;
  storage: string;
  port: number;
  origin: string;
  revision: () => string;
}): (request: IncomingMessage, response: ServerResponse) => void {
  const queues: Map<string, Promise<void>> = new Map();
  const saved: Map<string, [number, number]> = new Map();
  return (request: IncomingMessage, response: ServerResponse): void => {
    const fail: (cause: unknown) => void = (cause: unknown): void => {
      if (response.writableEnded) return;
      response.statusCode = 422;
      response.end(String(cause));
    };
    if (request.method !== "POST" || request.headers.origin !== props.origin) {
      fail(new Error("Display saving requires the local viewer's original POST."));
      return;
    }
    let text: string = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string): void => {
      text += chunk;
      if (text.length > 48 * 1024 * 1024) {
        fail(new Error("The display PNG exceeds the admitted frame envelope."));
        request.destroy();
      }
    });
    request.once("error", fail);
    request.once("end", (): void => {
      try {
        const value: Record<string, unknown> = JSON.parse(text) as Record<string, unknown>;
        const { session, generation, sequence, revision, renderer, png, width, height, camera, address }: Record<string, unknown> = value;
        if (typeof session !== "string" || !/^[0-9a-f-]{36}$/.test(session) ||
            typeof generation !== "number" || !Number.isSafeInteger(generation) || generation < 1 ||
            typeof sequence !== "number" || !Number.isSafeInteger(sequence) || sequence < 1 ||
            typeof revision !== "string" || revision.length === 0 ||
            typeof renderer !== "string" || !judgeViewerRenderer(renderer).real ||
            typeof png !== "string" || !png.startsWith("data:image/png;base64,") ||
            typeof width !== "number" || typeof height !== "number" ||
            !Number.isInteger(width) || !Number.isInteger(height) || width < 32 || height < 32 || width > 4096 || height > 2048 ||
            camera === null || typeof camera !== "object" || address === null || typeof address !== "object")
          throw new Error("Display saving requires the supported page-reported frame envelope.");
        const bytes: Buffer = Buffer.from(png.slice("data:image/png;base64,".length), "base64");
        const operation: Promise<void> = (queues.get(session) ?? Promise.resolve()).then(async (): Promise<void> => {
          const decoded: PNG = await new Promise<PNG>((resolve: (value: PNG) => void, reject: (error: unknown) => void): void => {
            new PNG().parse(bytes, (error: Error | null, parsed: PNG): void => error === null
              ? resolve(parsed) : reject(error));
          });
          if (decoded.width !== width || decoded.height !== height)
            throw new Error("The encoded display dimensions disagree with its frame.");
          const prior: [number, number] | undefined = saved.get(session);
          if (prior !== undefined && (generation < prior[0] || (generation === prior[0] && sequence <= prior[1])))
            throw new Error("The display save was superseded.");
          const output: string = path.resolve(props.root, ".shots/output");
          const records: string = path.resolve(props.storage, "display-records");
          await fs.mkdir(output, { recursive: true });
          await fs.mkdir(records, { recursive: true });
          const name: string = `current-${props.port}-${session}`;
          const temporary: string = path.join(records, randomUUID() + ".png");
          const hash: string = createHash("sha256").update(bytes).digest("hex");
          const metadataTemp: string = path.join(records, randomUUID() + ".json.tmp");
          const serverRevisionAtSave: string = props.revision();
          const metadata: Record<string, unknown> = {
            ...value, png: undefined, image: name + ".png", sha256: hash,
            savedAt: new Date().toISOString(), serverRevisionAtSave,
            stale: revision !== serverRevisionAtSave,
          };
          let primary: { error: unknown } | undefined;
          try {
            await fs.writeFile(temporary, bytes);
            await fs.writeFile(metadataTemp, JSON.stringify(metadata));
            await fs.rename(metadataTemp, path.join(records, name + "-" + hash + ".json"));
            await fs.rename(temporary, path.join(output, name + ".png"));
            saved.set(session, [generation, sequence]);
          } catch (error) {
            primary = { error };
            throw error;
          } finally {
            const operations: readonly (() => Promise<void>)[] = [
              async (): Promise<void> => { await fs.rm(temporary, { force: true }); },
              async (): Promise<void> => { await fs.rm(metadataTemp, { force: true }); },
            ];
            if (primary === undefined) await createAutoMovieResourceRetirement(operations)();
            else await createAutoMovieResourceRetirement(operations, primary)();
          }
        });
        const settled: Promise<void> = operation.catch((): undefined => undefined);
        queues.set(session, settled);
        void operation.then((): void => { response.end(); }).catch(fail).finally((): void => {
          if (queues.get(session) === settled) queues.delete(session);
        });
      } catch (cause) { fail(cause); }
    });
  };
}
