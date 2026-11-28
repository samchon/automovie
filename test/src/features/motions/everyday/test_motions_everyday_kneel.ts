import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  kneelPhaseTable
} from "../../../../../packages/motions/src/everyday/internal/kneelPhaseTable";
import {
  kneelPlace
} from "../../../../../packages/motions/src/everyday/internal/kneelPlace";
import {
  prepareKneelClock
} from "../../../../../packages/motions/src/everyday/internal/prepareKneelClock";
import {
  walkRoot
} from "../../../../../packages/motions/src/actions/internal/walkRoot";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { linearMotionClock } from "../../internal/synthetic/linearMotionClock";
import { vclose } from "../../internal/vclose";

namespace part_kneel_phase_table {
  /**
   * `kneelPhaseTable` lays a kneel's phases over its keys: down through the
   * step back (0.7 s), the lowering (1.0 s), the knee's contact (0.9 s) and the
   * second knee's (0.8 s) as far as the keys go, each scaled by the square root
   * of the hip height over the reference hip, then each mark at the bottom, the
   * hold, and, rising, back up through the same phases' seconds under the
   * kind's rising names to `stood`.
   *
   * Scenarios:
   *
   * 1. Kneeling on both knees (four keys) at the reference hip, with one mark, a 1
   *    s hold and the rise: stepBack, lowering and kneeContact, the mark, the
   *    hold, then kneeOff, frontUp and stepForward retracing them, and stood.
   * 2. At four times the reference hip every timed phase takes twice as long.
   * 3. Without the rise the table ends with the hold.
   */
  export function verify(): void {
    const hip: number = walkRoot.REFERENCE_HIP;
    const table: kneelPhaseTable.IPhase[] = kneelPhaseTable(
      { hipHeight: hip },
      4,
      "both",
      ["tap"],
      1,
      true,
    );
    TestValidator.equals("both knees", table, [
      { name: "stepBack", seconds: 0.7, from: 0, to: 1 },
      { name: "lowering", seconds: 1.0, from: 1, to: 2 },
      { name: "kneeContact", seconds: 0.9, from: 2, to: 3 },
      { name: "tap", seconds: 0, from: 3, to: 3 },
      { name: "settled", seconds: 1, from: 3, to: 3 },
      { name: "kneeOff", seconds: 0.9, from: 3, to: 2 },
      { name: "frontUp", seconds: 1.0, from: 2, to: 1 },
      { name: "stepForward", seconds: 0.7, from: 1, to: 0 },
      { name: "stood", seconds: 0, from: 0, to: 0 },
    ]);
    const tall: kneelPhaseTable.IPhase[] = kneelPhaseTable(
      { hipHeight: 4 * hip },
      4,
      "both",
      ["tap"],
      1,
      true,
    );
    TestValidator.predicate(
      "twice as long at four times the hip",
      tall.every(
        (phase: kneelPhaseTable.IPhase, i: number): boolean =>
          phase.name === "settled" ||
          Math.abs(phase.seconds - 2 * table[i]!.seconds) <= 1e-12,
      ),
    );
    TestValidator.equals(
      "no rise",
      kneelPhaseTable({ hipHeight: hip }, 4, "both", [], 1, false).map(
        (phase: kneelPhaseTable.IPhase): string => phase.name,
      ),
      ["stepBack", "lowering", "kneeContact", "settled"],
    );
  }
}

namespace part_kneel_place {
  /** Rounding of a few sums, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `kneelPlace` puts the kneeling knee: by default behind the hip along the
   * heading by the front foot's lead less `behind`, at the knee's height; at a
   * named point, there at that height, refused where the other ankle, the knee
   * point carried across to its side, would lie beyond a leg's length (thigh
   * and shank) of the front foot.
   *
   * Scenarios, a 0.45 m thigh and 0.42 m shank, the hip at (0.1, 0.9, 0), the
   * front foot at (-0.1, 0.08, 0.3), facing +Z, the knee 0.05 m up and carried
   * 0.2 m across:
   *
   * 1. By default with 0.4 m behind, the knee lies at (0.1, 0.05, -0.1).
   * 2. At (0.3, 0, -0.2) it lies there, 0.05 m up.
   * 3. At (0.3, 0, -1.5), the ankle 1.81 m from the front foot, it is refused on
   *    `at`.
   */
  export function verify(): void {
    const input: kneelPlace.IInput = {
      body: { measure: { thigh: 0.45, shank: 0.42 } },
      hip: { x: 0.1, y: 0.9, z: 0 },
      front: { x: -0.1, y: 0.08, z: 0.3 },
      forward: { x: 0, y: 0, z: 1 },
      behind: 0.4,
      height: 0.05,
      across: { x: -0.2, y: 0, z: 0 },
    };
    TestValidator.predicate(
      "behind the hip",
      vclose(kneelPlace(input), { x: 0.1, y: 0.05, z: -0.1 }, ROUNDING),
    );
    const at: IAutoMovieVector3 = { x: 0.3, y: 0, z: -0.2 };
    TestValidator.predicate(
      "at a point",
      vclose(
        kneelPlace({ ...input, at }),
        { x: 0.3, y: 0.05, z: -0.2 },
        ROUNDING,
      ),
    );
    let refused: boolean = false;
    try {
      kneelPlace({ ...input, at: { x: 0.3, y: 0, z: -1.5 } });
    } catch (error: unknown) {
      refused = error instanceof AutoMovieMotionHumanRefusal && error.axis === "at";
    }
    TestValidator.predicate("beyond a leg", refused);
  }
}

