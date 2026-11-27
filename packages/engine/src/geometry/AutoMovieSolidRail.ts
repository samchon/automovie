import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidRail,
  IAutoMovieSolidRailSolveAtlasSection,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidRailSolve } from "./AutoMovieSolidRailSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

const { combine, cross, dot, norm, unit }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;
/**
 * The two rails at one intersection point, where each surface is trimmed back
 * on its kept side.
 *
 * A square offset uses the surface's first fundamental form G: for preimage
 * tangent c'=(u',v'), e=G^-1(-v',u') satisfies c'^T G e=0, so S__e is
 * perpendicular in world space. The host uses this direction; the part does in
 * square mode. Station mode instead follows the part's fixed-phase station
 * line, s_A=s_+sigma*lambda, preserving its phase columns.
 *
 * A square offset is refined in the normal-section plane spanned by the
 * original surface normal and S_*e, at world chord w from the curve point. A
 * straight chart-line guess precedes Newton on plane/chord equations. With
 * regular well-conditioned jets, the intended rail is geometric rather than a
 * chart-distance offset.
 *
 * Merge keeps the part outside the host; diff keeps its cutter inside. The host
 * remains outside the part. Offset signs come from the other surface's oriented
 * normal, so a tangent or degenerate direction can return null. Local Newton
 * convergence and multiple-face boundary placement are not globally certified.
 */
export namespace AutoMovieSolidRail {
  /** Newton steps of one offset. */
  export const STEPS: number = 40;

  /**
   * Relative residual a rail solve accepts, of the chord plus the curve point's
   * distance from the origin: rounding grows with the coordinates, so a
   * sub-millimetre chord far from the origin converges as a large one does.
   */
  export const ROUNDING: number = 1e-12;

  /** Faces one host rail may cross before it is refused. */
  export const SWITCHES: number = 4;

  /**
   * Legacy crossing-resolution constant, retained for callers; atlas Newton no
   * longer uses this bisection.
   */
  export const CROSSING_BISECTIONS: number = 40;

  /**
   * The rails at a curve point.
   *
   * @param part The attached part.
   * @param host The host as an atlas (`AutoMovieSolidIntersection.atlas` for
   *   one surface).
   * @param curve The curve point with its preimages and their rates.
   * @param keep Which side of the host the part keeps: `outside` for a merge,
   *   `inside` for a diff.
   * @param partWidth Positive chord, mm; or a fixed `{ station }` in station
   *   mode, required to lie on the kept side of this contact.
   * @param hostWidth Chord from the curve to the host's rail, mm, positive.
   * @param mode How the part's rail leaves the curve; absent, `station`.
   * @param toward The rails' sides from a declared loop
   *   (`IAutoMovieSolidRail.IToward`); absent, from the two surfaces' normals
   *   and `keep`.
   * @returns Rails, or null on the checked direction, solve or atlas-transition
   *   failures.
   */
  export function at(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    curve: IAutoMovieSolidIntersection.IPoint,
    keep: IAutoMovieSolidRail.Keep,
    partWidth: IAutoMovieSolidRail.IAtPartWidth,
    hostWidth: number,
    mode: IAutoMovieSolidRail.Mode = "station",
    toward?: IAutoMovieSolidRail.IToward,
  ): IAutoMovieSolidRail.IRail | null {
    return explain(part, host, curve, keep, partWidth, hostWidth, mode, toward)
      .rail;
  }

