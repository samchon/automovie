import type { IAutoMovieViewPart } from "@automovie/engine";
import type {
  AutoMovieConstructionAxis,
  AutoMovieConstructionFullness,
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionOutlinePair,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A body part's view record in the construction tree (`IAutoMovieConstructionView`)
 * from the operator's part the part's own laws built (`AutoMovieHumanSiteViewPart`):
 * the same stations, outlines, fullness owner, closure, order and samples,
 * moved from the kernel's millimetres to the tree's metres, with the axis as
 * the data record the engine rebuilds the same frame from. Nothing is
 * recomputed, so the part the tree realizes is the part the laws built.
 */
export namespace AutoMovieHumanConstructionView {
  /** Metres per millimetre: the tree's unit over the kernel's. */
  export const METRES: number = 1 / 1000;

  /**
   * The view record.
   *
   * @param part The operator's part, millimetres.
   * @param axis The part's axis record, metres, naming the frame the part was lofted in.
   * @returns The view, metres.
   */
  export function of(part: IAutoMovieViewPart, axis: AutoMovieConstructionAxis): IAutoMovieConstructionView {
    return {
      type: "view",
      name: part.name,
      axis,
      stations: part.stations.map((s: number): number => s * METRES),
      front: pair(part.front),
      side: pair(part.side),
      fullness: fullness(part.fullness),
      pole: part.pole ?? "open",
      order: part.order,
      samples: part.samples,
    };
  }

  /**
   * A point from millimetres.
   *
   * @param p The point, mm.
   * @returns The point, metres.
   */
  export function point(p: readonly number[]): IAutoMovieVector3 {
    return { x: p[0]! * METRES, y: p[1]! * METRES, z: p[2]! * METRES };
  }

  /**
   * A direction, unscaled.
   *
   * @param d The direction.
   * @returns The same direction as a record.
   */
  export function direction(d: readonly number[]): IAutoMovieVector3 {
    return { x: d[0]!, y: d[1]!, z: d[2]! };
  }

  /**
   * A curve of lengths in metres.
   *
   * @param outline The curve, millimetres of station and value.
   * @returns The curve, metres.
   */
  export function length(outline: IAutoMovieViewPart.IOutline): IAutoMovieConstructionOutline {
    return { knots: outline.knots.map((k: IAutoMovieViewPart.IKnot): IAutoMovieConstructionKnot => ({ site: k.site, station: k.station * METRES, value: k.value * METRES })) };
  }

  /** A curve of shares, its stations in metres. */
  function share(outline: IAutoMovieViewPart.IOutline): IAutoMovieConstructionOutline {
    return { knots: outline.knots.map((k: IAutoMovieViewPart.IKnot): IAutoMovieConstructionKnot => ({ site: k.site, station: k.station * METRES, value: k.value })) };
  }

  /** A view's two edges in metres. */
  function pair(p: IAutoMovieViewPart.IPair): IAutoMovieConstructionOutlinePair {
    return { positive: length(p.positive), negative: length(p.negative) };
  }

  /** Four quarters' share curves. */
  function quarters(
    q: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>,
  ): [IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline, IAutoMovieConstructionOutline] {
    return [share(q[0]), share(q[1]), share(q[2]), share(q[3])];
  }

  /** The fullness owner as the tree's record. */
  function fullness(f: IAutoMovieViewPart.Fullness): AutoMovieConstructionFullness {
    switch (f.kind) {
      case "girth":
        return { type: "girth", girth: length(f.girth), departures: f.departures === undefined ? null : quarters(f.departures) };
      case "shoulder":
        return { type: "shoulder", shoulder: share(f.shoulder), departures: f.departures === undefined ? null : quarters(f.departures) };
      case "top":
        return { type: "top", shoulders: quarters(f.shoulders) };
    }
  }
}
