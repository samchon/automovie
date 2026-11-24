import type { IAutoMovieScheduleCue } from "@automovie/interface";
import { HumanCue } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/** The cues' names and seconds, in order. */
const listed = (cues: readonly IAutoMovieScheduleCue[]): string =>
  cues
    .map((cue: IAutoMovieScheduleCue): string => `${cue.name}@${cue.seconds}`)
    .join(" ");

/**
 * `HumanCue` writes cue tracks: a section wave's cue per section, a drill's
 * preparatory and executive words, a clock's named instants and a line's start,
 * accents, phrase ends and end, each in film seconds.
 *
 * Scenarios:
 *
 * 1. A wave from 2 s at 2 m/s cues sections at 0, 3 and 10 m at 2, 3.5 and 7 s;
 *    authored seconds are kept as they are; a section out of order is refused.
 * 2. Two orders at 3 s and 1 s, the first with a 1 s caution, sort into `halt` at
 *    1 s, `marchCaution` at 2 s and `march` at 3 s; a caution at or before the
 *    word before is refused.
 * 3. A clock's instants, one at a time named, are kept in time order, ties in
 *    their own order.
 * 4. A line from 1 to 3 s with an accent at 2 s and a phrase end at 2.5 s cues
 *    them between its start and its end; an accent outside it is refused.
 */
export function test_unit_motions_perform_human_cue_tracks(): void {
  TestValidator.equals(
    "a travelling wave",
    listed(HumanCue.sectionWave({ distances: [0, 3, 10], from: 2, speed: 2 })),
    "section@2 section@3.5 section@7",
  );
  TestValidator.equals(
    "authored seconds",
    listed(HumanCue.sectionWave({ seconds: [1, 1, 4] })),
    "section@1 section@1 section@4",
  );
  TestValidator.error("out of order", () =>
    HumanCue.sectionWave({ seconds: [2, 1] }),
  );

  TestValidator.equals(
    "orders",
    listed(
      HumanCue.orders([
        { word: "march", at: 3, caution: 1 },
        { word: "halt", at: 1 },
      ]),
    ),
    "halt@1 marchCaution@2 march@3",
  );
  TestValidator.error("a caution over the word before", () =>
    HumanCue.orders([
      { word: "march", at: 3, caution: 2.5 },
      { word: "halt", at: 1 },
    ]),
  );

  TestValidator.equals(
    "instants",
    listed(
      HumanCue.instants(
        {
          instants: [
            { label: "b", seconds: 2 },
            { label: "a", seconds: 1 },
            { label: "c", seconds: 2 },
            { label: "skip", seconds: 0 },
          ],
        },
        ["a", "b", "c"],
      ),
    ),
    "a@1 b@2 c@2",
  );

  TestValidator.equals(
    "a line",
    listed(
      HumanCue.dialogue([{ from: 1, to: 3, accents: [2], phrases: [2.5] }]),
    ),
    "lineStart@1 accent@2 phraseEnd@2.5 lineEnd@3",
  );
  TestValidator.error("an accent outside", () =>
    HumanCue.dialogue([{ from: 1, to: 3, accents: [4] }]),
  );
}
