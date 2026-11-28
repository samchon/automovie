import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  motionHumanBendChain
} from "../../../../../packages/motions/src/compose/internal/motionHumanBendChain";
import {
  motionHumanBendTurn
} from "../../../../../packages/motions/src/compose/internal/motionHumanBendTurn";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a rotation, metres. */
const ROUNDING: number = 1e-12;

/**
 * `motionHumanBendTurn` turns an elbow hint about the shoulder-to-
 * wrist line by Rodrigues' formula, right-handed about the line from the
 * shoulder to the wrist: its foot on the line and its radius kept; a hint on
 * the line is returned as it is.
 *
 * The body is built whole (`humanFixtureBody`) for the shoulder's place.
 *
 * Scenarios, the average man's left wrist 0.5 m ahead of his shoulder:
 *
 * 1. A hint 0.2 m up from the line's midpoint, turned 90 degrees: 0.2 m along
 *    (line × up), the foot kept.
 * 2. Turned 360 degrees, the hint is back; turned −30 then 30, it is back.
 * 3. A hint on the line is returned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names quarter and full turns, inverse turns, radius preservation and a hint on the rotation line.
 * @evidence contracts/development/testing.md#behavioral-verification Calls motionHumanBendTurn on radial and axial hints in the stored arm rig and compares the returned points and radius.
 * @evidence contracts/development/testing.md#independent-expectations The positively directed +Z line rotates a +Y radius of 0.2 m to -X in 90 degrees. A full revolution and opposite turns restore the initial point, and an axial point is fixed.
 */
export async function test_motions_compose_bend_turn(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: IAutoMovieMotionHumanBend.ISolve["posture"] = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
  };
  const shoulder: IAutoMovieVector3 = motionHumanBendChain(
    body,
    posture,
    "left",
  )!.shoulder;
  const props: IAutoMovieMotionHumanBend.ISolve = {
    body,
    posture,
    side: "left",
    point: AutoMovieEngineVector3.add(shoulder, { x: 0, y: 0, z: 0.5 }),
  };
  const middle: IAutoMovieVector3 = AutoMovieEngineVector3.add(shoulder, {
    x: 0,
    y: 0,
    z: 0.25,
  });
  const hint: IAutoMovieVector3 = AutoMovieEngineVector3.add(middle, { x: 0, y: 0.2, z: 0 });

  // 1. A quarter turn: +Z × +Y is −X.
  TestValidator.predicate(
    "a quarter turn about the line",
    vclose(
      motionHumanBendTurn(props, hint, 90),
      AutoMovieEngineVector3.add(middle, { x: -0.2, y: 0, z: 0 }),
      ROUNDING,
    ),
  );

  // 2. Whole and opposite turns.
  TestValidator.predicate(
    "a whole turn and a turn undone",
    vclose(motionHumanBendTurn(props, hint, 360), hint, ROUNDING) &&
      vclose(
        motionHumanBendTurn(
          props,
          motionHumanBendTurn(props, hint, -30),
          30,
        ),
        hint,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieEngineVector3.distance(motionHumanBendTurn(props, hint, 47), middle),
        0.2,
        ROUNDING,
      ),
  );

  // 3. On the line.
  TestValidator.predicate(
    "a hint on the line is kept",
    motionHumanBendTurn(props, middle, 40) === middle,
  );
}
