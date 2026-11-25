import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import {
  StrikingEventVerdicts,
  StrikingVerdicts,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The scenarios of
 * `test_unit_motions_executable_striking_event_verdicts_defence`.
 */
namespace ScenarioStrikingEventVerdictsDefence {
  /**
   * `StrikingEventVerdicts.defence` classes a defence by its own events: in time
   * when the guard is set by the contact, late when set within half its movement
   * (read to set) after it, failed otherwise, and passes when that class is the
   * declared outcome or none is declared.
   *
   * A 1 s plan starts at 1 s and reads the strike at 0.1 s; the contact comes at
   * 0.4 s.
   *
   * Scenarios:
   *
   * 1. Set at 0.3 s, before the contact: in time.
   * 2. Set at 0.5 s, 0.1 s after the contact of a 0.4 s movement: late.
   * 3. Set at 0.8 s, 0.4 s after the contact of a 0.7 s movement: failed, against a
   *    declared late.
   * 4. A plan without its set event fails and names it.
   */
  export function test_unit_motions_executable_striking_event_verdicts_defence(): void {
    const defence = (
      set: number | undefined,
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
            ...(set === undefined
              ? []
              : [{ name: "set", share: set } satisfies IAutoMovieMotionEvent]),
          ],
        },
      });
    const shown = (detail: string): string =>
      detail.split(": ")[1]!.split(" ")[0]!;
    TestValidator.equals(
      "in time, late, failed and incomplete",
      [
        shown(defence(0.3, "inTime").detail),
        defence(0.3, "inTime").passed,
        shown(defence(0.5).detail),
        defence(0.5).passed,
        shown(defence(0.8, "late").detail),
        defence(0.8, "late").passed,
        defence(undefined),
      ],
      [
        "inTime",
        true,
        "late",
        true,
        "fail",
        false,
        {
          name: "b d1 defence",
          passed: false,
          detail: "the plan lacks its set event",
        },
      ],
    );
  }
}

/**
 * The scenarios of
 * `test_unit_motions_executable_striking_event_verdicts_refusal`.
 */
namespace ScenarioStrikingEventVerdictsRefusal {
  /**
   * `StrikingEventVerdicts.refusal` passes only when a late redirect is refused
   * as an illegal cut into a kick.
   *
   * Scenarios:
   *
   * 1. The cut refusal passes and is shown.
   * 2. Another error fails.
   * 3. An accepted redirect fails and reads as accepted.
   */
  export function test_unit_motions_executable_striking_event_verdicts_refusal(): void {
    const refusing = (): never => {
      throw new Error("punch cannot be cut into kick after its chamber");
    };
    const other = (): never => {
      throw new Error("out of reach");
    };
    TestValidator.equals(
      "refused, refused otherwise, accepted",
      [
        StrikingEventVerdicts.refusal(refusing).passed,
        StrikingEventVerdicts.refusal(other).passed,
        StrikingEventVerdicts.refusal((): number => 1).detail,
      ],
      [true, false, 'accepted; bound the "cannot be cut into kick" refusal'],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_verdicts_at`. */
namespace ScenarioStrikingVerdictsAt {
  /**
   * `StrikingVerdicts.at` reads a segment's named event as a film second: the
   * segment's start plus the event's share of the plan's duration.
   *
   * Scenarios:
   *
   * 1. A launch at a quarter of a 2 s plan starting at 1 s lands at 1.5 s.
   * 2. An event the plan lacks reads undefined.
   */
  export function test_unit_motions_executable_striking_verdicts_at(): void {
    const segment: StrikingVerdicts.ITimed = {
      start: 1,
      end: 3,
      plan: { duration: 2, events: [{ name: "launch", share: 0.25 }] },
    };
    TestValidator.equals(
      "the event's second, or none",
      [
        StrikingVerdicts.at(segment, "launch"),
        StrikingVerdicts.at(segment, "contact"),
      ],
      [1.5, undefined],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_verdicts_classify`. */
namespace ScenarioStrikingVerdictsClassify {
  /**
   * `StrikingVerdicts.classify` sorts the bone a strike met into a class: the
   * head, neck, jaw and eyes are the head; the hips, spine and chests the trunk;
   * the thigh, shank, foot and toes the leg; anything else the guard.
   *
   * Scenarios:
   *
   * 1. One bone of each class, the guard's an arm, a shoulder and a finger.
   */
  export function test_unit_motions_executable_striking_verdicts_classify(): void {
    const bones: AutoMovieHumanoidBone[] = [
      "head",
      "leftEye",
      "upperChest",
      "hips",
      "rightLowerLeg",
      "leftToes",
      "rightLowerArm",
      "leftShoulder",
      "rightIndexProximal",
    ];
    TestValidator.equals(
      "each bone's class",
      bones.map(
        (bone: AutoMovieHumanoidBone): StrikingVerdicts.Class =>
          StrikingVerdicts.classify(bone),
      ),
      [
        "head",
        "head",
        "trunk",
        "trunk",
        "leg",
        "leg",
        "guard",
        "guard",
        "guard",
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_striking_verdicts_peak`. */
namespace ScenarioStrikingVerdictsPeak {
  /**
   * `StrikingVerdicts.peak` is the second a strike shows its peak: its planned
   * contact, else its `shown` event, else its `chamber` event, else its end, and
   * never after its end.
   *
   * Scenarios:
   *
   * 1. A contact planned 0.4 s in, on a segment starting at 1 s, peaks at 1.4 s.
   * 2. A contact past the end peaks at the end.
   * 3. Without a contact, the shown event leads the chamber.
   * 4. With only the chamber, the chamber; with neither, the end.
   */
  export function test_unit_motions_executable_striking_verdicts_peak(): void {
    const timed = (
      contact: number | undefined,
      events: StrikingVerdicts.ITimed["plan"]["events"],
    ): StrikingVerdicts.ITimed => ({
      start: 1,
      end: 2,
      plan: {
        duration: 1,
        events,
        ...(contact === undefined ? {} : { contact }),
      },
    });
    TestValidator.equals(
      "contact, end, shown, chamber, end",
      [
        StrikingVerdicts.peak(timed(0.4, [])),
        StrikingVerdicts.peak(timed(1.5, [])),
        StrikingVerdicts.peak(
          timed(undefined, [
            { name: "chamber", share: 0.2 },
            { name: "shown", share: 0.5 },
          ]),
        ),
        StrikingVerdicts.peak(
          timed(undefined, [{ name: "chamber", share: 0.25 }]),
        ),
        StrikingVerdicts.peak(timed(undefined, [])),
      ],
      [1.4, 2, 1.5, 1.25, 2],
    );
  }
}

/**
 * The `striking_verdicts` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_striking_verdicts(): void {
  ScenarioStrikingEventVerdictsDefence.test_unit_motions_executable_striking_event_verdicts_defence();
  ScenarioStrikingEventVerdictsRefusal.test_unit_motions_executable_striking_event_verdicts_refusal();
  ScenarioStrikingVerdictsAt.test_unit_motions_executable_striking_verdicts_at();
  ScenarioStrikingVerdictsClassify.test_unit_motions_executable_striking_verdicts_classify();
  ScenarioStrikingVerdictsPeak.test_unit_motions_executable_striking_verdicts_peak();
}
