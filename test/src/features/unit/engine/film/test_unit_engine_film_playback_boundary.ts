import {
  classifyAutoMoviePlaybackBoundary,
  sequenceTimeline,
} from "@automovie/engine";
import type {
  IAutoMovieClassifyPlaybackBoundary,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/** Builds an empty-motion shot with a supplied id and span. */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-yard",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}

/** Whether a result has the expected relation and live shot clocks. */
function relates(
  result: IAutoMovieClassifyPlaybackBoundary.IResult,
  boundary: IAutoMovieClassifyPlaybackBoundary.IResult["boundary"],
  before?: readonly [number, string, number],
  after?: readonly [number, string, number],
): boolean {
  if (result.boundary !== boundary) return false;
  if (result.boundary === "unavailable") return true;
  const same = (
    end: IAutoMovieClassifyPlaybackBoundary.IEndpoint,
    expected: readonly [number, string, number] | undefined,
  ): boolean =>
    expected === undefined ||
    (end.entry === expected[0] &&
      end.shot === expected[1] &&
      nclose(end.seconds, expected[2]));
  return same(result.before, before) && same(result.after, after);
}

/**
 * Classify output-frame pairs of a hand-laid cut and pin each edit relation and
 * both retimed shot clocks.
 *
 * Scenarios:
 *
 * 1. Inside one entry, and across a hard cut that resumes the same shot at its
 *    stopped source second, the relation is continuous and the incoming entry
 *    owns its first second.
 * 2. A seam whose incoming trim skips source time, a change of shot and a dissolve
 *    overlap are cuts.
 * 3. A doubled playback rate maps each output step to two shot-local steps.
 * 4. A declared break owns the half-open interval ending at its second.
 * 5. Reversed and post-runtime instants are unavailable.
 */
export function test_unit_engine_film_playback_boundary(): void {
  const shots: IAutoMovieShot[] = [shot("walk", 4), shot("close", 2)];
  const sequence: IAutoMovieSequence = {
    id: "yard",
    name: null,
    fps: 10,
    shots: [
      { shot: "walk", trim: { start: 0, duration: 2 }, transition: null },
      { shot: "walk", trim: { start: 2, duration: 1 }, transition: null },
      { shot: "close", trim: null, playbackRate: 2, transition: null },
      {
        shot: "walk",
        trim: { start: 3, duration: 1 },
        transition: { kind: "crossDissolve", duration: 0.25 },
      },
    ],
  };
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    sequence,
    shots,
  );
  const classify = (
    before: number,
    after: number,
    discontinuities?: IAutoMovieClassifyPlaybackBoundary.IProps["discontinuities"],
    cut: IAutoMovieSequence = sequence,
    layout: IAutoMoviePlaybackTimeline = timeline,
  ) =>
    classifyAutoMoviePlaybackBoundary({
      sequence: cut,
      timeline: layout,
      before,
      after,
      ...(discontinuities === undefined ? {} : { discontinuities }),
    });

  TestValidator.predicate(
    "one entry and a contiguous seam are continuous",
    () =>
      relates(
        classify(1, 1.1),
        "continuous",
        [0, "walk", 1],
        [0, "walk", 1.1],
      ) &&
      relates(classify(1.9, 2), "continuous", [0, "walk", 1.9], [1, "walk", 2]),
  );

  const skipped: IAutoMovieSequence = {
    ...sequence,
    shots: sequence.shots.map((entry, index) =>
      index === 1 ? { ...entry, trim: { start: 2.1, duration: 0.9 } } : entry,
    ),
  };
  const skippedTimeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    skipped,
    shots,
  );
  TestValidator.predicate(
    "a skipped seam, a change of shot and a dissolve overlap are cuts",
    () =>
      relates(
        classify(1.9, 2, undefined, skipped, skippedTimeline),
        "cut",
        [0, "walk", 1.9],
        [1, "walk", 2.1],
      ) &&
      relates(classify(2.9, 3), "cut", [1, "walk", 2.9], [2, "close", 0]) &&
      relates(classify(3.7, 3.8), "cut") &&
      relates(
        classify(3.6, 3.7),
        "continuous",
        [2, "close", 1.2],
        [2, "close", 1.4],
      ),
  );

  TestValidator.predicate("a doubled rate doubles the shot-local step", () =>
    relates(
      classify(3.1, 3.2),
      "continuous",
      [2, "close", 0.2],
      [2, "close", 0.4],
    ),
  );

  const breaks = [{ shot: "walk", seconds: 1.1 }];
  TestValidator.predicate(
    "a declared break owns the interval ending at its second",
    () =>
      classify(1, 1.1, breaks).boundary === "discontinuity" &&
      classify(1.1, 1.2, breaks).boundary === "continuous" &&
      classify(1, 1.1, [{ shot: "close", seconds: 1.1 }]).boundary ===
        "continuous",
  );

  TestValidator.predicate(
    "reversed and post-runtime instants are unavailable",
    () =>
      classify(1.1, 1).boundary === "unavailable" &&
      classify(4.7, timeline.runtime).boundary === "unavailable" &&
      classify(-0.1, 0).boundary === "unavailable",
  );
}
