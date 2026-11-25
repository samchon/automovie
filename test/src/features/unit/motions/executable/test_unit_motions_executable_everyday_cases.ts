import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanProp,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import {
  everydayCaseKit,
  everydayGestureSwings,
  everydayPostureCaseObstacle,
  everydayTypeCaseBoard,
  everydayVerdicts,
  typeText,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_executable_everyday_case_kit_angle`. */
namespace ScenarioEverydayCaseKitAngle {
  /**
   * `everydayCaseKit.angle` is the angle between two directions in degrees,
   * whatever their lengths.
   *
   * Scenarios:
   *
   * 1. +X and +Y are 90 degrees apart, +X and its double 0, +X and -X 180.
   * 2. +X and (1, 1, 0) are 45 degrees apart.
   */
  export function test_unit_motions_executable_everyday_case_kit_angle(): void {
    TestValidator.predicate(
      "right, none, straight and half-right",
      nclose(
        everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 0, y: 3, z: 0 }),
        90,
        1e-9,
      ) &&
        nclose(
          everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }),
          0,
          1e-9,
        ) &&
        nclose(
          everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }),
          180,
          1e-9,
        ) &&
        nclose(
          everydayCaseKit.angle({ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }),
          45,
          1e-9,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_everyday_case_kit_event`. */
namespace ScenarioEverydayCaseKitEvent {
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
   * `everydayCaseKit.event` is the film second of an event of a person's n-th
   * action: that segment's start plus the event's share of its plan.
   *
   * Subject `a` walks over 1 to 3 s, stepping at its middle, then waves over 3 to
   * 4 s, peaking a quarter in.
   *
   * Scenarios:
   *
   * 1. The first action's step lands at 2 s, the second action's peak at 3.25 s.
   */
  export function test_unit_motions_executable_everyday_case_kit_event(): void {
    const shown: Parameters<typeof everydayCaseKit.event>[0] = {
      segments: SEGMENTS,
    };
    TestValidator.equals(
      "by action index",
      [
        everydayCaseKit.event(shown, "a", 0, "step"),
        everydayCaseKit.event(shown, "a", 1, "peak"),
      ],
      [2, 3.25],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_everyday_case_kit_figure`. */
namespace ScenarioEverydayCaseKitFigure {
  /**
   * `everydayCaseKit.figure` draws a performer: its subject's id, the polygon
   * man's canonical body, its displayed pose read from the performance at each
   * second, and its colour only when one is given.
   *
   * Scenarios:
   *
   * 1. Subject `b` is drawn with the man's body and posed through the performance at
   *    the second asked.
   * 2. A colour is carried when given, and absent otherwise.
   */
  export async function test_unit_motions_executable_everyday_case_kit_figure(): Promise<void> {
    const fixture: IHumanFixture = await humanFixture("m-average");
    const body: IAutoMovieHumanCanonicalBody.IBody = {
      skeleton: fixture.skeleton,
      profile: fixture.profile,
      joints: [],
    };
    const asked: [string, number][] = [];
    const shown: Pick<Parameters<typeof everydayCaseKit.figure>[0], "pose"> = {
      pose: (subject: string, seconds: number): IAutoMoviePose => {
        asked.push([subject, seconds]);
        return { skeleton: fixture.skeleton.id, root: null, joints: [] };
      },
    };
    const plain: IMotionCaptureCase.IPerformer = everydayCaseKit.figure(
      shown,
      "b",
      {
        body,
      },
    );
    const red: IMotionCaptureCase.IPerformer = everydayCaseKit.figure(
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

/** The scenarios of `test_unit_motions_executable_everyday_gesture_swings`. */
namespace ScenarioEverydayGestureSwings {
  /**
   * `everydayGestureSwings` counts a sampled gesture's swings: its interior local
   * maxima standing above a quarter of the signal's range from its least value.
   *
   * Scenarios:
   *
   * 1. Two equal peaks count two.
   * 2. A tremor of a tenth of the range beside a full peak counts only the peak.
   * 3. A plateau counts once, at its rising edge.
   * 4. The ends of the signal are never peaks.
   */
  export function test_unit_motions_executable_everyday_gesture_swings(): void {
    TestValidator.equals(
      "peaks above a quarter of the range",
      [
        everydayGestureSwings([0, 1, 0, 1, 0]),
        everydayGestureSwings([0, 0.1, 0, 1, 0]),
        everydayGestureSwings([0, 1, 1, 0]),
        everydayGestureSwings([1, 0, 1]),
      ],
      [2, 1, 1, 0],
    );
  }
}

/**
 * The scenarios of
 * `test_unit_motions_executable_everyday_posture_case_obstacle`.
 */
namespace ScenarioEverydayPostureCaseObstacle {
  /**
   * `everydayPostureCaseObstacle` stages a box to step over with a kerb's
   * contacts: an `edge` along its near top and a `top` face its depth deep, the
   * box turned so its near side faces a performer at the origin facing +Z.
   *
   * A 0.2 m high, 0.3 m deep box whose near side's middle stands at (0, 0, 0.5).
   *
   * Scenarios:
   *
   * 1. In the world the edge runs at (0, 0.2, 0.5), the near top.
   * 2. The top's middle lies at (0, 0.2, 0.65), 0.3 m deep.
   */
  export function test_unit_motions_executable_everyday_posture_case_obstacle(): void {
    const box: IAutoMovieMotionHumanProp = everydayPostureCaseObstacle({
      at: { x: 0, y: 0, z: 0.5 },
      height: 0.2,
      depth: 0.3,
    });
    const world = (id: string): IAutoMovieVector3 => {
      const a: IAutoMovieAffordance = box.affordances!.find(
        (c: IAutoMovieAffordance): boolean => c.id === id,
      )!;
      return Vector3.add(
        box.frame.position,
        Quaternion.rotateVector(box.frame.rotation, a.frame.translation),
      );
    };
    TestValidator.predicate(
      "the near top edge and the top's middle",
      vclose(world("edge"), { x: 0, y: 0.2, z: 0.5 }, 1e-12) &&
        vclose(world("top"), { x: 0, y: 0.2, z: 0.65 }, 1e-12) &&
        box.affordances![1]!.depth === 0.3,
    );
  }
}

/** The scenarios of `test_unit_motions_executable_everyday_type_case_board`. */
namespace ScenarioEverydayTypeCaseBoard {
  /**
   * `everydayTypeCaseBoard` stages a keyboard: its home row at its origin and a
   * key field as wide as the letter rows (`typeText.WIDTH`), the board turned so
   * its +Z side, where the typist sits, faces a typist at the origin facing +Z.
   *
   * Scenarios:
   *
   * 1. Placed at (0, 0.75, 0.4), its home row is there and its +Z faces -Z.
   * 2. Its key field is `typeText.WIDTH` wide.
   */
  export function test_unit_motions_executable_everyday_type_case_board(): void {
    const board: IAutoMovieMotionHumanProp = everydayTypeCaseBoard({
      x: 0,
      y: 0.75,
      z: 0.4,
    });
    TestValidator.predicate(
      "placed facing the typist",
      vclose(board.frame.position, { x: 0, y: 0.75, z: 0.4 }, 1e-12) &&
        vclose(
          Quaternion.rotateVector(board.frame.rotation, { x: 0, y: 0, z: 1 }),
          { x: 0, y: 0, z: -1 },
          1e-12,
        ),
    );
    TestValidator.equals(
      "the home row and the key field",
      board.affordances!.map(
        (a: IAutoMovieAffordance): [string, number | undefined] => [
          a.id,
          a.width,
        ],
      ),
      [
        ["homeRow", undefined],
        ["keys", typeText.WIDTH],
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_everyday_verdicts_within`. */
namespace ScenarioEverydayVerdictsWithin {
  /**
   * `everydayVerdicts.within` passes a measure at or below its limit and shows it
   * in millimetres for metres, or in degrees.
   *
   * Scenarios:
   *
   * 1. A 3 mm slip under a 5 mm limit passes.
   * 2. A 2 degree overshoot over a 1 degree limit fails.
   * 3. A value equal to its limit passes.
   */
  export function test_unit_motions_executable_everyday_verdicts_within(): void {
    TestValidator.equals(
      "under, over and at the limit",
      [
        everydayVerdicts.within("slip", 0.003, 0.005, "mm"),
        everydayVerdicts.within("rom", 2, 1, "deg"),
        everydayVerdicts.within("rom", 1, 1, "deg").passed,
      ],
      [
        {
          name: "slip",
          passed: true,
          detail: "3.0 mm (limit 5.0 mm)",
        } satisfies IMotionCaptureCase.IVerdict,
        {
          name: "rom",
          passed: false,
          detail: "2.00 deg (limit 1.00 deg)",
        } satisfies IMotionCaptureCase.IVerdict,
        true,
      ],
    );
  }
}

/**
 * The `everyday_cases` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export async function test_unit_motions_executable_everyday_cases(): Promise<void> {
  ScenarioEverydayCaseKitAngle.test_unit_motions_executable_everyday_case_kit_angle();
  ScenarioEverydayCaseKitEvent.test_unit_motions_executable_everyday_case_kit_event();
  await ScenarioEverydayCaseKitFigure.test_unit_motions_executable_everyday_case_kit_figure();
  ScenarioEverydayGestureSwings.test_unit_motions_executable_everyday_gesture_swings();
  ScenarioEverydayPostureCaseObstacle.test_unit_motions_executable_everyday_posture_case_obstacle();
  ScenarioEverydayTypeCaseBoard.test_unit_motions_executable_everyday_type_case_board();
  ScenarioEverydayVerdictsWithin.test_unit_motions_executable_everyday_verdicts_within();
}
