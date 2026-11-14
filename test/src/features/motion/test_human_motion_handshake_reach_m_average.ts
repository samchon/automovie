import { TestValidator } from "@nestia/e2e";

import { motionHandshakeReach } from "../internal/motionHandshakeReach";

/**
 * A handshake plans for a pair whose shoulders stand within the band their
 * arms can close, and refuses a pair beyond it on the bound that failed,
 * with the band as what would plan (#3519).
 *
 * The website's handshake scene found a pair 0.729 m apart refused with
 * "bring them within about 1.153 m", which they already were. The cause was
 * the near side of the band: elbows that near meet with the forearms
 * steeper than the offering slope, straightening an arm past the pump's
 * least elbow flexion, and the only rule for it lowered one partner's arm.
 * Both upper arms now come back together toward hanging, so the elbows bend
 * instead, and a pair the rules cannot bring together is refused naming the
 * failed bound with its measured value.
 *
 * Scenarios, on two average men, read by `motionHandshakeReach` (the small woman and the large man
 * have their own spec); the pair stands facing with the right shoulders on
 * one line, placed by the shoulders the bodies stand with:
 * 1. 0.729 m apart: the handshake plans, the shoulders at its start that gap
 *    apart within 1 mm.
 * 2. 1.4 m apart: refused as a `HumanRefusal` on `reach`/`partner`, its
 *    value the measured 1.4 m within 1 mm, its feasible range holding 0.729 m
 *    and ending below 1.4 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the handshake through the public pair chain and reads its plan and its refusal; a pair inside the band refused, or a refusal on another axis, value or band, fails with what was read.
 * @evidence contracts/development/testing.md#independent-expectations The gaps are the website's refused pair and one beyond two arms at length; the bounds are a millimetre on measured gaps and the band's order around them.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair inside the band and one beyond it, on a pair of one size and a pair of opposite builds.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three short films, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the defect it replaces with its cause, and the 2 scenarios.
 */
export function test_human_motion_handshake_reach_m_average(): void {
  TestValidator.equals(
    "a handshake plans inside its band and names the bound it misses",
    motionHandshakeReach("m-average", "m-average"),
    [],
  );
}
