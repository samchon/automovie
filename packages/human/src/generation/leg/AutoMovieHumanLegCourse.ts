import { AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The leg walk's jointed course through its centres (port, knee centre, IM,
 * toe-web pole) and the map from a neutral walk station to the posed course
 * station, shared by the view curves (which solve the ankle's bisection
 * section at neutral) and the view loft (which lofts at any pose).
 *
 * The course is the engine's jointed axis (`AutoMovieViewAxis.jointed`): a
 * flexed joint turns its section planes by a quintic angle whose midpoint
 * plane is the bisection plane of the two links (Thalmann, Shen and
 * Chauvineau 1996, section 2.1). A tube of radius `r` about a course of
 * curvature `k` stays regular while `k r < 1`; only the turn's concave side
 * can fold, so the half length is set by the inner extent `r_in` of the
 * joint's bisection section: the quintic-angle turn of angle `theta` over
 * `2 h` has peak curvature `1.875 theta / (2 h)`, and `h = 1.875 theta r_in /
 * (2 * 0.8)` keeps `k r_in <= 0.8`. The convex side (the heel at the ankle,
 * the patella under knee flexion) cannot fold and does not lengthen the turn.
 *
 * Station map. A neutral walk station on a straight run keeps its distance
 * from the segment's first centre; a joint knot sits at its turn's midpoint;
 * a station inside a turn is placed by its distance from the joint and named
 * in the diagnostics.
 */
export namespace AutoMovieHumanLegCourse {
  /** The course and its station map. */
  export interface IOutput {
    /** The engine axis, or the refusal. */
    axis: AutoMovieViewAxis.IAxis | null;

    /** The straight runs between turns. */
    runs: AutoMovieViewAxis.IRun[];

    /** Turn angle at each interior centre, radians. */
    angles: number[];

    /** Turn half length at each interior centre, mm. */
    halves: number[];

    /** Unit direction of each link, from one centre to the next. */
    links: Vec3[];

    /** Posed course station of a neutral walk station. */
    station: (walk: number) => number;

    /** Course length, mm. */
    length: number;

    /** Constructor notes. */
    diagnostics: string[];
  }

