import type {
  IAutoMovieDrawCall,
  IAutoMovieInspectionRequest,
  IAutoMovieInspectionView,
} from "@automovie/interface";
import {
  AutoMovieDrawPlacement,
  type IAutoMovieInspectionHandle,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { createRecordedFilmSubject } from "./createRecordedFilmSubject";

/**
 * The draw page's placement places every trail time and every framing second as
 * the shot that second's picture shows, on its own entry's clock, never on
 * another shot through the film clock.
 *
 * Scenarios, on shot A from 0 to 2 s on its clock 1 + t and shot B from 1 s
 * through a one-second cross dissolve or from 2 s at a hard cut, with a box
 * `hero` at x = −1 while A is placed and x = 1 while B is:
 *
 * 1. A trail of `hero` at a hard cut's first frame, 2 s, half a second each way at
 *    four ticks a second, places its times before 2 s as B's head handle by
 *    `seekShot`, −0.5 and −0.25 s, and the rest and the drawn second by `seek`,
 *    so no placement shows A.
 * 2. Without `seekShot` the same trail holds its times before 2 s at B's in-point,
 *    `seek` at 2 s.
 * 3. A fitted view framing 1.25 s, the dissolve's first half, places A by
 *    `seekShot` at its clock 2.25 s and frames A's box, left of the centre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives `AutoMovieDrawPlacement`'s `inspect` with a trail and `frame` with a fitted view over a recording subject, and asserts every placement and the framing box; a trail or a framing second placed by the film clock, which places A before the cut or B in the dissolve's first half, fails.
 * @evidence contracts/development/testing.md#independent-expectations The trail times are the grid of four a second half a second around 2 s by hand; B's clock is t − 2 at the cut, and A, shown at 0.75 against 0.25, runs on 1 + t.
 * @evidence contracts/development/testing.md#distinguishing-cases A cut with and without `seekShot` and a dissolve's first half; the clocks themselves belong to `test_draw_film_layer_clock` and the picture's layers to `test_draw_film_transition_layers`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_placement_shown_clock`; the subject records its placements over a real three.js scene, and no renderer draws.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the placements it pins.
 */
export async function test_draw_placement_shown_clock(): Promise<void> {
  const trail: IAutoMovieInspectionRequest = request({
    trail: "hero",
    reach: "0.5",
    ticks: "4",
  });

  // 1. A trail at a cut's first frame.
  const cut: createRecordedFilmSubject.IDouble = createRecordedFilmSubject({
    transition: null,
    seekShot: true,
    optics: false,
  });
  const handle: IAutoMovieInspectionHandle = await placement(cut).inspect(
    trail,
    2,
  );
  handle.restore();
  TestValidator.predicate(
    "a trail at a cut's first frame places only the incoming shot",
    same(cut.calls, [
      ["seekShot", "shot:b", -0.5, 1.5],
      ["seekShot", "shot:b", -0.25, 1.75],
      ["seek", null, 2],
      ["seek", null, 2.25],
      ["seek", null, 2.5],
      ["seek", null, 2],
    ]),
  );

  // 2. Without seekShot.
  const bare: createRecordedFilmSubject.IDouble = createRecordedFilmSubject({
    transition: null,
    seekShot: false,
    optics: false,
  });
  (await placement(bare).inspect(trail, 2)).restore();
  TestValidator.predicate(
    "without seekShot the trail holds the incoming shot's in-point",
    same(bare.calls, [
      ["seek", null, 2],
      ["seek", null, 2],
      ["seek", null, 2],
      ["seek", null, 2.25],
      ["seek", null, 2.5],
      ["seek", null, 2],
    ]),
  );

  // 3. A fitted view in a dissolve's first half.
  const dissolve: createRecordedFilmSubject.IDouble = createRecordedFilmSubject(
    {
      transition: { kind: "crossDissolve", duration: 1 },
      seekShot: true,
      optics: false,
    },
  );
  const call: IAutoMovieDrawCall = {
    seconds: 1.25,
    view: "front",
    request: request({}),
    width: 64,
    height: 36,
    frame: [1.25],
    scale: 1,
  };
  const view: IAutoMovieInspectionView.INamed = {
    type: "named",
    name: "front",
    orthographic: false,
    follow: false,
    focus: null,
  };
  const framing: AutoMovieDrawPlacement = placement(dissolve);
  const bounds: Awaited<ReturnType<AutoMovieDrawPlacement["frame"]>> =
    await framing.frame(call, view);
  framing.restore();
  TestValidator.predicate(
    "a fitted view in a dissolve's first half frames the outgoing shot",
    same(dissolve.calls, [["seekShot", "shot:a", 2.25, 1.25]]) &&
      bounds !== null &&
      bounds.max.x < 0,
  );
}

/** A placement of a recording subject on a renderer that only clips. */
function placement(
  subject: createRecordedFilmSubject.IDouble,
): AutoMovieDrawPlacement {
  return new AutoMovieDrawPlacement("film", subject.subject, {
    localClippingEnabled: false,
  });
}

/** The inspection request of the given keys, every other key absent. */
function request(keys: Record<string, string>): IAutoMovieInspectionRequest {
  return parseAutoMovieInspectionRequest(
    (key: string): string | undefined => keys[key],
  );
}

/**
 * Whether the recorded placements are the expected ones, in order: name, shot
 * and numbers, the numbers to 1e-9.
 */
function same(
  actual: readonly createRecordedFilmSubject.ICall[],
  expected: readonly [string, string | null, ...number[]][],
): boolean {
  const placements: createRecordedFilmSubject.ICall[] = actual.filter(
    (call: createRecordedFilmSubject.ICall): boolean =>
      call.name === "seek" || call.name === "seekShot",
  );
  return (
    placements.length === expected.length &&
    placements.every(
      (call: createRecordedFilmSubject.ICall, index: number): boolean => {
        const [name, shot, ...numbers]: [string, string | null, ...number[]] =
          expected[index]!;
        return (
          call.name === name &&
          call.shot === shot &&
          call.numbers.length === numbers.length &&
          call.numbers.every((value: number, k: number): boolean =>
            nclose(value, numbers[k]!, 1e-9),
          )
        );
      },
    )
  );
}
