import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { embraceScene } from "../../internal/embraceScene";

/**
 * What the refusal of an unreachable shoulder names: the original's words, the
 * chin's miss from the partner's shoulder.
 */
const NAMED: RegExp = /mm from the partner's shoulder/;

/**
 * A small woman cannot rest her chin on a tall man's shoulder from behind, and
 * can on another small woman's: the refusal case of
 * `test_motion_touch_embrace_from_behind` with its adjacent valid case, the
 * partner given explicitly standing ahead facing away.
 *
 * Scenarios:
 *
 * 1. The small woman embracing the tall man: the embrace is refused on the
 *    `partner` axis and the refusal states the chin's miss from the partner's
 *    shoulder, the original's check.
 * 2. The small woman embracing another small woman, the same staging: the embrace
 *    builds without a refusal.
 *
 * The original's check, once it runs, passes whatever the large height
 * difference does while equal pairs are refused on `partner` with the same
 * message form (CI 45292314321 refused the average pair so); the adjacent equal
 * pair here makes the refusal distinguish.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, why it was vacuous, the adjacent case, the staging and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through `HumanPerformance` and reads the refusal's axis and stated miss or its absence; an admitted unreachable shoulder, a refusal for another reason or a refused equal pair fails.
 * @evidence contracts/development/testing.md#independent-expectations A chin cannot rest on a shoulder far above it from behind, and an equal pair is the embrace's staged case; the reason is matched only on the original's words.
 * @evidence contracts/development/testing.md#distinguishing-cases A tall against an equal partner, the input that changes being only the partner's body; the embrace's goals are `test_motion_touch_embrace_from_behind_embrace`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_touch_embrace_from_behind_refusal`.
 */
export function test_motion_touch_embrace_from_behind_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const tall: Refused = refusal("m-tall");
  checks.check(
    `the small woman cannot rest her chin on the tall man's shoulder (${describe(tall)})`,
    tall !== undefined && tall.axis === "partner" && NAMED.test(tall.message),
  );
  const equal: Refused = refusal("f-small");
  checks.check(
    `the small woman rests her chin on another small woman's shoulder (${describe(equal)})`,
    equal === undefined,
  );
  checks.assert("only a shoulder beyond the chin is refused");
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/** The refusal the small woman's embrace of a partner throws, if any. */
function refusal(partner: motionHumanBody.Name): Refused {
  try {
    embraceScene
      .scene(motionHumanBody("f-small"), motionHumanBody(partner))
      .bones("a", 1);
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