  /**
   * Build the course.
   *
   * @param input Course centres in the part's world: port, knee centre, IM, toe-web pole.
   * @param neutralInput Their neutral walk stations.
   * @param innerInput Inner (concave-side) half extent of each interior joint's section at neutral, before the bisection stretch, mm.
   * @param up The lateral direction that fixes the chart's `u`.
   * @param bend The femur's lead-in turn between the port and the knee centre, or none: the course leaves the port along the host loop's normal and turns there into the femur axis (`AutoMovieHumanLegLandmarks.IOutput.bend`). The returned `runs`, `angles`, `halves` and `links` keep the four-centre indexing (the femur's run is the one after the bend), so the knee stays interior centre 1 and IM centre 2; only the station map and the axis carry the bend.
   */
  export function create(input: readonly Vec3[], neutralInput: readonly number[], innerInput: readonly number[], up: Vec3, bend?: { centre: Vec3; walk: number; inner: number }): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const diagnostics: string[] = [];
    const lead: number = bend === undefined ? 0 : 1;
    const centres: Vec3[] = bend === undefined ? [...input] : [input[0]!, bend.centre, ...input.slice(1)];
    const neutral: number[] = bend === undefined ? [...neutralInput] : [neutralInput[0]!, bend.walk, ...neutralInput.slice(1)];
    const inner: number[] = bend === undefined ? [...innerInput] : [bend.inner, ...innerInput];
    const links: Vec3[] = centres.slice(1).map((c: Vec3, i: number): Vec3 => S.unit(sub(c, centres[i]!)));
    const interior: number[] = centres.slice(1, -1).map((_: Vec3, k: number): number => k + 1);
    const angles: number[] = interior.map((i: number): number => {
      const a: Vec3 = links[i - 1]!;
      const b: Vec3 = links[i]!;
      return Math.atan2(Math.hypot(...S.cross(a, b)), S.dot(a, b));
    });
    const halves: number[] = angles.map((theta: number, k: number): number => {
      const r: number = inner[k]! / Math.cos(theta / 2);
      // A rounding-level angle of a straight joint keeps a positive but negligible turn.
      return Math.max((1.875 * theta * r) / (2 * 0.8), 1e-6);
    });
    // The bend's turn fits its stub (main's order, 2026-11-08 18:56): on S00's floored half loop the stub from the port to the bend is 90.81 mm and the bend's turn, from its inner reach 137.78 mm, sets back 91.25 mm, so its half length is scaled (the set-back is linear in it at a fixed angle, read on the same turn with a long lead-in) until the set-back leaves a 1 mm straight run at the port; the bend's walk is unchanged. A course axis only: her sections stay hers.
    if (lead === 1) {
      const stub: number = Math.hypot(...sub(centres[1]!, centres[0]!));
      const u: Vec3 = S.unit(sub(centres[1]!, centres[0]!));
      const probe: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs([sub(centres[1]!, [u[0] * 1e4, u[1] * 1e4, u[2] * 1e4]), centres[1]!, centres[2]!], [halves[0]!]);
      const setback: number = typeof probe === "string" ? 0 : 1e4 - probe[0]!.to;
      if (setback > stub - 1) halves[0] = (halves[0]! * (stub - 1)) / setback;
    }
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(centres, halves, up);
    const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
    if (typeof axis === "string" || typeof runs === "string") {
      diagnostics.push(`course: ${typeof axis === "string" ? axis : runs}`);
      return { axis: null, runs: [], angles: angles.slice(lead), halves: halves.slice(lead), links: links.slice(lead), station: (w: number): number => w, length: NaN, diagnostics };
    }
    const last: number = runs.length - 1;
    const joint: (i: number) => number = (i: number): number => runs[i - 1]!.end + (runs[i]!.start - runs[i - 1]!.end) / 2;
    const station: (walk: number) => number = (walk: number): number => {
      let i: number = 0;
      while (i < last && walk > neutral[i + 1]! + 1e-6) ++i;
      const x: number = walk - neutral[i]!;
      const run: AutoMovieViewAxis.IRun = runs[i]!;
      if (i > 0 && Math.abs(x) < 1e-6) return joint(i);
      if (i < last && Math.abs(walk - neutral[i + 1]!) < 1e-6) return joint(i + 1);
      if (x >= run.from - 1e-6 && x <= run.to + 1e-6) return run.start + (Math.min(run.to, Math.max(run.from, x)) - run.from);
      const note: string = `walk ${walk.toFixed(3)} mm lies inside the turn at centre ${x < run.from ? i : i + 1}; placed by its distance from the joint`;
      if (!diagnostics.includes(note)) diagnostics.push(note);
      return x < run.from ? joint(i) + (run.start - joint(i)) * (x / run.from) : run.end + (joint(i + 1) - run.end) * ((x - run.to) / (neutral[i + 1]! - neutral[i]! - run.to));
    };
    return { axis, runs: runs.slice(lead), angles: angles.slice(lead), halves: halves.slice(lead), links: links.slice(lead), station, length: runs[last]!.end, diagnostics };
  }

  /**
   * The bisection-plane box value of a joint knot read in the chart's `v`
   * (the bend plane): the two links' common half extent `value` stretched by
   * `1 / cos(theta / 2)` about the joint centre (Thalmann et al. 1996) and
   * re-referred to the course origin at the turn's midpoint.
   *
   * @param course The course.
   * @param joint Interior centre index (1-based among the centres).
   * @param centre The joint centre, world.
   * @param value Common half extent along `+v` (positive side) or `-v`, mm.
   * @param positive Whether the extent lies along `+v`.
   */
  export function bisection(course: IOutput, joint: number, centre: Vec3, value: number, positive: boolean): number {
    const theta: number = course.angles[joint - 1]!;
    if (course.axis === null || !(theta > 1e-6)) return value;
    const plane: { origin: Vec3; v: Vec3 } = course.axis.at(midpoint(course, joint));
    const shift: number = AutoMovieHumanArmCurveSpec.dot(sub(plane.origin, centre), plane.v);
    return value / Math.cos(theta / 2) + (positive ? -shift : shift);
  }

  /**
   * Station of the turn midpoint of an interior centre: the bisection plane.
   *
   * @param course The course.
   * @param joint Interior centre index (1-based among the centres).
   */
  export function midpoint(course: IOutput, joint: number): number {
    return course.runs[joint - 1]!.end + (course.runs[joint]!.start - course.runs[joint - 1]!.end) / 2;
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
