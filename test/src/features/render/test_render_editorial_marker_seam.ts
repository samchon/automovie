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
 * @evidence contracts/development/testing.md#independent-expectations The incoming and repeated quarter-second plays start at 0.2 and 0.45. Neighboring source doubles stay exact while the output comparisons allow rounding. A full play at fourfold speed maps source time to one quarter of that value and places the start of the replay at 0.25 seconds.
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
  const renderSequence: (
    source: IAutoMovieShot,
    entries: Parameters<typeof cutSequence>[0]["entries"],
  ) => ReturnType<typeof planSequenceRender> = (
    source: IAutoMovieShot,
    entries: Parameters<typeof cutSequence>[0]["entries"],
  ): ReturnType<typeof planSequenceRender> => {
    const cut: ReturnType<typeof cutSequence> = cutSequence(
      {
        sequence: { id: "marker-playback", name: "Marker playback" },
        fps: 24,
        entries,
        pacing: "",
        continuity: "",
      },
      [source],
    );
    if (!cut.success) throw new Error("The marker sequence must admit the cut");
    return planSequenceRender({
      sequence: cut.sequence,
      shots: [source],
      spec: {
        target: cut.sequence.id,
        frameFormat: { fps: 24, width: 640, height: 360 },
        toneMapping: "none",
        codec: "h264",
        pixelFormat: "yuv420p",
        crf: 20,
      },
    });
  };

  const incoming: Parameters<typeof cutSequence>[0]["entries"][number] = {
    shot: shot.id,
    trim: { start: seam, duration: 0.25 },
    transition: null,
  };
  const render: ReturnType<typeof planSequenceRender> = renderSequence(shot, [
    { ...incoming, trim: { start: 0.1, duration: 0.2 } },
    incoming,
    { ...incoming },
  ]);
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
  const expectedTimes: readonly [number, number][] = [
    [before, 0.2],
    [seam, 0.2],
    [after, 0.2],
    [seam, 0.45],
    [after, 0.45],
  ];
  for (const [index, [source, output]] of expectedTimes.entries()) {
    const marker: IAutoMoviePlaybackEditorialMarker | undefined =
      projected[index];
    TestValidator.predicate(
      `point ${index} preserves its exact source identity and the replay clock`,
      marker !== undefined &&
        marker.startSeconds === source &&
        marker.endSeconds === source &&
        marker.retainedStartSeconds === source &&
        marker.retainedEndSeconds === source &&
        nclose(marker.outputStartSeconds, output, 1e-15) &&
        nclose(marker.outputEndSeconds, output, 1e-15),
    );
  }

  const tail: number = 0.9999999999999999;
  const tailShot: IAutoMovieShot = {
    ...shot,
    editorialMarkers: [
      { id: "tail", label: "Tail", startSeconds: tail, endSeconds: tail },
    ],
  };
  const replayPlan: ReturnType<typeof planSequenceRender> = renderSequence(
    tailShot,
    [
      { ...incoming, trim: null, playbackRate: 4 },
      { ...incoming, trim: { start: tail, duration: 1 - tail } },
    ],
  );
  const tailMarkers: IAutoMoviePlaybackEditorialMarker[] =
    replayPlan.editorialMarkers ?? [];
  TestValidator.equals(
    "the full play and the tail replay each keep the marker",
    tailMarkers.map(
      (marker: IAutoMoviePlaybackEditorialMarker): number => marker.entry,
    ),
    [0, 1],
  );
  TestValidator.predicate(
    "the fourfold playback places the tail at one quarter of its source time",
    tailMarkers[0]?.outputStartSeconds === tail / 4 &&
      tailMarkers[0]?.outputEndSeconds === tail / 4 &&
      tailMarkers[1]?.outputStartSeconds === 0.25 &&
      tailMarkers[1]?.outputEndSeconds === 0.25,
  );
}
