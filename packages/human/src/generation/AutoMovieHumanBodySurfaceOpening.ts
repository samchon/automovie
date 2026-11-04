import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanApertureSeam } from "./AutoMovieHumanApertureSeam";
import { AutoMovieHumanApertureSpan } from "./AutoMovieHumanApertureSpan";
import { AutoMovieHumanAperturePocket } from "./AutoMovieHumanAperturePocket";
import type { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfaceLoft } from "./AutoMovieHumanBodySurfaceLoft";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import { AutoMovieHumanEyelidSurface } from "./AutoMovieHumanEyelidSurface";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const { chain, interval } = AutoMovieHumanBodySurfaceRead;
type IPoint = AutoMovieHumanApertureSpan.IPoint;

/**
 * An opening closed from its trim (`AutoMovieHumanApertureSpan`): the rim's
 * vertices on their chains (a slit's drawn on the line it closes on,
 * `AutoMovieHumanApertureSeam`), the zipper from the chains' hole to them, and
 * the lid band (an eye) or the pocket (a nostril) built from each chain's own
 * derivative across the loop. The rim's points are kept as the opening's rim
 * (`IAutoMovieHumanSurfaceContext.rims`).
 *
 * A rim on one chain is zipped to its hole in that chain's chart. A rim on two
 * chains is zipped in the opening's own plane (its outline's lateral and up
 * axes), where every rim point and every hole vertex is the surface at its own
 * chain's chart point, since the two chains' charts are not one chart.
 */
