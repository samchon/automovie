import { sampleAutoMovieDialogueMouth } from "@automovie/engine";
import type {
  IAutoMovieDialogueMouth,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieHumanVisemeWeights,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * One actor's dialogue mouth is read from the film's mouth track at any second.
 *
 * Scenarios:
 *
 * 1. Before an actor's first line, and for an actor with no line, the jaw is 0 and
 *    the weights are `{ sil: 1 }`.
 * 2. The jaw is the speaking line's opening of the frame holding the second: 6 mm
 *    at frame 11 and at a shutter sample half a frame later, 12 mm at frame
 *    12.
 * 3. A phoneme-driven line gives its visemes: `PP` outweighs every other viseme at
 *    the centre of its bilabial range (frame 11) and `aa` at the centre of its
 *    vowel range (frame 14).
 * 4. A line without ranges gives `aa` at the jaw's share of the 12 mm maximum
 *    speech opening: 0.5 at 6 mm, `{ sil: 1 }` at 0 mm and `aa` 1 at 12 mm.
 * 5. Where two lines of one actor overlap, the later-starting line speaks from its
 *    start frame: frame 14 reads the first line's 3 mm, frame 15 the second
 *    line's 9 mm and `aa` 0.75.
 * 6. Two samplings of one second are identical, and a non-finite second is
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the track, the seconds sampled and the mouth each must give.
 * @evidence contracts/development/testing.md#behavioral-verification Samples `sampleAutoMovieDialogueMouth` on a hand-written track. A sampler that reads another frame's jaw, ignores the actor, lets an earlier line keep the mouth, scales the envelope weight by another maximum or leaves the mouth open outside every line fails.
 * @evidence contracts/development/testing.md#independent-expectations The openings are the track's own values by frame; 6 / 12 and 9 / 12 are the documented share of the 12 mm maximum speech opening; the dominant visemes follow from the ranges' centres and #4054's requirement that bilabials close on their own frames.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a speaking and a silent actor, a whole-frame and a between-frame second, a phoneme-driven and an envelope line, an overlap's two sides, and a valid and a non-finite second; the blend itself belongs to `test_engine_dialogue_viseme_coarticulation` and planning the track to `test_render_dialogue_mouth_track`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_dialogue_mouth_sample`; it starts no process.
 */
export function test_engine_dialogue_mouth_sample(): void {
  const track: IAutoMovieDialogueMouthTrack = {
    fps: 24,
    lines: [
      {
        line: "ann-1",
        actor: "ann",
        startFrame: 10,
        endFrame: 16,
        jaw: [0, 6, 12, 3, 3, 3],
        ranges: [
          { startFrame: 10, endFrame: 12, viseme: "PP" },
          { startFrame: 12, endFrame: 16, viseme: "aa" },
        ],
      },
      {
        line: "bob-1",
        actor: "bob",
        startFrame: 10,
        endFrame: 13,
        jaw: [0, 6, 12],
        ranges: null,
      },
      {
        line: "ann-2",
        actor: "ann",
        startFrame: 15,
        endFrame: 18,
        jaw: [9, 9, 9],
        ranges: null,
      },
    ],
  };
  const at: (actor: string, frame: number) => IAutoMovieDialogueMouth = (
    actor: string,
    frame: number,
  ): IAutoMovieDialogueMouth =>
    sampleAutoMovieDialogueMouth({ track, actor, seconds: frame / 24 });
  const heaviest: (weights: IAutoMovieHumanVisemeWeights) => string = (
    weights: IAutoMovieHumanVisemeWeights,
  ): string =>
    Object.entries(weights).reduce(
      (best: [string, number], entry: [string, number | undefined]) =>
        (entry[1] ?? 0) > best[1] ? [entry[0], entry[1] ?? 0] : best,
      ["", -1],
    )[0];
  const silent: (mouth: IAutoMovieDialogueMouth) => boolean = (
    mouth: IAutoMovieDialogueMouth,
  ): boolean =>
    mouth.jaw === 0 &&
    JSON.stringify(mouth.visemes) === JSON.stringify({ sil: 1 });

  TestValidator.predicate(
    "outside every line the mouth is closed and sets no channel",
    silent(at("ann", 9)) && silent(at("carol", 11)),
  );
  TestValidator.predicate(
    "the jaw is the opening of the frame holding the second",
    at("ann", 11).jaw === 6 &&
      at("ann", 11.5).jaw === 6 &&
      at("ann", 12).jaw === 12,
  );
  TestValidator.equals(
    "a phoneme-driven line closes the lips on its bilabial and opens on its vowel",
    [heaviest(at("ann", 11).visemes), heaviest(at("ann", 14).visemes)],
    ["PP", "aa"],
  );
  const half: IAutoMovieDialogueMouth = at("bob", 11);
  TestValidator.predicate(
    "an envelope line opens aa by the jaw's share of the maximum speech opening",
    nclose(half.visemes.aa ?? -1, 0.5) &&
      nclose(half.visemes.sil ?? -1, 0.5) &&
      silent(at("bob", 10)) &&
      nclose(at("bob", 12).visemes.aa ?? -1, 1),
  );
  const handed: IAutoMovieDialogueMouth = at("ann", 15);
  TestValidator.predicate(
    "the later-starting line of one actor speaks from its start",
    at("ann", 14).jaw === 3 &&
      handed.jaw === 9 &&
      nclose(handed.visemes.aa ?? -1, 0.75) &&
      nclose(handed.visemes.sil ?? -1, 0.25),
  );
  TestValidator.predicate(
    "sampling is repeatable and a non-finite second is refused",
    JSON.stringify(at("ann", 12.25)) === JSON.stringify(at("ann", 12.25)) &&
      throwsError(
        () =>
          sampleAutoMovieDialogueMouth({
            track,
            actor: "ann",
            seconds: Number.NaN,
          }),
        "not finite",
      ),
  );
}
