import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { coatPartnerScene } from "../../internal/coatPartnerScene";

/** A refusal's case: the coat's partner and hold, and the axis it must name. */
interface IRefused {
  /** The axis the refusal names, the original's. */
  axis: string;

  /** The coat's named partner. */
  partner: string;

  /** The coat's hold, seconds. */
  hold: number;
}

/**
 * A coat whose partner is the dresser itself, or whose hold has no length, is
 * refused on that axis, and the same coat with the partner and the hold of the
 * original's takes is not: the refusal cases of
 * `test_motion_get_dressed_coat_partner` with their adjacent valid case, two
 * average men as the original, entered by the original's whole chain.
 *
 * Scenarios:
 *
 * 1. Naming the dresser `a` as its own partner is refused on the `partner` axis.
 * 2. A hold of 0 s is refused on the `hold` axis.
 * 3. The same take with the partner `b` and the original's 4.5 s hold is not
 *    refused.
 *
 * The original asserts each axis; the adjacent valid coat makes the case
 * distinguish a refusal of these inputs from a coat refused whatever it is
 * given.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusals, the adjacent case, the entry and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the takes through `HumanPerformance` and reads a pose, then the refusal's axis or its absence; an admitted bad partner or hold, a refusal on another axis or a refused valid coat fails.
 * @evidence contracts/development/testing.md#independent-expectations The coat contract names the partner as the performer helped into the coat and the hold as a length of time (`IAutoMovieMotionHumanCoatPartner`); the axes are the original's.
 * @evidence contracts/development/testing.md#distinguishing-cases The two bad inputs against the valid pair, the input that changes being only the partner or the hold.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_get_dressed_coat_partner_refusal`.
 */
export function test_motion_get_dressed_coat_partner_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const self: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const cases: readonly IRefused[] = [
    { axis: "partner", partner: "a", hold: coatPartnerScene.HOLD },
    { axis: "hold", partner: "b", hold: 0 },
  ];
  for (const c of cases) {
    const refused: HumanRefusal | undefined = refusal(self, c.partner, c.hold);
    checks.check(
      `a coat with a bad ${c.axis} is refused on it (${describe(refused)})`,
      refused !== undefined && refused.axis === c.axis,
    );
  }
  const valid: HumanRefusal | undefined = refusal(
    self,
    "b",
    coatPartnerScene.HOLD,
  );
  checks.check(
    `the coat of the partner b held ${coatPartnerScene.HOLD} s is not refused (${describe(valid)})`,
    valid === undefined,
  );
  checks.assert("only a coat with a bad partner or hold is refused");
}

/** The refusal the original's coat with this partner and hold throws, if any. */
function refusal(
  self: IAutoMovieMotionHumanBody,
  partner: string,
  hold: number,
): HumanRefusal | undefined {
  try {
    coatPartnerScene
      .stage(
        self,
        self,
        coatPartnerScene.jacket(),
        "right",
        partner,
        hold,
        "walkOff",
      )
      .bones("a", 4);
    return undefined;
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) return error;
    throw error;
  }
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: HumanRefusal | undefined): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}