export namespace AutoMovieHumanBodySurfaceOpening {
  /**
   * Close one opening.
   *
   * @param context The surface's buffers, holes and roots.
   * @param prepared The opening.
   * @param span Its trim on its chains.
   * @param events The calibration's events, which name the rings chains share.
   */
  export function open(
    context: IContext,
    prepared: AutoMovieHumanBodyApertures.IPrepared,
    span: AutoMovieHumanApertureSpan.ISpan,
    events: readonly IAutoMovieHumanBodyCalibration.IEvent[],
  ): IAutoMovieHumanConstructionPath[] {
    // A slit's rim is drawn on its chains as the line it closes on.
    const seam = prepared.aperture.seam;
    const points: IPoint[] =
      seam === undefined
        ? span.points
        : AutoMovieHumanApertureSeam.drawn(
            span.points,
            seam,
            (name: string): IAutoMovieLoftChain => chain(context, name),
            (name: string, end: "bottom" | "top", t: number): IAutoMovieLoftChain | null => beyond(context, events, name, end, t),
          );
    const single: boolean =
      span.chains.length === 1 && points.every((p: IPoint): boolean => p.chain === span.chains[0]);
    const base: IAutoMovieLoftChain = chain(context, span.chains[0]!);
    const own: IPoint[] = points.filter((p: IPoint): boolean => p.chain === base.name);
    const middle: number = own.reduce((a: number, p: IPoint): number => a + p.s, 0) / Math.max(1, own.length);
    AutoMovieHumanLoftMesh.group(context.mesh, interval(base, middle, middle));

    // The rim's vertices, each the surface at its own chain's chart point.
    const rim: [number, number, number][] = points.map(
      (p: IPoint): [number, number, number] => AutoMovieLoftChain.point(chain(context, p.chain), p.s, p.t),
    );
    context.rims.set(prepared.aperture.name, rim);
    const ring: number[] = AutoMovieHumanLoftMesh.vertices(context.mesh, rim);
    for (const p of points)
      context.coordinates.push(context.indices.get(p.chain)!, p.s, ((p.t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const reference = AutoMovieHumanBodyRoots.outward(base, points[0]!.s, points[0]!.t);

    // The zipper from the hole to the rim, in one chart.
    if (single) {
      const trim: [number, number][] = span.loops.get(base.name)!;
      const [edge, charts] = AutoMovieHumanBodySurfaceLoft.holeEdge(context, base.name, trim);
      const loop: [number, number][] = points.map((p: IPoint): [number, number] => [p.s, p.t]);
      AutoMovieHumanBodyRoots.orient(context.mesh, reference, (): void =>
        AutoMovieHumanBodyRoots.zip(context.mesh, ring, loop, edge, charts),
      );
    } else {
      const flat = (p: readonly number[]): [number, number] => [
        p[0]! * prepared.outline.lateral[0] + p[1]! * prepared.outline.lateral[1] + p[2]! * prepared.outline.lateral[2],
        p[0]! * prepared.outline.up[0] + p[1]! * prepared.outline.up[1] + p[2]! * prepared.outline.up[2],
      ];
      // The hole is the span's own when the trim spans two chains, else its
      // chain's, which a slit's drawn rim left for the neighbour beyond.
      const key: string =
        span.chains.length > 1 ? AutoMovieHumanApertureSpan.key(prepared.aperture.name) : base.name;
      const [edge, charts] = spanEdge(context, key, rim.map(flat), flat);
      AutoMovieHumanBodyRoots.orient(context.mesh, reference, (): void =>
        AutoMovieHumanBodyRoots.zip(context.mesh, ring, rim.map(flat), edge, charts, Infinity),
      );
    }
    const lid = prepared.lid;
    if (lid === null && !(prepared.aperture.pocket! > 0)) return [];

    // Each chain's unit tangent across the loop, away from the opening: the
    // loop's turning sense in that chain's chart, and the chord between the
    // nearest neighbours the chain has a chart point for.
    const senses: Map<string, number> = new Map();
    for (const [name, loop] of span.loops) {
      const area: number = loop.reduce((a: number, p: [number, number], i: number): number => {
        const q: [number, number] = loop[(i + 1) % loop.length]!;
        return a + p[1] * q[0] - q[1] * p[0];
      }, 0);
      senses.set(name, area >= 0 ? 1 : -1);
    }
    const n: number = points.length;
    const slopes = points.map((p: IPoint, i: number) => {
      const near = (direction: number): [number, number] => {
        for (let k: number = 1; k < n; k++) {
          const c: [number, number] | null = chartOn(points[(i + direction * k + n * k) % n]!, p.chain);
          if (c !== null) return c;
        }
        return [p.s, p.t];
      };
      const a: [number, number] = near(-1);
      const b: [number, number] = near(1);
      const sense: number = senses.get(p.chain) ?? senses.get(base.name) ?? 1;
      return AutoMovieHumanBodyRoots.across(chain(context, p.chain), p.s, p.t, sense * (b[0] - a[0]), -sense * (b[1] - a[1]))[0];
    });
    let construction: IAutoMovieHumanConstructionPath[] = [];
    const emit = (_: string, ...corners: number[]): void => {
      context.mesh.indices.push(...corners);
    };
    AutoMovieHumanBodyRoots.orient(context.mesh, reference, (): void => {
      construction =
        lid !== null
          ? AutoMovieHumanEyelidSurface.loop(context.mesh, lid, ring, slopes, emit)
          : AutoMovieHumanAperturePocket.loop(context.mesh, prepared.aperture, ring, rim, slopes, emit);
    });

    // Vertices the closure added carry no loft coordinates.
    while (context.coordinates.length < context.mesh.positions.length) context.coordinates.push(NaN);
    return construction;
  }

  /**
   * The chain beyond an end of a chain through the ring they share: past a
   * parent's contact layer the child whose arc of the ring holds the phase,
   * past a child's inherited end the parent.
   */
  function beyond(
    context: IContext,
    events: readonly IAutoMovieHumanBodyCalibration.IEvent[],
    name: string,
    end: "bottom" | "top",
    t: number,
  ): IAutoMovieLoftChain | null {
    const two: number = 2 * Math.PI;
    const phase: number = ((t % two) + two) % two;
    const holds = (arc: [number, number]): boolean =>
      arc[0] <= arc[1] ? arc[0] <= phase && phase <= arc[1] : phase >= arc[0] || phase <= arc[1];
    for (const e of events) {
      const contact: "bottom" | "top" = e.direction === "down" ? "bottom" : "top";
      if (e.parent === name && end === contact) {
        const child: string | undefined = e.splits.find(
          (sp: IAutoMovieHumanBodyCalibration.ISplit): boolean => context.chains.has(sp.child) && sp.arcs.some(holds),
        )?.child;
        return child === undefined ? null : chain(context, child);
      }
      const childEnd: "bottom" | "top" = contact === "bottom" ? "top" : "bottom";
      if (end === childEnd && e.splits.some((sp: IAutoMovieHumanBodyCalibration.ISplit): boolean => sp.child === name))
        return chain(context, e.parent);
    }
    return null;
  }

  /** A point's chart on a chain: its own, its copy on the shared ring, or null. */
  function chartOn(p: IPoint, name: string): [number, number] | null {
    if (p.chain === name) return [p.s, p.t];
    if (p.also?.chain === name) return [p.also.s, p.also.t];
    return null;
  }

  /**
   * The hole round a rim on more than one chain: the closed edge of the
   * cells left under the hole's key nearest the rim, as vertices and their
   * places in the opening's plane, each read from the surface at the vertex's
   * own chain and chart point.
   */
  function spanEdge(
    context: IContext,
    key: string,
    rim: readonly [number, number][],
    flat: (p: readonly number[]) => [number, number],
  ): [number[], [number, number][]] {
    const hole = context.holes.get(key);
    if (hole === undefined) throw new Error(`Hole ${key} was not left`);
    const place = (v: number): [number, number] => {
      const [s, t] = hole.charts.get(v)!;
      return flat(AutoMovieLoftChain.point(chain(context, hole.owners.get(v)!), s, t));
    };
    const centre: [number, number] = rim.reduce(
      (a: [number, number], p: [number, number]): [number, number] => [a[0] + p[0] / rim.length, a[1] + p[1] / rim.length],
      [0, 0],
    );
    const loops: [number[], [number, number][]][] = AutoMovieHumanBodySurfaceLoft.boundaryLoops(hole.cells).map(
      (loop: number[]): [number[], [number, number][]] => [loop, loop.map(place)],
    );
    const distance = (charts: [number, number][]): number =>
      charts.reduce((a: number, p: [number, number]): number => a + Math.hypot(p[0] - centre[0], p[1] - centre[1]), 0) / charts.length;
    const edge: [number[], [number, number][]] | undefined = loops.sort(
      (a: [number[], [number, number][]], b: [number[], [number, number][]]): number => distance(a[1]) - distance(b[1]),
    )[0];
    if (edge === undefined) throw new Error(`Hole ${key} has no edge near its rim`);
    return edge;
  }
}
