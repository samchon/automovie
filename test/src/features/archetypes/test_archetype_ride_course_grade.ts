import { ArchetypeCourse, ArchetypeFrame } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A leg with a rise climbs at a constant grade: the root gains the rise over the leg, pitches nose up by the grade's angle, and travels the slope's length.
 *
 * Scenarios:
 * 1. A straight of 50 m that rises 5 m ends 5 m up and 50 m along, halfway it is 2.5 m up, and the path is the hypotenuse, the square root of 2525 m, long.
 * 2. On it the root's forward axis rises by the arctangent of 0.1 and its left axis stays level, within 1e-9; the leg after it, level, carries the root on at 5 m with no pitch.
 * 3. A descent of 3 m over a 30 m quarter turn ends 3 m lower, nose down by the arctangent of 3 over the arc's length.
 * 4. Reversing up the 5 m rise, the support climbs backward, so its nose points down the grade.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans graded courses and reads the root's height and axes; a rise not gained, a pitch the wrong way or of the wrong size, a roll, or a run measured along the slope instead of the ground is caught.
 * @evidence contracts/development/testing.md#independent-expectations A constant grade is rise over run, its angle the arctangent of that, and the travelled length the hypotenuse: plane geometry worked here. A turn's run is r theta.
 * @evidence contracts/development/testing.md#distinguishing-cases A climb, a descent, a level leg after a climb, a graded turn, and a reversed climb; ungraded courses belong to `test_archetype_ride_course`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory plans, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_ride_course_grade(): void {
  const findings: string[] = [];
  const base: Omit<ArchetypeCourse.ICourse, "legs"> = {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 5,
    acceleration: 2,
    deceleration: 3,
  };
  const climb = (state: ArchetypeCourse.IState): number => {
    const forward: IAutoMovieVector3 = ArchetypeFrame.axis(state.placement, "z");
    return Math.asin(forward.y);
  };

  // 1 and 2. A climb, then a level leg.
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...base,
    legs: [
      { kind: "straight", length: 50, rise: 5 },
      { kind: "straight", length: 10 },
    ],
  });
  const slope: number = Math.sqrt(2525);
  if (Math.abs(plan.length - (slope + 10)) > 1e-9) findings.push("the length");
  const top: ArchetypeCourse.IState = plan.at(plan.when(slope));
  const half: ArchetypeCourse.IState = plan.at(plan.when(slope / 2));
  if (
    Math.abs(top.placement.translation.y - 5) > 1e-9 ||
    Math.abs(top.placement.translation.z - 50) > 1e-9 ||
    Math.abs(half.placement.translation.y - 2.5) > 1e-9
  )
    findings.push("the rise is not gained along the run");
  if (
    Math.abs(climb(half) - Math.atan(0.1)) > 1e-9 ||
    Math.abs(ArchetypeFrame.axis(half.placement, "x").y) > 1e-9
  )
    findings.push(`the climb pitches ${climb(half)}, not atan 0.1`);
  const after: ArchetypeCourse.IState = plan.at(plan.when(slope + 5));
  if (Math.abs(after.placement.translation.y - 5) > 1e-9 || Math.abs(climb(after)) > 1e-9)
    findings.push("the level leg after the climb is not level at 5 m");

  // 3. A descending turn.
  const turn: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...base,
    legs: [{ kind: "turn", radius: 20, angle: 90, rise: -3 }],
  });
  const arc: number = 10 * Math.PI;
  const end: ArchetypeCourse.IState = turn.at(turn.duration);
  const middle: ArchetypeCourse.IState = turn.at(turn.duration / 2);
  if (
    Math.abs(end.placement.translation.y + 3) > 1e-9 ||
    Math.abs(climb(middle) + Math.atan(3 / arc)) > 1e-9
  )
    findings.push("the descending turn");

  // 4. Reversing up the climb.
  const back: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...base,
    legs: [{ kind: "straight", length: 50, rise: 5, reverse: true }],
  });
  const going: ArchetypeCourse.IState = back.at(back.duration / 2);
  if (
    !(going.placement.translation.z < 0) ||
    !(going.placement.translation.y > 0) ||
    Math.abs(climb(going) + Math.atan(0.1)) > 1e-9
  )
    findings.push("reversing up a climb does not point the nose down the grade");
  TestValidator.equals("a leg climbs at its grade", findings, []);
}
