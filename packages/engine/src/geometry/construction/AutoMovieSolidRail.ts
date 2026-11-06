import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type IJet = IAutoMovieSolidSurface.IJet;
const { combine, cross, dot, norm, sub, unit } = AutoMovieSolidVector;

/**
 * The two rails at one intersection point, where each surface is trimmed back on its kept side.
 *
 * A square offset uses the surface's first fundamental form G: for preimage tangent c'=(u',v'), e=G^-1(-v',u') satisfies c'^T G e=0, so S_*e is perpendicular in world space. The host uses this direction; the part does in square mode. Station mode instead follows the part's fixed-phase station line, s_A=s*+sigma*lambda, preserving its phase columns.
 *
 * A square offset is refined in the normal-section plane spanned by the original surface normal and S_*e, at world chord w from the curve point. A straight chart-line guess precedes Newton on plane/chord equations. With regular well-conditioned jets, the intended rail is geometric rather than a chart-distance offset.
 *
 * Merge keeps the part outside the host; diff keeps its cutter inside. The host remains outside the part. Offset signs come from the other surface's oriented normal, so a tangent or degenerate direction can return null. Local Newton convergence and multiple-face boundary placement are not globally certified.
 *
 * @evidence contracts/common.md#principled-implementation A rail point is where the surface meets the normal section through the curve point at the declared chord, so a width reads in millimetres of skin whatever the chart.
 * @evidence contracts/common.md#clear-and-simple-design One rail record and one evaluator select the kept side and part-offset mode, with local direction/chord/section helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Where the directions are tangent to the other surface no rail exists and null returns.
 * @evidence contracts/common.md#meaningful-documentation States the square offset, the normal section, the modes and the kept sides.
 * @evidence contracts/performance.md#efficient-algorithms First-order starts feed bounded 40-step offset/section solves and bounded face/bisection attempts; each atlas query's own cost remains part of the operation.
 * @evidence contracts/performance.md#reuse-equivalent-work The square direction's jet seeds both the offset and the section solve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one record per point and retains nothing.
 */
export namespace AutoMovieSolidRail {
  /**
   * The two rail chart/world readings and offset directions at one traced point.
   *
   * @evidence contracts/common.md#principled-implementation Links both trimmed endpoints to one contact point and its kept-side chart directions, with host-face identity after atlas traversal.
   * @evidence contracts/common.md#clear-and-simple-design A plain record exposes coordinates, positions and directions needed by ribbons and clipping without another surface model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not certify normal-section convergence or domain/kept-region membership; sigma uses a positive tie when a square direction's station component is zero.
   * @evidence contracts/common.md#meaningful-documentation Gives mm positions, chart coordinates, phase/mode meaning and where unit-world-speed directions are evaluated.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record executes no offset or face search.
   * @evidence contracts/performance.md#reuse-equivalent-work Ribbons and clipping can share the same computed chart/world readings; this record owns no cache policy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A retaining caller owns fixed-size rail fields and a borrowed curve point; a join's separate per-parameter Map controls how many such records remain live.
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

    /** The host's offset direction in its rail face's chart, toward and past the rail, the chart vector of unit world speed (at the preimage, or at the last crossing). */
    across: [number, number];

