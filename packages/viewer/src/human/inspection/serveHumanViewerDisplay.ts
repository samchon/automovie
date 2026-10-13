import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { PNG } from "pngjs";

import { judgeViewerRenderer } from "./judgeViewerRenderer.js";

/**
 * Atomically replace a tab's latest actual display image, keeping metadata and
 * temporary files outside output. Metadata is published under the image hash
 * before the image, so a visible PNG always has its matching record. Records
 * left by a failed image publication do not claim a displayed image.
 * Session/generation/sequence ordering and actual loaded-source metadata
 * preserve the distinction between an actual retained
 * viewport and the server's newer source. A source edit alone does not make
 * that displayed frame invalid or stop its latest camera from being saved.
 * Each record names the server revision and staleness observed at saving;
 * older generation or sequence encodings cannot replace a newer display.
 * Writes are serialized per tab; other viewer ports and tabs retain ownership.
 *
 * Ordering belongs to one viewer port and tab session. The encoded PNG digest is separate from reported source and view facts; this mutable latest-display slot computes no canonical decoded-pixel identity or immutable final-artifact collision verdict.
 *
 * @evidence contracts/common.md#principled-implementation Validated PNG dimensions and hardware precede atomic publication; the viewport's original source and server source at saving remain distinct, and a failed write retains the previous image.
 * @evidence contracts/common.md#clear-and-simple-design One per-session queue owns ordering and filesystem publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Publishes the supplied observed display PNG with its original source and checked ordering, without relabeling it as a newer build, generating pixels or moving logs and cache files into output.
 * @evidence contracts/common.md#meaningful-documentation States image, metadata, ordering and failure ownership.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Preserves the displayed frame's reported source, camera, renderer and ordering beside its supplied PNG rather than relabelling it as the server's newer source.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Per-session serialized PNG dimension checking and metadata-before-image rename keep the latest accepted display bytes and record together without establishing anatomical acceptance.
 *
 * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-late-writer-fencing Serializes the tab session's saves and rejects older generations or non-increasing sequences before replacing that session's accepted image.
 * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-fencing-late-writer Serializes the tab session's saves and rejects older generations or non-increasing sequences before replacing that session's accepted image.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-byte-digest Computes SHA-256 from the actual encoded PNG bytes and records that byte digest separately from the displayed source revision and view facts; it does not calculate canonical pixel or channel content identity.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Computes SHA-256 from the actual encoded PNG bytes and records that byte digest separately from the displayed source revision and view facts; it does not calculate canonical pixel or channel content identity.
 * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-publication-ownership-conflict Scopes publication to the viewer port/tab session and explicitly refuses superseded generation or sequence saves rather than silently replacing that session's newer accepted display.
 * @evidence requirements/operations-and-recovery/partial-artifacts-and-publication.md#operations-publication-conflict-rollback Scopes publication to the viewer port/tab session and explicitly refuses superseded generation or sequence saves rather than silently replacing that session's newer accepted display.
 */
export function serveHumanViewerDisplay(props: {
  root: string;
  storage: string;
  port: number;
  origin: string;
  revision: () => string;
}) {
  const queues = new Map<string, Promise<void>>();
  const saved = new Map<string, [number, number]>();
  return (request: IncomingMessage, response: ServerResponse): void => {
    const fail = (cause: unknown): void => {
      if (response.writableEnded) return;
      response.statusCode = 422;
      response.end(String(cause));
    };
    if (request.method !== "POST" || request.headers.origin !== props.origin) {
      fail(new Error("Display saving requires the local viewer's original POST."));
      return;
    }
    let text = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      text += chunk;
      if (text.length > 48 * 1024 * 1024) {
        fail(new Error("The display PNG exceeds the admitted frame envelope."));
        request.destroy();
      }
    });
    request.once("error", fail);
    request.once("end", () => {
      try {
        const value = JSON.parse(text) as Record<string, unknown>;
        const { session, generation, sequence, revision, renderer, png, width, height, camera, address } = value;
        if (typeof session !== "string" || !/^[0-9a-f-]{36}$/.test(session) ||
            typeof generation !== "number" || !Number.isSafeInteger(generation) || generation < 1 ||
            typeof sequence !== "number" || !Number.isSafeInteger(sequence) || sequence < 1 ||
            typeof revision !== "string" || revision.length === 0 ||
            typeof renderer !== "string" || !judgeViewerRenderer(renderer).real ||
            typeof png !== "string" || !png.startsWith("data:image/png;base64,") ||
            typeof width !== "number" || typeof height !== "number" ||
            !Number.isInteger(width) || !Number.isInteger(height) || width < 32 || height < 32 || width > 4096 || height > 2048 ||
            camera === null || typeof camera !== "object" || address === null || typeof address !== "object")
          throw new Error("Display saving requires a complete observed hardware frame identity.");
        const bytes = Buffer.from(png.slice("data:image/png;base64,".length), "base64");
        const operation = (queues.get(session) ?? Promise.resolve()).then(async () => {
          const decoded = await new Promise<PNG>((resolve, reject) => {
            new PNG().parse(bytes, (error, parsed) => error === null
              ? resolve(parsed) : reject(error));
          });
          if (decoded.width !== width || decoded.height !== height)
            throw new Error("The encoded display dimensions disagree with its frame.");
          const prior = saved.get(session);
          if (prior !== undefined && (generation < prior[0] || (generation === prior[0] && sequence <= prior[1])))
            throw new Error("The display save was superseded.");
          const output = path.resolve(props.root, ".shots/output");
          const records = path.resolve(props.storage, "display-records");
          await fs.mkdir(output, { recursive: true });
          await fs.mkdir(records, { recursive: true });
          const name = `current-${props.port}-${session}`;
          const temporary = path.join(records, randomUUID() + ".png");
          const hash = createHash("sha256").update(bytes).digest("hex");
          const metadataTemp = path.join(records, randomUUID() + ".json.tmp");
          const serverRevisionAtSave = props.revision();
          const metadata = {
            ...value, png: undefined, image: name + ".png", sha256: hash,
            savedAt: new Date().toISOString(), serverRevisionAtSave,
            stale: revision !== serverRevisionAtSave,
          };
          try {
            await fs.writeFile(temporary, bytes);
            await fs.writeFile(metadataTemp, JSON.stringify(metadata));
            await fs.rename(metadataTemp, path.join(records, name + "-" + hash + ".json"));
            await fs.rename(temporary, path.join(output, name + ".png"));
            saved.set(session, [generation, sequence]);
          } finally {
            await fs.rm(temporary, { force: true });
            await fs.rm(metadataTemp, { force: true });
          }
        });
        const settled = operation.catch(() => undefined);
        queues.set(session, settled);
        void operation.then(() => response.end()).catch(fail).finally(() => {
          if (queues.get(session) === settled) queues.delete(session);
        });
      } catch (cause) { fail(cause); }
    });
  };
}
