import type { IAutoMovieMotionHumanOperateState, IAutoMovieMotionTarget } from "@automovie/interface";
import { AutoMovieMotionHumanRefusal, operateLongInsertCourse, operateState } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

namespace part_operate_long_insert_course {
  /** Rounding of a few sums, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `operateLongInsertCourse` plans a staff driven down a bore hand over hand:
   * both hands push it in together as far as their reach chords on the bore's
   * axis and the mouth's clearance allow, then the steadying hand and the
   * carrying hand slide back out along the staff in turn, and so on to the
   * depth; drawn out, they pull together.
   *
   * Scenarios, a bore at the origin opening along +Z, both shoulders 0.5 m out
   * on its axis reaching 0.6 m (a chord from -0.1 to 1.1 m), the staff held 0.3
   * m behind its working point with the second hand 0.1 m behind, 50 mm off the
   * mouth, its grip running 0.2 to 1.5 m:
   *
   * 1. Driven 0.2 m, it is presented with the hands at 0.3 and 0.4 m and pushed
   *    once to 0.1 and 0.2 m.
   * 2. Driven 0.6 m, the first push stops at the clearance, 0.25 m in; the
   *    steadying hand slides back to its reach, 1.1 m, the carrying hand to 1
   *    m, 0.95 m along the staff; a second push takes it the last 0.35 m.
   * 3. Driven 0.2 m and drawn out, a pull brings the hands back to 0.3 and 0.4 m.
   * 4. A depth past the staff's grip less the clearance and the second hand, 1.35
   *    m, and shoulders 5 m aside of the bore, which no step along it brings
   *    within reach, are refused.
   */
  export function verify(): void {
    const props: operateLongInsertCourse.IProps = {
      mouth: { x: 0, y: 0, z: 0 },
      normal: { x: 0, y: 0, z: 1 },
      shoulders: { A: { x: 0, y: 0, z: 0.5 }, B: { x: 0, y: 0, z: 0.5 } },
      step: { x: 0, y: 0, z: -1 },
      reach: 0.6,
      grip: 0.3,
      shaft: { lo: 0.2, hi: 1.5 },
      clear: 0.05,
      gap: 0.1,
      depth: 0.2,
      withdraw: false,
    };
    const course: (
      asked: Partial<operateLongInsertCourse.IProps>,
    ) => operateLongInsertCourse.IResult = (
      asked: Partial<operateLongInsertCourse.IProps>,
    ): operateLongInsertCourse.IResult =>
      operateLongInsertCourse({ ...props, ...asked });
    const kinds: (result: operateLongInsertCourse.IResult) => string[] = (
      result: operateLongInsertCourse.IResult,
    ): string[] =>
      result.segments.map(
        (s: operateLongInsertCourse.ISegment): string => s.kind,
      );
    const shallow: operateLongInsertCourse.IResult = course({});
    TestValidator.predicate(
      "one push",
      kinds(shallow).join() === "push" &&
        shallow.presented.uA === 0.3 &&
        nclose(shallow.presented.uB, 0.4, ROUNDING) &&
        nclose(shallow.segments[0]!.to.uA, 0.1, ROUNDING) &&
        nclose(shallow.segments[0]!.to.uB, 0.2, ROUNDING),
    );
    const deep: operateLongInsertCourse.IResult = course({ depth: 0.6 });
    const [first, slideB, slideA, second] = deep.segments;
    TestValidator.predicate(
      "hand over hand",
      kinds(deep).join() === "push,slideB,slideA,push" &&
        nclose(first!.to.uA, 0.05, ROUNDING) &&
        nclose(slideB!.to.uB, 1.1, ROUNDING) &&
        nclose(slideA!.to.uA, 1, ROUNDING) &&
        nclose(slideA!.to.slide, 0.95, ROUNDING) &&
        nclose(second!.to.uA, 0.65, ROUNDING),
    );
    const drawn: operateLongInsertCourse.IResult = course({ withdraw: true });
    TestValidator.predicate(
      "drawn out",
      kinds(drawn).join() === "push,pull" &&
        nclose(drawn.segments[1]!.to.uA, 0.3, ROUNDING) &&
        nclose(drawn.segments[1]!.to.uB, 0.4, ROUNDING),
    );
    const refused: (
      asked: Partial<operateLongInsertCourse.IProps>,
    ) => boolean = (
      asked: Partial<operateLongInsertCourse.IProps>,
    ): boolean => {
      try {
        course(asked);
      } catch (error: unknown) {
        return error instanceof AutoMovieMotionHumanRefusal && error.axis === "kind";
      }
      return false;
    };
    TestValidator.predicate(
      "refusals",
      refused({ depth: 1.4 }) &&
        refused({
          shoulders: { A: { x: 5, y: 0, z: 0.5 }, B: { x: 5, y: 0, z: 0.5 } },
        }),
    );
  }
}

