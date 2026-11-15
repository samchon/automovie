import {
  HumanFoot,
  type IHumanBody,
  walkStanceCourse,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A planted foot's heel rises and lowers continuously as the stance that
 * asks for it changes (#3523).
 *
 * A stance's heel was raised by its own rule over a room read for every
 * pitch, and a pitch whose ankle lay beyond the leg's reach was read from a
 * leg stretched past its length. That fictitious room crossed the kept room
 * twice, and a rear stance's heel jumped by 11 degrees as the hip moved by
 * a nanometre. The heel now rises where the stance course
 * (`walkStanceCourse`) puts it: one trajectory optimisation in which more
 * dorsiflexion past heel-off costs more than turning about the ball, under
 * the leg's reach and the loaded ankle's range, and whose second differences
 * are penalised, so where the best heel of one instant would trade between
 * two places the course moves between them smoothly.
 *
 * Scenarios, on the average man and the small woman, for a right foot flat
 * from under the hip to half a metre behind it, each a stance course whose
 * knots hold the pelvis lower by a millimetre each, from its standing
 * height down by a quarter of a metre, 48 knots a second:
 * 1. The heel's pitch never moves from one knot to the next by more than a
 *    real ankle turns in a knot's 1/48 s: its fastest turn in walking, the
 *    plantarflexion of pre-swing, about 30 degrees (from 10 of dorsiflexion
 *    at heel-off to 20 of plantarflexion at toe-off) over its 12 % of a
 *    1.1 s cycle (Perry and Burnfield, Gait Analysis, 2nd ed.), so about
 *    230 degrees a second, 4.8 degrees a knot.
 * 2. A foot under the hip at the standing height stands no higher than the
 *    stance's own geometry asks: the leg, its knee bent the course's least
 *    `walkStanceCourse.KNEE`, is that much shorter than straight, and the
 *    heel rises about the ball by the angle that lifts the ankle so far,
 *    within ten times the course's tolerance `walkStanceCourse.MET`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the course through `walkStanceCourse.solve` for a stance lowered steadily, so a heel that jumps from one knot to the next fails with the knot it was read at.
 * @evidence contracts/development/testing.md#independent-expectations The per-knot bound is the measured fastest ankle turn of walking times a knot's interval (Perry and Burnfield), far below the 11-degree jump a nanometre made; the standing bound is the rise the stance's geometry asks of a knee bent the course's least, read from the body.
 * @evidence contracts/development/testing.md#distinguishing-cases Stances from under the hip, where the flat foot stands, to half a metre behind it, where it cannot, on two builds.
 * @evidence contracts/development/testing.md#execution-ownership Two polygon bodies and plain geometry; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the defect it replaces with its measured jump and the 2 scenarios.
 */
export function test_human_motion_walk_heel_rise(): void {
  const out: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const left = body.rest.get("leftUpperLeg")!;
    const right = body.rest.get("rightUpperLeg")!;
    const ankle: number = body.rest.get("rightFoot")!.y;
    for (let k: number = 0; k <= 10; k++) {
      const back: number = 0.05 * k;
      const placement: HumanFoot.IPlacement = {
        ankle: { x: right.x, y: ankle, z: -back },
        rotation: HumanFoot.rotation(0, 0),
      };
      const knots: walkStanceCourse.IKnot[] = Array.from(
        { length: 251 },
        (_: unknown, m: number): walkStanceCourse.IKnot => ({
          seconds: m / 48,
          stances: [{ side: "right", placement }],
          pelvis: (): walkStanceCourse.IPelvis => ({
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            hips: { left: { ...left, z: 0 }, right: { ...right, z: 0 } },
          }),
          trunk: { pitch: 0, roll: 0 },
          drop: m * 1e-3,
        }),
      );
      const pitch: Float64Array = walkStanceCourse.solve(body, knots).pitch
        .right;
      // 1. Continuous from knot to knot.
      for (let m: number = 1; m < pitch.length; m++)
        if (Math.abs(pitch[m]! - pitch[m - 1]!) > TURN)
          out.push(
            `${name} ${back.toFixed(2)} m behind, hip down ${m} mm: the heel's pitch jumps from ${pitch[m - 1]!.toFixed(3)} to ${pitch[m]!.toFixed(3)} degrees`,
          );
      // 2. A foot under a standing hip stands no higher than its geometry
      // asks: the ankle rises by what the bent leg lacks, about the ball.
      const lacking: number =
        right.y -
        ankle -
        Math.sqrt(
          body.measure.thigh ** 2 +
            body.measure.shank ** 2 +
            2 *
              body.measure.thigh *
              body.measure.shank *
              Math.cos((walkStanceCourse.KNEE * Math.PI) / 180),
        );
      const lever: number = Math.hypot(
        HumanFoot.point(body, "right", "mtp", placement).z - placement.ankle.z,
        HumanFoot.point(body, "right", "mtp", placement).y - placement.ankle.y,
      );
      const asked: number =
        (Math.asin(Math.min(1, Math.max(0, lacking) / lever)) * 180) / Math.PI;
      if (k === 0 && -pitch[0]! > asked + 10 * walkStanceCourse.MET)
        out.push(
          `${name} under the hip at its standing height: the heel stands ${(-pitch[0]!).toFixed(3)} degrees up, past the ${asked.toFixed(3)} its geometry asks`,
        );
    }
  }
  TestValidator.equals(
    "a planted heel rises and lowers continuously",
    out.slice(0, 20),
    [],
  );
}

/** The fastest a real ankle turns in a knot's 1/48 s, degrees: the plantarflexion of walking's pre-swing, 30 degrees over 12 % of a 1.1 s cycle (Perry and Burnfield), about 230 degrees a second. */
const TURN: number = 30 / (0.12 * 1.1) / 48;
