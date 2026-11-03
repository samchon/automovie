import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftStations } from "../lofting/AutoMovieHumanLoftStations";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanAperturePocket } from "./AutoMovieHumanAperturePocket";
import { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfacePhases } from "./AutoMovieHumanBodySurfacePhases";
import { AutoMovieHumanBodySurfacePoles } from "./AutoMovieHumanBodySurfacePoles";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import { AutoMovieHumanEyelidSurface } from "./AutoMovieHumanEyelidSurface";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";
import type { IAutoMovieHumanSurfaceBoundary as IBoundary } from "./IAutoMovieHumanSurfaceBoundary";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const { chain, endHeight, interval, ringVertices } = AutoMovieHumanBodySurfaceRead;
const { boundary, cells, domeBase, pole } = AutoMovieHumanBodySurfacePoles;
const { inheritedPhases, ownPhases } = AutoMovieHumanBodySurfacePhases;

/** A chain lofted between its owned and inherited rings and poles, its holes, and the zipper that joins it to its neighbours. */
export namespace AutoMovieHumanBodySurfaceLoft {
  /**
   * Loft one chain between its resolved bottom and top boundaries.
   *
   * Rings are generated at the interior bisection stations in the chain's
   * own phase set. An own boundary ring already has that phase set and joins
   * by an ordinary band; an inherited ring joins by a zipper; a missing
   * boundary is generated at the end height, or at the dome base of a
   * rounded pole, and closed at its pole.
   */
  export function loft(context: IContext, target: IAutoMovieHumanLoftChain): void {
    const phases: number[] = ownPhases(context, target);
    const bottom: IBoundary = boundary(context, target, "bottom");
    const top: IBoundary = boundary(context, target, "top");
    // A rounded pole closes from its dome base instead of the chain's end.
    const bottomY: number =
      (bottom.kind === "pole" ? domeBase(context, target, "bottom") : null) ??
      endHeight(target, "bottom");
    const topY: number =
      (top.kind === "pole" ? domeBase(context, target, "top") : null) ??
      endHeight(target, "top");
    // Bisection stations, refined where the rings pass near an opening. A
    // cap's sections all sit on its pole at its bottom station, so its
    // rings start at the next station and its pole closes them by a fan.
    const bisected: number[] = AutoMovieHumanBodyApertures.detail(
      context.details,
      target,
      AutoMovieHumanBodyApertures.refine(
        context.apertures,
        target,
        AutoMovieHumanLoftStations.bisect(
          target,
          bottomY,
          topY,
          context.tolerance,
        ),
        phases,
      ),
      phases,
    );
    const heights: number[] =
      target.pole?.end === "bottom" && bottom.kind === "pole"
        ? bisected.slice(1)
        : target.pole?.end === "top" && top.kind === "pole"
          ? bisected.slice(0, -1)
          : bisected;

    // Ring and phase set at each station. Ends come from their boundaries
    // when inherited or owned, and are generated here when the end is a
    // pole.
    const ringPhases: (readonly number[])[] = [];
    const rings: number[][] = heights.map((y: number, k: number): number[] => {
      const end: IBoundary | undefined =
        k === 0 ? bottom : k === heights.length - 1 ? top : undefined;
      if (end !== undefined && (end.kind === "own" || end.kind === "inherited")) {
        ringPhases.push(
          end.kind === "inherited"
            ? inheritedPhases(context, target, y, end.ring)
            : phases,
        );
        return end.ring;
      }

      ringPhases.push(phases);
      return ringVertices(context, target, y, phases);
    });

    // Bands between consecutive stations, grouped by principal interval.
    for (let k: number = 0; k + 1 < heights.length; k++) {
      AutoMovieHumanLoftMesh.group(
        context.mesh,
        interval(target, heights[k]!, heights[k + 1]!),
      );
      // Rings with one shared phase set join by a band, leaving out the
      // cells inside a root loop; inherited rings join by a zipper.
      if (ringPhases[k] === ringPhases[k + 1])
        cells(
          context,
          target,
          rings[k]!,
          rings[k + 1]!,
          heights[k]!,
          heights[k + 1]!,
          ringPhases[k]!,
        );
      else
        AutoMovieHumanLoftMesh.zipper(
          context.mesh,
          rings[k]!,
          ringPhases[k]!,
          rings[k + 1]!,
          ringPhases[k + 1]!,
        );
    }

    // Poles close the ends that no event owns, but for a pole a root winds
    // round, whose cells the root left out; an appendage keeps its root
    // ring for its strip.
    const wound = (end: "bottom" | "top"): boolean =>
      target.pole?.end === end &&
      (context.roots.get(target.name) ?? []).some((r): boolean => r.appendage?.winding !== undefined);
    if (bottom.kind === "pole" && !wound("bottom")) pole(context, target, "bottom", rings[0]!);
    if (top.kind === "pole" && !wound("top"))
      pole(context, target, "top", rings[rings.length - 1]!);
    if (bottom.kind === "root")
      context.ends.set(target.name, { ring: rings[0]!, phases: ringPhases[0]! });
    if (top.kind === "root")
      context.ends.set(target.name, {
        ring: rings[rings.length - 1]!,
        phases: ringPhases[ringPhases.length - 1]!,
      });
  }