namespace part_operate_state {
  /** Rounding of a few products and a turn, metres and degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `operateState.at` is an operated part's contact at a share of its stroke: a
   * button pressed in against its normal by its travel (5 mm unless given), a
   * knob turned by its turn, a slider drawn out along its normal by its travel,
   * a hinged leaf swung about its line by its swing toward its normal's side,
   * and an insertion driven in by its depth, or in and back out on a cosine
   * when it withdraws.
   *
   * Scenarios, a contact at (0, 1, 0.5) facing +Z, half way through:
   *
   * 1. A button with no travel is 2.5 mm in.
   * 2. A knob of 90 degrees has rolled 45.
   * 3. A slider of 0.3 m is 0.15 m out.
   * 4. A leaf hinged on a vertical line through (0.4, 0, 0.5), swinging 90
   *    degrees, has turned 45: its handle at `foot + R(45) arm` facing turned.
   * 5. An insertion of 0.2 m is 0.1 m in; withdrawing, it is at its full depth
   *    half way and back out at the end.
   */
  export function verify(): void {
    const place: IAutoMovieMotionHumanOperateState.IAtPlace = {
      point: { x: 0, y: 1, z: 0.5 },
      normal: { x: 0, y: 0, z: 1 },
    };
    const at: IAutoMovieMotionTarget = {
      kind: "point",
      frame: "world",
      at: place.point,
    };
    TestValidator.predicate(
      "a button",
      vclose(
        operateState.at({ kind: "button", at }, place, undefined, 0.5).point,
        { x: 0, y: 1, z: 0.5 - 0.0025 },
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "a knob",
      nclose(
        operateState.at({ kind: "knob", at, turn: 90 }, place, undefined, 0.5)
          .roll,
        45,
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "a slider",
      vclose(
        operateState.at(
          { kind: "slider", at, travel: 0.3 },
          place,
          undefined,
          0.5,
        ).point,
        { x: 0, y: 1, z: 0.65 },
        ROUNDING,
      ),
    );
    const swung: IAutoMovieMotionHumanOperateState.IAtResult = operateState.at(
      { kind: "hinge", at, swing: 90 },
      place,
      { point: { x: 0.4, y: 0, z: 0.5 } },
      0.5,
    );
    const r: number = Math.SQRT1_2;
    // The arm from the line's foot (0.4, 1, 0.5) is -0.4 X; the pull turns it
    // toward +Z, the normal's side, a quarter turn's half.
    TestValidator.predicate(
      "a hinged leaf",
      vclose(
        swung.point,
        { x: 0.4 - 0.4 * r, y: 1, z: 0.5 + 0.4 * r },
        ROUNDING,
      ) &&
        Math.abs(Math.hypot(swung.normal.x, swung.normal.z) - 1) <= ROUNDING &&
        Math.abs(Math.abs(swung.normal.x) - r) <= ROUNDING,
    );
    const insert: (withdraw: boolean, progress: number) => number = (
      withdraw: boolean,
      progress: number,
    ): number =>
      operateState.at(
        { kind: "insert", prop: "rod", into: at, depth: 0.2, withdraw },
        place,
        undefined,
        progress,
      ).point.z;
    TestValidator.predicate(
      "an insertion",
      nclose(insert(false, 0.5), 0.4, ROUNDING) &&
        nclose(insert(true, 0.5), 0.3, ROUNDING) &&
        nclose(insert(true, 1), 0.5, ROUNDING),
    );
  }
}

/**
 * `operate`'s unit contract: its state and long insert.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `operate_long_insert_course`: `operateLongInsertCourse` plans a staff driven
 *   down a bore hand over hand:
 * - `operate_state`: `operateState.at` is an operated part's contact at a share
 *   of its stroke:
 */
export async function test_motions_affordance_operate(): Promise<void> {
  part_operate_long_insert_course.verify();
  part_operate_state.verify();
}
