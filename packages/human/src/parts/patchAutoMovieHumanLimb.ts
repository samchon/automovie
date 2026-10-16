import { IAutoMovieSurfaceNetwork } from "@automovie/engine";

/**
 * Divide a limb's sweep into the patches of its control cage: rows of quads around the limb between its stations, and a transition band wherever the number of vertices around changes.
 *
 * Between two stations of equal column count the patch is the sweep's own rectangle `[u_i, u_i+1] × [0, 1]`, sampled in `rows` rows and `columns` columns, so its vertices lie at `v = j / columns` on each station row and the rows of neighbouring patches weld. Where the column count changes, the last row beside the narrower station is the transition and any preceding rows retain the wider count. Between a row of `W` columns and one of `W - 4`, one band of quads turns three wide spans into one narrow span on each half of the turn: four quads around two vertices in the band's middle, a third of the narrow span apart, whose only extraordinary vertices are those two of valence 3 and the narrow span's two ends of valence 5, and every other span runs straight across the band. Every quad of the pattern is convex in the domain, so none folds into a triangle with a corner on one side, which the sampled limit surface shows as a dent. The quads are bilinear Coons patches of one face each, their sides straight lines of the sweep's domain, so their corners are points of the sweep like every other vertex. The patterns sit just past `v` 0.25 and 0.75, the medial and lateral meridians of both limbs, the narrow, sharply curved sides where the poles show least, never the broad front and back.
 *
 * @param props.sweep Name of the sweep in the network
 * @param props.at Each station's `u` on the sweep, increasing from 0 to 1
 * @param props.columns Vertices around each station's row
 * @param props.rows Rows of faces from each station to the next
 * @returns The patches in emission order, and the sweep domain point of every patch corner
 */
