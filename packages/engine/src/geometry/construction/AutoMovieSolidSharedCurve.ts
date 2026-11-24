import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidRail,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World point or derivative, mm. */
type Vec3 = AutoMovieVector3Tuple;

/** A surface's 2-jet at a chart point. */
type IJet = IAutoMovieSolidSurface.IJet;

/** A point of the shared curve. */
type IPoint = IAutoMovieSolidIntersection.IPoint;
const {
  combine,
  cross,
  dot,
  norm,
  scale,
  solve2,
  sub,
  unit,
}: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/**
 * A join's contact as a declared closed loop on the host that both surfaces
 * share, in place of a traced intersection: the curve of a mixed join, along
 * which the part runs on from the host where the two are tangent and crosses it
 * elsewhere.
 *
 * A trace solves `A = B` with the Jacobian `[A_s, A_phi, -B_y, -B_theta]`,
 * which is singular where the two normals are parallel, so a contact that is
 * tangential over an arc cannot be traced however it is parameterized. A shared
 * boundary needs no trace: one owner supplies the loop `x(t) = (y(t),
 * theta(t))` on the host's chart with two derivatives (a port curve, a face's
 * skin cut by a surface fixed in a frame), and the part passes through it by
 * construction. The curve is then `C(t) = B(x(t))` with `C' = B_y y' + B_theta
 * theta'` and `C'' = Q_B + B_y y'' + B_theta theta''` exactly, and the part's
 * preimage is the foot of `C(t)` on the part, solved by Newton on `A_s . (A -
 * C) = 0`, `A_phi . (A - C) = 0`, a problem that stays regular at any angle
 * between the surfaces. The part's rates solve `I_A (s', phi') = (A_s . C',
 * A_phi . C')` and `I_A (s'', phi'') = (A_s . (C'' - Q_A), A_phi . (C'' -
 * Q_A))`, exact where the loop lies on the part and within the gap's order
 * where it stands off by less than the tolerance.
 *
 * What the surfaces decide, with no arc declared: the turn between the two
 * outward normals at each point is the fold's angle, which a `fold` width law
 * reads (`AutoMovieConstructionWidths`); a point where the tangent planes meet
 * under `grazing` is on a smooth arc and any other on a fold arc (`arc`). What
 * the loop decides is only what the normals cannot (`toward`): the host's rail
 * stands outside the loop at every point, and on a smooth arc the part's rail
 * stands where the part runs on from the host across the loop. On a fold arc
 * the part's side is the normals' own, as a traced join reads it. The two
 * readings of the part's side agree wherever both are defined and the part
 * rises from the host inside the loop; a part whose side reverses between
 * neighbouring points passes under its host along an arc and is refused.
 */
export namespace AutoMovieSolidSharedCurve {
  /** Newton steps of one foot. */
  export const STEPS: number = 40;

  /**
   * Relative size of the last foot step, of one millimetre plus the point's
   * distance from the origin, as `AutoMovieSolidRail.ROUNDING`.
   */
  export const ROUNDING: number = 1e-12;

  /**
   * The grid a foot starts from where no start is given: stations by phases
   * over the part's declared domain.
   */
  export const GRID: [number, number] = [33, 64];