namespace part_prepare_kneel_clock {
  /** Rounding of one quotient of film seconds and one quintic, unitless. */
  const ROUNDING: number = 1e-12;

  /** The minimum-jerk share at a quarter, `10/64 - 15/256 + 6/1024`. */
  const QUARTER: number = 10 / 64 - 15 / 256 + 6 / 1024;

  /**
   * `prepareKneelClock` finds the kneel's phase at a second, each phase running
   * from its own instant to the next phase's (the last to `end`), with its
   * linear share of the phase's time and that share's minimum-jerk progress. A
   * phase starts a nanosecond before its instant, so a read at an instant is in
   * the phase that opens there.
   *
   * On a linear clock of 4 s the phases open at 0.5, 1.5 and 3.5 s.
   *
   * Scenarios:
   *
   * 1. Before the first phase, it is the first phase at no progress.
   * 2. Half through the first it is index 0 at a half, both shares a half.
   * 3. At the second's instant it is index 1 at none.
   * 4. A quarter through the second its progress is `s(1/4)`.
   * 5. The last phase runs to the clock's end.
   */
  export function verify(): void {
    const at: ReturnType<typeof prepareKneelClock<{ name: string }>> =
      prepareKneelClock(
        linearMotionClock(4, [
          { name: "a", seconds: 0.5 },
          { name: "b", seconds: 1.5 },
          { name: "c", seconds: 3.5 },
        ]),
        [{ name: "a" }, { name: "b" }, { name: "c" }],
      );

    // 1. Before the first.
    const before: ReturnType<typeof at> = at(0.2);
    TestValidator.equals(
      "before the first phase",
      [before.phase.name, before.index, before.u, before.linear],
      ["a", 0, 0, 0],
    );

    // 2. Half through the first.
    const half: ReturnType<typeof at> = at(1);
    TestValidator.predicate(
      "half through the first",
      half.index === 0 &&
        nclose(half.linear, 0.5, ROUNDING) &&
        nclose(half.u, 0.5, ROUNDING),
    );

    // 3. At the second's instant.
    const opening: ReturnType<typeof at> = at(1.5);
    TestValidator.predicate(
      "at the second's instant",
      opening.index === 1 && nclose(opening.linear, 0, ROUNDING),
    );

    // 4. A quarter through the second.
    const quarter: ReturnType<typeof at> = at(2);
    TestValidator.predicate(
      "a quarter through the second",
      quarter.phase.name === "b" &&
        nclose(quarter.linear, 0.25, ROUNDING) &&
        nclose(quarter.u, QUARTER, ROUNDING),
    );

    // 5. The last to the end.
    const last: ReturnType<typeof at> = at(3.75);
    TestValidator.predicate(
      "the last phase to the end",
      last.index === 2 && nclose(last.linear, 0.5, ROUNDING),
    );
  }
}

/**
 * `kneel`'s unit contract: its keys, phases, place and clock.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `kneel_phase_table`: `kneelPhaseTable` lays a kneel's phases over its keys:
 * - `kneel_place`: `kneelPlace` puts the kneeling knee:
 * - `prepare_kneel_clock`: `prepareKneelClock` finds the kneel's phase at a
 *   second, each phase running from its own instant to the next phase's (the
 *   last to `end`), with its linear share of the phase's time and that share's
 *   minimum-jerk progress.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Kneeling phases, knee placement, and progress track fixed keys and the knee's attainable footprint.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the phase table, place reader, and prepared clock on explicit pose and time inputs.
 * @evidence contracts/development/testing.md#independent-expectations Prescribed key times determine which phase owns each sample and the minimum-jerk share within it. Equal segments give an independent reach boundary for the knee.
 */
export async function test_motions_everyday_kneel(): Promise<void> {
  part_kneel_phase_table.verify();
  part_kneel_place.verify();
  part_prepare_kneel_clock.verify();
}
