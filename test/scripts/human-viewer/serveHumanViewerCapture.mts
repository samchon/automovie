/**
 * The GPU routes of the resident viewer: `/render`, `/parts`, `/sheet`,
 * `/compare` and `/warm`. Each request is admitted before it waits (a bad
 * lane or an unknown document is refused at once), then runs as one queue
 * entry in its lane and is retried on the settled generation when only a
 * generation change interrupted it.
 */
import fs from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { PNG } from "pngjs";

import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import type { IServeHumanViewerCaptureProps } from "./IServeHumanViewerCaptureProps";
import { applyHumanViewerPose } from "./applyHumanViewerPose";
import { composeHumanViewerPixels } from "./composeHumanViewerPixels";
import { describeHumanViewerPass } from "./describeHumanViewerPass";
import { forHumanViewerComparison } from "./forHumanViewerComparison";
import { humanViewerQueuePosition } from "./humanViewerQueuePosition";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { planHumanViewerSheet } from "./planHumanViewerSheet";
import { queueHumanViewerRequest } from "./queueHumanViewerRequest";
import { renderHumanViewerSheet } from "./renderHumanViewerSheet.mjs";
import { retryAcrossHumanViewerGeneration } from "./retryAcrossHumanViewerGeneration";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail";

const ROUTES = ["/render", "/parts", "/sheet", "/compare", "/warm"];

/** Stream a stored PNG with its provenance headers. */
function sendPng(response: ServerResponse, file: string, headers: Record<string, string>): void {
  response.setHeader("Content-Type", "image/png");
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  fs.createReadStream(file).pipe(response);
}

/**
 * Answer one GPU route, or return false when the path is not one. A bulk
 * `/render` is served from the thumbnail store when the current revision has
 * drawn it, else from the last good thumbnail marked stale, else drawn. A
 * drawn response names its revision, whether that revision is stale, the
 * renderer, the pass's reading limit, its queue position and wait, and
 * whether the model was cached or built. A frame whose generation changed
 * while it was drawn is refused, never answered as current.
 *
 * @evidence contracts/common.md#principled-implementation Admission precedes queueing, and only generation-change refusals are retried on the settled generation.
 * @evidence contracts/common.md#clear-and-simple-design One handler owns the GPU routes; capture, queue and page state stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale thumbnails and stale generations are labelled stale rather than served as current.
 * @evidence contracts/common.md#meaningful-documentation States admission, thumbnail order, response provenance and refusal.
 */
