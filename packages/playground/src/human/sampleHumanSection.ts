import { AutoMovieHumanLoftChain } from "../../../human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftFrame } from "../../../human/src/lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanLoftJet } from "../../../human/src/lofting/AutoMovieHumanLoftJet";
import { AutoMovieHumanSplineCurve } from "../../../human/src/lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../../../human/src/lofting/IAutoMovieHumanLoftChain";

/**
 * Sample the skin's section of a chain at one station in that station's plane, with exact normals and curvature.
 *
 * The points are the skin ring `AutoMovieHumanLoftChain.ring` gives, its lift
 * and reliefs included, in the section frame's coordinates (`local`): x along
 * the frame's `u`, z along its `v`. The comb's derivatives are exact: a chain
 * carrying jets (every composed module chain) takes `r_t` and `r_tt` of
 * `AutoMovieHumanLoftJet.at`, reliefs included, projected on `u` and `v`; a
 * chain without jets (the world-height chains, which hold no reliefs) takes
 * its section's own analytic derivatives in the plane, the periodic cubic
 * B-spline's jet or the Fourier series' term-wise derivatives. The signed
 * curvature is `k = (x' z'' - z' x'') / |r'|^3` at 720 phases.
 *
 * @param chain Chain to sample.
 * @param s Station inside the chain.
 * @returns The points with unit right normals and curvature, the chain's own vertex phases' points, the ring perimeter and curvature statistics.
 *
 * @evidence contracts/common.md#principled-implementation Points come from the generator's ring and frame, derivatives from its exact jet or the section basis's analytic derivatives; no difference quotient is taken.
 * @evidence contracts/common.md#clear-and-simple-design One sampler serves the curve diagram's section plots; drawing stays in drawHumanCurveDiagram.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A chain without jets is sampled by its own exact section derivatives, never by a fallback difference; stations outside the chain are refused by the caller's expansion.
 * @evidence contracts/common.md#meaningful-documentation States the point source, the frame, both derivative sources and the curvature formula.
 * @evidence contracts/performance.md#efficient-algorithms 720 jets or section evaluations plus one ring of 720 and of the chain's samples, and a 512-point perimeter ring.
 * @evidence contracts/performance.md#reuse-equivalent-work The coefficients and frame at the station are computed once for every phase.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns plain arrays owned by the caller; retains nothing.
 */
export function sampleHumanSection(
  chain: IAutoMovieHumanLoftChain,
  s: number,
): sampleHumanSection.ISection {
  const frame: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
    chain,
    s,
  );
  const phases: number[] = Array.from(
    { length: 720 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 720,
  );
  const ring: [number, number][] = AutoMovieHumanLoftChain.ring(
    chain,
    s,
    phases,
  ).map((p: [number, number, number]): [number, number] =>
    AutoMovieHumanLoftFrame.local(frame, p),
  );

  // First and second phase derivatives in the plane, exact either way.
  const jets: boolean = AutoMovieHumanLoftJet.carries(chain);
  const c: number[] = AutoMovieHumanLoftChain.coefficients(chain, s);
  const derivatives: (t: number) => [number, number, number, number] = (
    t: number,
  ): [number, number, number, number] => {
    if (jets) {
      const jet: AutoMovieHumanLoftJet.IJet = AutoMovieHumanLoftJet.at(
        chain,
        s,
        t,
      );
      return [
        dot(jet.t, frame.u),
        dot(jet.t, frame.v),
        dot(jet.tt, frame.u),
        dot(jet.tt, frame.v),
      ];
    }
    if (chain.basis === "spline") {
      const j: number[] = AutoMovieHumanSplineCurve.jet(c, chain.order, t);
      return [j[2]!, j[3]!, j[4]!, j[5]!];
    }
    return harmonic(c, chain.order, t);
  };

  const points: sampleHumanSection.IPoint[] = phases.map(
    (t: number, i: number): sampleHumanSection.IPoint => {
      const [dx, dz, ddx, ddz] = derivatives(t);
      const speed: number = Math.hypot(dx, dz);
      return {
        x: ring[i]![0],
        z: ring[i]![1],
        nx: dz / speed,
        nz: -dx / speed,
        k: (dx * ddz - dz * ddx) / speed ** 3,
      };
    },
  );
  const curvatures: number[] = points.map(
    (p: sampleHumanSection.IPoint): number => p.k,
  );
  return {
    points,
    vertices: AutoMovieHumanLoftChain.ring(
      chain,
      s,
      Array.from(
        { length: chain.samples },
        (_: unknown, i: number): number => (2 * Math.PI * i) / chain.samples,
      ),
    ).map((p: [number, number, number]): [number, number] =>
      AutoMovieHumanLoftFrame.local(frame, p),
    ),
    perimeter: sampleHumanSection.perimeter(chain, s),
    maxCurvature: Math.max(...curvatures.map(Math.abs)),
    rmsCurvature: Math.sqrt(
      curvatures.reduce((sum: number, k: number): number => sum + k * k, 0) /
        curvatures.length,
    ),
    signChanges: curvatures.filter(
      (k: number, i: number): boolean =>
        Math.sign(k) !== Math.sign(curvatures[(i + 1) % curvatures.length]!),
    ).length,
  };
}

