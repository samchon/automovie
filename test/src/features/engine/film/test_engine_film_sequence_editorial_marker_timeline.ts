import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieEditorialMarker,
  IAutoMoviePlaybackEditorialMarker,
  IAutoMoviePlaybackEntry,
  IAutoMovieSequenceEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Project editorial markers through an already laid-out output clock.
 *
 * Scenarios:
 *
 * 1. A seam point belongs only to its incoming play. A range is clipped at both
 *    sides, overlaps the dissolve and appears again on replay.
 * 2. Ties on one play sort by id, and authored source endpoints are retained.
 * 3. A source trim of one second at 2^54 rounds its end onto its opening. The
 *    opening point and a covering range survive on the authored clock, while a
 *    range ending at the opening is excluded.
 *
 * Every value in the fixture is exactly representable in binary64, including
 * the rate-two divisions and the one-eighth-second overlap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish seam points, clipped ranges, replay, tie ordering and collapsed source windows on the already computed output clock.
 * @evidence contracts/development/testing.md#behavioral-verification The test invokes sequenceEditorialMarkerTimeline for its authored layout and compares placement, clipping, original coordinates and sort order. It supplies a separate large-coordinate layout whose represented endpoint collapses.
 * @evidence contracts/development/testing.md#independent-expectations Exactly representable marker coordinates, rate-two scaling and the one-eighth-second overlap determine the expected placements by interval arithmetic. At 2^54 the one-second source end rounds to its opening, so the authored span still distinguishes the opening point and covering range from the range that ends there.
 */
export function test_engine_film_sequence_editorial_marker_timeline(): void {
  const reel: IAutoMovieSequenceEntry[] = [
    { shot: "take", trim: { start: 0, duration: 0.75 }, transition: null },
    {
      shot: "take",
      trim: { start: 0.75, duration: 0.75 },
      playbackRate: 2,
      transition: { kind: "crossDissolve", duration: 0.125 },
    },
    {
      shot: "take",
      trim: { start: 0.75, duration: 0.75 },
      playbackRate: 2,
      transition: null,
    },
  ];
  const entries: IAutoMoviePlaybackEntry[] = [
    { entry: 0, shot: "take", start: 0, played: 0.75, offset: 0 },
    {
      entry: 1,
      shot: "take",
      start: 0.625,
      played: 0.375,
      offset: 0.75,
      playbackRate: 2,
    },
    {
      entry: 2,
      shot: "take",
      start: 1,
      played: 0.375,
      offset: 0.75,
      playbackRate: 2,
    },
  ];
  const editorialMarkers: IAutoMovieEditorialMarker[] = [
    { id: "window", label: "Dialogue", startSeconds: 0.25, endSeconds: 1.75 },
    { id: "reply", label: "Reply", startSeconds: 0.75, endSeconds: 0.75 },
    { id: "touch", label: "After trim", startSeconds: 1.5, endSeconds: 2 },
  ];
  const markers: IAutoMoviePlaybackEditorialMarker[] =
    AutoMovieEngineFilm.sequenceEditorialMarkerTimeline(
      { shots: reel },
      {
        timeline: { entries },
        shotById: new Map([
          ["take", { shot: { duration: 2, editorialMarkers } }],
        ]),
      },
    );
  TestValidator.equals(
    "half-open source trim and stable output order",
    markers.map(({ id, entry }) => [id, entry]),
    [
      ["window", 0],
      ["reply", 1],
      ["window", 1],
      ["reply", 2],
      ["window", 2],
    ],
  );
  const expected: [number, number, number, number][] = [
    [0.25, 0.75, 0.25, 0.75],
    [0.75, 0.75, 0.625, 0.625],
    [0.75, 1.5, 0.625, 1],
    [0.75, 0.75, 1, 1],
    [0.75, 1.5, 1, 1.375],
  ];
  markers.forEach(
    (marker: IAutoMoviePlaybackEditorialMarker, index: number) => {
      const [sourceStart, sourceEnd, outputStart, outputEnd] = expected[index]!;
      TestValidator.predicate(
        `placement ${index} uses clipped source time and remapped output time`,
        marker.shot === "take" &&
          marker.retainedStartSeconds === sourceStart &&
          marker.retainedEndSeconds === sourceEnd &&
          marker.outputStartSeconds === outputStart &&
          marker.outputEndSeconds === outputEnd,
      );
    },
  );
  TestValidator.predicate(
    "the authored range survives clipping",
    markers[4]?.startSeconds === 0.25 && markers[4].endSeconds === 1.75,
  );

  const sourceStart: number = 2 ** 54;
  const collapsed: IAutoMoviePlaybackEditorialMarker[] =
    AutoMovieEngineFilm.sequenceEditorialMarkerTimeline(
      {
        shots: [
          {
            shot: "take",
            trim: { start: sourceStart, duration: 1 },
            transition: null,
          },
        ],
      },
      {
        timeline: {
          entries: [
            {
              entry: 0,
              shot: "take",
              start: 0,
              played: 1,
              offset: sourceStart,
            },
          ],
        },
        shotById: new Map([
          [
            "take",
            {
              shot: {
                duration: sourceStart + 8,
                editorialMarkers: [
                  {
                    id: "point",
                    label: "Opening",
                    startSeconds: sourceStart,
                    endSeconds: sourceStart,
                  },
                  {
                    id: "late",
                    label: "Before",
                    startSeconds: sourceStart - 2,
                    endSeconds: sourceStart,
                  },
                  {
                    id: "range",
                    label: "Spanning",
                    startSeconds: sourceStart - 2,
                    endSeconds: sourceStart + 4,
                  },
                ],
              },
            },
          ],
        ]),
      },
    );
  TestValidator.equals(
    "collapsed source membership",
    collapsed.map(({ id }) => id),
    ["point", "range"],
  );
  TestValidator.predicate(
    "collapsed source retains its positive authored play",
    collapsed[0]?.outputEndSeconds === 0 &&
      collapsed[1]?.outputEndSeconds === 1 &&
      collapsed[1].retainedStartSeconds === sourceStart &&
      collapsed[1].retainedEndSeconds === sourceStart,
  );
}
