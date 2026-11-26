import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSkinCut,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitCompose,
  IAutoMovieLoftChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionSkinCut as SkinCut } from "./AutoMovieConstructionSkinCut";
import { AutoMovieConstructionSplitCompose as Compose } from "./AutoMovieConstructionSplitCompose";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidVector as Vector } from "./AutoMovieSolidVector";

/** A split's plane cut and its maps to both faces' original charts. */
export namespace AutoMovieConstructionSplitHost {
  /** Reader prepared from a regular parent cut for one realization. */
  export interface IBoundary {
    /** Local strip chart with the cut at station zero. */
    surface: IAutoMovieSolidSurface;

    /** Plane normal out of the portion the host retains. */
    normal: AutoMovieVector3Tuple;

    /** Direction from the retained host into the split. */
    out: 1 | -1;

    /** The cut's address in the original host chart, in mm. */
    at: (phase: number) => number;
  }

  /**
   * Prepare the cut on the original chart. Only its regular declared layers
   * bracket the root. The caller publishes and tessellates the native face.
   */
  export function create(
    declared: IAutoMovieConstructionSplit.IHostCut,
    face: IAutoMovieSolidBody.IFace,
    chain: IAutoMovieLoftChain,
    basis: IAutoMovieConstructionSplitCompose.IBasis | null,
    out: 1 | -1,
    count: number,
  ): IBoundary | string {
    if (declared.frame === "host" && basis === null)
      return "the host end section has no frame";
    const plane: IAutoMovieConstructionSkinCut.IPlane | null = Compose.plane(
      declared.plane,
      declared.frame === "tree" ? null : basis,
    );
    if (plane === null) return "the host cut has no plane normal";
    const host: IAutoMovieSolidSurface = face.surface;
    const stations: number[] = chain.layers
      .map((layer: IAutoMovieLoftChain.ILayer): number => layer.y)
      .filter(
        (s: number): boolean =>
          (host.domain === undefined ||
            (s >= host.domain[0] && s <= host.domain[1])) &&
          s !== chain.pole?.source?.station &&
          s !== chain.opposite?.source?.station,
      );
    const into: 1 | -1 = out === 1 ? -1 : 1;
    const cut: IAutoMovieConstructionSkinCut.ICut | string = SkinCut.create({
      surface: host,
      stations,
      into,
      planes: [plane],
      samples: count,
    });
    if (typeof cut === "string") return cut;
    const lo: number = stations[0]!;
    const hi: number = stations.at(-1)!;
    const cycles: IAutoMovieSolidCycle.ICycle[] = face.cycles.map(
      AutoMovieSolidCycle.copy,
    );
    const source: IAutoMovieSolidBody.IFace["sourceAtlas"] = face.sourceAtlas;

    /** Admit every accessed root against the bracket and previously kept face. */
    const at = (phase: number): [number, number, number] => {
      const result: [number, number, number] = cut.at(phase);
      const s: number = result[0];
      if (
        !(s > lo && s < hi) ||
        !result.every(Number.isFinite) ||
        (source !== undefined && !source.atlas.kept(source.face, s, phase)) ||
        !cycles.every((cycle: IAutoMovieSolidCycle.ICycle): boolean =>
          AutoMovieSolidCycle.held(cycle, s, phase, host.period),
        )
      )
        throw new AutoMovieLoftAdmissionError(
          `the host cut at station ${s} mm, phase ${phase} rad leaves the retained regular host`,
        );
      return result;
    };
    for (let i: number = 0; i < count; ++i) at((2 * Math.PI * i) / count);

    return {
      normal: Vector.scale(plane.normal, -1),
      out,
      at: (phase: number): number => at(phase)[0],
      surface: {
        name: host.name,
        orientation: host.orientation,
        /**
         * Apply the chain rule to the single chart change `(s, v) -> (s +
         * rho(v), v)`.
         */
        jet: (s: number, phase: number): IAutoMovieSolidSurface.IJet => {
          const [rho, d, dd]: [number, number, number] = at(phase);
          const u: number = s + rho;
          if (!(u >= lo && u <= hi))
            throw new AutoMovieLoftAdmissionError(
              `the host cut chart at station ${u} mm leaves [${lo}, ${hi}] mm`,
            );
          const j: IAutoMovieSolidSurface.IJet = host.jet(u, phase);
          return {
            ...j,
            v: Vector.combine([
              [1, j.v],
              [d, j.u],
            ]),
            uv: Vector.combine([
              [1, j.uv],
              [d, j.uu],
            ]),
            vv: Vector.combine([
              [1, j.vv],
              [2 * d, j.uv],
              [d * d, j.uu],
              [dd, j.u],
            ]),
          };
        },
      },
    };
  }

  /** Keep and cross the new boundary at the query's native host phase. */
  export function parentCycle(
    cycle: IAutoMovieSolidCycle.ICycle,
    cut: IBoundary,
  ): IAutoMovieSolidCycle.ICycle {
    const turn: number = 2 * Math.PI;
    const phases: number[] = cycle.chart.map(
      (p: [number, number]): number => p[1],
    );
    const first: number = phases[0]!;
    const count: number = phases.length;

    /** Locate the arc segment containing the phase, including the closing edge. */
    const foot = (u: number, v: number): IAutoMovieSolidCycle.IFoot => {
      const phase: number = v - turn * Math.floor((v - first) / turn);
      let lo: number = 0;
      let hi: number = count;
      while (hi - lo > 1) {
        const mid: number = Math.floor((lo + hi) / 2);
        if (phase < phases[mid]!) hi = mid;
        else lo = mid;
      }
      const a: number = phases[lo]!;
      const b: number = phases[hi] ?? first + turn;
      return {
        segment: lo,
        share: Math.max(0, Math.min(1, (phase - a) / (b - a))),
        distance: Math.abs(u - cut.at(v)),
      };
    };
    return {
      ...cycle,
      along: cut.at,
      exact: {
        count,
        kept: (u: number, v: number): boolean => cut.out * (u - cut.at(v)) <= 0,
        foot,
        across: (
          u: number,
          v: number,
          p: IAutoMovieSolidCycle.IFoot = foot(u, v),
          n: IAutoMovieSolidCycle.INeighbour = cycle.neighbours[p.segment]!,
        ): [number, number] => [0, mappedPhase(n, p.share)],
      },
    };
  }

  /** Map a band's start back to the parent cut or to the adjacent band's seam. */
  export function bandCycle(
    cycle: IAutoMovieSolidCycle.ICycle,
    host: number,
    cut: IBoundary,
  ): IAutoMovieSolidCycle.ICycle {
    return {
      ...cycle,
      exact: {
        count: cycle.chart.length,
        across: (
          u: number,
          v: number,
          p: IAutoMovieSolidCycle.IFoot = AutoMovieSolidCycle.foot(
            cycle,
            u,
            v,
            2 * Math.PI,
          ),
          n: IAutoMovieSolidCycle.INeighbour = cycle.neighbours[p.segment]!,
        ): [number, number] => {
          const phase: number = mappedPhase(n, p.share);
          return [n.face === host ? cut.at(phase) : 0, phase];
        },
      },
    };
  }

  /** Read the same directed phase share on the adjoining face. */
  function mappedPhase(
    n: IAutoMovieSolidCycle.INeighbour,
    share: number,
  ): number {
    return n.from[1] + share * (n.to[1] - n.from[1]);
  }
}
