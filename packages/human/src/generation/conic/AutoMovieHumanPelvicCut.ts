import {
  AutoMovieIllinois,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

import { AutoMovieHumanDigitalSection as Section } from "./AutoMovieHumanDigitalSection";

/** A physical lateral support and its original outgoing two-jet. */
type Rail = { normal: P3; jet: Solid.IJet };

/** A kept pelvic contour whose lateral lines can lead into the native thigh. */
export namespace AutoMovieHumanPelvicCut {
  /** Original lateral envelope through its first stationary widest section. */
  export function envelope(
    parent: IAutoMovieViewPart,
    field: IAutoMovieLoftViewFullSource.IReader,
    level: number,
    normal: P3,
  ) {
    const breadth = (s: number): Solid.IJet => {
      const at = {
        point: field.pointAt(s),
        jet: (phase: number) => field.jet(s, phase),
      };
      const tape: P3[] = Array.from({ length: parent.samples }, (_, k) =>
        at.point((2 * Math.PI * k) / parent.samples),
      );
      return Section.support(at, normal, tape);
    };
    const sections = parent.stations.filter(
      (s): boolean => s > level && s <= field.regular![1],
    );
    const slope = (s: number): number => Vec.dot(breadth(s).u, normal);
    const upper = sections.find((s): boolean => slope(s) <= 0);
    if (upper === undefined)
      return "The original pelvic width has no nearby stationary upper bound";
    const lower = sections.filter((s): boolean => s < upper).at(-1) ?? level;
    const tolerance: number = Number.EPSILON * upper;
    const widest: number | null = AutoMovieIllinois.root(
      slope,
      lower,
      upper,
      tolerance,
      100,
    );
    return widest === null
      ? "The original pelvic breadth derivative has no supported root"
      : { widest, at: breadth, tolerance };
  }

  /** Trim the exterior envelope without changing either actual sagittal fork. */
  export function prepare(
    parent: IAutoMovieViewPart,
    field: IAutoMovieLoftViewFullSource.IReader,
    level: number,
    rails: readonly Rail[],
    forward: P3,
    retainedCrests?: readonly [number, number],
  ) {
    const roots = rails.map(({ normal, jet: receiver }) => {
      const intoThigh: number = -Vec.dot(transverse(receiver), normal);
      if (!(intoThigh >= 0))
        return "The protected thigh lateral course widens distally";
      const span = envelope(parent, field, level, normal);
      if (typeof span === "string") return span;
      const { widest, at: breadth, tolerance } = span;
      const margin = (s: number): number => {
        const host = breadth(s);
        const departure: number = Vec.dot(transverse(host), normal);
        const span: number = Vec.dot(Vec.sub(receiver.p, host.p), forward) / 3;
        // A cubic's two interior Bernstein controls must remain lateral-ordered.
        // The generic split uses a third of the forward chord as the tangent
        // handle, so this is the exact budget for the two inward directions.
        return (
          Vec.dot(Vec.sub(host.p, receiver.p), normal) -
          span * (departure + intoThigh)
        );
      };
      if (margin(level) >= 0) return level;
      if (!(margin(widest) >= 0))
        return "The actual parent and thigh cannot carry a monotone lateral line";
      return (
        AutoMovieIllinois.root(margin, level, widest, tolerance, 100) ??
        "The native lateral taper has no supported last cut"
      );
    });
    const refused = roots.filter((s) => typeof s === "string");
    if (refused.length !== 0) return refused.join("\n");
    return cut(
      level,
      roots.filter((s): s is number => typeof s === "number"),
      false,
      retainedCrests,
    );
  }

  /** Hold each body's own lateral station and the original sagittal jets. */
  export function cut(
    level: number,
    roots: readonly number[],
    separate: boolean = false,
    retainedCrests?: readonly [number, number],
  ) {
    const lift: number = Math.max(...roots) - level;

    // ESTIMATE. The least even sine power with vanishing first and second jets
    // at both actual sagittal forks leaves their exact conic guide unchanged.
    const cut = (phase: number): [number, number, number] => {
      const sine: number = Math.sin(phase);
      const cosine: number = Math.cos(phase);
      const reach = separate ? roots[sine >= 0 ? 0 : 1]! - level : lift;
      if (retainedCrests !== undefined) {
        const wrap = Math.atan2(sine, cosine);
        const sign = wrap >= 0 ? 1 : -1;
        const t = Math.abs(wrap);
        const halfway = Math.PI / 2;
        const crest = retainedCrests[sign > 0 ? 0 : 1]!;
        if (t >= crest) return [level, 0, 0];
        const span = t <= halfway ? halfway : crest - halfway;
        const rate = (t <= halfway ? sign : -sign) / span;
        const u = (t <= halfway ? t : crest - t) / span;
        // Zero slope and curvature at the actual sagittal fork, lateral
        // support and posterior landmark require the minimum quintic step.
        return [
          level + reach * u ** 3 * (10 + u * (-15 + 6 * u)),
          reach * rate * 30 * u ** 2 * (1 - u) ** 2,
          reach * rate ** 2 * 60 * u * (1 - u) * (1 - 2 * u),
        ];
      }
      return [
        level + reach * sine ** 4,
        4 * reach * sine ** 3 * cosine,
        4 * reach * (3 * sine * sine * cosine * cosine - sine ** 4),
      ];
    };
    return { cut, roots, lift };
  }

  /** The source's cross derivative stripped of its native phase shear. */
  export function transverse({ u, v }: Solid.IJet): P3 {
    return Vec.unit(Vec.sub(u, Vec.scale(v, Vec.dot(u, v) / Vec.dot(v, v))))!;
  }
}