  /**
   * Join one appendage to its base: the hole the base left round the root
   * loop, traced from the cells left out, and the strip to the appendage's
   * root ring.
   */
  export function join(
    context: IContext,
    appendage: IAutoMovieHumanBodyCalibration.IAppendage,
  ): void {
    const base: IAutoMovieHumanLoftChain = chain(context, appendage.base);
    const own: IAutoMovieHumanLoftChain = chain(context, appendage.chain);
    const end = context.ends.get(appendage.chain);
    if (end === undefined)
      throw new Error(`Appendage ${appendage.chain} has no root on ${appendage.base}`);
    const [edge, charts] = holeEdge(
      context,
      appendage.base,
      AutoMovieHumanBodyRoots.polygon(appendage.root, LOOP, appendage.winding),
      appendage.winding !== undefined,
    );
    AutoMovieHumanLoftMesh.group(context.mesh, `${appendage.chain}/root`);
    AutoMovieHumanBodyRoots.join(
      context.mesh,
      context.coordinates,
      base,
      context.indices.get(base.name)!,
      own,
      appendage,
      end.ring,
      end.phases,
      edge,
      charts,
    );
  }

  /**
   * Close an opening on its base from its trim loop: the loop's vertices on
   * the base, the zipper from the base's hole to them, and the lid band (an
   * eye) built from the base's own derivative across the loop.
   */
  export function open(
    context: IContext,
    base: IAutoMovieHumanLoftChain,
    prepared: AutoMovieHumanBodyApertures.IPrepared,
    loop: [number, number][],
  ): IAutoMovieHumanConstructionPath[] {
    const [edge, charts] = holeEdge(context, base.name, loop);
    const index: number = context.indices.get(base.name)!;
    const middle: number = loop.reduce((a: number, p: [number, number]): number => a + p[0], 0) / loop.length;
    AutoMovieHumanLoftMesh.group(context.mesh, interval(base, middle, middle));
    const ring: number[] = AutoMovieHumanLoftMesh.vertices(
      context.mesh,
      loop.map(([s, t]: [number, number]): [number, number, number] => AutoMovieHumanLoftChain.ring(base, s, [t])[0]!),
    );
    for (const [s, t] of loop) context.coordinates.push(index, s, ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const reference = AutoMovieHumanBodyRoots.outward(base, loop[0]![0], loop[0]![1]);
    AutoMovieHumanBodyRoots.orient(context.mesh, reference, (): void =>
      AutoMovieHumanBodyRoots.zip(context.mesh, ring, loop, edge, charts),
    );
    const lid = prepared.lid;
    if (lid === null && !(prepared.aperture.pocket! > 0)) return [];
    // The base's unit tangent across the loop, away from the opening.
    const area: number = loop.reduce((a: number, p: [number, number], i: number): number => {
      const q: [number, number] = loop[(i + 1) % loop.length]!;
      return a + p[1] * q[0] - q[1] * p[0];
    }, 0);
    const sense: number = area >= 0 ? 1 : -1;
    const slopes = loop.map(([s, t]: [number, number], i: number) => {
      const a: [number, number] = loop[(i - 1 + loop.length) % loop.length]!;
      const b: [number, number] = loop[(i + 1) % loop.length]!;
      const ds: number = b[0] - a[0];
      const dt: number = b[1] - a[1];
      return AutoMovieHumanBodyRoots.across(base, s, t, sense * ds, -sense * dt)[0];
    });
    let construction: IAutoMovieHumanConstructionPath[] = [];
    const emit = (_: string, ...corners: number[]): void => {
      context.mesh.indices.push(...corners);
    };
    AutoMovieHumanBodyRoots.orient(context.mesh, reference, (): void => {
      construction =
        lid !== null
          ? AutoMovieHumanEyelidSurface.loop(context.mesh, lid, ring, slopes, emit)
          : AutoMovieHumanAperturePocket.loop(context.mesh, prepared.aperture, ring, slopes, emit);
    });
    // Vertices the closure added carry no loft coordinates.
    while (context.coordinates.length < context.mesh.positions.length) context.coordinates.push(NaN);
    return construction;
  }

  /**
   * The hole a base left round a loop: the closed edge of its left-out
   * cells nearest the loop, as vertices and their chart points; for a loop
   * winding round the cap pole, the edge ring whose mean station is the
   * loop's nearest.
   */
  export function holeEdge(
    context: IContext,
    baseName: string,
    loopPolygon: [number, number][],
    winding: boolean = false,
  ): [number[], [number, number][]] {
    const hole = context.holes.get(baseName);
    if (hole === undefined) throw new Error(`Base ${baseName} left no hole`);

    // Edges of the left-out region: cell edges no other left-out cell shares.
    const count: Map<string, [number, number, number]> = new Map();
    for (const c of hole.cells)
      for (let e: number = 0; e < 4; e++) {
        const a: number = c[e]!;
        const b: number = c[(e + 1) % 4]!;
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        const seen = count.get(key);
        count.set(key, [a, b, (seen?.[2] ?? 0) + 1]);
      }
    const next: Map<number, number[]> = new Map();
    for (const [a, b, k] of count.values()) {
      if (k !== 1) continue;
      next.set(a, [...(next.get(a) ?? []), b]);
      next.set(b, [...(next.get(b) ?? []), a]);
    }

    // Closed loops of those edges; the one round this appendage's root.
    const loops: number[][] = [];
    const used: Set<number> = new Set();
    for (const startVertex of next.keys()) {
      if (used.has(startVertex)) continue;
      const loop: number[] = [startVertex];
      used.add(startVertex);
      let previous: number = -1;
      let current: number = startVertex;
      for (;;) {
        const candidates: number[] = (next.get(current) ?? []).filter(
          (v: number): boolean => v !== previous,
        );
        const v: number | undefined = candidates.find(
          (x: number): boolean => !used.has(x) || x === startVertex,
        );
        if (v === undefined || v === startVertex) break;
        loop.push(v);
        used.add(v);
        previous = current;
        current = v;
      }
      loops.push(loop);
    }
    const centre: [number, number] = loopPolygon.reduce(
      (a: [number, number], p: [number, number]): [number, number] => [
        a[0] + p[0] / loopPolygon.length,
        a[1] + p[1] / loopPolygon.length,
      ],
      [0, 0],
    );
    const distance = (loop: number[]): number =>
      winding
        ? Math.abs(
            loop.reduce((a: number, v: number): number => a + hole.charts.get(v)![0], 0) / loop.length -
              centre[0],
          )
        : loop.reduce((a: number, v: number): number => {
            const [s, t] = hole.charts.get(v)!;
            const dt: number = Math.atan2(
              Math.sin(t - centre[1]),
              Math.cos(t - centre[1]),
            );
            return a + Math.hypot(s - centre[0], dt * 100);
          }, 0) / loop.length;
    const edge: number[] | undefined = loops.sort(
      (a: number[], b: number[]): number => distance(a) - distance(b),
    )[0];
    if (edge === undefined) throw new Error(`Base ${baseName} left no hole near a loop`);
    return [edge, edge.map((v: number): [number, number] => hole.charts.get(v)!)];
  }

  /** Samples of a root loop when testing cells against it. */
  export const LOOP: number = 256;
}
