import type { IAutoMoviePlaybackTimeline } from "@automovie/interface";
import { type IAutoMovieDrawScene, AutoMovieRenderDraw } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose, rejectsError } from "../../internal/predicates";

/** All tested entries and seeks have exactly representable binary seconds. */
const CLOCK_TOLERANCE: number = 0;

/** The predecessor of 1 is one unit in the exponent -1 binade below it. */
const BEFORE_CUT: number = 1 - Number.EPSILON / 2;

/** A hard cut at second 1 with a doubled playback rate on the first entry. */
const CUT: IAutoMoviePlaybackTimeline = {
  entries: [
    { entry: 0, shot: "old", start: 0, played: 1, offset: 2, playbackRate: 2 },
    { entry: 1, shot: "next", start: 1, played: 1, offset: 0.25 },
  ],
  runtime: 2,
};

/**
 * The draw layer chooses its own entry's clock before delegating placement.
 *
 * Scenarios:
 *
 * 1. A live layer seeks by output time, including at its in-point. At the cut the
 *    previous layer is placed at its shot time 2 + 1 times 2 = 4.
 * 2. Without shot-local seeking, the previous layer holds at the last
 *    representable second before the cut. The next layer before its in-point
 *    holds at that in-point.
 * 3. An absent entry refuses rather than placing a different shot.
 */
export async function test_render_draw_place_layer(): Promise<void> {
  const seeks: number[] = [];
  const shotSeeks: [string, number, number][] = [];
  const film: Pick<IAutoMovieDrawScene, "cut" | "seek"> = {
    cut: CUT,
    seek: async (seconds: number): Promise<void> => {
      seeks.push(seconds);
    },
  };
  const byShot: Pick<IAutoMovieDrawScene, "cut" | "seek" | "seekShot"> = {
    ...film,
    seekShot: async (
      shot: string,
      local: number,
      output: number,
    ): Promise<void> => {
      shotSeeks.push([shot, local, output]);
    },
  };
  const previous: { entry: number; shot: string } = { entry: 0, shot: "old" };
  const next: { entry: number; shot: string } = { entry: 1, shot: "next" };
  await AutoMovieRenderDraw.placeAutoMovieDrawLayer("layer", byShot, null, 0.25);
  await AutoMovieRenderDraw.placeAutoMovieDrawLayer("layer", byShot, previous, 0.5);
  await AutoMovieRenderDraw.placeAutoMovieDrawLayer("layer", byShot, next, 1);
  await AutoMovieRenderDraw.placeAutoMovieDrawLayer("layer", byShot, previous, 1);
  await AutoMovieRenderDraw.placeAutoMovieDrawLayer("layer", film, previous, 1);
  await AutoMovieRenderDraw.placeAutoMovieDrawLayer("layer", film, next, 0.5);
  TestValidator.predicate(
    "film-clock places and boundary holds",
    () =>
      seeks.length === 5 &&
      nclose(seeks[0]!, 0.25, CLOCK_TOLERANCE) &&
      nclose(seeks[1]!, 0.5, CLOCK_TOLERANCE) &&
      nclose(seeks[2]!, 1, CLOCK_TOLERANCE) &&
      nclose(seeks[3]!, BEFORE_CUT, CLOCK_TOLERANCE) &&
      nclose(seeks[4]!, 1, CLOCK_TOLERANCE),
  );
  TestValidator.predicate(
    "outgoing layer gets its own shot clock",
    () =>
      shotSeeks.length === 1 &&
      shotSeeks[0]![0] === "old" &&
      nclose(shotSeeks[0]![1], 4, CLOCK_TOLERANCE) &&
      nclose(shotSeeks[0]![2], 1, CLOCK_TOLERANCE),
  );
  TestValidator.predicate(
    "absent entry refuses",
    await rejectsError(
      () =>
        AutoMovieRenderDraw.placeAutoMovieDrawLayer(
          "layer",
          byShot,
          { entry: 2, shot: "missing" },
          1,
        ),
      "no sequence entry 2",
    ),
  );
}
