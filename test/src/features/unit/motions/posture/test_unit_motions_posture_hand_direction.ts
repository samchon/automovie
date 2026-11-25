import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanHandDirection } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** Rounding of a heading's turn. */
const ROUNDING: number = 1e-15;

/**
 * `HumanHandDirection` is a hand's named direction as a world unit vector for a
 * performer heading `yaw`: an axis of the floor frame, `out` toward the acting
 * hand's side (+X for the left at heading 0, −X for the right) and `in` the
 * other way; a share of the way between two axes, normalized; or explicit out,
 * up and forward components, normalized; turned by the heading about +Y. A
 * share outside [0, 1], two opposite axes, an explicit direction of no length
 * or no source are refused. `prepare` reads the same axes.
 *
 * Scenarios:
 *
 * 1. At heading 0: the left hand's out +X, the right's −X, forward +Z.
 * 2. At heading 90: forward is +X, the left's out −Z.
 * 3. Halfway from forward to up: (0, 1, 1)/√2; explicit (out 1, up 0, forward 1)
 *    for the right hand: (−1, 0, 1)/√2.
 * 4. The refusals.
 * 5. Prepared axes use the current yaw and each read returns its own vector.
 */
export function test_unit_motions_posture_hand_direction(): void {
  const r: number = Math.SQRT1_2;

  // 1. Heading 0.
  TestValidator.predicate(
    "the floor axes",
    vclose(
      HumanHandDirection("left", 0, "out"),
      { x: 1, y: 0, z: 0 },
      ROUNDING,
    ) &&
      vclose(
        HumanHandDirection("right", 0, "out"),
        { x: -1, y: 0, z: 0 },
        ROUNDING,
      ) &&
      vclose(
        HumanHandDirection("right", 0, "in"),
        { x: 1, y: 0, z: 0 },
        ROUNDING,
      ) &&
      vclose(
        HumanHandDirection("left", 0, "forward"),
        { x: 0, y: 0, z: 1 },
        ROUNDING,
      ),
  );

  // 2. Heading 90.
  TestValidator.predicate(
    "turned by the heading",
    vclose(
      HumanHandDirection("left", 90, "forward"),
      { x: 1, y: 0, z: 0 },
      ROUNDING,
    ) &&
      vclose(
        HumanHandDirection("left", 90, "out"),
        { x: 0, y: 0, z: -1 },
        ROUNDING,
      ),
  );

  // 3. Between and explicit.
  TestValidator.predicate(
    "between two axes, and explicit components",
    vclose(
      HumanHandDirection("left", 0, { between: ["forward", "up"], share: 0.5 }),
      { x: 0, y: r, z: r },
      ROUNDING,
    ) &&
      vclose(
        HumanHandDirection("right", 0, {
          explicit: { out: 1, up: 0, forward: 1 },
          source: "a cue",
        }),
        { x: -r, y: 0, z: r },
        ROUNDING,
      ),
  );

  // 4. Refusals.
  TestValidator.predicate(
    "invalid directions",
    throwsError((): unknown =>
      HumanHandDirection("left", 0, { between: ["forward", "up"], share: 1.5 }),
    ) &&
      throwsError(
        (): unknown =>
          HumanHandDirection("left", 0, {
            between: ["up", "down"],
            share: 0.5,
          }),
        "opposite",
      ) &&
      throwsError((): unknown =>
        HumanHandDirection("left", 0, {
          explicit: { out: 0, up: 0, forward: 0 },
          source: "a cue",
        }),
      ) &&
      throwsError(
        (): unknown =>
          HumanHandDirection("left", 0, {
            explicit: { out: 1, up: 0, forward: 0 },
            source: " ",
          }),
        "source",
      ),
  );

  // 5. Prepared.
  const right: ReturnType<typeof HumanHandDirection.prepare> =
    HumanHandDirection.prepare("right");
  const left: ReturnType<typeof HumanHandDirection.prepare> =
    HumanHandDirection.prepare("left");
  const given: IAutoMovieVector3 = right(90, "out");
  const outward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const initial: boolean = vclose(given, outward, ROUNDING);
  given.z = 8;
  TestValidator.predicate(
    "prepared axes follow the requested heading independently",
    initial &&
      vclose(right(-90, "out"), { x: 0, y: 0, z: -1 }, ROUNDING) &&
      vclose(right(-90, "forward"), { x: -1, y: 0, z: 0 }, ROUNDING) &&
      vclose(right(90, "out"), outward, ROUNDING) &&
      vclose(left(90, "out"), { x: 0, y: 0, z: -1 }, ROUNDING) &&
      vclose(right(90, "in"), { x: 0, y: 0, z: -1 }, ROUNDING) &&
      vclose(right(180, "back"), { x: 0, y: 0, z: 1 }, ROUNDING) &&
      vclose(right(37, "up"), { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(left(-120, "down"), { x: 0, y: -1, z: 0 }, ROUNDING),
  );
}
