import { AutoMovieEngineFilm } from "@automovie/engine";
import {
  AutoMovieCameraFraming,
  type IAutoMovieCameraIntent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `resolveAutoMovieLensAt` eases a timed focus pull between its two marks,
 * starting and landing with zero rate.
 *
 * Camera: static at the origin looking down -Z; pull from a mark 2 m deep to
 * one 4 m deep, start 1 s, end 2 s.
 *
 * Scenarios:
 *
 * 1. The depth holds 2 m at 0.5 s, is 3 m at 1.5 s and lands 4 m at 2.5 s.
 * 2. A quarter through, at 1.25 s, it is 2 + 2 s(0.25) = 2.3125 m with s(u) = u^2
 *    (3 - 2u).
 * 3. The rate is near zero just after the start and just before the end, and is
 *    the peak 1.5 x (4 - 2) / 1 = 3 m/s in the middle.
 */
export function test_engine_film_lens_pull(): void {
  const intent: IAutoMovieCameraIntent = {
    start: 0,
    framing: AutoMovieCameraFraming.Medium,
    move: "static",
    focus: { x: 0, y: 0, z: -2 },
    focusPull: { start: 1, end: 2, to: { x: 0, y: 0, z: -4 } },
    focalLength: null,
    fNumber: 2,
  };
  const depth = (seconds: number): number | undefined =>
    AutoMovieEngineFilm.resolveAutoMovieLensAt({
      intents: [intent],
      seconds,
      position: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
    })?.focusDistance;
  TestValidator.predicate("holds", nclose(depth(0.5)!, 2, 1e-12));
  TestValidator.predicate("middle", nclose(depth(1.5)!, 3, 1e-12));
  TestValidator.predicate("lands", nclose(depth(2.5)!, 4, 1e-12));
  TestValidator.predicate("quarter", nclose(depth(1.25)!, 2.3125, 1e-12));
  const h: number = 1e-4;
  const rate = (seconds: number): number =>
    (depth(seconds + h)! - depth(seconds - h)!) / (2 * h);
  TestValidator.predicate("rate at start", Math.abs(rate(1 + h)) < 0.01);
  TestValidator.predicate("rate at end", Math.abs(rate(2 - h)) < 0.01);
  TestValidator.predicate("peak rate", nclose(rate(1.5), 3, 1e-3));
}