export function patchAutoMovieHumanLimb(props: {
  sweep: string;
  at: number[];
  columns: number[];
  rows: number[];
}): patchAutoMovieHumanLimb.IOutput {
  const { sweep, at, columns, rows }: typeof props = props;
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const domains: Array<(s: number, t: number) => IDomain> = [];
  const transitions: number[] = [];
  // The regular patch and transition share this exact domain coordinate.
  const wideAt: (i: number) => number = (i: number): number => {
    const wideFirst: boolean = columns[i]! > columns[i + 1]!;
    const wide: number = wideFirst ? at[i]! : at[i + 1]!;
    const narrow: number = wideFirst ? at[i + 1]! : at[i]!;
    return rows[i] === 1 ? wide : narrow + (wide - narrow) / rows[i]!;
  };
  const band: (name: string, u: [number, number], count: number, rowCount: number) => void = (
    name: string,
    u: [number, number],
    count: number,
    rowCount: number,
  ): void => {
    patches.push({
      type: "sweep",
      name,
      sweep,
      u,
      v: [0, 1],
      rows: fixed(rowCount),
      columns: fixed(count),
    });
    domains.push(
      (s: number, t: number): IDomain => ({
        u: u[0] + (u[1] - u[0]) * t,
        v: s,
      }),
    );
  };
  for (let i: number = 0; i + 1 < at.length; ++i) {
    if (columns[i] === columns[i + 1])
      band(`band.${i}`, [at[i]!, at[i + 1]!], columns[i]!, rows[i]!);
    else {
      transitions.push(i);
      if (rows[i]! <= 1) continue;
      const wideFirst: boolean = columns[i]! > columns[i + 1]!;
      const split: number = wideAt(i);
      band(
        `band.${i}.wide`,
        wideFirst ? [at[i]!, split] : [split, at[i + 1]!],
        Math.max(columns[i]!, columns[i + 1]!),
        rows[i]! - 1,
      );
    }
  }
  // transition quads after every sweep patch, so the station rows they share are sampled at their patches' spacing
  for (const i of transitions) {
    const wideFirst: boolean = columns[i]! > columns[i + 1]!;
    const W: number = Math.max(columns[i]!, columns[i + 1]!);
    const N: number = W - 4;
    if (Math.min(columns[i]!, columns[i + 1]!) !== N || W % 4 !== 0)
      throw new Error(
        `limb band ${i} turns ${columns[i]} columns into ${columns[i + 1]}; it needs 4k + 4 and 4k`,
      );
    const uNarrow: number = wideFirst ? at[i + 1]! : at[i]!;
    const uWide: number = wideAt(i);
    const t: (j: number) => IDomain = (j: number): IDomain => ({ u: uWide, v: j / W });
    const b: (k: number) => IDomain = (k: number): IDomain => ({ u: uNarrow, v: k / N });
    for (let half: number = 0; half < 2; ++half) {
      const q: number = N / 4;
      // q straight spans, three wide spans into one narrow span, then q - 1 straight spans
      const j0: number = (half * W) / 2;
      const k0: number = (half * N) / 2;
      const ja: number = j0 + q;
      const kc: number = k0 + q;
      const u: number = (uWide + uNarrow) / 2;
      const p: IDomain = { u, v: (kc + 1 / 3) / N };
      const r: IDomain = { u, v: (kc + 2 / 3) / N };
      const quads: IDomain[][] = [
        [t(ja), t(ja + 1), p, b(kc)],
        [t(ja + 1), t(ja + 2), r, p],
        [t(ja + 2), t(ja + 3), b(kc + 1), r],
        [p, r, b(kc + 1), b(kc)],
      ];
      for (let k: number = 0; k < q; ++k)
        quads.push([t(j0 + k), t(j0 + k + 1), b(k0 + k + 1), b(k0 + k)]);
      for (let k: number = 0; k < q - 1; ++k)
        quads.push([
          t(ja + 3 + k),
          t(ja + 4 + k),
          b(kc + 2 + k),
          b(kc + 1 + k),
        ]);
      for (const quad of quads) {
        const corners: IDomain[] = counterclockwise(quad);
        patches.push({
          type: "coons",
          name: `band.${i}.${patches.length}`,
          sides: corners.map(
            (c: IDomain, k: number): IAutoMovieSurfaceNetwork.IEdge => ({
              type: "sweep",
              sweep,
              from: c,
              to: corners[(k + 1) % 4]!,
              segments: fixed(1),
            }),
          ) as [
            IAutoMovieSurfaceNetwork.IEdge,
            IAutoMovieSurfaceNetwork.IEdge,
            IAutoMovieSurfaceNetwork.IEdge,
            IAutoMovieSurfaceNetwork.IEdge,
          ],
        });
        // a one-face Coons patch has its corners at (0, 0), (1, 0), (1, 1) and (0, 1), in side order
        domains.push(
          (s: number, t: number): IDomain =>
            corners[t === 0 ? (s === 0 ? 0 : 1) : s === 0 ? 3 : 2]!,
        );
      }
    }
  }
  return { patches, domains };
}
/** Output types of {@link patchAutoMovieHumanLimb}. */
export namespace patchAutoMovieHumanLimb {
  /**
   * The patches of a limb's cage and where their corners lie.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Patches in emission order. */
    patches: IAutoMovieSurfaceNetwork.IPatch[];

    /** For each patch, the sweep domain point at patch coordinates `(s, t)`. */
    domains: Array<(s: number, t: number) => IDomain>;
  }

  /**
   * A point of the sweep's domain.
   *
   * @author Samchon
   */
  export interface IDomain {
    /** Along the limb. */
    u: number;

    /** Around it, a fraction of a turn. */
    v: number;
  }
}

type IDomain = patchAutoMovieHumanLimb.IDomain;

/** The same count at every tier: the human profile samples one tier until resolution tiers reach every part. */
const fixed: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

/** A quad's corners counterclockwise in the `(v, u)` plane, which winds the face outward; the domain's `v` runs about the distal axis. */
const counterclockwise: (quad: IDomain[]) => IDomain[] = (quad: IDomain[]): IDomain[] => {
  let area: number = 0;
  for (let k: number = 0; k < quad.length; ++k) {
    const a: IDomain = quad[k]!;
    const b: IDomain = quad[(k + 1) % quad.length]!;
    area += a.v * b.u - b.v * a.u;
  }
  return area > 0 ? quad : [...quad].reverse();
};
