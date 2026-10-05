import type { HumanViewerAddress } from "./HumanViewerAddress";
import { HumanViewerStartingError } from "./HumanViewerStartingError";
import type { ICreateHumanViewerCaptureProps } from "./ICreateHumanViewerCaptureProps";
import type { IHumanViewerBuildRecord } from "./IHumanViewerBuildRecord";
import type { IHumanViewerCaptureStatus } from "./IHumanViewerCaptureStatus";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild";
import type { IHumanViewerLastRender } from "./IHumanViewerLastRender";
import type { IHumanViewerPhases } from "./IHumanViewerPhases";
import { describeHumanViewerCapture } from "./describeHumanViewerCapture";
import { judgeViewerRenderer } from "./judgeViewerRenderer";
import { readHumanViewerCapture } from "./readHumanViewerCapture.mjs";

/**
 * Own one GPU capture and the telemetry it produces. A capture refuses while
 * the page starts and on a software renderer, draws under the generation the
 * page has ready (the last good build while the newest source fails; the
 * frame's revision says which), and discards a frame whose generation changed
 * while it was drawn. The owner keeps the last render, the last build per
 * domain, every build by document and the source edit still waiting for its
 * first frame; the HTTP layer adds queue and response time to the phases.
 *
 * @evidence contracts/common.md#principled-implementation A frame is accepted only when the generation it was drawn under is still the ready one.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds capture state transitions; the host supplies page and generation through accessors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses software rendering instead of returning its frame.
 * @evidence contracts/common.md#meaningful-documentation States refusals, generation selection, discard and the telemetry kept.
 */
export function createHumanViewerCapture(props: ICreateHumanViewerCaptureProps) {
  let phases: IHumanViewerPhases = {};
  let lastRender: IHumanViewerLastRender | null = null;
  const lastBuild: Record<string, IHumanViewerDomainBuild | undefined> = {};
  const builds: Record<string, IHumanViewerBuildRecord> = {};
  let pendingEditAt: number | null = null;
  return {
    capture: async (address: HumanViewerAddress): Promise<Buffer> => {
      const renderer = props.renderer();
      if (renderer.trim() === "")
        throw new HumanViewerStartingError("The viewer is starting (" + props.startup() + "), retry");
      if (!judgeViewerRenderer(renderer).real)
        throw new Error("A real GPU is required: " + renderer);
      // The page reloaded and has no drawable generation yet: say so at once
      // instead of waiting on a bridge the page does not have.
      if (props.readyRevision() === "")
        throw new HumanViewerStartingError("No source generation is ready (" + props.startup() + "), retry");
      const inventory = props.inventory();
      const ready = props.readyRevision();
      const selectedRevision = ready;
      const started = performance.now();
      const result = await props.lifetime.run(() =>
        readHumanViewerCapture(props.page(), address, props.pageRevision()));
      if (props.readyRevision() !== selectedRevision)
        throw new Error("Source changed during capture; the mixed revision was discarded");
      // Inside the queue slot, so no capture shows a resident while it is released.
      await props.lifetime.run(() => props.trim());
      const decoded = performance.now();
      const bytes = Buffer.from(result.png.split(",")[1], "base64");
      const reading = describeHumanViewerCapture({
        doc: address.doc, ao: address.ao, built: result.built, buildMs: result.buildMs,
        showMs: result.showMs, pngMs: result.pngMs, spans: result.spans, started,
        waited: result.waited, decoded, finished: performance.now(), wallTime: Date.now(),
        pendingEditAt,
      });
      phases = reading.phases;
      const domain = inventory.documents.find((entry) => entry.id === address.doc)?.domain;
      if (reading.lastBuild !== null && reading.build !== null && domain !== undefined) {
        lastBuild[domain] = reading.lastBuild;
        builds[address.doc] = reading.build;
      }
      lastRender = reading.lastRender;
      pendingEditAt = null;
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
    status: (): IHumanViewerCaptureStatus => ({ lastRender, lastBuild, builds }),
  };
}
