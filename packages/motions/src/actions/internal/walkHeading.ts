import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * How far a walk's footprint may turn, from the foot's own last footprint and
 * from the line to its hip, so the walk takes a turn the way the legs can
 * (`walkSteps`).
 *
 * A body that sets off toward a way behind it turns about over its first
 * footfalls: each foot turns at most `STEP` of the turn's amplitude from its
 * own last footprint, the yaw a foot turns in one swing of a standing turn, so
 * a turn about takes some three steps instead of one swing through the whole
 * turn. And a footprint turns no further from the line to its hip than keeps
 * that line within `ROLL` of the foot's side when the foot lifts, so the
 * ankle's inversion and eversion hold the stance.
 */
export namespace walkHeading {
  /*
   * The furthest a planted leg's line leans to the side of its foot, degrees:
   * 5° inside the ankle's 25° of inversion and eversion (AutoMovieEngineDefaultHumanoidRom),
   * provisional room for the pelvis's drop and list.
   */
  export const ROLL: number = 20;

  /*
   * The yaw a foot turns in one swing of a standing turn, degrees, at the
   * turn's amplitude, degrees: 73.5 +/- 14.3 at 90, 88.6 +/- 24.4 at 135 and
   * 95.0 +/- 26.0 at 180, over 1.95, 2.75 and 3.25 steps (Khobkhun, Hollands
   * and Richards 2022, Appl Sci 12:5474, Table 1, 20 younger adults turning on
   * level ground at a self-selected speed, inertial sensors); between them
   * linear, and the nearest beyond.
   */
  export const STEP: readonly (readonly [number, number])[] = [
    [90, 73.54],
    [135, 88.55],
    [180, 95.0],
  ];

  /*
   * The yaw a foot turns in one swing of a turn of an amplitude.
   * Parameter amplitude: The whole turn, degrees.
   * Returns: Degrees.
   */
  export function step(amplitude: number): number {
    const a: number = Math.abs(amplitude);
    if (a <= STEP[0]![0]) return STEP[0]![1];
    for (let i: number = 1; i < STEP.length; i++) {
      const [x1, y1]: readonly [number, number] = STEP[i]!;
      if (a <= x1) {
        const [x0, y0]: readonly [number, number] = STEP[i - 1]!;
        return y0 + ((y1 - y0) * (a - x0)) / (x1 - x0);
      }
    }
    return STEP.at(-1)![1];
  }

  /*
   * The footfalls an ordinary arrival turns over: the two before the closing
   * pair turn a third and two thirds of the arrival's turn, and the pair faces
   * it.
   */
  export const CLOSING: number = 3;

  /*
   * The footfalls a walk turns its arrival over: `CLOSING`, or, for an arrival
   * turned about further than `CLOSING` step turns carry, as many step turns as
   * it needs, the extra ones taken in place at the arrival, so no footfall
   * turns further from the one before than a step turn and the feet never cross
   * (a step turn, Hase and Stein 1999).
   * Parameter turn: The arrival's heading less the way in, degrees.
   * Parameter stepTurn: The most one footfall turns from the one before, degrees.
   * Returns: The footfalls, at least `CLOSING`.
   */
  export function closing(turn: number, stepTurn: number): number {
    return Math.max(CLOSING, Math.ceil(Math.abs(turn) / stepTurn));
  }

  /*
   * A heading turned from another toward a target by no more than a bound: a
   * footfall of a walk facing off its entry turns from the entry by at most as
   * many step turns as it is footfalls in.
   * Parameter from: The heading turned from, degrees.
   * Parameter target: The heading asked, degrees, unwrapped near `from`.
   * Parameter most: The largest turn, degrees.
   * Returns: The heading, degrees.
   */
  export function capped(from: number, target: number, most: number): number {
    const turn: number = target - from;
    return from + Math.sign(turn) * Math.min(Math.abs(turn), most);
  }

