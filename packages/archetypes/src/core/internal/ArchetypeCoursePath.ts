import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";
import type { AutoMovieArchetypeCourse } from "../AutoMovieArchetypeCourse";
import { AutoMovieArchetypeUnits } from "../AutoMovieArchetypeUnits";

/*
 * A course's path: its legs measured and laid end to end from its start, and
 * the place and heading a distance along a leg reaches.
 *
 * `ArchetypeCourseLegs.plan` is its one caller; the path is kept apart from the
 * speed so each file stays within its size.
 */
export namespace ArchetypeCoursePath {
  /*
   * One leg with where it starts.
   */
  export interface IRow {
    /*
     * The leg.
     */
    leg: AutoMovieArchetypeCourse.Leg;

    /*
     * Distance along the path at which the leg starts, metres.
     */
    from: number;

    /*
     * The leg's length along the path, metres: its run on the ground,
     * lengthened by its grade.
     */
    span: number;

    /*
     * The leg's run on the ground, metres.
     */
    run: number;

    /*
     * Metres the leg gains, 0 when level.
     */
    rise: number;

    /*
     * Whether the support goes backward along it.
     */
    reverse: boolean;

    /*
     * The signed distance rolled where the leg starts, metres: forward legs add
     * their span, reversed legs take it away.
     */
    progress: number;

    /*
     * The root's X where the leg starts, metres.
     */
    x: number;

    /*
     * The root's height where the leg starts, metres.
     */
    y: number;

    /*
     * The root's Z where the leg starts, metres.
     */
    z: number;

    /*
     * The heading the support faces where the leg starts, degrees.
     */
    heading: number;
  }

  /*
   * A place on the path and the heading faced there.
   */
  export interface IPose {
    /*
     * X, metres.
     */
    x: number;

    /*
     * Height, metres.
     */
    y: number;

    /*
     * Z, metres.
     */
    z: number;

    /*
     * Heading faced, degrees.
     */
    heading: number;
  }

  /*
   * A course's legs measured and laid end to end from its start.
   * Parameter course: The course.
   * Parameter refuse: The plan's refusal, which names the course's field.
   * Returns: One row per leg, and the path's whole length along its grades,
   * metres.
   * Through `refuse`, for a leg whose
   * length or radius is not positive, a turn of no angle, or a path length
   * that is unrepresentable.
   */
  export function lay(
    course: AutoMovieArchetypeCourse.ICourse,
    refuse: (axis: string, value: unknown, reason: string) => never,
  ): { rows: IRow[]; length: number } {
    const rows: IRow[] = [];
    let x: number = course.start.x;
    let y: number = 0;
    let z: number = course.start.z;
    let heading: number = course.start.heading;
    let length: number = 0;
    let progress: number = 0;
    course.legs.forEach(
      (leg: AutoMovieArchetypeCourse.Leg, index: number): void => {
        const size: number = leg.kind === "straight" ? leg.length : leg.radius;
        if (!(size > 0))
          refuse(
            `legs[${index}]`,
            size,
            "a leg's length or radius must be positive",
          );
        if (leg.kind === "turn" && !(leg.angle !== 0))
          refuse(
            `legs[${index}].angle`,
            leg.angle,
            "a turn must change the heading",
          );
        const rise: number = leg.rise ?? 0;
        const run: number =
          leg.kind === "straight"
            ? leg.length
            : leg.radius * Math.abs(leg.angle) * AutoMovieArchetypeUnits.DEGREE;
        const grade: number = rise === 0 ? 0 : rise / run;
        const ordinary: number = rise === 0 ? run : run * Math.sqrt(1 + grade * grade);
        const span: number = ordinary < Infinity ? ordinary : Math.hypot(run, rise);
        const next: number = length + span;
        if (!(next > length && next < Infinity))
          refuse(
            `legs[${index}]`,
            span,
            "the course must gain a representable distance along each leg",
          );
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
        length = next;
        progress += leg.reverse === true ? -span : span;
      },
    );
    return { rows, length };
  }

  /*
   * Where a leg has taken the root after a distance along it.
   * Parameter row: The leg and its start.
   * Parameter along: Distance along the leg's path, metres, from 0 to its span.
   * Returns: The root's place and the heading it faces.
   */
  export function advance(row: IRow, along: number): IPose {
    // The ground covered and the height gained, in the grade's proportion; a level leg covers what it travels.
    const ground: number =
      row.rise === 0 ? along : gradedComponent(row.run, along, row.span);
    const height: number =
      row.rise === 0 ? row.y : row.y + gradedComponent(row.rise, along, row.span);

    // A reversed leg travels opposite to the heading it faces.
    const travel: number = row.reverse ? row.heading + 180 : row.heading;
    const h: number = travel * AutoMovieArchetypeUnits.DEGREE;
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
      heading: row.heading + swept / AutoMovieArchetypeUnits.DEGREE,
    };
  }

  /*
   * Project one component without prematurely rounding the product to zero or infinity.
   */
  function gradedComponent(component: number, along: number, span: number): number {
    if (component === 0 || along === 0) return 0;
    const product: number = component * along;
    const magnitude: number = Math.abs(product);
    // Below the least normal value an intermediate product loses significand bits.
    if (magnitude >= 2 ** -1022 && magnitude < Infinity) return product / span;
    return (
      Math.sign(component) *
      ArchetypeMassArithmetic.ratio(Math.abs(component), along, span, 1)
    );
  }
}