/**
 * Types and the perimeter of a sampled section.
 *
 * @evidence contracts/common.md#principled-implementation The perimeter is the closed polyline length of the generator's own ring.
 * @evidence contracts/common.md#clear-and-simple-design Groups the section's record types with the perimeter the axis plots also read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is estimated beyond the stated polyline.
 * @evidence contracts/common.md#meaningful-documentation Each member states its meaning and unit.
 * @evidence contracts/performance.md#efficient-algorithms One 512-point ring per perimeter.
 * @evidence contracts/performance.md#reuse-equivalent-work Types cost nothing; the perimeter shares the ring evaluator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns numbers; retains nothing.
 */
export namespace sampleHumanSection {
  /** One point of a drawn section with its unit right normal and signed curvature, mm and 1/mm. */
  export interface IPoint {
    x: number;
    z: number;
    nx: number;
    nz: number;
    k: number;
  }

  /** A sampled section. */
  export interface ISection {
    /** 720 points in the section plane. */
    points: IPoint[];

    /** The chain's own vertex phases' points in the plane. */
    vertices: Array<[number, number]>;

    /** Ring perimeter, mm. */
    perimeter: number;

    /** Largest |k|, 1/mm. */
    maxCurvature: number;

    /** Root mean square k, 1/mm. */
    rmsCurvature: number;

    /** Sign changes of k round the ring. */
    signChanges: number;
  }

  /** Closed polyline length of the world ring at station s, 512 phases, mm. */
  export function perimeter(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): number {
    const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
      chain,
      s,
      Array.from(
        { length: 512 },
        (_: unknown, i: number): number => (2 * Math.PI * i) / 512,
      ),
    );
    return ring.reduce(
      (sum: number, p: [number, number, number], i: number): number => {
        const q: [number, number, number] = ring[(i + 1) % ring.length]!;
        return sum + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      },
      0,
    );
  }
}

/** First and second phase derivatives of a Fourier section, term by term. */
function harmonic(
  c: readonly number[],
  order: number,
  t: number,
): [number, number, number, number] {
  const offset: number = 2 * order + 1;
  const out: [number, number, number, number] = [0, 0, 0, 0];
  for (let k: number = 1; k <= order; k++) {
    const cos: number = Math.cos(k * t);
    const sin: number = Math.sin(k * t);
    const [xc, xs, zc, zs] = [
      c[2 * k - 1]!,
      c[2 * k]!,
      c[offset + 2 * k - 1]!,
      c[offset + 2 * k]!,
    ];
    out[0] += k * (xs * cos - xc * sin);
    out[1] += k * (zs * cos - zc * sin);
    out[2] -= k * k * (xc * cos + xs * sin);
    out[3] -= k * k * (zc * cos + zs * sin);
  }
  return out;
}

/** Dot product of two 3-vectors. */
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
