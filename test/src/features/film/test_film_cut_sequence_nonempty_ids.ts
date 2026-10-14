import { cutSequence } from "@automovie/engine";
import { IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "../internal/predicates";

const shot: (id: string) => IAutoMovieShot = (id: string): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration: 3,
});

/**
 * Assembly creates the sequence artifact and stores shot references inside it.
 * Blank ids can pass the shot-existence check when a built shot carries the
 * same blank id, but they are not usable stable cut-list references.
 *
 * Scenarios:
 *
 * 1. An empty sequence id and whitespace-only entry shot id refuse at their own input fields even though the supplied shot has that same whitespace id.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cutSequence with blank artifact and reference ids and requires a type finding on each input field, detecting acceptance based solely on a successful shot lookup.
 * @evidence contracts/testing.md#independent-expectations The literal empty string and single space contain no non-whitespace character and therefore cannot serve as stable cut ids; the source shot deliberately shares the reference so absence is not the reason for refusal.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty sequence identity and a whitespace reference that nevertheless resolves to a built shot; ordinary nonblank references and duplicate source identities are owned by separate cutSequence tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_cut_sequence_nonempty_ids entry owns one direct portable engine call and its shared predicates, with no dynamic cases, installation, process, browser or GPU.
 */
export function test_film_cut_sequence_nonempty_ids(): void {
  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "", name: "blank sequence" },
      fps: 24,
      entries: [{ shot: " ", trim: null, transition: null }],
      pacing: "n/a",
      continuity: "n/a",
    },
    [shot(" ")],
  );

  TestValidator.equals("blank cut ids fail", cut.success, false);
  TestValidator.equals(
    "sequence id violation",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false &&
          hasViolation(cut, "type", "$input.sequence.id"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "entry shot id violation",
    namedFacts([
      ["refused", (): boolean => cut.success === false],
      [
        "violated",
        (): boolean =>
          cut.success === false &&
          hasViolation(cut, "type", "$input.entries[0].shot"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
