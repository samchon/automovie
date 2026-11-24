import {
  playbackCursor,
  playbackLayersAt,
  sequenceTimeline,
} from "@automovie/engine";
import type {
  IAutoMoviePlaybackLayer,
  IAutoMoviePlaybackSample,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

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

/** Shot A of 3 s and shot B of 4 s. */
const SHOTS: IAutoMovieShot[] = [shot("shot:a", 3), shot("shot:b", 4)];

/**
 * A, then B through a one-second fade starting at 2 s, then A again through a
 * one-second cross dissolve starting at 5 s.
 */
const SEQUENCE: IAutoMovieSequence = {
  id: "seq",
  name: null,
  fps: 24,
  shots: [
    { shot: "shot:a", trim: null, transition: null },
    {
      shot: "shot:b",
      trim: null,
      transition: { kind: "fade", duration: 1 },
    },
    {
      shot: "shot:a",
      trim: null,
      transition: { kind: "crossDissolve", duration: 1 },
    },
  ],
};

/** Whether the layers are, in order, the expected entries, times and weights. */
function layered(
  actual: readonly IAutoMoviePlaybackLayer[],
  expected: readonly {
    entry: number;
    shot: string;
    time: number;
    weight: number;
    live: boolean;
  }[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (layer: IAutoMoviePlaybackLayer, index: number): boolean =>
        layer.entry === expected[index]!.entry &&
        layer.shot === expected[index]!.shot &&
        layer.live === expected[index]!.live &&
        nclose(layer.time, expected[index]!.time) &&
        nclose(layer.weight, expected[index]!.weight),
    )
  );
}

/**
 * A sequence's layers at an instant follow `IAutoMovieTransition`: a fade dips
 * through black, the outgoing shot alone over its first half and the incoming
 * alone over its second, and a cross dissolve stays a plain complementary mix.
 *
 * Scenarios:
 *
 * 1. Outside a transition, at 1 s, the live entry is the one layer at weight 1.
 * 2. At a fade's first instant, 2 s, the outgoing shot is alone at weight 1.
 * 3. At the fade's first quarter, 2.25 s, the outgoing shot is alone at weight
 *    0.5.
 * 4. At the fade's midpoint, 2.5 s, the incoming shot is alone at weight 0: black.
 * 5. At the fade's third quarter, 2.75 s, the incoming shot is alone at weight
 *    0.5.
 * 6. A cross dissolve's quarter, 5.25 s, mixes the outgoing shot at 0.75 and the
 *    incoming at 0.25, and its midpoint mixes both at 0.5; the weights sum to
 *    exactly 1.
 * 7. Every layer's shot and time equal `playbackCursor`'s sample in a 50 Hz sweep,
 *    the live layer the sample's shot and the outgoing layer its blend.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `playbackLayersAt` on a laid-out cut and asserts each layer's entry, shot, clock, weight and liveness; a fade sampled as a dissolve, a dissolve sampled as a dip, a midpoint that is not black, or a layer clock off the cursor's fails.
 * @evidence contracts/development/testing.md#independent-expectations The cut is hand-laid: A plays 0 to 3 s, B starts at 3 - 1 = 2 s and A again at 6 - 1 = 5 s; the weights follow by hand from the dip-to-black and linear-mix definitions, and the clocks from each entry's start. The sweep compares against the forward cursor, an independent reader of the same instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Direct, a fade's start, both quarters and its midpoint, and a dissolve's quarter and midpoint; refusals of malformed cuts belong to `test_film_playback_resolver`, and the composite of these weights to the draw host's GPU check.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_film_playback_layers`; it lays out hand-authored shots and starts no renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the instant and the layers it pins.
 */
export function test_film_playback_layers(): void {
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    SEQUENCE,
    SHOTS,
  );
  const at: (seconds: number) => IAutoMoviePlaybackLayer[] = (
    seconds: number,
  ): IAutoMoviePlaybackLayer[] => playbackLayersAt(SEQUENCE, timeline, seconds);

  // 1. Direct.
  TestValidator.predicate(
    "a direct frame is the live shot alone",
    layered(at(1), [
      { entry: 0, shot: "shot:a", time: 1, weight: 1, live: true },
    ]),
  );

  // 2-5. The fade into B, overlapping A's last second.
  TestValidator.predicate(
    "a fade opens on the outgoing shot at full weight",
    layered(at(2), [
      { entry: 0, shot: "shot:a", time: 2, weight: 1, live: false },
    ]),
  );
  TestValidator.predicate(
    "a fade's first quarter is the outgoing shot at half weight",
    layered(at(2.25), [
      { entry: 0, shot: "shot:a", time: 2.25, weight: 0.5, live: false },
    ]),
  );
  TestValidator.predicate(
    "a fade's midpoint is black",
    layered(at(2.5), [
      { entry: 1, shot: "shot:b", time: 0.5, weight: 0, live: true },
    ]),
  );
  TestValidator.predicate(
    "a fade's third quarter is the incoming shot at half weight",
    layered(at(2.75), [
      { entry: 1, shot: "shot:b", time: 0.75, weight: 0.5, live: true },
    ]),
  );

  // 6. The cross dissolve back into A.
  const quarter: IAutoMoviePlaybackLayer[] = at(5.25);
  TestValidator.predicate(
    "a cross dissolve's quarter mixes both shots",
    layered(quarter, [
      { entry: 1, shot: "shot:b", time: 3.25, weight: 0.75, live: false },
      { entry: 2, shot: "shot:a", time: 0.25, weight: 0.25, live: true },
    ]) && quarter[0]!.weight + quarter[1]!.weight === 1,
  );
  TestValidator.predicate(
    "a cross dissolve's midpoint mixes both shots evenly",
    layered(at(5.5), [
      { entry: 1, shot: "shot:b", time: 3.5, weight: 0.5, live: false },
      { entry: 2, shot: "shot:a", time: 0.5, weight: 0.5, live: true },
    ]),
  );

  // 7. The layers sit on the cursor's samples.
  const cursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(
    SEQUENCE,
    timeline,
  );
  let agreed: boolean = true;
  for (let frame: number = 0; frame < 400; ++frame) {
    const seconds: number = frame / 50;
    const sample: IAutoMoviePlaybackSample = cursor(seconds);
    for (const layer of at(seconds))
      if (layer.live)
        agreed &&= layer.shot === sample.shot && layer.time === sample.time;
      else
        agreed &&=
          sample.blend !== null &&
          layer.shot === sample.blend.shot &&
          layer.time === sample.blend.time;
  }
  TestValidator.predicate("the layers sit on the cursor's samples", agreed);
}
