import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** The instant read, film seconds. */
const AT: number = 0.5;

/** The hold the balance reading asks the base to last, seconds: about the inverted pendulum's time constant, a third of a second. */
const HOLD: number = 1 / 3;

/** When the seat lands, film seconds: within the hold after `AT`. */
const SEATED: number = 0.7;

/** When a later seat lands, film seconds: after the hold. */
const LATE: number = 1.2;

/**
 * Which instants the balance reading judges while another support is about
 * to take the body (`AutoMovieMotionHumanAuditBalance.standing`).
 *
 * Scenarios:
 * 1. Feet bearing on the floor (a sliding tackle's), the seat landing within
 *    the hold: the instant is not read, as a deliberate fall onto the seat.
 * 2. The same feet with no support coming within the hold, or one landing
 *    only after it: the instant is read, so a body falling from them fails.
 * 3. Planted feet keep their existing reading: not read with the seat
 *    coming, read without it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each window set and the reading expected of it.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public audit predicate on declared windows.
 * @evidence contracts/development/testing.md#independent-expectations The hold is the pendulum's time constant the audit documents; the seat lands inside or after it.
 * @evidence contracts/development/testing.md#distinguishing-cases Bearing and planted feet, a seat within the hold, after it, and none.
 * @evidence contracts/development/testing.md#execution-ownership Pure in-memory windows, no performance.
 */
export function test_motion_dynamics_balance_bear_arrival(): void {
  // Whether the instant is read, the feet bearing by `kind` and the seat
  // landing at `seat` when given.
  const read: (
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    seat?: number,
  ) => boolean = (
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    seat?: number,
  ): boolean =>
    AutoMovieMotionHumanAuditBalance.standing(
      [
        window("leftFoot", kind, 0, 2),
        window("rightFoot", kind, 0, 2),
        ...(seat === undefined ? [] : [window("seat", "lie", seat, 2)]),
      ],
      AT,
      AT + HOLD,
    );
  TestValidator.predicate(
    "bearing feet with the seat landing within the hold are not read",
    read("bear", SEATED) === false,
  );
  TestValidator.predicate(
    "bearing feet with no support coming are read",
    read("bear") === true,
  );
  TestValidator.predicate(
    "bearing feet with the seat landing after the hold are read",
    read("bear", LATE) === true,
  );
  TestValidator.predicate(
    "planted feet with the seat landing within the hold are not read",
    read("plant", SEATED) === false,
  );
  TestValidator.predicate(
    "planted feet with no support coming are read",
    read("plant") === true,
  );
}

/** One declared window on the ground, film seconds. */
function window(
  part: IAutoMovieMotionHumanContactWindow["part"],
  kind: IAutoMovieMotionHumanContactWindow["kind"],
  from: number,
  to: number,
): IAutoMovieMotionHumanAuditMotion.IWindow {
  return {
    action: "fall",
    contact: { part, kind, from: 0, to: 1, support: { kind: "ground" } },
    from,
    to,
  };
}