  /**
   * The rails at a curve point, as `at`, with the quantities read and the
   * failed premise named.
   *
   * @param part The attached part.
   * @param host The host as an atlas.
   * @param curve The curve point.
   * @param keep Which side of the host the part keeps.
   * @param partWidth Positive chord, mm, or a fixed `{ station }` in station
   *   mode.
   * @param hostWidth Chord from the curve to the host's rail, mm.
   * @param mode How the part's rail leaves the curve.
   * @param toward The rails' sides from a declared loop; absent, from the
   *   normals and `keep`.
   * @returns The explanation; `rail` is what `at` returns.
   */
  export function explain(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    curve: IAutoMovieSolidIntersection.IPoint,
    keep: IAutoMovieSolidRail.Keep,
    partWidth: IAutoMovieSolidRail.IAtPartWidth,
    hostWidth: number,
    mode: IAutoMovieSolidRail.Mode = "station",
    toward?: IAutoMovieSolidRail.IToward,
  ): IAutoMovieSolidRail.IExplanation {
    const quantities: Record<string, number> = {
      face: curve.face,
      s: curve.s,
      phi: curve.phi,
      y: curve.y,
      theta: curve.theta,
      hostWidth,
      ...(typeof partWidth === "number"
        ? { partWidth }
        : { partStation: partWidth.station }),
    };
    const refuse = (premise: string): IAutoMovieSolidRail.IExplanation => ({
      rail: null,
      refusal: premise,
      quantities,
    });
    const a: IJet | null = AutoMovieSolidDomain.jet(part, curve.s, curve.phi);
    const surface: IAutoMovieSolidSurface = host.faces[curve.face]!;
    const b: IJet | null = AutoMovieSolidDomain.jet(
      surface,
      curve.y,
      curve.theta,
    );
    if (a === null) return refuse("the part has no jet at the curve point");
    if (b === null)
      return refuse("the host face has no jet at the curve point");
    const outA: AutoMovieVector3Tuple | null = unit(cross(a.u, a.v));
    const outB: AutoMovieVector3Tuple | null = unit(cross(b.u, b.v));
    if (outA === null)
      return refuse("the part's normal vanishes at the curve point");
    if (outB === null)
      return refuse("the host's normal vanishes at the curve point");
    quantities.normals = dot(outA, outB);
    const nA: AutoMovieVector3Tuple = [
      outA[0] * part.orientation,
      outA[1] * part.orientation,
      outA[2] * part.orientation,
    ];
    const nB: AutoMovieVector3Tuple = [
      outB[0] * surface.orientation,
      outB[1] * surface.orientation,
      outB[2] * surface.orientation,
    ];

    // The part's kept side: along its station, or square to the curve.
    let s: number;
    let phi: number = curve.phi;
    let partAcross: [number, number];
    let sigma: number;
    if (mode === "station") {
      // A declared loop names the kept direction itself; the normals name it through the kept side.
      const facing: number = dot(a.u, toward === undefined ? nB : toward.part);
      quantities.facing = facing;
      quantities.stationSpeed = norm(a.u);
      if (!(Math.abs(facing) > 0))
        return refuse(
          "the part's station line is parallel to the host (facing 0)",
        );
      const side: number =
        facing > 0 === (toward !== undefined || keep === "outside") ? 1 : -1;
      quantities.side = side;
      sigma = side;
      partAcross = [side / norm(a.u), 0];
      if (typeof partWidth === "number") {
        const lambda: number | null = offset(
          (l: number): IJet | null =>
            AutoMovieSolidDomain.jet(part, curve.s + side * l, curve.phi),
          [side, 0],
          curve.point,
          partWidth,
        );
        if (lambda === null)
          return refuse(
            "the part's chord along its station line found no solution",
          );
        quantities.lambda = lambda;
        s = curve.s + side * lambda;
      } else {
        if (!(side * (partWidth.station - curve.s) > 0))
          return refuse(
            `the part's rail station ${partWidth.station} does not lie on its kept side (side ${side}) of the curve point's station ${curve.s}`,
          );
        s = partWidth.station;
      }
    } else {
      if (typeof partWidth !== "number")
        return refuse("a fixed part station needs the station mode");
      const e: [number, number] | null = square(
        a,
        [curve.rate[0], curve.rate[1]],
        toward === undefined ? nB : toward.part,
        toward !== undefined || keep === "outside" ? 1 : -1,
        quantities,
        "part",
      );
      if (e === null)
        return refuse(
          "the part's square direction failed (metric solve, vanishing speed or no side toward the host's normal)",
        );
      quantities.partSquareS = e[0];
      quantities.partSquarePhi = e[1];
      partAcross = e;
      sigma = e[0] >= 0 ? 1 : -1;
      const lambda: number | null = offset(
        (l: number): IJet | null =>
          AutoMovieSolidDomain.jet(
            part,
            curve.s + l * e[0],
            curve.phi + l * e[1],
          ),
        e,
        curve.point,
        partWidth,
      );
      if (lambda === null)
        return refuse(
          "the part's chord along its square direction found no solution",
        );
      quantities.lambda = lambda;
      const refined: [number, number] | null = section(
        part,
        [curve.s + lambda * e[0], curve.phi + lambda * e[1]],
        curve.point,
        plane(a, e),
        partWidth,
      );
      if (refined === null)
        return refuse("the part's normal-section refinement did not converge");
      s = refined[0];
      phi = refined[1];
    }
    quantities.partS = s;
    quantities.partPhi = phi;

    // The host's direction square to the preimage, turned toward the
    // outside of the part.
    quantities.hostRateY = curve.rate[2];
    quantities.hostRateTheta = curve.rate[3];
    quantities.hostToward =
      dot(cross(b.u, b.v), nA) / (norm(cross(b.u, b.v)) || 1);
    const across: [number, number] | null = square(
      b,
      [curve.rate[2], curve.rate[3]],
      toward === undefined ? nA : toward.host,
      1,
      quantities,
      "host",
    );
    if (across === null)
      return refuse(
        "the host's square direction failed (metric solve, vanishing speed or no side toward the part's normal)",
      );
    quantities.acrossY = across[0];
    quantities.acrossTheta = across[1];
    const report: { reason: string; numbers: Record<string, number> } = {
      reason: "",
      numbers: {},
    };
    // The initial chart displacement selects a local branch; every equation
    // is subsequently read on its actual retained face, including neighbours.
    const settled: IAutoMovieSolidRailSolveAtlasSection | null =
      AutoMovieSolidRailSolve.atlas(
        host,
        curve.face,
        [curve.y + hostWidth * across[0], curve.theta + hostWidth * across[1]],
        curve.point,
        plane(b, across),
        combine([
          [across[0], b.u],
          [across[1], b.v],
        ]),
        hostWidth,
        STEPS,
        ROUNDING,
        SWITCHES,
        report,
      );
    for (const [key, value] of Object.entries(report.numbers))
      quantities["atlas." + key] = value;
    if (settled === null) {
      return refuse(
        "the host's normal-section solve across the atlas: " + report.reason,
      );
    }
    const face: number = settled.face;
    const hostChart: [number, number] = settled.chart;
    const direction: [number, number] = settled.direction;
    quantities.hostFace = face;
    quantities.hostY = hostChart[0];
    quantities.hostTheta = hostChart[1];
    const partJet: IJet | null = AutoMovieSolidDomain.jet(part, s, phi);
    const hostJet: IJet | null = AutoMovieSolidDomain.jet(
      host.faces[face]!,
      hostChart[0],
      hostChart[1],
    );
    if (partJet === null) return refuse("the part has no jet at its rail");
    if (hostJet === null) return refuse("the host face has no jet at its rail");
    return {
      rail: {
        curve,
        s,
        phi,
        sigma,
        partAcross,
        partPoint: partJet.p,
        hostFace: face,
        host: hostChart,
        across: direction,
        hostPoint: hostJet.p,
      },
      refusal: null,
      quantities,
    };
  }