    /** The host's rail point, mm. */
    hostPoint: Vec3;
  }

  /**
   * Which side of the host the part keeps: merge outside, cutter diff inside.
   *
   * @evidence contracts/common.md#principled-implementation The closed choice determines the part offset's sign against the host's outward normal.
   * @evidence contracts/common.md#clear-and-simple-design One literal union shares the same side convention across merge/diff and rail evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Selects a side without inferring it from a fixture or a sampled mesh.
   * @evidence contracts/common.md#meaningful-documentation Names which solid's kept side changes and the merge/diff mapping.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This mode type executes no geometry algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A literal side choice coordinates no repeated work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The string value acquires no retained collection or resource.
   */
  export type Keep = "outside" | "inside";

  /**
   * Part-offset mode: fixed-phase station line or metric-square normal section.
   *
   * @evidence contracts/common.md#principled-implementation Station mode preserves a phase column; square mode uses the inverse first fundamental form to define a transverse world direction.
   * @evidence contracts/common.md#clear-and-simple-design A closed discriminator selects only the part strategy; the host keeps its metric-square strategy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A fixed station width is accepted only in station mode, without silently converting it to a chord.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes chart-station and world-square offset semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type itself runs no offset solve.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mode selection owns no reusable surface preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mode value owns no handle, task or growing state.
   */
  export type Mode = "station" | "square";

  /** Newton steps of one offset. */
  export const STEPS: number = 40;

  /** Relative residual a rail solve accepts, of the chord plus the curve point's distance from the origin: rounding grows with the coordinates, so a sub-millimetre chord far from the origin converges as a large one does. */
  export const ROUNDING: number = 1e-12;

  /** Faces one host rail may cross before it is refused. */
  export const SWITCHES: number = 4;

  /** Halvings that place an offset's crossing of a trim, to `2^-40` of the offset. */
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
   * @evidence contracts/common.md#principled-implementation Orients kept-side directions from surface normals, solves chord offsets and square-mode normal sections, then maps host offsets across atlas faces under regular, representable chart arithmetic.
   * @evidence contracts/common.md#clear-and-simple-design One evaluator composes direction, scalar offset and two-equation section helpers while retaining explicit station/square part behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null records checked failures, but later host-switch iterations currently bracket from hostChart to itself; general multiple-hop boundary placement is therefore unresolved. Final extra Newton updates and domain membership are not independently certified here.
   * @evidence contracts/common.md#meaningful-documentation Gives kept side, offset modes, chord/station units, nullable failures and the remaining multiple-hop/numerical validation limits.
   * @evidence contracts/performance.md#efficient-algorithms Uses fixed 40-step local solves, up to four main host-switch iterations and forty crossing bisections per switch, plus one final neighbour refinement; surface/atlas callback costs are additional.
   * @evidence contracts/performance.md#reuse-equivalent-work Initial jets supply normals, metric directions and the normal-section plane; this function owns no cache, while its join caller caches returned rails by parameter.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Iterates, jets and directions are call-local; only the fixed rail record/borrowed curve point escapes, with population retention delegated to its caller's cache.
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
    const a: IJet = part.jet(curve.s, curve.phi);
    const surface: IAutoMovieSolidSurface = host.faces[curve.face]!;
    const b: IJet = surface.jet(curve.y, curve.theta);
    const outA: Vec3 | null = unit(cross(a.u, a.v));
    const outB: Vec3 | null = unit(cross(b.u, b.v));
    if (outA === null || outB === null) return null;
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
      if (!(Math.abs(facing) > 0)) return null;
      const side: number = facing > 0 === (keep === "outside") ? 1 : -1;
      sigma = side;
      partAcross = [side / norm(a.u), 0];
      if (typeof partWidth === "number") {
        const lambda: number | null = offset(
          (l: number): IJet => part.jet(curve.s + side * l, curve.phi),
          [side, 0],
          curve.point,
          partWidth,
        );
        if (lambda === null) return null;
        s = curve.s + side * lambda;
      } else {
        if (!(side * (partWidth.station - curve.s) > 0)) return null;
        s = partWidth.station;
      }
    } else {
      if (typeof partWidth !== "number") return null;
      const e: [number, number] | null = square(
        a,
        [curve.rate[0], curve.rate[1]],
        nB,
        keep === "outside" ? 1 : -1,
      );
      if (e === null) return null;
      partAcross = e;
      sigma = e[0] >= 0 ? 1 : -1;
      const lambda: number | null = offset(
        (l: number): IJet => part.jet(curve.s + l * e[0], curve.phi + l * e[1]),
        e,
        curve.point,
        partWidth,
      );
      if (lambda === null) return null;
      const refined: [number, number] | null = section(
        part,
        [curve.s + lambda * e[0], curve.phi + lambda * e[1]],
        curve.point,
        plane(a, e),
        partWidth,
      );
      if (refined === null) return null;
      s = refined[0];
      phi = refined[1];
    }

    // The host's direction square to the preimage, turned toward the
    // outside of the part.
    const across: [number, number] | null = square(
      b,
      [curve.rate[2], curve.rate[3]],
      nA,
      1,
    );
    if (across === null) return null;
    const mu: number | null = offset(
      (l: number): IJet =>
        surface.jet(curve.y + l * across[0], curve.theta + l * across[1]),
      across,
      curve.point,
      hostWidth,
    );
    if (mu === null) return null;
    let face: number = curve.face;
    let hostChart: [number, number] = [
      curve.y + mu * across[0],
      curve.theta + mu * across[1],
    ];
    let direction: [number, number] = across;

    // An offset that leaves its face continues on the neighbour from the
    // crossing, along the same world direction in the neighbour's chart.
    for (
      let k: number = 0;
      k < SWITCHES && !host.kept(face, hostChart[0], hostChart[1]);
      k++
    ) {
      const from: [number, number] =
        k === 0 ? [curve.y, curve.theta] : hostChart;
      const inside: (l: number) => boolean = (l: number): boolean =>
        host.kept(
          face,
          from[0] + l * (hostChart[0] - from[0]),
          from[1] + l * (hostChart[1] - from[1]),
        );
      let lo: number = 0;
      let hi: number = 1;
      for (let i: number = 0; i < CROSSING_BISECTIONS; i++) {
        const m: number = (lo + hi) / 2;
        if (inside(m)) lo = m;
        else hi = m;
      }
      const at: [number, number] = [
        from[0] + hi * (hostChart[0] - from[0]),
        from[1] + hi * (hostChart[1] - from[1]),
      ];
      const here: IJet = host.faces[face]!.jet(at[0], at[1]);
      const world: Vec3 = combine([
        [direction[0], here.u],
        [direction[1], here.v],
      ]);
      const next: { face: number; u: number; v: number } | null = host.across(
        face,
        at[0],
        at[1],
      );
      if (next === null) return null;
      const there: IJet = host.faces[next.face]!.jet(next.u, next.v);
      const e: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(there.u, there.u),
        dot(there.u, there.v),
        dot(there.u, there.v),
        dot(there.v, there.v),
        [dot(there.u, world), dot(there.v, world)],
      );
      if (e === null) return null;
      const speed: number = norm(
        combine([
          [e[0], there.u],
          [e[1], there.v],
        ]),
      );
      if (!(speed > 0)) return null;
      face = next.face;
      direction = [e[0] / speed, e[1] / speed];
      const onward: IAutoMovieSolidSurface = host.faces[face]!;
      const start: [number, number] = [next.u, next.v];
      const nu: number | null = offset(
        (l: number): IJet =>
          onward.jet(start[0] + l * direction[0], start[1] + l * direction[1]),
        direction,
        curve.point,
        hostWidth,
        Math.max(0, hostWidth - norm(sub(there.p, curve.point))),
      );
      if (nu === null) return null;
      hostChart = [start[0] + nu * direction[0], start[1] + nu * direction[1]];
    }

    // The rail in the normal section through the curve point: the plane of
    // the host's normal and its square direction at the preimage.
    const settled: [number, number] | null = section(
      host.faces[face]!,
      hostChart,
      curve.point,
      plane(b, across),
      hostWidth,
    );
    if (settled === null) return null;
    hostChart = settled;
    // A rail that the normal section settles a hair across a face's boundary
    // (a rail point at the crossing itself, as the clip's bisection asks for)
    // belongs to the neighbour: map it across and settle it there.
    if (!host.kept(face, hostChart[0], hostChart[1])) {
      const here: IJet = host.faces[face]!.jet(hostChart[0], hostChart[1]);
      const world: Vec3 = combine([
        [direction[0], here.u],
        [direction[1], here.v],
      ]);
      const next: { face: number; u: number; v: number } | null = host.across(
        face,
        hostChart[0],
        hostChart[1],
      );
      if (next === null) return null;
      const again: [number, number] | null = section(
        host.faces[next.face]!,
        [next.u, next.v],
        curve.point,
        plane(b, across),
        hostWidth,
      );
      if (again === null || !host.kept(next.face, again[0], again[1]))
        return null;
      const there: IJet = host.faces[next.face]!.jet(again[0], again[1]);
      const e: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(there.u, there.u),
        dot(there.u, there.v),
        dot(there.u, there.v),
        dot(there.v, there.v),
        [dot(there.u, world), dot(there.v, world)],
      );
      if (e === null) return null;
      const speed: number = norm(
        combine([
          [e[0], there.u],
          [e[1], there.v],
        ]),
      );
      if (!(speed > 0)) return null;
      face = next.face;
      hostChart = again;
      direction = [e[0] / speed, e[1] / speed];
    }

    return {
      curve,
      s,
      phi,
      sigma,
      partAcross,
      partPoint: part.jet(s, phi).p,
      hostFace: face,
      host: hostChart,
      across: direction,
      hostPoint: host.faces[face]!.jet(hostChart[0], hostChart[1]).p,
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
    if (!(norm(m) > 0)) return null;
    // Rounding grows with the coordinates, not with the chord: a sub-millimetre
    // chord far from the origin still converges to the coordinates' precision.
    const scale: number = width + norm(from);
    let x: [number, number] = [start[0], start[1]];
    for (let step: number = 0; step < STEPS; step++) {
      const j: IJet = surface.jet(x[0], x[1]);
      const r: Vec3 = sub(j.p, from);
      const f1: number = dot(r, m);
      const f2: number = dot(r, r) - width * width;
      const done: boolean =
        Math.abs(f1) <= ROUNDING * scale &&
        Math.abs(f2) <= 2 * width * ROUNDING * scale;
      const dx: [number, number] | null = AutoMovieSolidVector.solve2(
        dot(j.u, m),
        dot(j.v, m),
        2 * dot(r, j.u),
        2 * dot(r, j.v),
        [-f1, -f2],
      );
      if (dx === null) return null;
      x = [x[0] + dx[0], x[1] + dx[1]];
      if (done) return x;
    }
    return null;
  }

  /** From surface jet j and preimage chart tangent (u',v'), return the inverse-metric square chart direction at unit world speed, signed along world direction toward for side=1 and against it for -1; return null for a failed metric solve, vanishing speed or zero sidedness. */
  function square(
    j: IJet,
    tangent: readonly [number, number],
    toward: Readonly<Vec3>,
    side: number,
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
    if (!(Math.abs(out) > 0)) return null;
    const turn: number = ((out > 0 ? 1 : -1) * side) / speed;
    return [e[0] * turn, e[1] * turn];
  }

  /** Solve chart distance l along the jet callback along(l) and chart direction d at positive world chord width from world point from, both in mm. The initial remaining-chord guess is start or width, divided by world speed; failed/invalid offsets return null, and an accepted residual takes one final unchecked Newton update. */
  function offset(
    along: (l: number) => IJet,
    d: readonly [number, number],
    from: Readonly<Vec3>,
    width: number,
    start?: number,
  ): number | null {
    if (!(width > 0)) return null;
    const j0: IJet = along(0);
    const speed: number = norm(
      combine([
        [d[0], j0.u],
        [d[1], j0.v],
      ]),
    );
    if (!(speed > 0)) return null;
    let l: number = (start ?? width) / speed;
    for (let step: number = 0; step < STEPS; step++) {
      const j: IJet = along(l);
      const r: Vec3 = sub(j.p, from);
      const chord: number = norm(r);
      const miss: number = chord - width;
      const rate: number =
        dot(
          r,
          combine([
            [d[0], j.u],
            [d[1], j.v],
          ]),
        ) / chord;
      if (!(rate > 0)) return null;

      // Converged: one last step takes the miss from the tolerance to
      // rounding, so neighbouring rail points carry no solver noise.
      const converged: boolean =
        Math.abs(miss) <= ROUNDING * (width + norm(from));
      l -= miss / rate;
      if (converged) return l;
    }
    return null;
  }
}
