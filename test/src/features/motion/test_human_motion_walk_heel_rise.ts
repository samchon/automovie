import {
  HumanFoot,
  type IHumanBody,
  walkStanceCourse,
  walkStanceSolve,
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
 * from under the hip to half a metre behind it, every tenth of a metre, each a stance course whose
 * knots hold the pelvis lower by a millimetre each, from its standing
 * height down by a quarter of a metre, 48 knots a second:
 * 1. The heel's pitch is a continuous function of the hip's drop: about
 *    where it turns most between two knots a millimetre of drop apart, the
 *    same stance is lowered a tenth of a millimetre a knot, and about that
 *    course's largest turn a hundredth of a millimetre a knot (each course's
 *    end knots, which have no neighbour to smooth against on one side, left
 *    unread); the hundredth's largest turn is at most a quarter of the
 *    tenth's (a tenth for a straight course, with room for its curvature).
 *    Both steps are small enough that the course's smoothing spreads no turn
 *    across knots, which a millimetre's step does at a kink, so the ratio
 *    reads the pitch itself; the 11-degree jump a nanometre made would not
 *    shrink. The turn itself may be fast: a hip
 *    lowered at 48 mm/s over a nearly straight knee folds the knee by
 *    degrees a millimetre (a near-straight leg's length changes little with
 *    its knee), so the ankle's dorsiflexion, and the heel that relieves it,
 *    turns faster than walking's ankle ever does; the input, not the heel,
 *    sets that rate.
 * 2. A foot under the hip at the standing height stands no higher than the
 *    stance's own geometry asks: the leg, its knee bent the course's least
 *    `walkStanceCourse.KNEE`, is that much shorter than straight, and the
 *    heel rises about the ball by the angle that lifts the ankle so far,
 *    within ten times the course's tolerance `walkStanceCourse.MET`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the course through `walkStanceSolve.solve` for a stance lowered steadily, so a heel that jumps from one knot to the next fails with the knot it was read at.
 * @evidence contracts/development/testing.md#independent-expectations Continuity is read as the turn shrinking with the step, which a jump cannot do; the standing bound is the rise the stance's geometry asks of a knee bent the course's least, read from the body.
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
    for (let k: number = 0; k <= 10; k += 2) {
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
      const pitch: Float64Array = walkStanceSolve.solve(body, knots).pitch
        .right;
      // 1. Continuous: where the heel turns most between two knots a
      // millimetre apart, the same stance lowered a tenth of a millimetre a
      // knot turns it a tenth as far, within the curvature's share; a jump
      // does not shrink with the step.
      let widest: number = 0;
      let at: number = 1;
      for (let m: number = 1; m < pitch.length; m++)
        if (Math.abs(pitch[m]! - pitch[m - 1]!) > widest) {
          widest = Math.abs(pitch[m]! - pitch[m - 1]!);
          at = m;
        }
      if (widest > 0) {
        // The same stance lowered `step` millimetres a knot over 50 knots
        // from `from` millimetres: its largest turn between interior knots
        // and where (a course's end knots have no neighbour on one side to
        // smooth against, so `EDGE` knots at each end are not read).
        const refined = (
          from: number,
          step: number,
        ): { turn: number; at: number } => {
          const fine: Float64Array = walkStanceSolve.solve(
            body,
            Array.from(
              { length: 51 },
              (_: unknown, j: number): walkStanceCourse.IKnot => ({
                ...knots[0]!,
                seconds: j / 48,
                drop: (from + j * step) * 1e-3,
              }),
            ),
          ).pitch.right;
          let out: { turn: number; at: number } = { turn: 0, at: from };
          for (let j: number = EDGE + 1; j < fine.length - EDGE; j++)
            if (Math.abs(fine[j]! - fine[j - 1]!) > out.turn)
              out = {
                turn: Math.abs(fine[j]! - fine[j - 1]!),
                at: from + j * step,
              };
          return out;
        };
        // A tenth of a millimetre a knot, then a hundredth about the tenth's
        // largest turn: neither course's step is large enough for its
        // smoothing to spread a turn across knots, so a continuous heel turns
        // a tenth as far at the hundredth, and a jump as far.
        const tenth = refined(Math.max(0, at - 3), 0.1);
        const hundredth = refined(Math.max(0, tenth.at - 0.25), 0.01);
        if (!(hundredth.turn <= REFINED * tenth.turn))
          out.push(
            `${name} ${back.toFixed(2)} m behind: the heel turns ${tenth.turn.toFixed(4)} degrees between knots a tenth of a millimetre of hip drop apart at ${tenth.at.toFixed(2)} mm, and still ${hundredth.turn.toFixed(4)} degrees a hundredth apart there, at most ${(REFINED * tenth.turn).toFixed(4)} expected of a continuous heel`,
          );
      }
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

/** The share of a tenth of a millimetre step's turn a hundredth of a millimetre step may keep: a tenth for a continuous heel, with room for the pitch's curvature; a jump keeps all of it. */
const REFINED: number = 0.25;

/** The refined courses' knots left unread at each end, a fifth of each course: a course's ends have no neighbour on one side to smooth against. */
const EDGE: number = 10;