  /**
   * Build the shared contact of a part and a host along a declared loop.
   *
   * @param input The surfaces, the loop and the limits.
   * @returns The contact, or null with one diagnostic.
   */
  export function create(
    input: IAutoMovieSolidSharedCurve.IInput,
  ): IAutoMovieSolidSharedCurve.IResult {
    const host: IAutoMovieSolidAtlas = AutoMovieSolidIntersection.atlas(
      input.host,
    );
    const index: number = input.face ?? 0;
    const face: IAutoMovieSolidSurface = host.faces[index]!;
    const part: IAutoMovieSolidSurface = input.part;
    const producer: string = `solid.shared.${part.name}.${host.name}`;
    const turn: number = 2 * Math.PI;
    const period: number = part.period ?? turn;

    /** One refusal. */
    const refuse = (
      contract: string,
      detail: string,
    ): IAutoMovieSolidSharedCurve.IResult => ({
      shared: null,
      diagnostics: [{ producer, level: 6, contract, detail }],
    });

    /**
     * The curve's point at a clock with the part's foot from a chart guess, or
     * the premise that failed.
     */
    const evaluate = (
      t: number,
      guess: readonly [number, number],
    ): { point: IPoint; gap: number } | string => {
      const c: ReturnType<IAutoMovieSolidSharedCurve.Loop> = input.loop(t);
      const b: IJet | null = AutoMovieSolidDomain.jet(
        face,
        c.point[0],
        c.point[1],
      );
      if (b === null)
        return `the loop leaves the host face's domain at [${c.point[0]}, ${c.point[1]}]`;

      // The host's map of the loop: the curve's point and its two clock derivatives.
      const tangent: Vec3 = combine([
        [c.first[0], b.u],
        [c.first[1], b.v],
      ]);
      const second: Vec3 = combine([
        [c.first[0] * c.first[0], b.uu],
        [2 * c.first[0] * c.first[1], b.uv],
        [c.first[1] * c.first[1], b.vv],
        [c.second[0], b.u],
        [c.second[1], b.v],
      ]);

      // The part's foot of the point: Newton on the two orthogonality equations with their own second-order terms.
      let s: number = guess[0];
      let phi: number = guess[1];
      const reach: number = ROUNDING * (1 + norm(b.p));
      let settled: boolean = false;
      for (let step: number = 0; step < STEPS && !settled; ++step) {
        const a: IJet | null = AutoMovieSolidDomain.jet(part, s, phi);
        if (a === null)
          return `the part has no jet at [${s}, ${phi}] on the way to the loop point's foot`;
        const r: Vec3 = sub(a.p, b.p);
        const move: [number, number] | null = solve2(
          dot(a.u, a.u) + dot(a.uu, r),
          dot(a.u, a.v) + dot(a.uv, r),
          dot(a.u, a.v) + dot(a.uv, r),
          dot(a.v, a.v) + dot(a.vv, r),
          [-dot(a.u, r), -dot(a.v, r)],
        );
        if (move === null)
          return `the part's foot of the loop point is singular at [${s}, ${phi}]`;
        s += move[0];
        phi += move[1];
        settled =
          norm(
            combine([
              [move[0], a.u],
              [move[1], a.v],
            ]),
          ) <= reach;
      }
      if (!settled)
        return `the part's foot of the loop point did not settle in ${STEPS} steps`;
      const a: IJet | null = AutoMovieSolidDomain.jet(part, s, phi);
      if (a === null)
        return `the part has no jet at the loop point's foot [${s}, ${phi}]`;

      // The part's rates along the curve: the tangent and the second derivative read in the part's own tangent plane.
      const E: number = dot(a.u, a.u);
      const F: number = dot(a.u, a.v);
      const G: number = dot(a.v, a.v);
      const rate: [number, number] | null = solve2(E, F, F, G, [
        dot(a.u, tangent),
        dot(a.v, tangent),
      ]);
      if (rate === null)
        return `the part's chart is singular at the loop point's foot [${s}, ${phi}]`;
      const rest: Vec3 = sub(
        second,
        combine([
          [rate[0] * rate[0], a.uu],
          [2 * rate[0] * rate[1], a.uv],
          [rate[1] * rate[1], a.vv],
        ]),
      );
      const rate2: [number, number] | null = solve2(E, F, F, G, [
        dot(a.u, rest),
        dot(a.v, rest),
      ]);
      const nA: Vec3 | null = unit(cross(a.u, a.v));
      const nB: Vec3 | null = unit(cross(b.u, b.v));
      if (rate2 === null || nA === null || nB === null)
        return `a normal vanishes at the loop point [${c.point[0]}, ${c.point[1]}]`;
      return {
        point: {
          t,
          phi,
          s,
          face: index,
          y: c.point[0],
          theta: c.point[1],
          point: b.p,
          tangent,
          second,
          rate: [rate[0], rate[1], c.first[0], c.first[1]],
          rate2: [rate2[0], rate2[1], c.second[0], c.second[1]],
          angle: Math.acos(Math.min(1, Math.abs(dot(nA, nB)))),
        },
        gap: norm(sub(a.p, b.p)),
      };
    };

    // Where the first foot starts: the given chart point, or the nearest point of a grid over the part.
    if (!(input.count >= 8))
      return refuse(
        "shared loop",
        `the count ${input.count} is not an integer of at least 8`,
      );
    let guess: [number, number];
    if (input.start !== undefined) guess = [input.start[0], input.start[1]];
    else {
      if (part.domain === undefined)
        return refuse(
          "shared loop",
          "a part without a declared domain needs the start of its first foot",
        );
      const origin: IJet | null = AutoMovieSolidDomain.jet(
        face,
        input.loop(0).point[0],
        input.loop(0).point[1],
      );
      if (origin === null)
        return refuse(
          "shared loop",
          "the loop's first point lies outside the host face's domain",
        );
      guess = [part.domain[0], 0];
      let least: number = Infinity;
      for (let i: number = 0; i < GRID[0]; ++i)
        for (let j: number = 0; j < GRID[1]; ++j) {
          const s: number =
            part.domain[0] +
            ((part.domain[1] - part.domain[0]) * i) / (GRID[0] - 1);
          const phi: number = (period * j) / GRID[1];
          const p: Vec3 = part.point?.(s, phi) ?? part.jet(s, phi).p;
          const distance: number = norm(sub(p, origin.p));
          if (distance < least) [least, guess] = [distance, [s, phi]];
        }
    }

    // The stored points, each foot from the one before it, every one within the tolerance of the part.
    const points: IPoint[] = [];
    const gaps: number[] = [];
    for (let i: number = 0; i < input.count; ++i) {
      const t: number = (turn * i) / input.count;
      const read: { point: IPoint; gap: number } | string = evaluate(t, guess);
      if (typeof read === "string")
        return refuse("shared loop", `at clock ${t}: ${read}`);
      points.push(read.point);
      gaps.push(read.gap);
      guess = [read.point.s, read.point.phi];
    }

    // A part that leaves the loop is refused with the arc it leaves over: the longest run of points off it, from its first clock to its last.
    const off: boolean[] = gaps.map(
      (gap: number): boolean => !(gap <= input.tolerance),
    );
    if (off.some((x: boolean): boolean => x)) {
      const worst: number = gaps.indexOf(Math.max(...gaps));
      let from: number = 0;
      let length: number = input.count;
      if (!off.every((x: boolean): boolean => x)) {
        length = 0;
        for (let i: number = 0; i < input.count; ++i) {
          if (!off[i] || off[(i + input.count - 1) % input.count]) continue;
          let run: number = 1;
          while (off[(i + run) % input.count]) ++run;
          if (run > length) [from, length] = [i, run];
        }
      }
      return refuse(
        "shared loop",
        `the part does not pass through the loop over the clocks [${points[from]!.t}, ${points[from]!.t + (turn * (length - 1)) / input.count}], ${off.filter((x: boolean): boolean => x).length} of ${input.count} points: the point at clock ${points[worst]!.t} stands ${gaps[worst]} mm off it (tolerance ${input.tolerance} mm)`,
      );
    }

    // One turn must bring the foot back onto itself, the part's phase by whole periods.
    const first: IPoint = points[0]!;
    const closing: { point: IPoint; gap: number } | string = evaluate(
      turn,
      guess,
    );
    if (typeof closing === "string")
      return refuse("closed loop", `at the end of the turn: ${closing}`);
    const partWinding: number =
      part.period === undefined
        ? 0
        : Math.round((closing.point.phi - first.phi) / period);
    const start: IJet = part.jet(first.s, first.phi);
    const miss: number = norm(
      combine([
        [closing.point.s - first.s, start.u],
        [closing.point.phi - first.phi - partWinding * period, start.v],
      ]),
    );
    if (!(miss <= 10 * input.tolerance))
      return refuse(
        "closed loop",
        `the part's foot returns ${miss} mm from its start after one turn of the loop`,
      );
    const winding: number =
      face.period === undefined
        ? 0
        : Math.round((closing.point.theta - first.theta) / face.period);
    if (winding !== 0)
      return refuse(
        "enclosed loop",
        `the loop winds ${winding} times round the host's phase: it must enclose a region of the host's chart`,
      );

    // The loop's sense in the host's chart: its outside is on the right of a counter-clockwise loop and on the left of a clockwise one.
    let area: number = 0;
    points.forEach((p: IPoint, i: number): void => {
      const q: IPoint = points[(i + 1) % points.length]!;
      area +=
        (p.y - first.y) * (q.theta - first.theta) -
        (q.y - first.y) * (p.theta - first.theta);
    });
    if (!(area !== 0))
      return refuse(
        "enclosed loop",
        "the loop encloses no area of the host's chart",
      );
    const sense: number = area > 0 ? 1 : -1;

    /**
     * Both rails' sides at a point: the host's outside the loop, the part's
     * from the normals on a fold arc and from the loop on a smooth one.
     */
    const toward: IAutoMovieSolidSharedCurve.IShared["toward"] = (
      p: IPoint,
    ): IAutoMovieSolidRail.IToward | null => {
      const b: IJet = face.jet(p.y, p.theta);
      const a: IJet = part.jet(p.s, p.phi);
      const along: number = dot(p.tangent, p.tangent);
      if (!(along > 0)) return null;

      // The host's direction square to the curve on the loop's outside: the chart's outward normal mapped, less its part along the curve.
      const outward: Vec3 = combine([
        [sense * p.rate[3], b.u],
        [-sense * p.rate[2], b.v],
      ]);
      const hostSide: Vec3 | null = unit(
        sub(outward, scale(p.tangent, dot(outward, p.tangent) / along)),
      );
      const nB: Vec3 | null = unit(cross(b.u, b.v));
      const nA: Vec3 | null = unit(cross(a.u, a.v));
      if (hostSide === null || nB === null || nA === null) return null;
      const square: Vec3 | null = unit(cross(nA, p.tangent));
      if (square === null) return null;

      // A fold arc: the side the normals name, as a traced join reads it. A smooth arc: the side on which the part runs on across the loop.
      const product: number =
        p.angle < input.grazing
          ? -dot(square, hostSide)
          : dot(square, nB) *
            face.orientation *
            (input.keep === "outside" ? 1 : -1);
      if (!(Math.abs(product) > 0)) return null;
      return { part: scale(square, product > 0 ? 1 : -1), host: hostSide };
    };

    // One kept side all round: neighbouring points' part directions turn with the loop, never against each other.
    let before: IAutoMovieSolidRail.IToward | null = toward(
      points[points.length - 1]!,
    );
    for (const p of points) {
      const here: IAutoMovieSolidRail.IToward | null = toward(p);
      if (here === null || before === null)
        return refuse(
          "one kept side",
          `no side can be read at clock ${p.t}: a direction square to the curve vanishes`,
        );
      if (!(dot(here.part, before.part) > 0))
        return refuse(
          "one kept side",
          `the part's kept side reverses before clock ${p.t} (product ${dot(here.part, before.part)}): the part passes under its host along an arc of the loop instead of rising from it`,
        );
      before = here;
    }
    const count: number = points.length;
    return {
      shared: {
        curve: {
          part: part.name,
          host: host.name,
          parameter: { kind: "arc" },
          points,
          winding: 0,
          partWinding,
          at: (t: number): IPoint | null => {
            const nearest: number = Math.round((t * count) / turn);
            const k: number = ((nearest % count) + count) % count;
            const base: IPoint = points[k]!;
            if ((turn * nearest) / count === t && nearest === k) return base;
            const read: { point: IPoint; gap: number } | string = evaluate(t, [
              base.s,
              base.phi + ((nearest - k) / count) * partWinding * period,
            ]);
            return typeof read === "string" ? null : read.point;
          },
        },
        toward,
        arc: (p: IPoint): "smooth" | "fold" =>
          p.angle < input.grazing ? "smooth" : "fold",
      },
      diagnostics: [],
    };
  }
}
