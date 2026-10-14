import type { IHumanViewerCaptureStatus } from "./IHumanViewerCaptureStatus.js";
import type { IHumanViewerDomainBuild } from "./IHumanViewerDomainBuild.js";
import type { IHumanViewerPhases } from "./IHumanViewerPhases.js";

/**
 * Project actual capture measurements into health telemetry. Server monotonic timestamps form durations; wall-clock time locates builds and source edits. A GPU cache hit contributes zero numerical build time even when the worker still remembers the preceding document's build duration.
 *
 * @evidence contracts/common.md#principled-implementation Duration differences use supplied monotonic timestamps, wall time locates actual builds and edits, and built count distinguishes cache hits from numerical work.
 * @evidence contracts/common.md#clear-and-simple-design One phases record feeds the last-render telemetry, with optional build records created only when numerical work occurred.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached display contributes zero build time rather than borrowing an earlier worker duration, and absent edit time stays null.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes duration and wall-clock authorities and explains numerical-cache attribution.
 * @evidence contracts/performance.md#efficient-algorithms Span durations are summed once in linear work in stage count; all remaining projection fields require constant-time arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every projection describes supplied measurements for one capture and retains no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned telemetry shares the supplied spans record and phases object; no task, image bytes or process resource is retained by this stateless projection.
 */
export function describeHumanViewerCapture(props: {
  doc: string;
  ao: boolean;
  built: number;
  buildMs: number;
  showMs: number;
  pngMs: number;
  spans?: Record<string, number>;
  started: number;
  waited: number;
  decoded: number;
  finished: number;
  wallTime: number;
  pendingEditAt: number | null;
}): {
  phases: IHumanViewerPhases;
  lastRender: NonNullable<IHumanViewerCaptureStatus["lastRender"]>;
  lastBuild: IHumanViewerDomainBuild | null;
  build: { ms: number; ao: boolean; at: string } | null;
} {
  const phases: IHumanViewerPhases = {
    pageWaitMs: props.waited - props.started,
    showMs: props.showMs,
    buildMs: props.built === 0 ? 0 : props.buildMs,
    pngMs: props.pngMs,
    spans: props.spans ?? {},
    otherMs: Math.max(
      0,
      props.showMs -
        Object.values(props.spans ?? {}).reduce(
          (sum: number, ms: number): number => sum + ms,
          0,
        ),
    ),
    decodeMs: props.finished - props.decoded,
  };
  return {
    phases,
    lastRender: {
      doc: props.doc,
      ms: props.finished - props.started,
      build: props.built === 0 ? ("cache" as const) : ("built" as const),
      sinceEditMs:
        props.pendingEditAt === null
          ? null
          : props.wallTime - props.pendingEditAt,
      phases,
    },
    lastBuild: props.built === 0 ? null : { doc: props.doc, ms: props.buildMs },
    build:
      props.built === 0
        ? null
        : {
            ms: props.buildMs,
            ao: props.ao,
            at: new Date(props.wallTime).toISOString(),
          },
  };
}