  /**
   * Unit normal of the plane spanned by the preimage jet j's surface normal and
   * the world image of square chart direction e; failed normalization returns
   * [0,0,0].
   */
  function plane(j: IJet, e: readonly [number, number]): AutoMovieVector3Tuple {
    const d: AutoMovieVector3Tuple = combine([
      [e[0], j.u],
      [e[1], j.v],
    ]);
    return unit(cross(cross(j.u, j.v), d)) ?? [0, 0, 0];
  }

  /**
   * From a nearby chart start, solve (S-from).m=0 and |S-from|²=width² with
   * world point from and positive chord width in mm and unit plane normal m;
   * return a chart pair or null on failed Newton/degenerate direction. An
   * accepted residual still takes one final unchecked update.
   */
  function section(
    surface: IAutoMovieSolidSurface,
    start: readonly [number, number],
    from: Readonly<AutoMovieVector3Tuple>,
    m: Readonly<AutoMovieVector3Tuple>,
    width: number,
  ): [number, number] | null {
    return AutoMovieSolidRailSolve.section(
      surface,
      start,
      from,
      m,
      width,
      STEPS,
      ROUNDING,
    );
  }

  /**
   * From surface jet j and preimage chart tangent (u',v'), return the
   * inverse-metric square chart direction at unit world speed, signed along
   * world direction toward for side=1 and against it for -1; return null for a
   * failed metric solve, vanishing speed or zero sidedness.
   */
  function square(
    j: IJet,
    tangent: readonly [number, number],
    toward: Readonly<AutoMovieVector3Tuple>,
    side: number,
    note?: Record<string, number>,
    key: string = "",
  ): [number, number] | null {
    const E: number = dot(j.u, j.u);
    const F: number = dot(j.u, j.v);
    const G: number = dot(j.v, j.v);
    const e: [number, number] | null = AutoMovieSolidVector.solve2(E, F, F, G, [
      -tangent[1],
      tangent[0],
    ]);
    if (e === null) return null;
    const speed: number = Math.sqrt(
      E * e[0] * e[0] + 2 * F * e[0] * e[1] + G * e[1] * e[1],
    );
    if (!(speed > 0)) return null;
    const out: number = dot(
      combine([
        [e[0], j.u],
        [e[1], j.v],
      ]),
      toward,
    );
    if (note !== undefined) {
      note[key + "Out"] = out / speed;
      note[key + "Speed"] = speed;
    }
    if (!(Math.abs(out) > 0)) return null;
    const turn: number = ((out > 0 ? 1 : -1) * side) / speed;
    return [e[0] * turn, e[1] * turn];
  }

  /**
   * Solve chart distance l along the jet callback along(l) and chart direction
   * d at positive world chord width from world point from, both in mm. The
   * initial remaining-chord guess is start or width, divided by world speed;
   * failed/invalid offsets return null, and an accepted residual takes one
   * final unchecked Newton update.
   */
  function offset(
    along: (l: number) => IJet | null,
    d: readonly [number, number],
    from: Readonly<AutoMovieVector3Tuple>,
    width: number,
    start?: number,
  ): number | null {
    return AutoMovieSolidRailSolve.offset(
      along,
      d,
      from,
      width,
      STEPS,
      ROUNDING,
      start,
    );
  }
}

type IJet = IAutoMovieSolidSurface.IJet;
