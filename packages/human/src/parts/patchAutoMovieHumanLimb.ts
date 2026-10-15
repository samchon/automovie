import { IAutoMovieSurfaceNetwork } from "@automovie/engine";

/**
 * Divide a limb's sweep into the patches of its control cage: rows of quads around the limb between its stations, and a transition band wherever the number of vertices around changes.
 *
 * Between two stations of equal column count the patch is the sweep's own rectangle `[u_i, u_i+1] × [0, 1]`, sampled in `rows` rows and `columns` columns, so its vertices lie at `v = j / columns` on each station row and the rows of neighbouring patches weld. Between a station of `W` columns and one of `W - 4`, one row of quads turns four spans into two twice, on the half turns centred at `v` 0.25 and 0.75: each half keeps one straight span at either end and between them four quads around one vertex in the band's middle, a pattern whose only extraordinary vertices are a valence-3 and a valence-5 vertex on each side of that centre. The quads are bilinear Coons patches of one face each, their sides straight lines of the sweep's domain, so their corners are points of the sweep like every other vertex. For both limbs `v` 0.25 and 0.75 are the medial and lateral meridians, the narrow, sharply curved sides where the poles show least, never the broad front and back.
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
  const { sweep, at, columns, rows } = props;
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const domains: Array<(s: number, t: number) => IDomain> = [];
  const transitions: number[] = [];
  for (let i: number = 0; i + 1 < at.length; ++i) {
    if (columns[i] === columns[i + 1]) {
      const u: [number, number] = [at[i]!, at[i + 1]!];
      patches.push({
        type: "sweep",
        name: `band.${i}`,
        sweep,
        u,
        v: [0, 1],
        rows: fixed(rows[i]!),
        columns: fixed(columns[i]!),
      });
      domains.push(
        (s: number, t: number): IDomain => ({ u: u[0] + (u[1] - u[0]) * t, v: s }),
      );
    } else transitions.push(i);
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
    const uWide: number = wideFirst ? at[i]! : at[i + 1]!;
    const uNarrow: number = wideFirst ? at[i + 1]! : at[i]!;
    const t = (j: number): IDomain => ({ u: uWide, v: j / W });
    const b = (k: number): IDomain => ({ u: uNarrow, v: k / N });
    for (let half: number = 0; half < 2; ++half) {
      const j0: number = (half * W) / 2;
      const k0: number = (half * N) / 2;
      const m: IDomain = { u: (uWide + uNarrow) / 2, v: 0.25 + 0.5 * half };
      const quads: IDomain[][] = [
        [t(j0), b(k0), b(k0 + 1), t(j0 + 1)],
        [t(j0 + 1), b(k0 + 1), m, t(j0 + 2)],
        [t(j0 + 2), m, t(j0 + 4), t(j0 + 3)],
        [t(j0 + 4), m, b(k0 + 3), t(j0 + 5)],
        [m, b(k0 + 1), b(k0 + 2), b(k0 + 3)],
      ];
      for (let j: number = j0 + 5; j < j0 + W / 2; ++j)
        quads.push([t(j), b(j - j0 - 5 + k0 + 3), b(j - j0 - 5 + k0 + 4), t(j + 1)]);
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
const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

/** A quad's corners counterclockwise in the `(v, u)` plane, which winds the face outward; the domain's `v` runs about the distal axis. */
const counterclockwise = (quad: IDomain[]): IDomain[] => {
  let area: number = 0;
  for (let k: number = 0; k < quad.length; ++k) {
    const a: IDomain = quad[k]!;
    const b: IDomain = quad[(k + 1) % quad.length]!;
    area += a.v * b.u - b.v * a.u;
  }
  return area > 0 ? quad : [...quad].reverse();
};
