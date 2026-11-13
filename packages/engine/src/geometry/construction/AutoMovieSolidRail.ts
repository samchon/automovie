import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidRailSolve } from "./AutoMovieSolidRailSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type IJet = IAutoMovieSolidSurface.IJet;
const { combine, cross, dot, norm, unit }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * The two rails at one intersection point, where each surface is trimmed back on its kept side.
 *
 * A square offset uses the surface's first fundamental form G: for preimage tangent c'=(u',v'), e=G^-1(-v',u') satisfies c'^T G e=0, so S_*e is perpendicular in world space. The host uses this direction; the part does in square mode. Station mode instead follows the part's fixed-phase station line, s_A=s*+sigma*lambda, preserving its phase columns.
 *
 * A square offset is refined in the normal-section plane spanned by the original surface normal and S_*e, at world chord w from the curve point. A straight chart-line guess precedes Newton on plane/chord equations. With regular well-conditioned jets, the intended rail is geometric rather than a chart-distance offset.
 *
 * Merge keeps the part outside the host; diff keeps its cutter inside. The host remains outside the part. Offset signs come from the other surface's oriented normal, so a tangent or degenerate direction can return null. Local Newton convergence and multiple-face boundary placement are not globally certified.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the square offset, the normal section, the modes and the kept sides.
 * @evidence contracts/development/design.md#principled-representation Represents The two rails at one intersection point, where each surface is trimmed back on its kept side: companion namespace of 12 members (`IRail`, `Keep`, `Mode`, `STEPS`, `ROUNDING`, `SWITCHES`, ...); units and frames named in its text: world, newton, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidRail` in packages/engine/src/geometry/construction/AutoMovieSolidRail.ts; its surface is the 12 members listed and the text shows 13 other files naming it, mostly packages/engine (8), test (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidRail {
  /**
   * The two rail chart/world readings and offset directions at one traced point.
   *
   * @evidence contracts/development/design.md#principled-representation Links both trimmed endpoints to one contact point and its kept-side chart directions, with host-face identity after atlas traversal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A plain record exposes coordinates, positions and directions needed by ribbons and clipping without another surface model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not certify normal-section convergence or domain/kept-region membership; sigma uses a positive tie when a square direction's station component is zero.
   * @evidence contracts/development/common.md#meaningful-documentation Gives mm positions, chart coordinates, phase/mode meaning and where unit-world-speed directions are evaluated.
   */
  export interface IRail {
    /** The curve point the rails are read from. */
    curve: AutoMovieSolidIntersection.IPoint;

    /** The part's rail station. */
    s: number;

    /** The part's rail phase: the curve's own under the `station` mode. */
    phi: number;

    /** Sign of the part's kept side in its station, +1 or -1 (under the `square` mode, the sign of `partAcross`'s station part). */
    sigma: number;

    /** The part's offset direction in its chart, from the curve's preimage toward its rail, the chart vector of unit world speed at the preimage. */
    partAcross: [number, number];

    /** The part's rail point, mm. */
    partPoint: Vec3;

    /** The host face its rail lies on (`IAutoMovieSolidAtlas`); the curve's own face unless the offset crossed a trim. */
    hostFace: number;

    /** The host's rail chart point `[y, theta]` on that face. */
    host: [number, number];

    /** Original outward direction projected into the rail face's tangent plane, as a chart vector of unit world speed. */
    across: [number, number];

    /** The host's rail point, mm. */
    hostPoint: Vec3;
  }

  /**
   * Which side of the host the part keeps: merge outside, cutter diff inside.
   *
   * @evidence contracts/development/design.md#principled-representation The closed choice determines the part offset's sign against the host's outward normal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One literal union shares the same side convention across merge/diff and rail evaluation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Selects a side without inferring it from a fixture or a sampled mesh.
   * @evidence contracts/development/common.md#meaningful-documentation Names which solid's kept side changes and the merge/diff mapping.
   */
  export type Keep = "outside" | "inside";

  /**
   * Part-offset mode: fixed-phase station line or metric-square normal section.
   *
   * @evidence contracts/development/design.md#principled-representation Station mode preserves a phase column; square mode uses the inverse first fundamental form to define a transverse world direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed discriminator selects only the part strategy; the host keeps its metric-square strategy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed station width is accepted only in station mode, without silently converting it to a chord.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes chart-station and world-square offset semantics.
   */
  export type Mode = "station" | "square";

  /** Newton steps of one offset. */
  export const STEPS: number = 40;

  /** Relative residual a rail solve accepts, of the chord plus the curve point's distance from the origin: rounding grows with the coordinates, so a sub-millimetre chord far from the origin converges as a large one does. */
  export const ROUNDING: number = 1e-12;

  /** Faces one host rail may cross before it is refused. */
  export const SWITCHES: number = 4;

  /** Legacy crossing-resolution constant, retained for callers; atlas Newton no longer uses this bisection. */
  export const CROSSING_BISECTIONS: number = 40;

  /**
   * The rails at a curve point.
   *
   * @param part The attached part.
   * @param host The host as an atlas (`AutoMovieSolidIntersection.atlas` for one surface).
   * @param curve The curve point with its preimages and their rates.
   * @param keep Which side of the host the part keeps: `outside` for a merge, `inside` for a diff.
   * @param partWidth Positive chord, mm; or a fixed `{ station }` in station mode, required to lie on the kept side of this contact.
   * @param hostWidth Chord from the curve to the host's rail, mm, positive.
   * @param mode How the part's rail leaves the curve; absent, `station`.
   * @returns Rails, or null on the checked direction, solve or atlas-transition failures.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Orients kept-side directions from surface normals, solves chord offsets and square-mode normal sections, then maps host offsets across atlas faces under regular, representable chart arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One evaluator composes direction, scalar offset and two-equation section helpers while retaining explicit station/square part behavior.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Jets are admitted to actual owned domains before evaluation. Host boundary feet are only Newton initializers and a published rail must solve the unchanged plane/chord equations on a kept actual face; local branch convergence remains a premise.
   * @evidence contracts/development/common.md#meaningful-documentation Gives kept side, offset modes, chord/station units, nullable failures and the remaining multiple-hop/numerical validation limits.
   * @evidence contracts/development/implementation.md#efficient-algorithms Part offsets retain the bounded scalar/section solves; one host normal-section solve uses at most forty iterations, twenty trial halvings per iteration and four accepted chart changes. Surface/atlas callback costs are additional.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Initial jets supply normals, metric directions and the normal-section plane; this function owns no cache, while its join caller caches returned rails by parameter.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Iterates, jets and directions are call-local; only the fixed rail record/borrowed curve point escapes, with population retention delegated to its caller's cache.
   */
  export function at(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    curve: AutoMovieSolidIntersection.IPoint,
    keep: Keep,
    partWidth: number | { station: number },
    hostWidth: number,
    mode: Mode = "station",
  ): IRail | null {
    return explain(part, host, curve, keep, partWidth, hostWidth, mode).rail;
  }

  /**
   * The rails at a curve point with the reading of every premise the solve checks: the quantities it computed, in the order computed, and,
   * when it returns no rail, the premise that failed.
   *
   * @evidence contracts/development/design.md#principled-representation The rail and a nullable refusal partition success from the failed premise; quantities are the solve's own numbers keyed by what they measure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record reports what `at` already computes, so a join can name a refusal without a second solver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It changes no solve, threshold or result: `at` returns exactly its rail.
   * @evidence contracts/development/common.md#meaningful-documentation States the units of the recorded quantities: mm, chart units and dimensionless dot products.
   */
  export interface IExplanation {
    /** The rails, or null. */
    rail: IRail | null;

    /** The failed premise, or null with a rail. */
    refusal: string | null;

    /** The quantities read on the way, by name. */
    quantities: Record<string, number>;
  }

  /**
   * The rails at a curve point, as `at`, with the quantities read and the failed premise named.
   *
   * @param part The attached part.
   * @param host The host as an atlas.
   * @param curve The curve point.
   * @param keep Which side of the host the part keeps.
   * @param partWidth Positive chord, mm, or a fixed `{ station }` in station mode.
   * @param hostWidth Chord from the curve to the host's rail, mm.
   * @param mode How the part's rail leaves the curve.
   * @returns The explanation; `rail` is what `at` returns.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The single rail solve, its every early return naming the checked premise it failed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure `at` reads this one evaluator, so a reported refusal is the solve's own and not a reconstruction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Records the quantities without changing any of them, and adds no tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds a constant number of record writes to the solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same jets and directions feed the record and the rail.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record is call-local and returned; nothing is retained.
   */
  export function explain(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    curve: AutoMovieSolidIntersection.IPoint,
    keep: Keep,
    partWidth: number | { station: number },
    hostWidth: number,
    mode: Mode = "station",
  ): IExplanation {
    const quantities: Record<string, number> = {
      face: curve.face,
      s: curve.s,
      phi: curve.phi,
      y: curve.y,
      theta: curve.theta,
      hostWidth,
      ...(typeof partWidth === "number" ? { partWidth } : { partStation: partWidth.station }),
    };
    const refuse = (premise: string): IExplanation => ({ rail: null, refusal: premise, quantities });
    const a: IJet | null = AutoMovieSolidDomain.jet(part, curve.s, curve.phi);
    const surface: IAutoMovieSolidSurface = host.faces[curve.face]!;
    const b: IJet | null = AutoMovieSolidDomain.jet(
      surface,
      curve.y,
      curve.theta,
    );
    if (a === null) return refuse("the part has no jet at the curve point");
    if (b === null) return refuse("the host face has no jet at the curve point");
    const outA: Vec3 | null = unit(cross(a.u, a.v));
    const outB: Vec3 | null = unit(cross(b.u, b.v));
    if (outA === null) return refuse("the part's normal vanishes at the curve point");
    if (outB === null) return refuse("the host's normal vanishes at the curve point");
    quantities.normals = dot(outA, outB);
    const nA: Vec3 = [
      outA[0] * part.orientation,
      outA[1] * part.orientation,
      outA[2] * part.orientation,
    ];
    const nB: Vec3 = [
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
      const facing: number = dot(a.u, nB);
      quantities.facing = facing;
      quantities.stationSpeed = norm(a.u);
      if (!(Math.abs(facing) > 0)) return refuse("the part's station line is parallel to the host (facing 0)");
      const side: number = facing > 0 === (keep === "outside") ? 1 : -1;
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
        if (lambda === null) return refuse("the part's chord along its station line found no solution");
        quantities.lambda = lambda;
        s = curve.s + side * lambda;
      } else {
        if (!(side * (partWidth.station - curve.s) > 0)) return refuse(`the part's rail station ${partWidth.station} does not lie on its kept side (side ${side}) of the curve point's station ${curve.s}`);
        s = partWidth.station;
      }
    } else {
      if (typeof partWidth !== "number") return refuse("a fixed part station needs the station mode");
      const e: [number, number] | null = square(
        a,
        [curve.rate[0], curve.rate[1]],
        nB,
        keep === "outside" ? 1 : -1,
        quantities,
        "part",
      );
      if (e === null) return refuse("the part's square direction failed (metric solve, vanishing speed or no side toward the host's normal)");
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
      if (lambda === null) return refuse("the part's chord along its square direction found no solution");
      quantities.lambda = lambda;
      const refined: [number, number] | null = section(
        part,
        [curve.s + lambda * e[0], curve.phi + lambda * e[1]],
        curve.point,
        plane(a, e),
        partWidth,
      );
      if (refined === null) return refuse("the part's normal-section refinement did not converge");
      s = refined[0];
      phi = refined[1];
    }
    quantities.partS = s;
    quantities.partPhi = phi;

    // The host's direction square to the preimage, turned toward the
    // outside of the part.
    quantities.hostRateY = curve.rate[2];
    quantities.hostRateTheta = curve.rate[3];
    quantities.hostToward = dot(cross(b.u, b.v), nA) / (norm(cross(b.u, b.v)) || 1);
    const across: [number, number] | null = square(
      b,
      [curve.rate[2], curve.rate[3]],
      nA,
      1,
      quantities,
      "host",
    );
    if (across === null) return refuse("the host's square direction failed (metric solve, vanishing speed or no side toward the part's normal)");
    quantities.acrossY = across[0];
    quantities.acrossTheta = across[1];
    const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
    // The initial chart displacement selects a local branch; every equation
    // is subsequently read on its actual retained face, including neighbours.
    const settled: ReturnType<typeof AutoMovieSolidRailSolve.atlas> =
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
    for (const [key, value] of Object.entries(report.numbers)) quantities["atlas." + key] = value;
    if (settled === null) {
      return refuse("the host's normal-section solve across the atlas: " + report.reason);
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

  /** Unit normal of the plane spanned by the preimage jet j's surface normal and the world image of square chart direction e; failed normalization returns [0,0,0]. */
  function plane(j: IJet, e: readonly [number, number]): Vec3 {
    const d: Vec3 = combine([
      [e[0], j.u],
      [e[1], j.v],
    ]);
    return unit(cross(cross(j.u, j.v), d)) ?? [0, 0, 0];
  }

  /** From a nearby chart start, solve (S-from).m=0 and |S-from|²=width² with world point from and positive chord width in mm and unit plane normal m; return a chart pair or null on failed Newton/degenerate direction. An accepted residual still takes one final unchecked update. */
  function section(
    surface: IAutoMovieSolidSurface,
    start: readonly [number, number],
    from: Readonly<Vec3>,
    m: Readonly<Vec3>,
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

  /** From surface jet j and preimage chart tangent (u',v'), return the inverse-metric square chart direction at unit world speed, signed along world direction toward for side=1 and against it for -1; return null for a failed metric solve, vanishing speed or zero sidedness. */
  function square(
    j: IJet,
    tangent: readonly [number, number],
    toward: Readonly<Vec3>,
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

  /** Solve chart distance l along the jet callback along(l) and chart direction d at positive world chord width from world point from, both in mm. The initial remaining-chord guess is start or width, divided by world speed; failed/invalid offsets return null, and an accepted residual takes one final unchecked Newton update. */
  function offset(
    along: (l: number) => IJet | null,
    d: readonly [number, number],
    from: Readonly<Vec3>,
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
