import { sequenceTimeline } from "@automovie/engine";
import type {
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  placeAutoMovieDrawLayer,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { rejectsError } from "../internal/rejectsError";

/**
 * A layer of a film picture is placed on its own entry's clock: by `seek` at a
 * second its entry is live at, and otherwise by `seekShot` at the entry's
 * shot-local time, which before the entry's in-point runs into its handle; a
 * subject without `seekShot` holds a sample before the in-point at the
 * in-point.
 *
 * Scenarios, on shot A for 3 s cut hard to shot B trimmed from its 1 s mark, so
 * B starts at 3 s:
 *
 * 1. A subject without a cut, or a layer of null, is placed by `seek`.
 * 2. B at 3.5 s, where it is live, is placed by `seek` at 3.5 s.
 * 3. B at 3 − 1/64 s, a shutter sample before its start, is placed by `seekShot`
 *    at its handle 1 − 1/64 s with the output second 3 − 1/64 s.
 * 4. A at 3.25 s, past its own span, is placed by `seekShot` at its clock 3.25 s.
 * 5. Without `seekShot`, B's sample at 3 − 1/64 s is placed by `seek` at B's
 *    in-point, 3 s, never on A; A's tail at 3.25 s, which only `seekShot` can
 *    place, is refused naming the subject, the entry and `seekShot`, and
 *    nothing is placed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `placeAutoMovieDrawLayer` on a recording subject and asserts which placement it made with which clock; a sample placed by the film second, a handle clamped to the trim, a live layer placed by `seekShot`, a sample without `seekShot` placed on the previous shot or refused, or a tail without `seekShot` placed silently fails.
 * @evidence contracts/development/testing.md#independent-expectations The cut is hand-laid: A over 0 to 3 s and B from 3 s with its clock starting at its 1 s trim, so B's clock at 3 − 1/64 s is 1 − 1/64 s by the affine entry clock.
 * @evidence contracts/development/testing.md#distinguishing-cases No cut, a live layer, a sample before an in-point, a tail past its span and a subject without `seekShot`; the draw page's use of it belongs to `test_draw_film_transition_layers`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_layer_clock`; the subject records its placements and nothing is drawn.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the placement it pins.
 */
export async function test_draw_film_layer_clock(): Promise<void> {
  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: null,
    fps: 24,
    shots: [
      { shot: "shot:a", trim: null, transition: null },
      { shot: "shot:b", trim: { start: 1, duration: 3 }, transition: null },
    ],
  };
  const cut: IAutoMoviePlaybackTimeline = sequenceTimeline(sequence, [
    shot("shot:a", 3),
    shot("shot:b", 4),
  ]);
  const placed: [string, string | null, number, number][] = [];
  const subject: Pick<IAutoMovieDrawScene, "cut" | "seek" | "seekShot"> = {
    cut,
    seek: async (seconds: number): Promise<void> => {
      placed.push(["seek", null, Number.NaN, seconds]);
    },
    seekShot: async (
      name: string,
      time: number,
      seconds: number,
    ): Promise<void> => {
      placed.push(["seekShot", name, time, seconds]);
    },
  };
  const a: { entry: number; shot: string } = { entry: 0, shot: "shot:a" };
  const b: { entry: number; shot: string } = { entry: 1, shot: "shot:b" };
  const last: () => [string, string | null, number, number] = (): [
    string,
    string | null,
    number,
    number,
  ] => placed.at(-1)!;

  // 1. No cut, or no layer.
  await placeAutoMovieDrawLayer("film", { ...subject, cut: undefined }, b, 2);
  const uncut: [string, string | null, number, number] = last();
  await placeAutoMovieDrawLayer("film", subject, null, 3.5);
  TestValidator.predicate(
    "a subject without a cut or a layer is placed by seek",
    uncut[0] === "seek" &&
      nclose(uncut[3], 2) &&
      last()[0] === "seek" &&
      nclose(last()[3], 3.5),
  );

  // 2. A live layer.
  await placeAutoMovieDrawLayer("film", subject, b, 3.5);
  TestValidator.predicate(
    "a layer at a second its entry is live at is placed by seek",
    last()[0] === "seek" && nclose(last()[3], 3.5),
  );

  // 3. A sample before the in-point.
  await placeAutoMovieDrawLayer("film", subject, b, 3 - 1 / 64);
  TestValidator.predicate(
    "a sample before the in-point is the shot's handle",
    last()[0] === "seekShot" &&
      last()[1] === "shot:b" &&
      nclose(last()[2], 1 - 1 / 64, 1e-12) &&
      nclose(last()[3], 3 - 1 / 64, 1e-12),
  );

  // 4. A tail past its span.
  await placeAutoMovieDrawLayer("film", subject, a, 3.25);
  TestValidator.predicate(
    "a tail past its span is placed on its own clock",
    last()[0] === "seekShot" &&
      last()[1] === "shot:a" &&
      nclose(last()[2], 3.25, 1e-12),
  );

  // 5. Without seekShot.
  const bare: Pick<IAutoMovieDrawScene, "cut" | "seek"> = {
    cut,
    seek: subject.seek,
  };
  await placeAutoMovieDrawLayer("film", bare, b, 3 - 1 / 64);
  const held: [string, string | null, number, number] = last();
  const count: number = placed.length;
  const refused: boolean = await rejectsError(
    (): Promise<void> => placeAutoMovieDrawLayer("film", bare, a, 3.25),
    ['Subject "film"', "entry 0", "seekShot"],
  );
  TestValidator.predicate(
    "without seekShot a sample is held at the in-point and a tail is refused",
    held[0] === "seek" &&
      nclose(held[3], 3, 0) &&
      refused &&
      placed.length === count,
  );
}

/** An authored empty-motion shot of the given id and length. */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-room",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}