  /*
   * How many opening footfalls a walk steps in place to turn about: when a
   * foot's first swing cannot face the way the walk sets off (turning at most
   * `step` of the turn), the feet alternate in place, each turning at most that
   * far, until both face within `twist` of the way, so the walk sets off from
   * feet the pelvis can face between.
   * Parameter heading: The way the walk sets off, degrees, unwrapped about `yaw`.
   * Parameter lead: The foot that steps first; the feet alternate.
   * Parameter start: Each foot's facing before the walk, degrees.
   * Parameter yaw: The heading the walk starts from, degrees.
   * Parameter twist: How far the pelvis turns from a foot it stands on, degrees
   * (`walkReach.TWIST`).
   * Parameter stepped: Whether the walk opens with a step turn (`uncrossed`), whose
   * stance foot stands behind the way's start: its feet turn in place before
   * it sets off however far a swing could turn them, so the pelvis never sets
   * off from a foot behind it.
   * Returns: The count; 0 when the first swing of each foot faces the way and
   * the walk is no step turn.
   */
  export function opening(
    heading: number,
    lead: AutoMovieHumanSide,
    start: Record<AutoMovieHumanSide, number>,
    yaw: number,
    twist: number,
    stepped: boolean = false,
  ): number {
    const limit: number = step(heading - yaw);
    const last: Record<AutoMovieHumanSide, number> = {
      left: yaw + AutoMovieEngineMath.wrapDegrees(start.left - yaw),
      right: yaw + AutoMovieEngineMath.wrapDegrees(start.right - yaw),
    };
    // A foot already within the twist of the way turns no more in place.
    const far: (s: AutoMovieHumanSide) => boolean = (
      s: AutoMovieHumanSide,
    ): boolean => Math.abs(heading - last[s]) > twist;
    if (
      !stepped &&
      Math.abs(heading - last.left) <= limit &&
      Math.abs(heading - last.right) <= limit
    )
      return 0;
    let side: AutoMovieHumanSide = lead;
    let count: number = 0;
    while (far("left") || far("right")) {
      const off: number = heading - last[side];
      last[side] += Math.sign(off) * Math.min(limit, Math.abs(off));
      count++;
      side = side === "left" ? "right" : "left";
    }
    return count;
  }

  /*
   * The footfalls' facings with each foot turning at most `step` of the walk's
   * largest turn from its own last footprint, in order.
   * Parameter towards: Each footfall's facing as the way asks it, degrees,
   * unwrapped about the starting heading.
   * Parameter lead: The foot of the first footfall; the feet alternate.
   * Parameter start: Each foot's facing before the walk, degrees.
   * Parameter yaw: The heading the walk starts from, degrees.
   * Parameter kept: How many footfalls at the end keep their asked facing (the
   * closing pair).
   * Returns: The facings, degrees.
   */
  export function about(
    towards: readonly number[],
    lead: AutoMovieHumanSide,
    start: Record<AutoMovieHumanSide, number>,
    yaw: number,
    kept: number,
  ): number[] {
    const amplitude: number = Math.max(
      0,
      ...towards.map((t: number): number => Math.abs(t - yaw)),
    );
    const limit: number = step(amplitude);
    const last: Record<AutoMovieHumanSide, number> = {
      left: yaw + AutoMovieEngineMath.wrapDegrees(start.left - yaw),
      right: yaw + AutoMovieEngineMath.wrapDegrees(start.right - yaw),
    };
    return towards.map((toward: number, j: number): number => {
      const side: AutoMovieHumanSide =
        j % 2 === 0 ? lead : lead === "left" ? "right" : "left";
      const turned: number =
        j >= towards.length - kept || Math.abs(toward - last[side]) <= limit
          ? toward
          : last[side] + Math.sign(toward - last[side]) * limit;
      last[side] = turned;
      return turned;
    });
  }

  /*
   * The foot that sets off, so its first footprint never lands across the foot
   * it leaves standing: the foot further behind leads, unless its footprint
   * would land past the other foot's line, which on a sharp turn toward the
   * standing foot's side is a crossover through the stance leg; then the other
   * foot leads, the step turn a turn is taken with, the turning foot moving
   * first (Hase and Stein 1999).
   * Parameter behind: The foot further behind along the way, the lead a straight
   * walk takes.
   * Parameter ankles: Each foot's ankle before the walk, world metres.
   * Parameter facings: Each foot's facing before the walk, degrees.
   * Parameter way: The way's point under the first footprint, world metres.
   * Parameter heading: The first footprint's facing, degrees.
   * Parameter lateral: How far either side of the way a first footprint lies,
   * metres.
   * Returns: The lead.
   */
  export function uncrossed(
    behind: AutoMovieHumanSide,
    ankles: Record<AutoMovieHumanSide, IAutoMovieVector3>,
    facings: Record<AutoMovieHumanSide, number>,
    way: IAutoMovieVector3,
    heading: number,
    lateral: number,
  ): AutoMovieHumanSide {
    // A footprint lies `lateral` to its side of the way, along the heading's `+X`.
    const turn: number = (heading * Math.PI) / 180;
    const landing: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => {
      const x: number = (side === "left" ? 1 : -1) * lateral;
      return {
        x: way.x + x * Math.cos(turn),
        y: 0,
        z: way.z - x * Math.sin(turn),
      };
    };
    const crosses: (side: AutoMovieHumanSide) => boolean = (
      side: AutoMovieHumanSide,
    ): boolean => {
      const stance: AutoMovieHumanSide = side === "left" ? "right" : "left";
      const yaw: number = (facings[stance] * Math.PI) / 180;
      // The standing foot's right, `+X` turned by its facing's yaw.
      const right: IAutoMovieVector3 = {
        x: -Math.cos(yaw),
        y: 0,
        z: Math.sin(yaw),
      };
      const across: (point: IAutoMovieVector3) => number = (
        point: IAutoMovieVector3,
      ): number =>
        (point.x - ankles[stance].x) * right.x +
        (point.z - ankles[stance].z) * right.z;
      return across(ankles[side]) * across(landing(side)) < 0;
    };
    const other: AutoMovieHumanSide = behind === "left" ? "right" : "left";
    return crosses(behind) && !crosses(other) ? other : behind;
  }

