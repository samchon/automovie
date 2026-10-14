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

import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerLane } from "./HumanViewerLane.js";
import type { IHumanViewerConstructionPartsResponse } from "./IHumanViewerConstructionPartsResponse.js";
import type { IHumanViewerConstructionReadout } from "./IHumanViewerConstructionReadout.js";
import type { IHumanViewerConstructionTransfer } from "./IHumanViewerConstructionTransfer.js";
import type { IHumanViewerQueuedRequest } from "./IHumanViewerQueuedRequest.js";
import type { HumanViewerHandle } from "./HumanViewerHandle.js";
import type { IHumanViewerWindow } from "./IHumanViewerWindow.js";
import type { IServeHumanViewerCaptureProps } from "./IServeHumanViewerCaptureProps.js";
import { applyHumanViewerPose } from "./applyHumanViewerPose.js";
import { composeHumanViewerPixels } from "./composeHumanViewerPixels.js";
import { describeHumanViewerPass } from "./describeHumanViewerPass.js";
import { forHumanViewerComparison } from "./forHumanViewerComparison.js";
import { humanViewerQueuePosition } from "./humanViewerQueuePosition.js";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress.js";
import { planHumanViewerSheet } from "./planHumanViewerSheet.js";
import { queueHumanViewerRequest } from "./queueHumanViewerRequest.js";
import { renderHumanViewerSheet } from "./renderHumanViewerSheet.mjs";
import { retryAcrossHumanViewerGeneration } from "./retryAcrossHumanViewerGeneration.js";
import { sendHumanViewerPng } from "./sendHumanViewerPng.js";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress.js";
import { writeHumanViewerThumbnail } from "./writeHumanViewerThumbnail.js";

const ROUTES: readonly string[] = ["/render", "/parts", "/sheet", "/compare", "/warm", "/export-construction"];

/**
 * Answer one GPU route, or return false when the path is not one. A bulk `/render` is served from the thumbnail store when the current revision has drawn it, else from the last good thumbnail marked stale, else drawn. A drawn response names its revision, whether that revision is stale, the renderer, the pass's reading limit, its queue position and wait, and whether the model was cached or built. A frame whose generation changed while it was drawn is refused, never answered as current. `/export-construction` encodes the displayed paired Person through its product viewport and returns binary GLB with the original admission headers. The full admission remains available from `/parts` on the same construction; exporting a refused draft never turns it into an admitted preview.
 *
 * @evidence contracts/common.md#principled-implementation Admits existing GPU routes and selected documents before queuing, then uses guarded resident capture with final generation/address checks and unchanged product construction admission.
 * @evidence contracts/common.md#clear-and-simple-design The public dispatcher owns route/lane/selected-document admission while the private dispatcher composes queue, lifetime, PNG, sheet and construction response owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown inputs refuse before waiting, stale thumbnails are labeled, source transitions alone are retried and exporting a rejected construction preserves its refusal.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies lane admission, current/stale thumbnails, reading limits, paired-Person export and final source checks; mesh parts remain observation names rather than anatomical partitions.
 * @evidence contracts/performance.md#efficient-algorithms Admission scans catalogue entries and actual route work costs selected pixels/cells/parts or exported GLB bytes; one queue slot serializes resident-page effects and composition necessarily reads its requested frames.
 * @evidence contracts/performance.md#reuse-equivalent-work Bulk thumbnails require current query/revision/document authority or are explicitly stale; numerical/resident reuse stays with capture ownership and exports remain individual guarded effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Client binding and logical queue-slot ownership last through guarded task settlement; host-reported lifetime signals are not independent OS/GPU termination proof. Temporary PNG/base64/GLB buffers last through response and have no independent aggregate-byte cap here.
 */
