import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { slipRingScene } from "../../internal/slipRingScene";

/**
 * Naming the dresser as the partner is refused, and naming the partner is not:
 * the refusal case of `test_motion_get_dressed_slip_ring` with its adjacent
 * valid case, on the average man's right hand and the small woman's presented
 * left hand as the original, entered by the minimal chain the partner's
 * presentHand, the dresser's pickUp(ring) > slipRing.
 *
 * Scenarios:
 *
 * 1. The dresser named as its own partner: the slip is refused on the `partner`
 *    axis, the original's check.
 * 2. The presenting partner named: the same chain builds without a refusal, so the
 *    refusal is the self naming's and not one any partner draws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, the adjacent case, the entry and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through `HumanPerformance` and reads the refusal's axis or its absence; an admitted self dressing, a refusal on another axis for it, or a refused partner fails.
 * @evidence contracts/development/testing.md#independent-expectations Dressing names another person by its contract (`slipRing` slips a ring onto a partner's finger); the axis is the refusal contract's `partner`.
 * @evidence contracts/development/testing.md#distinguishing-cases The dresser against the partner as the named partner, the input that changes being only the name; the slip's goals are `test_motion_get_dressed_slip_ring_slip`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_slip_ring_refusal`.
 */
export function test_motion_get_dressed_slip_ring_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const self: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const c: slipRingScene.ICase = slipRingScene.CASES[0]!;
  const own: Refused = refusal(self, self, c, "a");
  checks.check(
    `ringing oneself is refused on the partner (${describe(own)})`,
    own !== undefined && own.axis === "partner",
  );
  const other: Refused = refusal(self, motionHumanBody(c.partner), c, "b");
  checks.check(
    `ringing the partner is not refused (${describe(other)})`,
    other === undefined,
  );
  checks.assert("only naming oneself as the partner is refused");
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/** The refusal an exchange naming a partner throws, if any. */
function refusal(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  c: slipRingScene.ICase,
  partner: string,
): Refused {
  try {
    slipRingScene.exchange(a, b, c, partner).bones("a", 2);
    return undefined;
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) return error;
    throw error;
  }
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: Refused): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}
