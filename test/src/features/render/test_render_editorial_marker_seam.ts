import { cutSequence } from "@automovie/engine";
import type {
  IAutoMovieEditorialMarker,
  IAutoMoviePlaybackEditorialMarker,
  IAutoMovieShot,
} from "@automovie/interface";
import { planSequenceRender } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Render planning keeps one owner for each same-shot decimal seam.
 *
 * Scenarios:
 * 1. A hard cut at source 0.3 after a trim from 0.1 of duration 0.2 assigns the seam point only to the incoming entry.
 * 2. Distinct representable points immediately on either side survive, and a replay retains the seam point in its own entry.
 * 3. Playing the whole source and replaying its last representable interval keeps both occurrences of the tail marker.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads editorial markers from a public render manifest after admitting the cut through cutSequence.
 * @evidence contracts/development/testing.md#independent-expectations The first entry lasts 0.2 output seconds. The incoming and repeated 0.25-second plays start at 0.2 and 0.45, and both retain a point at their exact source start of 0.3.
 * @evidence contracts/development/testing.md#distinguishing-cases The decimal endpoint rounds upward and brackets an exact seam with neighboring source doubles, detecting both duplicated ownership and epsilon-based marker loss.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous spec runs the edit and render planners without writing frames or opening a host.
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the source seam, neighboring doubles, retained replay and an explicit tail inside the full play.
 */
export function test_render_editorial_marker_seam(): void {
  const before: number = 0.29999999999999993;
  const seam: number = 0.3;
  const after: number = 0.30000000000000004;
  const markers: IAutoMovieEditorialMarker[] = [
    { id: "before", label: "Before", startSeconds: before, endSeconds: before },
    { id: "seam", label: "Seam", startSeconds: seam, endSeconds: seam },
    { id: "after", label: "After", startSeconds: after, endSeconds: after },
  ];
  const shot: IAutoMovieShot = {
    id: "scene-take",
    name: null,
    scene: "scene",
    camera: "camera",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    editorialMarkers: markers,
    duration: 1,
  };
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "decimal-seam", name: "Decimal seam" },
      fps: 24,
      entries: [
        {
          shot: shot.id,
          trim: { start: 0.1, duration: 0.2 },
          transition: null,
        },
        {
          shot: shot.id,
          trim: { start: 0.3, duration: 0.25 },
          transition: null,
        },
        {
          shot: shot.id,
          trim: { start: 0.3, duration: 0.25 },
          transition: null,
        },
      ],
      pacing: "Keep both dialogue beats.",
      continuity: "Replay the second beat.",
    },
    [shot],
  );
  if (cut.success !== true) throw new Error("cut must succeed");
  const render: ReturnType<typeof planSequenceRender> = planSequenceRender({
    sequence: cut.sequence,
    shots: [shot],
    spec: {
      target: cut.sequence.id,
      frameFormat: { fps: 24, width: 640, height: 360 },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 20,
    },
  });
  const projected: IAutoMoviePlaybackEditorialMarker[] =
    render.editorialMarkers ?? [];
  TestValidator.equals(
    "each source double survives only in its respective plays",
    projected.map(
      (marker: IAutoMoviePlaybackEditorialMarker): string =>
        `${marker.entry}:${marker.id}`,
    ),
    ["0:before", "1:seam", "1:after", "2:seam", "2:after"],
  );
  TestValidator.predicate(
    "source identities and replay clocks are retained",
    projected[0]!.startSeconds < projected[1]!.startSeconds &&
      projected[1]!.startSeconds < projected[2]!.startSeconds &&
      nclose(projected[1]!.outputStartSeconds, 0.2) &&
      nclose(projected[3]!.outputStartSeconds, 0.45),
  );

  const tail: number = 0.9999999999999999;
  const tailShot: IAutoMovieShot = {
    ...shot,
    editorialMarkers: [
      { id: "tail", label: "Tail", startSeconds: tail, endSeconds: tail },
    ],
  };
  const replay = cutSequence(
    {
      sequence: { id: "tail-replay", name: "Tail replay" },
      fps: 24,
      entries: [
        { shot: shot.id, trim: null, playbackRate: 4, transition: null },
        {
          shot: shot.id,
          trim: { start: tail, duration: 1 - tail },
          transition: null,
        },
      ],
      pacing: "",
      continuity: "",
    },
    [tailShot],
  );
  if (replay.success !== true) throw new Error("replay cut must succeed");
  const replayPlan = planSequenceRender({
    sequence: replay.sequence,
    shots: [tailShot],
    spec: {
      target: replay.sequence.id,
      frameFormat: { fps: 24, width: 640, height: 360 },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 20,
    },
  });
  TestValidator.equals(
    "the full play and the tail replay each keep the marker",
    replayPlan.editorialMarkers?.map((marker) => marker.entry),
    [0, 1],
  );
  TestValidator.predicate(
    "each marker stays inside its own output span",
    replayPlan.editorialMarkers?.every((marker) => {
      const span = replayPlan.shots[marker.entry]!;
      return (
        marker.outputStartSeconds >= span.start &&
        marker.outputEndSeconds <= span.end
      );
    }) === true,
  );
}
