import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionEvent,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** The scenarios of `test_unit_motions_executable_family_case_kit_angle`. */
namespace ScenarioFamilyCaseKitAngle {
  /**
   * `FamilyCaseKit.angle` reads one clinical angle of a displayed joint: flexion
   * by default, abduction or twist on request, zero when unset or omitted.
   *
   * Scenarios:
   *
   * 1. A shoulder at (30, 45, unset) reads 30, 45 and 0.
   * 2. An omitted elbow reads 0.
   */
  export function test_unit_motions_executable_family_case_kit_angle(): void {
    const shown: Parameters<typeof FamilyCaseKit.angle>[0] = {
      pose: (): IAutoMoviePose => ({
        skeleton: "s",
        root: null,
        joints: [
          { bone: "rightUpperArm", flexion: 30, abduction: 45, twist: null },
        ],
      }),
    };
    TestValidator.equals(
      "each axis, and an omitted joint",
      [
        FamilyCaseKit.angle(shown, "a", 0, "rightUpperArm"),
        FamilyCaseKit.angle(shown, "a", 0, "rightUpperArm", 1),
        FamilyCaseKit.angle(shown, "a", 0, "rightUpperArm", 2),
        FamilyCaseKit.angle(shown, "a", 0, "rightLowerArm"),
      ],
      [30, 45, 0, 0],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_attempt`. */
namespace ScenarioFamilyCaseKitAttempt {
  /**
   * `FamilyCaseKit.attempt` returns what the build returns, and when the build
   * throws appends that case's refusal and returns null, so the remaining cases
   * still run.
   *
   * Scenarios:
   *
   * 1. A build that returns 7 yields 7 and appends nothing.
   * 2. A build that throws yields null and appends one refused case of that name,
   *    its `planned` verdict failing with the thrown message.
   */
  export function test_unit_motions_executable_family_case_kit_attempt(): void {
    const out: IMotionCaptureCase[] = [];
    TestValidator.equals(
      "a built case",
      [FamilyCaseKit.attempt(out, "built", (): number => 7), out.length],
      [7, 0],
    );
    const failed: number | null = FamilyCaseKit.attempt(
      out,
      "refused",
      (): number => {
        throw new Error("no place");
      },
    );
    TestValidator.equals(
      "a refused case",
      [failed, out],
      [null, [FamilyCaseKit.refused("refused", new Error("no place"))]],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_band`. */
namespace ScenarioFamilyCaseKitBand {
  /**
   * `FamilyCaseKit.band` passes a value inside its closed band and shows it in
   * its unit: metres as millimetres, degrees or seconds.
   *
   * Scenarios:
   *
   * 1. 5 mm inside a 0 to 10 mm band passes and reads in millimetres.
   * 2. 91 degrees outside a 0 to 90 degree band fails.
   * 3. A value on the bound in seconds passes.
   */
  export function test_unit_motions_executable_family_case_kit_band(): void {
    TestValidator.equals(
      "inside, outside and on the bound",
      [
        FamilyCaseKit.band("gap", 0.005, 0, 0.01, "mm"),
        FamilyCaseKit.band("knee", 91, 0, 90, "deg"),
        FamilyCaseKit.band("late", 0.2, 0, 0.2, "s"),
      ],
      [
        {
          name: "gap",
          passed: true,
          detail: "5.0 mm (band 0.0 mm to 10.0 mm)",
        },
        {
          name: "knee",
          passed: false,
          detail: "91.00 deg (band 0.00 deg to 90.00 deg)",
        },
        {
          name: "late",
          passed: true,
          detail: "0.200 s (band 0.000 s to 0.200 s)",
        },
      ] satisfies IMotionCaptureCase.IVerdict[],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_drift`. */
namespace ScenarioFamilyCaseKitDrift {
  /**
   * `FamilyCaseKit.drift` is the greatest distance of a bone's joint from a
   * moving point over a span, on the 24 Hz grid.
   *
   * The hand moves along +X at 1 m/s from the origin; the point stands still at
   * the origin.
   *
   * Scenarios:
   *
   * 1. Over 0 to 0.5 s the hand drifts at most 0.5 m, at the span's end.
   * 2. A point that follows the hand sees no drift.
   */
  export function test_unit_motions_executable_family_case_kit_drift(): void {
    const shown: Parameters<typeof FamilyCaseKit.drift>[0] = {
      bones: (
        _subject: string,
        seconds: number,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        new Map([
          [
            "rightHand",
            {
              bone: "rightHand",
              localRotation: { x: 0, y: 0, z: 0, w: 1 },
              worldPosition: { x: seconds, y: 1, z: 0 },
              worldRotation: { x: 0, y: 0, z: 0, w: 1 },
            },
          ],
        ]),
    };
    TestValidator.predicate(
      "the worst drift, and none",
      nclose(
        FamilyCaseKit.drift(
          shown,
          "a",
          "rightHand",
          (): IAutoMovieVector3 => ({ x: 0, y: 1, z: 0 }),
          0,
          0.5,
        ),
        0.5,
        1e-9,
      ) &&
        FamilyCaseKit.drift(
          shown,
          "a",
          "rightHand",
          (t: number): IAutoMovieVector3 => ({ x: t, y: 1, z: 0 }),
          0,
          0.5,
        ) === 0,
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_event`. */
namespace ScenarioFamilyCaseKitEvent {
  /** Two segments of subject `a`: a walk over 1 to 3 s and a wave over 3 to 4 s. */
  const SEGMENTS = (
    subject: string,
  ): {
    name: "walk" | "wave";
    start: number;
    plan: { duration: number; events: IAutoMovieMotionEvent[] };
  }[] =>
    subject === "a"
      ? [
          {
            name: "walk",
            start: 1,
            plan: { duration: 2, events: [{ name: "step", share: 0.5 }] },
          },
          {
            name: "wave",
            start: 3,
            plan: { duration: 1, events: [{ name: "peak", share: 0.25 }] },
          },
        ]
      : [];
  /**
   * `FamilyCaseKit.event` is the film second of a named event of a subject's
   * first action that has it: the segment's start plus the event's share of its
   * plan.
   *
   * Subject `a` walks over 1 to 3 s, stepping at its middle, then waves over 3 to
   * 4 s, peaking a quarter in.
   *
   * Scenarios:
   *
   * 1. The step lands at 2 s and the peak at 3.25 s.
   * 2. An event no action has, or a subject with no action, is refused.
   */
  export function test_unit_motions_executable_family_case_kit_event(): void {
    const shown: Parameters<typeof FamilyCaseKit.event>[0] = {
      segments: SEGMENTS,
    };
    TestValidator.equals(
      "the events' seconds",
      [FamilyCaseKit.event(shown, "step"), FamilyCaseKit.event(shown, "peak")],
      [2, 3.25],
    );
    TestValidator.predicate(
      "missing",
      throwsError(() => FamilyCaseKit.event(shown, "jump")) &&
        throwsError(() => FamilyCaseKit.event(shown, "step", "b")),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_figure`. */
namespace ScenarioFamilyCaseKitFigure {
  /**
   * `FamilyCaseKit.figure` draws a performer: its subject's id, the polygon man's
   * canonical body, its displayed pose read from the performance at each second.
   *
   * Scenarios:
   *
   * 1. The default subject `a` is drawn with the man's body and posed through the
   *    performance at the second asked.
   */
  export async function test_unit_motions_executable_family_case_kit_figure(): Promise<void> {
    const fixture: IHumanFixture = await humanFixture("m-average");
    const body: IAutoMovieHumanCanonicalBody.IBody = {
      skeleton: fixture.skeleton,
      profile: fixture.profile,
      joints: [],
    };
    const asked: [string, number][] = [];
    const shown: Pick<Parameters<typeof FamilyCaseKit.figure>[0], "pose"> = {
      pose: (subject: string, seconds: number): IAutoMoviePose => {
        asked.push([subject, seconds]);
        return { skeleton: fixture.skeleton.id, root: null, joints: [] };
      },
    };
    const figure: IMotionCaptureCase.IPerformer = FamilyCaseKit.figure(shown, {
      body,
    });
    figure.pose(0.5);
    TestValidator.equals(
      "the drawn figure",
      [figure.id, figure.body === body, asked],
      ["a", true, [["a", 0.5]]],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_refused`. */
namespace ScenarioFamilyCaseKitRefused {
  /**
   * `FamilyCaseKit.refused` turns a refused performance into a case with no
   * figure and one failing `planned` verdict naming the refusal.
   *
   * Scenarios:
   *
   * 1. An error's message becomes the verdict's detail.
   * 2. A thrown string is shown as it is.
   */
  export function test_unit_motions_executable_family_case_kit_refused(): void {
    const refused: IMotionCaptureCase = FamilyCaseKit.refused(
      "kick",
      new Error("out of reach"),
    );
    TestValidator.equals(
      "the refused case",
      [refused, FamilyCaseKit.refused("kick", "late").verdicts],
      [
        {
          name: "kick",
          times: [{ seconds: 0, label: "refused" }],
          performers: [],
          verdicts: [
            { name: "planned", passed: false, detail: "out of reach" },
          ],
        },
        [{ name: "planned", passed: false, detail: "late" }],
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_family_case_kit_times`. */
namespace ScenarioFamilyCaseKitTimes {
  /**
   * `FamilyCaseKit.times` draws a whole performance at a fixed step with its
   * named instants: a grid instant within a quarter step of a named one gives way
   * to it, the last instant is the performance's end, and all are in order.
   *
   * Scenarios:
   *
   * 1. A one-second performance at 0.25 s with a hit at 0.3 s: the 0.25 s grid
   *    instant gives way, the others keep their captions.
   * 2. A 0.9 s performance ends on its own end, not on the next step.
   */
  export function test_unit_motions_executable_family_case_kit_times(): void {
    TestValidator.equals(
      "the grid around a named instant",
      FamilyCaseKit.times({ duration: 1 }, 0.25, [[0.3, "hit"]]),
      [
        { seconds: 0, label: "0.00 s" },
        { seconds: 0.3, label: "hit" },
        { seconds: 0.5, label: "0.50 s" },
        { seconds: 0.75, label: "0.75 s" },
        { seconds: 1, label: "1.00 s" },
      ] satisfies IMotionCaptureCase.ITime[],
    );
    TestValidator.equals(
      "the end",
      FamilyCaseKit.times({ duration: 0.9 }, 0.25, []).map(
        (t: IMotionCaptureCase.ITime): number => t.seconds,
      ),
      [0, 0.25, 0.5, 0.75, 0.9],
    );
  }
}

/**
 * The `family_case_kit` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_executable_family_case_kit(): Promise<void> {
  ScenarioFamilyCaseKitAngle.test_unit_motions_executable_family_case_kit_angle();
  ScenarioFamilyCaseKitAttempt.test_unit_motions_executable_family_case_kit_attempt();
  ScenarioFamilyCaseKitBand.test_unit_motions_executable_family_case_kit_band();
  ScenarioFamilyCaseKitDrift.test_unit_motions_executable_family_case_kit_drift();
  ScenarioFamilyCaseKitEvent.test_unit_motions_executable_family_case_kit_event();
  await ScenarioFamilyCaseKitFigure.test_unit_motions_executable_family_case_kit_figure();
  ScenarioFamilyCaseKitRefused.test_unit_motions_executable_family_case_kit_refused();
  ScenarioFamilyCaseKitTimes.test_unit_motions_executable_family_case_kit_times();
}
