import {
  HumanRefusal,
  operateLongInsertCourse,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-12;

/**
 * `operateLongInsertCourse` plans a staff driven down a bore hand over hand:
 * both hands push it in together as far as their reach chords on the bore's
 * axis and the mouth's clearance allow, then the steadying hand and the
 * carrying hand slide back out along the staff in turn, and so on to the depth;
 * drawn out, they pull together.
 *
 * Scenarios, a bore at the origin opening along +Z, both shoulders 0.5 m out on
 * its axis reaching 0.6 m (a chord from -0.1 to 1.1 m), the staff held 0.3 m
 * behind its working point with the second hand 0.1 m behind, 50 mm off the
 * mouth, its grip running 0.2 to 1.5 m:
 *
 * 1. Driven 0.2 m, it is presented with the hands at 0.3 and 0.4 m and pushed once
 *    to 0.1 and 0.2 m.
 * 2. Driven 0.6 m, the first push stops at the clearance, 0.25 m in; the steadying
 *    hand slides back to its reach, 1.1 m, the carrying hand to 1 m, 0.95 m
 *    along the staff; a second push takes it the last 0.35 m.
 * 3. Driven 0.2 m and drawn out, a pull brings the hands back to 0.3 and 0.4 m.
 * 4. A depth past the staff's grip less the clearance and the second hand, 1.35 m,
 *    and shoulders 5 m aside of the bore, which no step along it brings within
 *    reach, are refused.
 */
export function test_unit_motions_affordance_operate_long_insert_course(): void {
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
  const refused: (asked: Partial<operateLongInsertCourse.IProps>) => boolean = (
    asked: Partial<operateLongInsertCourse.IProps>,
  ): boolean => {
    try {
      course(asked);
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === "kind";
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
