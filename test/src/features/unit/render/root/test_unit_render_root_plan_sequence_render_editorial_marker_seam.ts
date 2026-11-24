import { cutSequence } from "@automovie/engine";
import type {
  IAutoMovieEditorialMarker,
  IAutoMoviePlaybackEditorialMarker,
  IAutoMovieShot,
} from "@automovie/interface";
import { planSequenceRender } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * Render planning keeps one owner for each same-shot decimal seam.
 *
 * Scenarios:
 *
 * 1. A hard cut at source 0.3 after a trim from 0.1 of duration 0.2 assigns the
 *    seam point only to the incoming entry.
 * 2. Distinct representable points immediately on either side survive, and a
 *    replay retains the seam point in its own entry.
 * 3. Playing the whole source and replaying its last representable interval keeps
 *    both occurrences of the tail marker.
 * 4. A retimed span whose source end rounds back to its start keeps the opening
 *    point and projects a covering range across the entire second. Neighboring
 *    points and a range ending at the opening stay excluded.
 */
export function test_unit_render_root_plan_sequence_render_editorial_marker_seam(): void {
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

  const opening: IAutoMovieEditorialMarker = {
    id: "opening",
    label: "Opening",
    startSeconds: 1,
    endSeconds: 1,
  };
  const followingSourceStart: number = 1 + Number.EPSILON;
  const collapsed: ReturnType<typeof planSequenceRender> = renderSequence(
    {
      ...shot,
      duration: 2,
      editorialMarkers: [
        opening,
        { ...opening, id: "before", startSeconds: tail, endSeconds: tail },
        {
          ...opening,
          id: "after",
          startSeconds: followingSourceStart,
          endSeconds: followingSourceStart,
        },
        { ...opening, id: "range", startSeconds: tail, endSeconds: 1.5 },
        { ...opening, id: "touch", startSeconds: tail },
      ],
    },
    [
      {
        ...incoming,
        trim: { start: 1, duration: 1e-17 },
        playbackRate: 1e-17,
      },
      { ...incoming, trim: { start: followingSourceStart, duration: 0.25 } },
    ],
  );
  const firstPlayMarkers: IAutoMoviePlaybackEditorialMarker[] | undefined =
    collapsed.editorialMarkers?.filter(
      (marker: IAutoMoviePlaybackEditorialMarker): boolean =>
        marker.entry === 0,
    );
  TestValidator.equals(
    "the opening point and covering range survive the collapsed source span",
    firstPlayMarkers?.map(
      (marker: IAutoMoviePlaybackEditorialMarker): string => marker.id,
    ),
    [opening.id, "range"],
  );
  const openingPlay: IAutoMoviePlaybackEditorialMarker | undefined =
    firstPlayMarkers?.[0];
  TestValidator.predicate(
    "the opening marker stays a point at the start of the one-second play",
    collapsed.shots[0]?.end === 1 &&
      openingPlay?.retainedStartSeconds === 1 &&
      openingPlay.retainedEndSeconds === 1 &&
      openingPlay.outputStartSeconds === 0 &&
      openingPlay.outputEndSeconds === 0,
  );
  const coveringRange: IAutoMoviePlaybackEditorialMarker | undefined =
    firstPlayMarkers?.[1];
  TestValidator.predicate(
    "the covering range lasts one output second with rounded source bounds",
    coveringRange?.retainedStartSeconds === 1 &&
      coveringRange.retainedEndSeconds === 1 &&
      coveringRange.outputStartSeconds === 0 &&
      coveringRange.outputEndSeconds === 1,
  );
}
