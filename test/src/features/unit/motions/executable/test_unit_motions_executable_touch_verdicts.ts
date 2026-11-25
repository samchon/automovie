import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionEvent,
  IAutoMoviePose,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { TouchVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { throwsError } from "../../../internal/throwsError";

/** The scenarios of `test_unit_motions_executable_touch_verdicts_event`. */
namespace ScenarioTouchVerdictsEvent {
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
   * `TouchVerdicts.event` is the film second of an event of a performer's action,
   * the first when no index is given, refusing an event that action lacks.
   *
   * Subject `a` walks over 1 to 3 s, stepping at its middle, then waves over 3 to
   * 4 s, peaking a quarter in.
   *
   * Scenarios:
   *
   * 1. The step lands at 2 s; the second action's peak at 3.25 s.
   * 2. A peak asked of the walk is refused.
   */
  export function test_unit_motions_executable_touch_verdicts_event(): void {
    const shown: Parameters<typeof TouchVerdicts.event>[0] = {
      segments: SEGMENTS,
    };
    TestValidator.equals(
      "the events' seconds",
      [
        TouchVerdicts.event(shown, "a", "step"),
        TouchVerdicts.event(shown, "a", "peak", 1),
      ],
      [2, 3.25],
    );
    TestValidator.predicate(
      "not in that action",
      throwsError(() => TouchVerdicts.event(shown, "a", "peak")),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_touch_verdicts_figure`. */
namespace ScenarioTouchVerdictsFigure {
  /**
   * `TouchVerdicts.figure` draws a performer: its subject's id, the polygon man's
   * canonical body, its displayed pose read from the performance at each second,
   * and its colour only when one is given.
   *
   * Scenarios:
   *
   * 1. Subject `b` is drawn with the man's body and posed through the performance at
   *    the second asked.
   * 2. A colour is carried when given, and absent otherwise.
   */
  export async function test_unit_motions_executable_touch_verdicts_figure(): Promise<void> {
    const fixture: IHumanFixture = await humanFixture("m-average");
    const body: IAutoMovieHumanCanonicalBody.IBody = {
      skeleton: fixture.skeleton,
      profile: fixture.profile,
      joints: [],
    };
    const asked: [string, number][] = [];
    const shown: Pick<Parameters<typeof TouchVerdicts.figure>[0], "pose"> = {
      pose: (subject: string, seconds: number): IAutoMoviePose => {
        asked.push([subject, seconds]);
        return { skeleton: fixture.skeleton.id, root: null, joints: [] };
      },
    };
    const plain: IMotionCaptureCase.IPerformer = TouchVerdicts.figure(
      shown,
      "b",
      {
        body,
      },
    );
    const red: IMotionCaptureCase.IPerformer = TouchVerdicts.figure(
      shown,
      "b",
      { body },
      0xff0000,
    );
    plain.pose(1.25);
    TestValidator.equals(
      "the drawn figure",
      [plain.id, plain.body === body, asked, plain.color, red.color],
      ["b", true, [["b", 1.25]], undefined, 0xff0000],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_touch_verdicts_times`. */
namespace ScenarioTouchVerdictsTimes {
  /**
   * `TouchVerdicts.times` draws a duration at a fixed step with its named
   * instants: a grid instant within a quarter step of a named one gives way to
   * it, the last instant is the end, and all are in order.
   *
   * Scenarios:
   *
   * 1. Half a second at 0.25 s with a contact named at 0.26 s keeps the contact and
   *    drops the 0.25 s grid instant.
   * 2. Named instants out of order come back sorted.
   */
  export function test_unit_motions_executable_touch_verdicts_times(): void {
    TestValidator.equals(
      "the grid around a named instant",
      TouchVerdicts.times(0.5, 0.25, [[0.26, "contact"]]),
      [
        { seconds: 0, label: "0.00 s" },
        { seconds: 0.26, label: "contact" },
        { seconds: 0.5, label: "0.50 s" },
      ] satisfies IMotionCaptureCase.ITime[],
    );
    TestValidator.equals(
      "sorted",
      TouchVerdicts.times(1, 1, [
        [0.6, "b"],
        [0.3, "a"],
      ]).map((t: IMotionCaptureCase.ITime): string => t.label),
      ["0.00 s", "a", "b", "1.00 s"],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_touch_verdicts_touches`. */
namespace ScenarioTouchVerdictsTouches {
  /**
   * `TouchVerdicts.touches` counts how often an effector comes down on its
   * region: the local minima of its miss on a 96 Hz grid within the limit, not
   * counting the window's first sample.
   *
   * Scenarios:
   *
   * 1. A miss dipping to zero at 0.25 s and 0.75 s over one second comes down twice.
   * 2. A limit below both dips counts none.
   * 3. A miss falling from its first sample is not a touch until it dips.
   */
  export function test_unit_motions_executable_touch_verdicts_touches(): void {
    const twice = (t: number): number =>
      Math.min(Math.abs(t - 0.25), Math.abs(t - 0.75));
    const rising = (t: number): number => t;
    TestValidator.equals(
      "two dips, none under a tight limit, none at the start",
      [
        TouchVerdicts.touches(twice, 0, 1, 0.01),
        TouchVerdicts.touches(twice, 0, 1, -0.01),
        TouchVerdicts.touches(rising, 0, 1, 0.5),
      ],
      [2, 0, 0],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_touch_verdicts_within`. */
namespace ScenarioTouchVerdictsWithin {
  /**
   * `TouchVerdicts.within` passes when the worst miss over the instants stays
   * within the limit, and reports that miss and its second.
   *
   * Scenarios:
   *
   * 1. Misses of 1, 4 and 2 mm against a 5 mm limit pass, worst 4 mm at 0.5 s.
   * 2. The same misses against a 3 mm limit fail.
   * 3. No instants reads no miss and passes.
   */
  export function test_unit_motions_executable_touch_verdicts_within(): void {
    const miss = (seconds: number): number =>
      seconds === 0.5 ? 0.004 : seconds === 1 ? 0.002 : 0.001;
    TestValidator.equals(
      "the worst miss against its limit",
      [
        TouchVerdicts.within("palm", miss, [0, 0.5, 1], 0.005),
        TouchVerdicts.within("palm", miss, [0, 0.5, 1], 0.003).passed,
        TouchVerdicts.within("palm", miss, [], 0.003).passed,
      ],
      [
        {
          name: "palm",
          passed: true,
          detail: "4.0 mm at 0.50 s (limit 5.0 mm)",
        } satisfies IMotionCaptureCase.IVerdict,
        false,
        true,
      ],
    );
  }
}

/**
 * The `touch_verdicts` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_executable_touch_verdicts(): Promise<void> {
  ScenarioTouchVerdictsEvent.test_unit_motions_executable_touch_verdicts_event();
  await ScenarioTouchVerdictsFigure.test_unit_motions_executable_touch_verdicts_figure();
  ScenarioTouchVerdictsTimes.test_unit_motions_executable_touch_verdicts_times();
  ScenarioTouchVerdictsTouches.test_unit_motions_executable_touch_verdicts_touches();
  ScenarioTouchVerdictsWithin.test_unit_motions_executable_touch_verdicts_within();
}