export function serveHumanViewerCapture(
  props: IServeHumanViewerCaptureProps,
): boolean {
  const { url, response, json }: Pick<IServeHumanViewerCaptureProps, "url" | "response" | "json"> = props;
  if (!ROUTES.includes(url.pathname)) return false;
  const start: number = performance.now();
  const lane: string =
    url.searchParams.get("lane") ?? (url.pathname === "/warm" ? "bulk" : "cli");
  if (lane !== "ui" && lane !== "cli" && lane !== "bulk") {
    response.statusCode = 422;
    json({ error: "lane must be ui, cli or bulk" });
    return true;
  }
  const wanted: string[] = [url.searchParams.get("doc"), url.searchParams.get("against")]
    .filter((doc: string | null): doc is string => doc !== null);
  if (props.settleDocument !== undefined && wanted.length !== 0) {
    const settleDocument: NonNullable<IServeHumanViewerCaptureProps["settleDocument"]> = props.settleDocument;
    void Promise.all([...new Set(wanted)].map((doc: string): ReturnType<typeof settleDocument> => settleDocument(doc)))
      .then((): boolean => dispatchHumanViewerCapture(props, start, lane))
      .catch((error: unknown): void => {
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
  const { url, response, json }: Pick<IServeHumanViewerCaptureProps, "url" | "response" | "json"> = props;
  const inventory: ReturnType<IServeHumanViewerCaptureProps["inventory"]> = props.inventory();
  // A misspelled document fails here, not after a wait in the queue.
  for (const name of ["doc", "against"]) {
    const wanted: string | null = url.searchParams.get(name);
    if (
      wanted !== null &&
      url.searchParams.get("axes") === null &&
      !inventory.documents.some((entry: (typeof inventory.documents)[number]): boolean => entry.id === wanted)
    ) {
      // A document awaiting admission (its key moved with the source) is
      // not unknown: it comes back once a page on the current code judges it.
      const pending: (typeof inventory.rejected)[number] | undefined = inventory.rejected.find(
        (entry: (typeof inventory.rejected)[number]): boolean | undefined => entry.pending && entry.id === wanted,
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
      !inventory.documents.some((entry: (typeof inventory.documents)[number]): boolean => entry.id === url.searchParams.get("doc") && entry.domain === "person")) {
    response.statusCode = 422;
    json({ error: "Construction export requires a registered paired Person document." });
    return true;
  }
  if (url.pathname === "/render" && lane === "bulk") {
    const file: string | null = props.thumbnailFile(url.search);
    if (file !== null && fs.existsSync(file)) {
      sendHumanViewerPng(response, file, {
        "X-Human-Build": "thumbnail-cache",
        "X-Human-Revision": inventory.revision,
        "X-Human-Stale": "false",
      });
      return true;
    }
    // The new revision has not drawn it yet: show the last good picture, dimmed.
    const older: string | null =
      file === null ? null : props.thumbnails.stale(file, inventory.revision);
    if (older !== null) {
      sendHumanViewerPng(response, older, {
        "X-Human-Build": "thumbnail-stale",
        "X-Human-Stale": "true",
      });
      return true;
    }
  }
  const received: number = performance.now();
  const ahead: number = humanViewerQueuePosition(props.queue.status(), lane);
  let settledMs: number = 0;
  void queueHumanViewerRequest({
    queue: props.queue,
    response,
    label: url.pathname + url.search,
    lane,
    task: (request: IHumanViewerQueuedRequest): Promise<void> =>
      retryAcrossHumanViewerGeneration(
        async (): Promise<void> => {
          const requestCapture: (address: HumanViewerAddress) => Promise<Buffer> = (address: HumanViewerAddress): Promise<Buffer> =>
            request.run((): Promise<Buffer> => props.capture.capture(address));
          const queued: number = performance.now() - received;
          // A request that meets a rebuild waits for the settled generation
          // instead of drawing on the one being replaced. With no generation
          // ready at all (starting, reloading, relaunching) it is refused as
          // starting at once instead.
          const serving: string = props.readyRevision();
          if (serving !== "" && serving !== props.inventory().revision) {
            const began: number = performance.now();
            await request.run((): Promise<void> => props.settle());
            settledMs += performance.now() - began;
          }
          const current: ReturnType<IServeHumanViewerCaptureProps["inventory"]> = props.inventory();
          const fields: URLSearchParams = new URLSearchParams(url.search);
          if (url.pathname === "/export-construction") fields.set("operation", "construct");
          fields.delete("lane");
          const axes: string | null = fields.get("axes");
          fields.delete("axes");
          const against: string | null = fields.get("against");
          fields.delete("against");
          if (url.pathname === "/sheet" && !fields.has("size"))
            fields.set("size", "320");
          applyHumanViewerPose(fields, (file: string): string =>
            fs.readFileSync(
              path.join(
                props.cameraPosesDirectory,
                file + ".json",
              ),
              "utf8",
            ),
          );
          const address: HumanViewerAddress = parseHumanViewerAddress(fields.toString(), current.documents[0]?.id);
          const ready: string = props.readyRevision();
          const selectedRevision: string = ready === "" ? current.revision : ready;
          let png: Buffer;
          if (url.pathname === "/sheet") {
            if (axes === null) throw new Error("A sheet requires review axes");
            png = await request.run((): Promise<Buffer> =>
              props.lifetime.run((): Promise<Buffer> =>
                renderHumanViewerSheet({
                  page: props.page(),
                  capture: requestCapture,
                  revision: props.readyRevision,
                  cells: planHumanViewerSheet(
                    address,
                    axes,
                    current.documents.map((entry: (typeof current.documents)[number]): string => entry.id),
                  ),
                }),
              ),
            );
          } else if (url.pathname === "/warm") {
            const warmed: { document: string; ms: number }[] = [];
            for (const entry of current.documents.filter(
              (entry: (typeof current.documents)[number]): boolean => entry.domain === "face",
            )) {
              const before: number = performance.now();
              await requestCapture({ ...address, doc: entry.id });
              warmed.push({
                document: entry.id,
                ms: performance.now() - before,
              });
            }
            if (props.readyRevision() !== selectedRevision)
              throw new Error("Source changed during request");
            request.check();
            response.setHeader("X-Human-Revision", selectedRevision);
            response.setHeader("X-Human-Stale", String(selectedRevision !== props.inventory().revision));
            return json({ revision: selectedRevision, warmed });
          } else if (url.pathname === "/compare") {
            if (against === null)
              throw new Error("A comparison requires an against document");
            const first: ReturnType<typeof PNG.sync.read> = PNG.sync.read(
              await requestCapture(
                forHumanViewerComparison(address, address.doc),
              ),
            );
            const second: ReturnType<typeof PNG.sync.read> = PNG.sync.read(
              await requestCapture(forHumanViewerComparison(address, against)),
            );
            const compared: ReturnType<typeof composeHumanViewerPixels> = composeHumanViewerPixels(
              first.width,
              first.height,
              first.data,
              second.data,
            );
            const composed: PNG = new PNG({
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
            const asset: IHumanViewerConstructionTransfer = await request.run((): Promise<IHumanViewerConstructionTransfer> =>
              props.lifetime.run((): Promise<IHumanViewerConstructionTransfer> => props.page().evaluate(async (): Promise<IHumanViewerConstructionTransfer> => {
                const viewer: HumanViewerHandle = (window as unknown as IHumanViewerWindow).__humanViewer;
                const before: IHumanViewerConstructionTransfer["before"] = {
                  address: structuredClone(viewer.address()), revision: viewer.revision(),
                };
                const result: Awaited<ReturnType<HumanViewerHandle["exportConstruction"]>> = await viewer.exportConstruction();
                // FileReader carries bytes through the browser bridge without
                // expanding one GLB into a JavaScript array of numbers.
                const dataUrl: string = await new Promise<string>((resolve: (value: string) => void, reject: (error: unknown) => void): void => {
                  const reader: FileReader = new FileReader();
                  reader.onload = (): void => {
                    if (typeof reader.result !== "string") {
                      reject(new Error("The exported construction has no binary data URL."));
                      return;
                    }
                    resolve(reader.result);
                  };
                  reader.onerror = (): void => reject(reader.error ?? new Error("Construction byte transfer failed."));
                  reader.readAsDataURL(new Blob([result.glb], { type: "model/gltf-binary" }));
                });
                return {
                  dataUrl, admission: result.admission, before,
                  after: { address: structuredClone(viewer.address()), revision: viewer.revision() },
                };
              })),
            );
            if (props.readyRevision() !== selectedRevision ||
                asset.before.revision !== selectedRevision || asset.after.revision !== selectedRevision)
              throw new Error("Source changed during request");
            if ([asset.before.address, asset.after.address].some((observed: HumanViewerAddress): boolean =>
                serializeHumanViewerAddress(observed) !== serializeHumanViewerAddress(address)))
              throw new Error("Displayed selection changed during construction export.");
            response.setHeader(
              "X-Human-Stale",
              String(selectedRevision !== props.inventory().revision),
            );
            request.check();
            const prefix: string = "data:model/gltf-binary;base64,";
            if (!asset.dataUrl.startsWith(prefix))
              throw new Error("Construction export did not return its binary GLB.");
            const glb: Buffer = Buffer.from(asset.dataUrl.slice(prefix.length), "base64");
            response.setHeader("X-Human-Construction-Accepted", String(asset.admission.accepted));
            response.setHeader("X-Human-Construction-Failures", String(asset.admission.failures.length));
            response.setHeader("Content-Type", "model/gltf-binary");
            response.setHeader("Content-Disposition", 'attachment; filename="human-construction.glb"');
            response.setHeader("Content-Length", String(glb.length));
            response.end(glb);
            return;
          }
          if (address.operation === "construct") {
            if (url.pathname === "/parts") {
              // Read the completed resident's identity, admission and values
              // together. A page or selection changed after capture refuses.
              const readings: IHumanViewerConstructionReadout = await request.run((): Promise<IHumanViewerConstructionReadout> =>
                props.lifetime.run((): Promise<IHumanViewerConstructionReadout> =>
                  props.page().evaluate((): IHumanViewerConstructionReadout => {
                    const viewer: HumanViewerHandle = (window as unknown as IHumanViewerWindow)
                      .__humanViewer;
                    return {
                      revision: viewer.revision(),
                      address: viewer.address(),
                      admission: viewer.admission(),
                      parts: viewer.parts(),
                      periocularMappings: viewer.periocularMappings?.(),
                      rigReading: viewer.rigReading?.(),
                    };
                  }),
                ),
              );
              if (readings.revision !== selectedRevision ||
                  props.readyRevision() !== selectedRevision)
                throw new Error("Source changed during request");
              if (serializeHumanViewerAddress(readings.address) !==
                  serializeHumanViewerAddress(address))
                throw new Error("Displayed selection changed during construction observation.");
              if (readings.admission === null)
                throw new Error("Construction observation is missing its admission report.");
              request.check();
              response.setHeader("X-Human-Stale", String(selectedRevision !== props.inventory().revision));
              response.setHeader("X-Human-Construction-Accepted", String(readings.admission.accepted));
              response.setHeader("X-Human-Construction-Failures", String(readings.admission.failures.length));
              const parts: IHumanViewerConstructionPartsResponse = {
                ...readings,
                admission: readings.admission,
              };
              return json(parts);
            }
            const admission: ReturnType<HumanViewerHandle["admission"]> = await request.run((): Promise<ReturnType<HumanViewerHandle["admission"]>> =>
              props.lifetime.run((): Promise<ReturnType<HumanViewerHandle["admission"]>> =>
                props
                  .page()
                  .evaluate((): ReturnType<HumanViewerHandle["admission"]> =>
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
            if (props.readyRevision() !== selectedRevision)
              throw new Error("Source changed during request");
            request.check();
            response.setHeader(
              "X-Human-Construction-Accepted",
              String(admission.accepted),
            );
            response.setHeader(
              "X-Human-Construction-Failures",
              String(admission.failures.length),
            );
          }
          response.setHeader(
            "X-Render-Ms",
            (performance.now() - start).toFixed(1),
          );
          if (url.pathname === "/parts") {
            const parts: string[] = await request.run((): Promise<string[]> =>
              props.lifetime.run((): Promise<string[]> =>
                props
                  .page()
                  .evaluate((): string[] =>
                    (
                      window as unknown as IHumanViewerWindow
                    ).__humanViewer.parts(),
                  ),
              ),
            );
            if (props.readyRevision() !== selectedRevision)
              throw new Error("Source changed during request");
            request.check();
            response.setHeader("X-Human-Stale", String(selectedRevision !== props.inventory().revision));
            return json(
              parts.map((name: string): { name: string; limitation: string } => ({
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
            const file: string | null = props.thumbnailFile(url.search);
            if (file !== null) await writeHumanViewerThumbnail(file, png);
          }
          if (props.readyRevision() !== selectedRevision)
            throw new Error("Source changed during request");
          request.check();
          // Final async work may have observed an inventory edit while the
          // same last-good page remains drawable. Label that page truthfully.
          response.setHeader("X-Human-Stale", String(selectedRevision !== props.inventory().revision));
          const before: number = performance.now();
          response.setHeader("Content-Type", "image/png");
          response.end(png);
          const phases: ReturnType<IServeHumanViewerCaptureProps["capture"]["responded"]> = props.capture.responded({
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
                    (entry: [string, unknown]): entry is [string, number] =>
                      typeof entry[1] === "number",
                  )
                  .map(([key, value]: [string, number]): [string, number] => [key, Math.round(value)]),
              ),
            ),
          );
        },
        {
          settle: async (): Promise<void> => {
            const began: number = performance.now();
            await request.run((): Promise<void> => props.settle());
            settledMs += performance.now() - began;
          },
          attempts: 4,
        },
      ),
  });
  return true;
}
