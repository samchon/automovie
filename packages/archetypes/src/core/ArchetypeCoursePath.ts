import type { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeUnits } from "./ArchetypeUnits";

/**
 * A course's path: its legs measured and laid end to end from its start, and the place and heading a distance along a leg reaches.
 *
 * `ArchetypeCourseLegs.plan` is its one caller; the path is kept apart from the speed so each file stays within its size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it owns and who calls it.
 * @evidence contracts/development/design.md#principled-representation The legs as a table of rows, each with its start, its run on the ground and its length along its grade, and a pose as a place and a heading.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `lay` and `advance`, called by `ArchetypeCourseLegs.plan`, and the two records they pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace ArchetypeCoursePath {
  /**
   * One leg with where it starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The leg, its distances along the path and on the ground in metres, its direction of travel, and the root's place and heading where it starts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written by `lay`, read by `advance` and the plan's samplers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRow {
    /** The leg. */
    leg: ArchetypeCourse.Leg;

    /** Distance along the path at which the leg starts, metres. */
    from: number;

    /** The leg's length along the path, metres: its run on the ground, lengthened by its grade. */
    span: number;

    /** The leg's run on the ground, metres. */
    run: number;

    /** Metres the leg gains, 0 when level. */
    rise: number;

    /** Whether the support goes backward along it. */
    reverse: boolean;

    /** The signed distance rolled where the leg starts, metres: forward legs add their span, reversed legs take it away. */
    progress: number;

    /** The root's X where the leg starts, metres. */
    x: number;

    /** The root's height where the leg starts, metres. */
    y: number;

    /** The root's Z where the leg starts, metres. */
    z: number;

    /** The heading the support faces where the leg starts, degrees. */
    heading: number;
  }

  /**
   * A place on the path and the heading faced there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The root's place in metres and its heading in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `advance`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPose {
    /** X, metres. */
    x: number;

    /** Height, metres. */
    y: number;

    /** Z, metres. */
    z: number;

    /** Heading faced, degrees. */
    heading: number;
  }

  /**
   * A course's legs measured and laid end to end from its start.
   *
   * @param course The course.
   * @param refuse The plan's refusal, which names the course's field.
   * @returns One row per leg, and the path's whole length along its grades, metres.
   * @throws {ArchetypeRefusal} Through `refuse`, for a leg whose length or radius is not positive, a turn of no angle, or a rise that is not finite.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each leg's run on the ground is its length or its radius times its angle, and its length along the path that run times the square root of one plus the grade squared, the hypotenuse of a constant grade; each leg starts where `advance` leaves the one before it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the leg, measure it, record it, advance to its end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg that cannot be laid is refused, never skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the legs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The rows are handed to the plan, which keeps them as long as its caller keeps it.
   */
  export function lay(
    course: ArchetypeCourse.ICourse,
    refuse: (axis: string, value: unknown, reason: string) => never,
  ): { rows: IRow[]; length: number } {
    const rows: IRow[] = [];
    let x: number = course.start.x;
    let y: number = 0;
    let z: number = course.start.z;
    let heading: number = course.start.heading;
    let length: number = 0;
    let progress: number = 0;
    course.legs.forEach((leg: ArchetypeCourse.Leg, index: number): void => {
      const size: number = leg.kind === "straight" ? leg.length : leg.radius;
      if (!(Number.isFinite(size) && size > 0))
        refuse(
          `legs[${index}]`,
          size,
          "a leg's length or radius must be positive",
        );
      if (
        leg.kind === "turn" &&
        !(Number.isFinite(leg.angle) && leg.angle !== 0)
      )
        refuse(
          `legs[${index}].angle`,
          leg.angle,
          "a turn must change the heading",
        );
      const rise: number = leg.rise ?? 0;
      if (!Number.isFinite(rise))
        refuse(`legs[${index}].rise`, rise, "a leg's rise must be finite");
      const run: number =
        leg.kind === "straight"
          ? leg.length
          : leg.radius * Math.abs(leg.angle) * ArchetypeUnits.DEGREE;
      const span: number =
        rise === 0 ? run : run * Math.sqrt(1 + (rise / run) * (rise / run));
      const row: IRow = {
        leg,
        from: length,
        span,
        run,
        rise,
        reverse: leg.reverse === true,
        progress,
        x,
        y,
        z,
        heading,
      };
      rows.push(row);
      const end: IPose = advance(row, span);
      x = end.x;
      y = end.y;
      z = end.z;
      heading = end.heading;
      length += span;
      progress += leg.reverse === true ? -span : span;
    });
    return { rows, length };
  }

  /**
   * Where a leg has taken the root after a distance along it.
   *
   * @param row The leg and its start.
   * @param along Distance along the leg's path, metres, from 0 to its span.
   * @returns The root's place and the heading it faces.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the range and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The ground covered and the height gained in the grade's proportion; a straight leg along the way the root travels, a reversed leg opposite to the heading it faces, and a turn the arc about its centre a radius to the turning side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The grade, the direction of travel, then one branch for a straight leg and one for a turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A level leg skips the grade's scaling and a forward leg the reversal, so a course using neither computes as before they existed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function advance(row: IRow, along: number): IPose {
    // The ground covered and the height gained, in the grade's proportion; a level leg covers what it travels.
    const ground: number =
      row.rise === 0 ? along : (along * row.run) / row.span;
    const height: number =
      row.rise === 0 ? row.y : row.y + (row.rise * along) / row.span;

    // A reversed leg travels opposite to the heading it faces.
    const travel: number = row.reverse ? row.heading + 180 : row.heading;
    const h: number = travel * ArchetypeUnits.DEGREE;
    if (row.leg.kind === "straight")
      return {
        x: row.x + ground * Math.sin(h),
        y: height,
        z: row.z + ground * Math.cos(h),
        heading: row.heading,
      };

    // Forward is (sin h, cos h) on (X, Z) and left is (cos h, -sin h); the centre lies a radius to the turning side of the way the root travels.
    const side: number = Math.sign(row.leg.angle);
    const swept: number = (side * ground) / row.leg.radius;
    const cx: number = row.x + side * row.leg.radius * Math.cos(h);
    const cz: number = row.z - side * row.leg.radius * Math.sin(h);
    return {
      x: cx - side * row.leg.radius * Math.cos(h + swept),
      y: height,
      z: cz + side * row.leg.radius * Math.sin(h + swept),
      heading: row.heading + swept / ArchetypeUnits.DEGREE,
    };
  }
}
