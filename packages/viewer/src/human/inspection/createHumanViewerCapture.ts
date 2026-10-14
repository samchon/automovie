import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import { HumanViewerStartingError } from "./HumanViewerStartingError.js";
import type { ICreateHumanViewerCaptureProps } from "./ICreateHumanViewerCaptureProps.js";
import type { IHumanViewerBuildRecord } from "./IHumanViewerBuildRecord.js";
import type { IHumanViewerCaptureStatus } from "./IHumanViewerCaptureStatus.js";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild.js";
import type { IHumanViewerLastRender } from "./IHumanViewerLastRender.js";
import type { IHumanViewerPhases } from "./IHumanViewerPhases.js";
import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import { describeHumanViewerCapture } from "./describeHumanViewerCapture.js";
import { judgeViewerRenderer } from "./judgeViewerRenderer.js";
import { readHumanViewerCapture } from "./readHumanViewerCapture.mjs";

/**
 * Own capture telemetry under the page's reported ready generation. Empty readiness or a renderer string refused by judgeViewerRenderer prevents capture; drawing and final trimming must preserve that generation. Renderer-string classification is not independent hardware/display observation, and a fallback gl.RENDERER string can lack unmasked device detail. Keep one last render, the latest build per domain and document, and the edit waiting for its first current frame; document records follow the last captured catalogue and stale frames do not consume that edit timing.
 *
 * The checks contribute ready-source, renderer and original-page capture admission. Complete canonical runtime identity and required font, decoder and requested-pass closure remain with the capture profile owner.
 *
 * @evidence contracts/common.md#principled-implementation Capture requires nonempty page readiness and a reported renderer string accepted by the existing classifier, then runs room/page/trim under the lifetime and rejects changed source authority after drawing/final trim; these checks do not independently prove hardware display validity.
 * @evidence contracts/common.md#clear-and-simple-design GPU capture and measured phases stay with this owner while queue/HTTP timings, source authority and physical renderer recovery remain supplied responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale last-good capture is not the first frame of a newer source edit, and untrusted document ids use a prototype-free record rather than overwriting object internals.
 * @evidence contracts/common.md#meaningful-documentation The comment defines source and renderer-string admission with its unmasked/fallback observation limit, stale-frame behavior, telemetry scope, latest per-document retention and pending-edit timing.
 * @evidence contracts/performance.md#efficient-algorithms Capture includes numerical/GPU work plus PNG decode; one initial document lookup chooses the domain, and pruning scans current document ids and retained build records once without a second domain search.
 * @evidence contracts/performance.md#reuse-equivalent-work Numerical/model cache reuse is reported by the actual page result; this coordinator does not merge capture effects, and edit timing is consumed only by the matching current-source completion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Renderer dispatch remains owned until lifetime settlement; telemetry retains one last render, three domain slots and at most the last captured catalogue's document records, with transient PNG bytes returned to the caller.
 */
