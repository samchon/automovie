import type { AutoMovieVector3Tuple as P3 } from "@automovie/interface";

import type { AutoMovieSolidHeightFence as Fence } from "./AutoMovieSolidHeightFence";
import { AutoMovieSolidHeightSection as Section } from "./AutoMovieSolidHeightSection";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** One first-order physical-height surface bounded by its authored curves. */
export namespace AutoMovieSolidHeightPatch {
  /** One original curve and the normal field of its incident source surface. */
  export interface IFence {
    /** The prepared physical intersections of this curve. */
    read: ReturnType<typeof Fence.prepare>;

    /** The boundary normal and its derivative in the exact curve parameter. */
    normal(t: number): { value: P3; rate: P3 };
  }

  /** One physically inherited quartic coefficient where the curve owner changes. */
  export interface IJoin {
    /** Section coordinate at the actual join. */
    s: number;

    /** The quartic coefficient required by the incident normals' mixed jet. */
    coefficient: number;
  }

  /** One section in the physical basis, after resolving its actual boundaries. */
  export interface IRow {
    /** Smallest transverse coordinate actually owned by the section. */
    lo: number;

    /** Largest transverse coordinate actually owned by the section. */
    hi: number;

    /** Exact Bernstein control hull in world millimetres. */
    hull: readonly P3[];

    /** Maximum residual of the two original plane intersections. */
    residual: number;

    /** Height and first partials at fixed physical coordinates. */
    at(x: number): { height: number; longitudinal: number; transverse: number };

    /** Prepare the true transverse second partial, absent at a contracted end. */
    transverseSecond(): (x: number) => number | null;
  }

  /**
   * Prepare the original curve family. Read each requested physical section
   * once for its scope. Both joins supply the affine coefficient; the same
   * physical quartic then keeps its two actual boundary planes along the
   * patch.
   */
  export function prepare(
    name: string,
    basis: { height: P3; section: P3; span: P3 },
    fences: readonly IFence[],
    joins: readonly [IJoin, IJoin],
  ): (s: number) => IRow {
    const [first, last] = joins;
    if (!(first.s < last.s))
      throw new Error(
        `${name} needs two ordered physical section-owner changes`,
      );
    const height: P3 = [...basis.height];
    const section: P3 = [...basis.section];
    const span: P3 = [...basis.span];
    const sources = [...fences];
    const start = first.s;
    const coefficient = first.coefficient;
    const coefficientRate = (last.coefficient - coefficient) / (last.s - start);
    return (s) => {
      const tolerance = 64 * Number.EPSILON * Math.max(1, Math.abs(s));
      const hits = sources.flatMap(({ read, normal }) =>
        read.at(s, true).map((hit) => ({ ...hit, normal })),
      );
      const ends = hits
        .filter(
          ({ p }, i) =>
            !hits
              .slice(0, i)
              .some(({ p: q }) => Vec.norm(Vec.sub(p, q)) <= tolerance),
        )
        .map(({ p, t, normal, along, residual }) => {
          const { value, rate } = normal(t);
          const n = Vec.dot(value, height);
          const slope = -Vec.dot(value, span) / n;
          const ds = Vec.dot(along, section);
          return {
            p,
            x: Vec.dot(p, span),
            height: Vec.dot(p, height),
            xRate: Vec.dot(along, span) / ds,
            heightRate: Vec.dot(along, height) / ds,
            slope,
            slopeRate:
              (-Vec.dot(rate, span) - slope * Vec.dot(rate, height)) / (n * ds),
            longitudinal: -Vec.dot(value, section) / n,
            residual,
          };
        })
        .sort((a, b) => a.x - b.x);
      if (ends.length === 1) {
        const q = ends[0]!;
        return {
          lo: q.x,
          hi: q.x,
          hull: [q.p],
          residual: Math.abs(q.residual),
          at: () => ({
            height: q.height,
            longitudinal: q.longitudinal,
            transverse: q.slope,
          }),
          transverseSecond: () => () => null,
        };
      }
      if (ends.length !== 2)
        throw new Error(
          `${name} needs two boundary owners in physical section ${s}`,
        );
      const a = ends[0]!;
      const b = ends[1]!;
      const width = b.x - a.x;
      if (!(width > 0))
        throw new Error(
          `${name} has no physical transverse width in section ${s}`,
        );
      const prepared = Section.prepare(
        a,
        b,
        coefficient + (s - start) * coefficientRate,
        coefficientRate,
      );
      return {
        lo: a.x,
        hi: b.x,
        hull: prepared.controls.map((y, k) =>
          Vec.combine([
            [s, section],
            [a.x + (k * width) / 4, span],
            [y, height],
          ]),
        ),
        residual: Math.max(Math.abs(a.residual), Math.abs(b.residual)),
        at: prepared.at,
        transverseSecond: prepared.transverseSecond,
      };
    };
  }
}