export function serveHumanViewerCapture(props: IServeHumanViewerCaptureProps): boolean {
  const { url, response, json } = props;
  if (!ROUTES.includes(url.pathname)) return false;
  const inventory = props.inventory();
  const start = performance.now();
  const lane = url.searchParams.get("lane") ?? (url.pathname === "/warm" ? "bulk" : "cli");
  if (lane !== "ui" && lane !== "cli" && lane !== "bulk") {
    response.statusCode = 422;
    json({ error: "lane must be ui, cli or bulk" });
    return true;
  }
  // A misspelled document fails here, not after a wait in the queue.
  for (const name of ["doc", "against"]) {
    const wanted = url.searchParams.get(name);
    if (wanted !== null && url.searchParams.get("axes") === null &&
        !inventory.documents.some((entry) => entry.id === wanted)) {
      response.statusCode = 422;
      json({ error: `Unknown document ${wanted}; ${inventory.documents.length} are published, see /docs` });
      return true;
    }
  }
  if (url.pathname === "/render" && lane === "bulk") {
    const file = props.thumbnailFile(url.search);
    if (file !== null && fs.existsSync(file)) {
      sendPng(response, file, { "X-Human-Build": "thumbnail-cache",
        "X-Human-Revision": inventory.revision, "X-Human-Stale": "false" });
      return true;
    }
    // The new revision has not drawn it yet: show the last good picture, dimmed.
    const older = file === null ? null : props.thumbnails.stale(file, inventory.revision);
    if (older !== null) {
      sendPng(response, older, { "X-Human-Build": "thumbnail-stale", "X-Human-Stale": "true" });
      return true;
    }
  }
  const received = performance.now();
  const ahead = humanViewerQueuePosition(props.queue.status(), lane);
  let settledMs = 0;
  void queueHumanViewerRequest({ queue: props.queue, response, label: url.pathname + url.search, lane,
    task: (request) => retryAcrossHumanViewerGeneration(async () => {
      const requestCapture = (address: HumanViewerAddress) => request.run(() => props.capture.capture(address));
      const queued = performance.now() - received;
      const current = props.inventory();
      const fields = new URLSearchParams(url.search);
      fields.delete("lane");
      const axes = fields.get("axes");
      fields.delete("axes");
      const against = fields.get("against");
      fields.delete("against");
      if (url.pathname === "/sheet" && !fields.has("size")) fields.set("size", "320");
      applyHumanViewerPose(fields, (file) => fs.readFileSync(path.join(props.root,
        "test/studies/human-face/connected-basis/global-face/population", file + ".json"), "utf8"));
      const address = parseHumanViewerAddress(fields.toString());
      const ready = props.readyRevision();
      const selectedRevision = ready === "" ? current.revision : ready;
      let png: Buffer;
      if (url.pathname === "/sheet") {
        if (axes === null) throw new Error("A sheet requires review axes");
        png = await request.run(() => props.lifetime.run(() => renderHumanViewerSheet({
          page: props.page(),
          capture: requestCapture,
          revision: props.readyRevision,
          cells: planHumanViewerSheet(address, axes, current.documents.map((entry) => entry.id)),
        })));
      } else if (url.pathname === "/warm") {
        const warmed = [];
        for (const entry of current.documents.filter((entry) => entry.domain === "face")) {
          const before = performance.now();
          await requestCapture({ ...address, doc: entry.id });
          warmed.push({ document: entry.id, ms: performance.now() - before });
        }
        return json({ revision: selectedRevision, warmed });
      } else if (url.pathname === "/compare") {
        if (against === null) throw new Error("A comparison requires an against document");
        const first = PNG.sync.read(await requestCapture(forHumanViewerComparison(address, address.doc)));
        const second = PNG.sync.read(await requestCapture(forHumanViewerComparison(address, against)));
        const compared = composeHumanViewerPixels(first.width, first.height, first.data, second.data);
        const composed = new PNG({ width: compared.width, height: compared.height });
        composed.data.set(compared.data);
        png = PNG.sync.write(composed);
      } else png = await requestCapture(address);
      if (props.readyRevision() !== selectedRevision) throw new Error("Source changed during request");
      request.check();
      response.setHeader("X-Human-Revision", selectedRevision);
      response.setHeader("X-Human-Stale", String(selectedRevision !== props.inventory().revision));
      response.setHeader("X-Viewer-Address", serializeHumanViewerAddress(address));
      response.setHeader("X-Renderer", props.renderer());
      // Time spent behind other requests and waiting out a source rebuild.
      response.setHeader("X-Human-Queue-Position", String(ahead));
      response.setHeader("X-Human-Waited-Ms", String(Math.round(queued + settledMs)));
      response.setHeader("X-Pass-Reading", describeHumanViewerPass(address.pass));
      response.setHeader("X-Human-Build", props.capture.build());
      response.setHeader("X-Render-Ms", (performance.now() - start).toFixed(1));
      if (url.pathname === "/parts") {
        const parts = await request.run(() => props.lifetime.run(() => props.page().evaluate(() =>
          (window as unknown as IHumanViewerWindow).__humanViewer.parts())));
        return json(parts.map((name) => ({ name,
          limitation: "Displayed mesh/material region, not an anatomical partition" })));
      }
      if (url.pathname === "/render" && lane === "bulk" && selectedRevision === props.inventory().revision) {
        const file = props.thumbnailFile(url.search);
        if (file !== null) await writeHumanViewerThumbnail(file, png);
      }
      request.check();
      const before = performance.now();
      response.setHeader("Content-Type", "image/png");
      response.end(png);
      const phases = props.capture.responded({ queueMs: queued,
        responseMs: performance.now() - before, totalMs: performance.now() - received });
      console.log("REQUEST", url.pathname, address.doc, JSON.stringify(Object.fromEntries(
        Object.entries(phases).filter((entry): entry is [string, number] => typeof entry[1] === "number")
          .map(([key, value]) => [key, Math.round(value)]))));
    }, { settle: async () => {
      const began = performance.now();
      await request.run(() => props.settle());
      settledMs += performance.now() - began;
    }, attempts: 4 }) });
  return true;
}
