import type {
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as Plane,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

import { FamilyConicMpfbUpperTop as Tensor } from "./FamilyConicMpfbUpperTop";

type Jet = IAutoMovieSolidSurface.IJet;
type Slice = (u: number) => (v: number) => Jet;

/** Compact tensor charts on a single, locally resolvable source sheet. */
export namespace FamilyConicMpfbScalarAtlas {
  /** One independent ray reading on a directed component of the source. */
  export interface IObservation {
    /** Height or radius in physical millimetres, according to the chart. */
    value: number;
    /** Edge-connected source component that owns this observation. */
    component: number;
  }

  /** Bounds of a projected source edge used to trim complete chart tiles. */
  export interface IBoundary {
    /** Edge-connected source component that owns this boundary. */
    component: number;
    /** Increasing first-coordinate extent in millimetres. */
    u: Plane;
    /** Increasing second-coordinate extent in millimetres. */
    v: Plane;
  }

  /**
   * Four knots per axis leave a cubic interior. Keep only tiles with complete
   * source observations in one edge-connected component and no projected edge
   * of that component crossing their interior. Independently observed cell
   * centres verify that source variation is resolved at the chosen pitch.
   *
   * @see https://doi.org/10.1145/882262.882293
   */
  export function prepare(props: {
    domain: readonly Plane[];
    pitch: number;
    boundaries: readonly IBoundary[];
    observe: (u: number) => (v: number) => IObservation | null;
  }) {
    const { pitch, boundaries, observe } = props;
    const axis = (i: 0 | 1): number[] => {
      const coordinates: number[] = props.domain.map(
        (point): number => point[i],
      );
      const low: number = Math.floor(Math.min(...coordinates) / pitch) * pitch;
      const steps: number = Math.ceil((Math.max(...coordinates) - low) / pitch);
      return Array.from(
        { length: steps + 3 },
        (_, j): number => low + (j - 1) * pitch,
      );
    };
    const midpoint = (nodes: readonly number[]): number[] =>
      nodes.slice(1).map((x, i): number => (x + nodes[i]!) / 2);
    const sample = (us: readonly number[], vs: readonly number[]) =>
      us.map((u): (IObservation | null)[] => vs.map(observe(u)));
    const us: number[] = axis(0);
    const vs: number[] = axis(1);
    const halfU: number[] = midpoint(us);
    const halfV: number[] = midpoint(vs);
    const knots = sample(us, vs);
    const cells = sample(halfU, halfV);
    interface ITile {
      read: Slice;
      centre: Plane;
      component: number;
    }
    const tiles: ITile[] = [];
    let boundaryRefusals: number = 0;
    let interpolationRefusals: number = 0;
    for (let i: number = 0; i < us.length - 3; ++i)
      for (let j: number = 0; j < vs.length - 3; ++j) {
        const observations = knots
          .slice(i, i + 4)
          .map((row) => row.slice(j, j + 4));
        const component: number | undefined = observations[0]![0]?.component;
        if (
          component === undefined ||
          observations.some((row) =>
            row.some((value) => value?.component !== component),
          )
        )
          continue;
        const x: number[] = us.slice(i, i + 4);
        const z: number[] = vs.slice(j, j + 4);
        if (
          boundaries.some(
            ({ component: owner, u, v }): boolean =>
              owner === component &&
              u[1] > x[0]! &&
              u[0] < x[3]! &&
              v[1] > z[0]! &&
              v[0] < z[3]!,
          )
        ) {
          ++boundaryRefusals;
          continue;
        }
        const read: Slice = Tensor.grid(
          x,
          z,
          observations.map((row) => row.map((value): number => value!.value)),
        );
        let resolved: boolean = true;
        for (let k: number = i; resolved && k < i + 3; ++k) {
          const section = read(halfU[k]!);
          for (let l: number = j; resolved && l < j + 3; ++l) {
            const measured: IObservation | null = cells[k]![l]!;
            // ESTIMATE: half a physical cell limits the unresolved source
            // deflection allowed inside one tile. Held-out rail error is reported separately.
            resolved =
              measured?.component === component &&
              Math.abs(section(halfV[l]!).p[1] - measured.value) <= pitch / 2;
          }
        }
        if (!resolved) {
          ++interpolationRefusals;
          continue;
        }
        tiles.push({
          read,
          centre: [(x[0]! + x[3]!) / 2, (z[0]! + z[3]!) / 2],
          component,
        });
      }
    const width: number = (3 * pitch) / 2;
    const read = (u: number) => {
      const sections = tiles.flatMap(({ read, centre, component }) => {
        const x: number = (u - centre[0]) / width;
        return Math.abs(x) < 1
          ? [{ slice: read, x, z: centre[1], component }]
          : [];
      });
      return (
        v: number,
        owner: number,
      ): { jet: Jet; support: number } | null => {
        // Stem derivatives are the value, U, V, UU, UV and VV components.
        const den: number[] = [0, 0, 0, 0, 0, 0];
        const num: number[] = [0, 0, 0, 0, 0, 0];
        let outside: number = 1;
        for (const { slice, x, z, component } of sections) {
          const y: number = (v - z) / width;
          if (component !== owner || !(Math.abs(y) < 1)) continue;
          const a: Point = window(x, width);
          const b: Point = window(y, width);
          outside *= 1 - a[0] * b[0];
          accumulate(den, num, a, b, slice(u)(v));
        }
        return den[0]! > 0
          ? { jet: quotient(u, v, den, num), support: 1 - outside }
          : null;
      };
    };
    return {
      read,
      tiles: tiles.length,
      refusedGrid: knots.flat().filter((row): boolean => row === null).length,
      boundaryRefusals,
      interpolationRefusals,
    };
  }
}

/** A compact polynomial whose first two derivatives vanish at each edge. */
function window(t: number, width: number): Point {
  const remainder: number = 1 - t * t;
  return [
    remainder ** 3,
    (-6 * t * remainder * remainder) / width,
    (-6 * remainder * (1 - 5 * t * t)) / (width * width),
  ];
}

function accumulate(
  den: number[],
  num: number[],
  x: Point,
  z: Point,
  jet: Jet,
): void {
  const w: number = x[0] * z[0];
  const wu: number = x[1] * z[0];
  const wv: number = x[0] * z[1];
  const wuu: number = x[2] * z[0];
  const wuv: number = x[1] * z[1];
  const wvv: number = x[0] * z[2];
  const p: number = jet.p[1];
  const u: number = jet.u[1];
  const v: number = jet.v[1];
  den[0]! += w;
  den[1]! += wu;
  den[2]! += wv;
  den[3]! += wuu;
  den[4]! += wuv;
  den[5]! += wvv;
  num[0]! += w * p;
  num[1]! += w * u + wu * p;
  num[2]! += w * v + wv * p;
  num[3]! += w * jet.uu[1] + 2 * wu * u + wuu * p;
  num[4]! += w * jet.uv[1] + wu * v + wv * u + wuv * p;
  num[5]! += w * jet.vv[1] + 2 * wv * v + wvv * p;
}

/** Differentiate the normalized tile sum in physical chart coordinates. */
function quotient(u: number, v: number, den: number[], num: number[]): Jet {
  const total: number = den[0]!;
  const f: number = num[0]! / total;
  const fu: number = (num[1]! - f * den[1]!) / total;
  const fv: number = (num[2]! - f * den[2]!) / total;
  return {
    p: [u, f, v],
    u: [1, fu, 0],
    v: [0, fv, 1],
    uu: [0, (num[3]! - 2 * den[1]! * fu - den[3]! * f) / total, 0],
    uv: [0, (num[4]! - den[1]! * fv - den[2]! * fu - den[4]! * f) / total, 0],
    vv: [0, (num[5]! - 2 * den[2]! * fv - den[5]! * f) / total, 0],
  };
}
