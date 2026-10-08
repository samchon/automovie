/**
 * The GPU routes of the resident viewer: `/render`, `/parts`, `/sheet`,
 * `/compare`, `/warm` and explicit `/export-construction`. Each request is admitted before it waits (a bad
 * lane or an unknown document is refused at once), then runs as one queue
 * entry in its lane and is retried on the settled generation when only a
 * generation change interrupted it.
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerLane } from "./HumanViewerLane";
import type { IHumanViewerConstructionPartsResponse } from "./IHumanViewerConstructionPartsResponse";
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
import { sendHumanViewerPng } from "./sendHumanViewerPng";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail";

const ROUTES = ["/render", "/parts", "/sheet", "/compare", "/warm", "/export-construction"];

/**
 * Answer one GPU route, or return false when the path is not one. A bulk
 * `/render` is served from the thumbnail store when the current revision has
 * drawn it, else from the last good thumbnail marked stale, else drawn. A
 * drawn response names its revision, whether that revision is stale, the
 * renderer, the pass's reading limit, its queue position and wait, and
 * whether the model was cached or built. A frame whose generation changed
 * while it was drawn is refused, never answered as current.
 * `/export-construction` encodes the displayed paired Person through its
 * product viewport and returns binary GLB with the original admission headers.
 * The full admission remains available from `/parts` on the same construction;
 * exporting a refused draft never turns it into an admitted preview.
 *
 * @evidence contracts/common.md#principled-implementation Admission precedes queueing, and only generation-change refusals are retried on the settled generation.
 * @evidence contracts/common.md#clear-and-simple-design One handler owns the GPU routes; capture, queue and page state stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale thumbnails and stale generations are labelled stale rather than served as current.
 * @evidence contracts/common.md#meaningful-documentation States admission, thumbnail order, response provenance and refusal.
 */
export function serveHumanViewerCapture(
  props: IServeHumanViewerCaptureProps,
): boolean {
  const { url, response, json } = props;
  if (!ROUTES.includes(url.pathname)) return false;
  const start = performance.now();
  const lane =
    url.searchParams.get("lane") ?? (url.pathname === "/warm" ? "bulk" : "cli");
  if (lane !== "ui" && lane !== "cli" && lane !== "bulk") {
    response.statusCode = 422;
    json({ error: "lane must be ui, cli or bulk" });
    return true;
  }
  const wanted = [url.searchParams.get("doc"), url.searchParams.get("against")]
    .filter((doc): doc is string => doc !== null);
  if (props.settleDocument !== undefined && wanted.length !== 0) {
    const settleDocument = props.settleDocument;
    void Promise.all([...new Set(wanted)].map((doc) => settleDocument(doc)))
      .then(() => dispatchHumanViewerCapture(props, start, lane))
      .catch((error: unknown) => {
        response.statusCode = 503;
        json({ error: error instanceof Error ? error.message : String(error) });
      });
    return true;
  }
  return dispatchHumanViewerCapture(props, start, lane);
}

