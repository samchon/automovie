import type { AutoMovieHumanoidBone, IAutoMovieMotionEvent } from "@automovie/interface";
import type {
  IMotionCaptureCase
} from "../../../../../packages/motions/src/executable/internal/IMotionCaptureCase";
import {
  StrikingEventVerdicts
} from "../../../../../packages/motions/src/executable/cases/StrikingEventVerdicts";
import {
  StrikingVerdicts
} from "../../../../../packages/motions/src/executable/cases/StrikingVerdicts";
import { TestValidator } from "@nestia/e2e";

/** A strike over 1 to 2 s on a 1 s plan with its events. */
const timed = (
  contact: number | undefined,
  events: IAutoMovieMotionEvent[],
): StrikingVerdicts.ITimed => ({
  start: 1,
  end: 2,
  plan: {
    duration: 1,
    events,
    ...(contact === undefined ? {} : { contact }),
  },
});

/**
 * The striking captures' verdicts: the class of the bone a strike met, the
 * second a strike peaks, a defence's timing class, and the refused late cut.
 *
 * Scenarios:
 *
 * 1. The jaw's eye is the head, the upper chest the trunk, the toes the leg and a
 *    shoulder the guard.
 * 2. A strike planned to contact 0.4 s in peaks at 1.4 s; without a contact its
 *    `shown` event leads its `chamber`.
 * 3. A defence reading the strike at 0.1 s against a contact at 0.4 s, set at 0.5
 *    s, 0.1 s past the contact within half its 0.4 s movement, is late;
 *    declared late and set at 0.8 s it fails.
 * 4. A late redirect refused as a cut into a kick passes; an accepted one fails.
 */
export function test_motions_executable_striking_verdicts(): void {
  TestValidator.equals(
    "each bone's class",
    (
      [
        "leftEye",
        "upperChest",
        "leftToes",
        "leftShoulder",
      ] satisfies AutoMovieHumanoidBone[]
    ).map(
      (bone: AutoMovieHumanoidBone): StrikingVerdicts.Class =>
        StrikingVerdicts.classify(bone),
    ),
    ["head", "trunk", "leg", "guard"],
  );
  TestValidator.equals(
    "the contact, then the shown event",
    [
      StrikingVerdicts.peak(timed(0.4, [])),
      StrikingVerdicts.peak(
        timed(undefined, [
          { name: "chamber", share: 0.2 },
          { name: "shown", share: 0.5 },
        ]),
      ),
    ],
    [1.4, 1.5],
  );
  const defence = (
    set: number,
    outcome?: string,
  ): IMotionCaptureCase.IVerdict =>
    StrikingEventVerdicts.defence("b", {
      id: "d1",
      params: outcome === undefined ? {} : { outcome },
      start: 1,
      end: 2,
      plan: {
        duration: 1,
        events: [
          { name: "read", share: 0.1 },
          { name: "contact", share: 0.4 },
          { name: "set", share: set },
        ],
      },
    });
  TestValidator.equals(
    "late, and failed against a declared late",
    [
      defence(0.5).detail.split(": ")[1]!.split(" ")[0],
      defence(0.8, "late").passed,
    ],
    ["late", false],
  );
  TestValidator.equals(
    "the refused cut",
    [
      StrikingEventVerdicts.refusal((): never => {
        throw new Error("punch cannot be cut into kick after its chamber");
      }).passed,
      StrikingEventVerdicts.refusal((): number => 1).passed,
    ],
    [true, false],
  );
}