  /*
   * A footprint kept on its own side of the other foot's last footprint: a walk
   * that faces away from its way (aside, a sidestep) places each foot its rest
   * separation to its side of the way, and a step longer than the two
   * separations would land the trailing foot past the leading one, a crossover
   * through the stance leg. The footprint then closes up to the other foot
   * instead, the step-close of a sidestep.
   * Parameter point: The footprint's ankle, world metres.
   * Parameter other: The other foot's last footprint and its own offset across the
   * facing, or undefined before it has one.
   * Parameter toward: The footprint's facing, degrees.
   * Parameter side: The footprint's foot.
   * Parameter lateral: The footprint's own offset across the facing, metres.
   * Returns: The footprint, moved across the facing only as far as keeps the
   * two feet their offsets apart.
   */
  export function separated(
    point: IAutoMovieVector3,
    other: ISeparated | undefined,
    toward: number,
    side: AutoMovieHumanSide,
    lateral: number,
  ): IAutoMovieVector3 {
    if (other === undefined) return point;
    const a: number = (toward * Math.PI) / 180;
    // The facing's +X, the body's left.
    const lx: number = Math.cos(a);
    const lz: number = -Math.sin(a);
    const sign: number = side === "left" ? 1 : -1;
    const gap: number = Math.abs(lateral) + Math.abs(other.lateral);
    const apart: number =
      sign * ((point.x - other.point.x) * lx + (point.z - other.point.z) * lz);
    if (apart >= gap) return point;
    const shift: number = sign * (gap - apart);
    return { x: point.x + shift * lx, y: point.y, z: point.z + shift * lz };
  }

  /*
   * A step turn's footprint (Hase and Stein 1999): the turning foot steps round
   * the standing foot's last footprint to its own side of it at the new facing,
   * the two feet their offsets apart across that facing, so a turn about at an
   * arrival pivots on the standing foot instead of orbiting the arrival point.
   * Parameter other: The standing foot's last footprint and its own offset across
   * the facing.
   * Parameter toward: The footprint's facing, degrees.
   * Parameter side: The stepping foot.
   * Parameter lateral: The footprint's own offset across the facing, metres.
   * Parameter height: The footprint's ankle height, world metres.
   * Returns: The footprint's ankle, world metres.
   */
  export function around(
    other: ISeparated,
    toward: number,
    side: AutoMovieHumanSide,
    lateral: number,
    height: number,
  ): IAutoMovieVector3 {
    const a: number = (toward * Math.PI) / 180;
    // The facing's +X, the body's left.
    const lx: number = Math.cos(a);
    const lz: number = -Math.sin(a);
    const sign: number = side === "left" ? 1 : -1;
    const gap: number = Math.abs(lateral) + Math.abs(other.lateral);
    return {
      x: other.point.x + sign * gap * lx,
      y: height,
      z: other.point.z + sign * gap * lz,
    };
  }

  /*
   * A foot's last footprint for `separated`.
   */
  export interface ISeparated {
    /*
     * The ankle, world metres.
     */
    point: IAutoMovieVector3;

    /*
     * Its offset across its facing, metres.
     */
    lateral: number;
  }

  /*
   * A footprint's heading turned no further from the line to its hip than the
   * ankle can lean sideways when the foot lifts.
   * Parameter heading: The footprint's heading, degrees.
   * Parameter point: The footprint's ankle, world metres.
   * Parameter hip: The hip over it when the foot lifts, world metres.
   * Parameter leeway: How far across the foot the hip may lie, metres: the leg's
   * height times the tangent of `ROLL`.
   * Parameter behind: Whether a hip behind the foot (a backward step) leans the leg
   * the other way.
   * Returns: The heading, degrees.
   */
  export function leaned(
    heading: number,
    point: IAutoMovieVector3,
    hip: IAutoMovieVector3,
    leeway: number,
    behind: boolean,
  ): number {
    const reach: number = Math.hypot(hip.x - point.x, hip.z - point.z);
    if (reach <= leeway) return heading;
    const band: number = (Math.asin(leeway / reach) * 180) / Math.PI;
    const line: number = AutoMovieEngineMath.wrapDegrees(
      heading - (Math.atan2(hip.x - point.x, hip.z - point.z) * 180) / Math.PI,
    );
    const off: number =
      behind && Math.abs(line) > 90 ? AutoMovieEngineMath.wrapDegrees(line - 180) : line;
    return heading + Math.max(-band, Math.min(band, off)) - off;
  }
}
