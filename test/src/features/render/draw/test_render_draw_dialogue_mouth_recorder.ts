import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnMouth,
  IAutoMovieHumanVisemeWeights,
} from "@automovie/interface";
import { AutoMovieDialogueMouthRecorder } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * The draw page records the dialogue mouth its subject read for each actor, so
 * a picture reports the mouth it was handed.
 *
 * Scenarios:
 *
 * 1. Before any read the record is empty.
 * 2. A jaw read for one actor and a viseme read for another are recorded in the
 *    order first read, each with only the form read.
 * 3. A later read of the same actor and form replaces the earlier value, as when
 *    an inspection places another second and then the drawn one again: the jaw
 *    read at frame 11 (6 mm) and then frame 12 (12 mm) records 12 mm.
 * 4. Changing a returned or reported weight leaves the record unchanged.
 * 5. `clear` empties the record before the next placement.
 */
export function test_render_draw_dialogue_mouth_recorder(): void {
  const track: IAutoMovieDialogueMouthTrack = {
    fps: 24,
    lines: [
      {
        line: "ann-1",
        actor: "ann",
        startFrame: 10,
        endFrame: 13,
        jaw: [0, 6, 12],
        ranges: null,
      },
      {
        line: "bob-1",
        actor: "bob",
        startFrame: 10,
        endFrame: 13,
        jaw: [0, 6, 12],
        ranges: null,
      },
    ],
  };
  const recorder: AutoMovieDialogueMouthRecorder =
    new AutoMovieDialogueMouthRecorder(track);
  TestValidator.equals("nothing is read yet", recorder.drawn(), []);

  recorder.mouths.jaw("ann", 11 / 24);
  const weights: IAutoMovieHumanVisemeWeights = recorder.mouths.visemes(
    "bob",
    11 / 24,
  );
  recorder.mouths.jaw("ann", 12 / 24);
  weights.aa = 1;
  const drawn: IAutoMovieDrawnMouth[] = recorder.drawn();
  const half: (mouth: IAutoMovieDrawnMouth | undefined) => boolean = (
    mouth: IAutoMovieDrawnMouth | undefined,
  ): boolean =>
    mouth !== undefined &&
    mouth.actor === "bob" &&
    mouth.jaw === undefined &&
    Object.keys(mouth.visemes ?? {}).join() === "aa,sil" &&
    nclose(mouth.visemes?.aa ?? -1, 0.5) &&
    nclose(mouth.visemes?.sil ?? -1, 0.5);
  TestValidator.predicate(
    "each actor's last read of each form is recorded in first-read order",
    drawn.length === 2 &&
      drawn[0]!.actor === "ann" &&
      nclose(drawn[0]!.jaw ?? -1, 12) &&
      drawn[0]!.visemes === undefined &&
      half(drawn[1]),
  );

  drawn[1]!.visemes!.aa = 0;
  TestValidator.predicate(
    "the record is copied out",
    half(recorder.drawn()[1]),
  );
  recorder.clear();
  TestValidator.equals("clear forgets every read", recorder.drawn(), []);
}
