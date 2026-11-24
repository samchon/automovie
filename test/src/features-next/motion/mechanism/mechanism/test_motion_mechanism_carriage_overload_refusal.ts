import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRefusal,
} from "@automovie/interface";
import { HumanChain, HumanRefusal } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";

/**
 * The carry's load band's top, a share of the body's mass: the carry contract's
 * "a share of the body's mass in [0, 0.25]" (`IAutoMovieMotionHumanCarry`).
 */
const BAND: number = 0.25;

/** The original's load over the band. */
const OVER: number = 0.4;

/**
 * A load over the carriage band is refused for that reason, and a load at the
 * band's top is not: the refusal case of `test_motion_mechanism_carriage` with
 * its adjacent valid case, a one-hand carry two metres ahead on the average man
 * as the original, entered standing.
 *
 * Scenarios:
 *
 * 1. A load of 0.4 of the body's mass is refused as a `parameter` on the `load`
 *    axis, its feasible range ending at the band's top, 0.25.
 * 2. A load of 0.25, the same carry otherwise, is not refused.
 *
 * The original asserts only that some refusal is raised, which a carry refused
 * for any other reason meets too; the axis, the range and the adjacent load at
 * the band's top make the case distinguish.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, why it was vacuous, the adjacent case, the entry and the body.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through the public chain and reads the refusal's kind, axis and feasible range or its absence; an admitted overload, an overload refused on another axis or range, or a refused load at the band's top fails.
 * @evidence contracts/development/testing.md#independent-expectations The band is the carry contract's [0, 0.25]; the refusal's fields are the refusal contract's (`IAutoMovieMotionHumanRefusal`), read without parsing its message.
 * @evidence contracts/development/testing.md#distinguishing-cases Two loads either side of the band's top, the input that changes being only the load.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_overload_refusal`.
 */
export function test_motion_mechanism_carriage_overload_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const over: HumanRefusal | undefined = carry(body, OVER);
  const range: IAutoMovieMotionHumanRefusal.Feasible | null =
    over?.feasible ?? null;
  checks.check(
    `a load of ${OVER} is refused on the load axis, its range ending at ${BAND} (${describe(over)})`,
    over !== undefined &&
      over.kind === "parameter" &&
      over.axis === "load" &&
      range !== null &&
      range.kind === "range" &&
      range.maximum === BAND,
  );
  const top: HumanRefusal | undefined = carry(body, BAND);
  checks.check(
    `a load at the band's top, ${BAND}, is not refused (${describe(top)})`,
    top === undefined,
  );
  checks.assert("only a load over the carriage band is refused");
}

/** The refusal a one-hand carry of this load throws, if any. */
function carry(
  body: IAutoMovieMotionHumanBody,
  load: number,
): HumanRefusal | undefined {
  // A pose is read too, so a refusal raised only where the carry is resolved
  // is seen as well as one raised at the build.
  return everydayTake.refusal(() =>
    carriageScene
      .perform(
        `load-${load}`,
        body,
        [],
        HumanChain.subject("actor")
          .stand()
          .carry({ to: { x: 0, y: 0, z: 2 }, kind: "oneHand", load }),
      )
      .bones("actor", 1),
  );
}

/** A refusal's kind, axis and message, or that the build was admitted. */
function describe(refused: HumanRefusal | undefined): string {
  return refused === undefined
    ? "admitted"
    : `${refused.kind} on ${refused.axis}: ${refused.message}`;
}
