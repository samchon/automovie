import {
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
} from "@automovie/interface";

/**
 * Resolve an exact film-global frame or frame-grid second to its latest owning
 * canonical segment and source-shot frame; missing timeline, off-grid time and
 * gaps throw.
 */
export function measureAutoMovieGeometryFilmTime(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "film-time" }>,
): IAutoMovieGeometryResult {
  const timeline: IAutoMovieGeometryMeasurementInput["timeline"] =
    props.timeline;

  if (timeline === null)
    throw new Error(
      "Film-time measurement requires the canonical film timeline of the current compile. Compile a film before resolving film-global time.",
    );

  const raw: number =
    "frame" in request.at
      ? request.at.frame
      : request.at.seconds * timeline.fps;

  const globalFrame: number = Math.round(raw);

  if (
    globalFrame < 0 ||
    globalFrame >= timeline.totalFrames ||
    Math.abs(raw - globalFrame) >
      Number.EPSILON * 64 * Math.max(1, Math.abs(raw))
  )
    throw new Error(
      `Film-global time does not resolve to one current frame in 0..${timeline.totalFrames - 1}. Use an exact frame or frame-grid second.`,
    );

  let segment: (typeof timeline.segments)[number] | undefined;
  for (let index: number = timeline.segments.length - 1; index >= 0; --index) {
    const candidate: (typeof timeline.segments)[number] =
      timeline.segments[index]!;
    if (
      candidate.startFrame <= globalFrame &&
      globalFrame < candidate.endFrame
    ) {
      segment = candidate;
      break;
    }
  }

  if (segment === undefined)
    throw new Error(
      `Film-global frame ${globalFrame} has no owning video segment. Recompile a gap-free canonical timeline.`,
    );

  const sourceFrame: number =
    segment.sourceInFrame + globalFrame - segment.startFrame;

  return {
    kind: "measurement",
    values: {
      film: timeline.id,
      globalFrame,
      globalTime: globalFrame / timeline.fps,
      shot: segment.shot,
      sourceFrame,
      shotTime: sourceFrame / timeline.fps,
      transitionIn: segment.transitionIn.kind,
      transitionOut: segment.transitionOut.kind,
    },
  };
}
