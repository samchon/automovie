import type { IHumanViewerPhases } from "./IHumanViewerPhases.js";

/**
 * Project actual capture measurements into health telemetry. Server monotonic
 * timestamps form durations; wall-clock time locates builds and source edits.
 * A GPU cache hit contributes zero numerical build time even when the worker
 * still remembers the preceding document's build duration.
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
}) {
  const phases: IHumanViewerPhases = {
    pageWaitMs: props.waited - props.started,
    showMs: props.showMs,
    buildMs: props.built === 0 ? 0 : props.buildMs,
    pngMs: props.pngMs,
    spans: props.spans ?? {},
    otherMs: Math.max(
      0,
      props.showMs -
        Object.values(props.spans ?? {}).reduce((sum, ms) => sum + ms, 0),
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
