import { AutoMovieGeometryQuery, IAutoMovieGeometryResult } from "@automovie/interface";
import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";


/**
 * Resolve an exact film-global frame or frame-grid second to its latest owning canonical segment and source-shot frame; missing timeline, off-grid time and gaps throw.
 *
 * @evidence contracts/common.md#principled-implementation Rounds seconds times FPS only within 64 machine epsilons scaled to frame magnitude, requires a safe integer in [0,totalFrames), then scans backwards so overlap ownership matches the latest canonical segment.
 * @evidence contracts/common.md#clear-and-simple-design A single adapter owns exact-grid admission, segment ownership and source-in offset arithmetic without rebuilding the canonical timeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-frame approximation is accepted beyond roundoff tolerance and no segment is invented for a timeline gap.
 * @evidence contracts/common.md#meaningful-documentation States exact frame-grid interpretation, latest overlap owner, source-shot clock and failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Backwards segment search is O(segment count) worst case with constant auxiliary space; it avoids copying and reversing the timeline to find the last owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Frame arithmetic and the selected segment are shared across all result fields; no cached ownership assumes timeline edits preserve boundaries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed timeline is not mutated or retained; only ids, numbers and transition-kind strings escape.
 */
export function measureAutoMovieGeometryFilmTime(props: IAutoMovieGeometryMeasurementInput, request: Extract<AutoMovieGeometryQuery, { query: "film-time" }>): IAutoMovieGeometryResult {

      const timeline: IAutoMovieGeometryMeasurementInput["timeline"] = props.timeline;

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
        Number.isFinite(raw) === false ||
        Number.isSafeInteger(globalFrame) === false ||
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
        const candidate: (typeof timeline.segments)[number] = timeline.segments[index]!;
        if (candidate.startFrame <= globalFrame && globalFrame < candidate.endFrame) {
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

