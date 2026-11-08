import {
  AutoMovieLoftSection,
  type IAutoMovieLoftChain,
} from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftStations } from "../lofting/AutoMovieHumanLoftStations";
import { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfacePhases } from "./AutoMovieHumanBodySurfacePhases";
import { AutoMovieHumanBodySurfacePoles } from "./AutoMovieHumanBodySurfacePoles";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanSurfaceBoundary as IBoundary } from "./IAutoMovieHumanSurfaceBoundary";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const {
  chain,
  endHeight,
  capHeight,
  interval,
  ringVertices,
}: typeof AutoMovieHumanBodySurfaceRead = AutoMovieHumanBodySurfaceRead;
const {
  boundary,
  cells,
  domeBase,
  pole,
  zipped,
}: typeof AutoMovieHumanBodySurfacePoles = AutoMovieHumanBodySurfacePoles;
const { inheritedPhases, ownPhases }: typeof AutoMovieHumanBodySurfacePhases =
  AutoMovieHumanBodySurfacePhases;

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
   *
   * @evidence contracts/common.md#principled-implementation Retained pole source.station extends bisection through the public original Point0 domain. Only exact zero tips are omitted as rings; every positive principal section survives.
   * @evidence contracts/common.md#clear-and-simple-design Existing adaptive bands read both regular and retained cap values; the last tiny ring closes at its explicit pole point.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move an original curve, sample an unpublished source domain or invent a replacement cap law.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes retained original caps, legacy calibrated domes and event-owned cut boundaries; Point0 does not promise physical2 at a zero tip.
   * @evidence contracts/performance.md#efficient-algorithms Extends the existing bounded bisection by at most two owned cap intervals, retaining its tolerance/depth and principal knots.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the same chain source owner as ring generation, without another body or curve preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Endpoint closures are local to this call; no source cache or mesh is retained globally here.
   */
  export function loft(context: IContext, target: IAutoMovieLoftChain): void {
    const phases: number[] = ownPhases(context, target);
    const bottom: IBoundary = boundary(context, target, "bottom");
    const top: IBoundary = boundary(context, target, "top");
    // Retained caps use the actual source domain. Event-owned boundaries do
    // not restore a cut-away end, and legacy calibrated domes stay separate.
    const bottomTip: number | null =
      bottom.kind === "pole" ? capHeight(target, "bottom") : null;
    const topTip: number | null =
      top.kind === "pole" ? capHeight(target, "top") : null;
    const bottomY: number =
      bottomTip ??
      (bottom.kind === "pole" ? domeBase(context, target, "bottom") : null) ??
      endHeight(target, "bottom");
    const topY: number =
      topTip ??
      (top.kind === "pole" ? domeBase(context, target, "top") : null) ??
      endHeight(target, "top");
    // Bisection stations, refined where the rings pass near an opening. A
    // A legacy zero end can be omitted. A source-owned positive principal
    // section is already inside its true pole and must remain in the loft.
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
    const heights: number[] = bisected.filter(
      (station: number, index: number): boolean => {
        if (station === bottomTip || station === topTip) return false;
        if (
          index === 0 &&
          bottom.kind === "pole" &&
          bottomTip === null &&
          (target.pole?.end === "bottom" ||
            target.opposite?.end === "bottom") &&
          !positiveEnd(target, "bottom")
        )
          return false;
        if (
          index === bisected.length - 1 &&
          top.kind === "pole" &&
          topTip === null &&
          (target.pole?.end === "top" || target.opposite?.end === "top") &&
          !positiveEnd(target, "top")
        )
          return false;
        return true;
      },
    );

    // Ring and phase set at each station. Ends come from their boundaries
    // when inherited or owned, and are generated here when the end is a
    // pole.
    const ringPhases: (readonly number[])[] = [];
    const rings: number[][] = heights.map((y: number, k: number): number[] => {
      const end: IBoundary | undefined =
        k === 0 ? bottom : k === heights.length - 1 ? top : undefined;
      if (
        end !== undefined &&
        (end.kind === "own" || end.kind === "inherited")
      ) {
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
        zipped(
          context,
          target,
          rings[k]!,
          ringPhases[k]!,
          rings[k + 1]!,
          ringPhases[k + 1]!,
          heights[k]!,
          heights[k + 1]!,
        );
    }

    // Poles close the ends that no event owns, but for a pole a root winds
    // round, whose cells the root left out; an appendage keeps its root
    // ring for its strip.
    const wound: (end: "bottom" | "top") => boolean = (
      end: "bottom" | "top",
    ): boolean =>
      (target.pole?.end === end || target.opposite?.end === end) &&
      (context.roots.get(target.name) ?? []).some(
        (r): boolean => r.appendage?.winding !== undefined,
      );
    if (bottom.kind === "pole" && !wound("bottom"))
      pole(context, target, "bottom", rings[0]!);
    if (top.kind === "pole" && !wound("top"))
      pole(context, target, "top", rings[rings.length - 1]!);
    if (bottom.kind === "root")
      context.ends.set(target.name, {
        ring: rings[0]!,
        phases: ringPhases[0]!,
      });
    if (top.kind === "root")
      context.ends.set(target.name, {
        ring: rings[rings.length - 1]!,
        phases: ringPhases[ringPhases.length - 1]!,
      });
  }

  /** Read the actual explicit regular section, independently of physical station jets. Native conic principal sections have distinct cardinal values. Genuine legacy absence keeps its previous endpoint policy; no retained source domain is bypassed to replay an unavailable cap. */
  function positiveEnd(
    target: IAutoMovieLoftChain,
    end: "bottom" | "top",
  ): boolean {
    const source: ReturnType<typeof AutoMovieLoftSection.phase> =
      AutoMovieLoftSection.phase(target, endHeight(target, end));
    if (source === null) return false;
    const first: readonly number[] = source(0).p;
    return [Math.PI / 2, Math.PI, (3 * Math.PI) / 2].some(
      (phase: number): boolean =>
        source(phase).p.some(
          (value: number, axis: number): boolean => value !== first[axis],
        ),
    );
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
    const base: IAutoMovieLoftChain = chain(context, appendage.base);
    const own: IAutoMovieLoftChain = chain(context, appendage.chain);
    const end = context.ends.get(appendage.chain);
    if (end === undefined)
      throw new Error(
        `Appendage ${appendage.chain} has no root on ${appendage.base}`,
      );
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
    const loops: number[][] = boundaryLoops(hole.cells);
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
            loop.reduce(
              (a: number, v: number): number => a + hole.charts.get(v)![0],
              0,
            ) /
              loop.length -
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
    if (edge === undefined)
      throw new Error(`Base ${baseName} left no hole near a loop`);
    return [
      edge,
      edge.map((v: number): [number, number] => hole.charts.get(v)!),
    ];
  }

  /**
   * The closed edge loops of a set of left-out cells: the cell edges no other
   * left-out cell shares, chained into loops of vertices.
   *
   * @param cells Cells as corner vertices in ring order, quads or triangles.
   */
  export function boundaryLoops(
    cells: readonly (readonly number[])[],
  ): number[][] {
    // Edges of the left-out region: cell edges no other left-out cell shares.
    const count: Map<string, [number, number, number]> = new Map();
    for (const c of cells)
      for (let e: number = 0; e < c.length; e++) {
        const a: number = c[e]!;
        const b: number = c[(e + 1) % c.length]!;
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

    // Closed loops of those edges.
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
    return loops;
  }

  /** Samples of a root loop when testing cells against it. */
  export const LOOP: number = 256;
}