/** Dispatch the original GPU operation after its selected document owners have answered. */
function dispatchHumanViewerCapture(
  props: IServeHumanViewerCaptureProps,
  start: number,
  lane: HumanViewerLane,
): boolean {
  const { url, response, json } = props;
  const inventory = props.inventory();
  // A misspelled document fails here, not after a wait in the queue.
  for (const name of ["doc", "against"]) {
    const wanted = url.searchParams.get(name);
    if (
      wanted !== null &&
      url.searchParams.get("axes") === null &&
      !inventory.documents.some((entry) => entry.id === wanted)
    ) {
      // A document awaiting admission (its key moved with the source) is
      // not unknown: it comes back once a page on the current code judges it.
      const pending = inventory.rejected.find(
        (entry) => entry.pending && entry.id === wanted,
      );
      if (pending !== undefined) {
        response.statusCode = 503;
        response.setHeader("Retry-After", "3");
        json({
          error: `${wanted} is awaiting admission (${pending.reason}), retry`,
        });
        return true;
      }
      response.statusCode = 422;
      json({
        error: `Unknown document ${wanted}; ${inventory.documents.length} are published, see /docs`,
      });
      return true;
    }
  }
  if (url.pathname === "/export-construction" &&
      !inventory.documents.some((entry) => entry.id === url.searchParams.get("doc") && entry.domain === "person")) {
    response.statusCode = 422;
    json({ error: "Construction export requires a registered paired Person document." });
    return true;
  }
  if (url.pathname === "/render" && lane === "bulk") {
    const file = props.thumbnailFile(url.search);
    if (file !== null && fs.existsSync(file)) {
      sendHumanViewerPng(response, file, {
        "X-Human-Build": "thumbnail-cache",
        "X-Human-Revision": inventory.revision,
        "X-Human-Stale": "false",
      });
      return true;
    }
    // The new revision has not drawn it yet: show the last good picture, dimmed.
    const older =
      file === null ? null : props.thumbnails.stale(file, inventory.revision);
    if (older !== null) {
      sendHumanViewerPng(response, older, {
        "X-Human-Build": "thumbnail-stale",
        "X-Human-Stale": "true",
      });
      return true;
    }
  }
  const received = performance.now();
  const ahead = humanViewerQueuePosition(props.queue.status(), lane);
  let settledMs = 0;
  void queueHumanViewerRequest({
    queue: props.queue,
    response,
    label: url.pathname + url.search,
    lane,
    task: (request) =>
      retryAcrossHumanViewerGeneration(
        async () => {
          const requestCapture = (address: HumanViewerAddress) =>
            request.run(() => props.capture.capture(address));
          const queued = performance.now() - received;
          // A request that meets a rebuild waits for the settled generation
          // instead of drawing on the one being replaced. With no generation
          // ready at all (starting, reloading, relaunching) it is refused as
          // starting at once instead.
          const serving = props.readyRevision();
          if (serving !== "" && serving !== props.inventory().revision) {
            const began = performance.now();
            await request.run(() => props.settle());
            settledMs += performance.now() - began;
          }
          const current = props.inventory();
          const fields = new URLSearchParams(url.search);
          if (url.pathname === "/export-construction") fields.set("operation", "construct");
          fields.delete("lane");
          const axes = fields.get("axes");
          fields.delete("axes");
          const against = fields.get("against");
          fields.delete("against");
          if (url.pathname === "/sheet" && !fields.has("size"))
            fields.set("size", "320");
          applyHumanViewerPose(fields, (file) =>
            fs.readFileSync(
              path.join(
                props.root,
                "test/studies/human-face/connected-basis/global-face/population",
                file + ".json",
              ),
              "utf8",
            ),
          );
          const address = parseHumanViewerAddress(fields.toString());
          const ready = props.readyRevision();
          const selectedRevision = ready === "" ? current.revision : ready;
          let png: Buffer;
          if (url.pathname === "/sheet") {
            if (axes === null) throw new Error("A sheet requires review axes");
            png = await request.run(() =>
              props.lifetime.run(() =>
                renderHumanViewerSheet({
                  page: props.page(),
                  capture: requestCapture,
                  revision: props.readyRevision,
                  cells: planHumanViewerSheet(
                    address,
                    axes,
                    current.documents.map((entry) => entry.id),
                  ),
                }),
              ),
            );
          } else if (url.pathname === "/warm") {
            const warmed = [];
            for (const entry of current.documents.filter(
              (entry) => entry.domain === "face",
            )) {
              const before = performance.now();
              await requestCapture({ ...address, doc: entry.id });
              warmed.push({
                document: entry.id,
                ms: performance.now() - before,
              });
            }
            return json({ revision: selectedRevision, warmed });
          } else if (url.pathname === "/compare") {
            if (against === null)
              throw new Error("A comparison requires an against document");
            const first = PNG.sync.read(
              await requestCapture(
                forHumanViewerComparison(address, address.doc),
              ),
            );
            const second = PNG.sync.read(
              await requestCapture(forHumanViewerComparison(address, against)),
            );
            const compared = composeHumanViewerPixels(
              first.width,
              first.height,
              first.data,
              second.data,
            );
            const composed = new PNG({
              width: compared.width,
              height: compared.height,
            });
            composed.data.set(compared.data);
            png = PNG.sync.write(composed);
          } else png = await requestCapture(address);
          if (props.readyRevision() !== selectedRevision)
            throw new Error("Source changed during request");
          request.check();
          response.setHeader("X-Human-Revision", selectedRevision);
          response.setHeader(
            "X-Human-Stale",
            String(selectedRevision !== props.inventory().revision),
          );
          response.setHeader(
            "X-Viewer-Address",
            serializeHumanViewerAddress(address),
          );
          response.setHeader("X-Renderer", props.renderer());
          // Time spent behind other requests and waiting out a source rebuild.
          response.setHeader("X-Human-Queue-Position", String(ahead));
          response.setHeader(
            "X-Human-Waited-Ms",
            String(Math.round(queued + settledMs)),
          );
          response.setHeader(
            "X-Pass-Reading",
            describeHumanViewerPass(address.pass),
          );
          response.setHeader("X-Human-Build", props.capture.build());
          if (url.pathname === "/export-construction") {
            const asset = await request.run(() =>
              props.lifetime.run(() => props.page().evaluate(async () => {
                const result = await (window as unknown as IHumanViewerWindow)
                  .__humanViewer.exportConstruction();
                // FileReader carries bytes through the browser bridge without
                // expanding one GLB into a JavaScript array of numbers.
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result !== "string") {
                      reject(new Error("The exported construction has no binary data URL."));
                      return;
                    }
                    resolve(reader.result);
                  };
                  reader.onerror = () => reject(reader.error ?? new Error("Construction byte transfer failed."));
                  reader.readAsDataURL(new Blob([result.glb], { type: "model/gltf-binary" }));
                });
                return { dataUrl, admission: result.admission };
              })),
            );
            if (props.readyRevision() !== selectedRevision)
              throw new Error("Source changed during request");
            response.setHeader(
              "X-Human-Stale",
              String(selectedRevision !== props.inventory().revision),
            );
            request.check();
            const prefix = "data:model/gltf-binary;base64,";
            if (!asset.dataUrl.startsWith(prefix))
              throw new Error("Construction export did not return its binary GLB.");
            const glb = Buffer.from(asset.dataUrl.slice(prefix.length), "base64");
            response.setHeader("X-Human-Construction-Accepted", String(asset.admission.accepted));
            response.setHeader("X-Human-Construction-Failures", String(asset.admission.failures.length));
            response.setHeader("Content-Type", "model/gltf-binary");
            response.setHeader("Content-Disposition", 'attachment; filename="human-construction.glb"');
            response.setHeader("Content-Length", String(glb.length));
            response.end(glb);
            return;
          }
          if (address.operation === "construct") {
            const admission = await request.run(() =>
              props.lifetime.run(() =>
                props
                  .page()
                  .evaluate(() =>
                    (
                      window as unknown as IHumanViewerWindow
                    ).__humanViewer.admission(),
                  ),
              ),
            );
            if (admission === null)
              throw new Error(
                "Construction observation is missing its admission report.",
              );
            response.setHeader(
              "X-Human-Construction-Accepted",
              String(admission.accepted),
            );
            response.setHeader(
              "X-Human-Construction-Failures",
              String(admission.failures.length),
            );
            if (url.pathname === "/parts") {
              const readings = await request.run(() =>
                props.lifetime.run(() =>
                  props.page().evaluate(() => {
                    const viewer = (window as unknown as IHumanViewerWindow)
                      .__humanViewer;
                    return {
                      parts: viewer.parts(),
                      periocularMappings: viewer.periocularMappings?.(),
                    };
                  }),
                ),
              );
              const parts: IHumanViewerConstructionPartsResponse = {
                admission,
                ...readings,
              };
              return json(parts);
            }
          }
          response.setHeader(
            "X-Render-Ms",
            (performance.now() - start).toFixed(1),
          );
          if (url.pathname === "/parts") {
            const parts = await request.run(() =>
              props.lifetime.run(() =>
                props
                  .page()
                  .evaluate(() =>
                    (
                      window as unknown as IHumanViewerWindow
                    ).__humanViewer.parts(),
                  ),
              ),
            );
            return json(
              parts.map((name) => ({
                name,
                limitation:
                  "Displayed mesh/material region, not an anatomical partition",
              })),
            );
          }
          if (
            url.pathname === "/render" &&
            lane === "bulk" &&
            selectedRevision === props.inventory().revision
          ) {
            const file = props.thumbnailFile(url.search);
            if (file !== null) await writeHumanViewerThumbnail(file, png);
          }
          request.check();
          const before = performance.now();
          response.setHeader("Content-Type", "image/png");
          response.end(png);
          const phases = props.capture.responded({
            queueMs: queued,
            responseMs: performance.now() - before,
            totalMs: performance.now() - received,
          });
          console.log(
            "REQUEST",
            url.pathname,
            address.doc,
            JSON.stringify(
              Object.fromEntries(
                Object.entries(phases)
                  .filter(
                    (entry): entry is [string, number] =>
                      typeof entry[1] === "number",
                  )
                  .map(([key, value]) => [key, Math.round(value)]),
              ),
            ),
          );
        },
        {
          settle: async () => {
            const began = performance.now();
            await request.run(() => props.settle());
            settledMs += performance.now() - began;
          },
          attempts: 4,
        },
      ),
  });
  return true;
}