export function createHumanViewerCapture(
  props: ICreateHumanViewerCaptureProps,
): {
  capture: (address: HumanViewerAddress) => Promise<Buffer>;
  edited: (at: number) => void;
  responded: (http: IHumanViewerPhases) => IHumanViewerPhases;
  build: () => string;
  status: () => IHumanViewerCaptureStatus;
} {
  let phases: IHumanViewerPhases = {};
  let lastRender: IHumanViewerLastRender | null = null;
  const lastBuild: Record<string, IHumanViewerDomainBuild | undefined> = {};
  const builds: Record<string, IHumanViewerBuildRecord> = Object.create(null) as Record<string, IHumanViewerBuildRecord>;
  let pendingEditAt: number | null = null;
  return {
    capture: async (address: HumanViewerAddress): Promise<Buffer> => {
      const renderer: string = props.renderer();
      if (renderer.trim() === "")
        throw new HumanViewerStartingError(
          "The viewer is starting (" + props.startup() + "), retry",
        );
      if (!judgeViewerRenderer(renderer).real)
        throw new Error("A real GPU is required: " + renderer);
      // The page reloaded and has no drawable generation yet: say so at once
      // instead of waiting on a bridge the page does not have.
      if (props.readyRevision() === "")
        throw new HumanViewerStartingError(
          "No source generation is ready (" + props.startup() + "), retry",
        );
      const inventory: ReturnType<ICreateHumanViewerCaptureProps["inventory"]> = props.inventory();
      const selectedRevision: string = props.readyRevision();
      const started: number = performance.now();
      const shownDomain: IHumanViewerCatalogueEntry["domain"] | undefined = inventory.documents.find(
        (entry: IHumanViewerCatalogueEntry): boolean => entry.id === address.doc,
      )?.domain;
      // Room for the build's transient copies is made before it starts.
      // Transport failure is owned by the capture lifetime, without a deadline.
      const stages: ICreateHumanViewerCaptureProps["stages"] = props.stages;
      if (shownDomain !== undefined)
        await stages.run(
          "room",
          address.doc,
          (): Promise<void> => props.lifetime.run((): Promise<void> => props.makeRoom(shownDomain)),
        );
      const result: Awaited<ReturnType<typeof readHumanViewerCapture>> = await stages.run(
        "page",
        address.doc,
        (): ReturnType<typeof readHumanViewerCapture> =>
          props.lifetime.run((): ReturnType<typeof readHumanViewerCapture> =>
            readHumanViewerCapture(props.page(), address, props.pageRevision()),
          ),
      );
      if (shownDomain !== undefined) props.learnRoom(shownDomain);
      if (props.readyRevision() !== selectedRevision)
        throw new Error(
          "Source changed during capture; the mixed revision was discarded",
        );
      // Inside the queue slot, so no capture shows a resident while it is released.
      await stages.run(
        "trim",
        address.doc,
        (): Promise<void> => props.lifetime.run((): Promise<void> => props.trim()),
      );
      if (props.readyRevision() !== selectedRevision)
        throw new Error("Source changed during capture; the mixed revision was discarded");
      const decoded: number = performance.now();
      const bytes: Buffer = Buffer.from(result.png.split(",")[1], "base64");
      const completedEditAt: number | null = selectedRevision === props.inventory().revision ? pendingEditAt : null;
      const reading: ReturnType<typeof describeHumanViewerCapture> = describeHumanViewerCapture({
        doc: address.doc,
        ao: address.ao,
        built: result.built,
        buildMs: result.buildMs,
        showMs: result.showMs,
        pngMs: result.pngMs,
        spans: result.spans,
        started,
        waited: result.waited,
        decoded,
        finished: performance.now(),
        wallTime: Date.now(),
        pendingEditAt: completedEditAt,
      });
      phases = reading.phases;
      const known: Set<string> = new Set<string>(inventory.documents.map((entry: IHumanViewerCatalogueEntry): string => entry.id));
      for (const id of Object.keys(builds)) if (!known.has(id)) delete builds[id];
      if (
        reading.lastBuild !== null &&
        reading.build !== null &&
        shownDomain !== undefined
      ) {
        lastBuild[shownDomain] = reading.lastBuild;
        builds[address.doc] = reading.build;
      }
      lastRender = reading.lastRender;
      if (completedEditAt !== null && pendingEditAt === completedEditAt) pendingEditAt = null;
      return bytes;
    },

    /** Record that a source edit reached a build, so the next frame reports its delay. */
    edited: (at: number): void => {
      pendingEditAt = at;
    },

    /** Add the HTTP layer's durations to the last capture's phases and return them. */
    responded: (http: IHumanViewerPhases): IHumanViewerPhases => {
      phases = { ...phases, ...http };
      if (lastRender !== null) lastRender.phases = phases;
      return phases;
    },

    /** Whether the last capture used a cached or freshly built model. */
    build: (): string => lastRender?.build ?? "unknown",

    /** Telemetry for `/health`. */
    status: (): IHumanViewerCaptureStatus => ({
      lastRender,
      lastBuild,
      builds,
    }),
  };
}
