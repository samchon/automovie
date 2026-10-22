import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";

/**
 * Apertures applied to the lofted body: stations, margin vertices and the cut.
 *
 * See {@link AutoMovieHumanLoftAperture} for the representation. This module
 * applies it to chains by position only, so an aperture works on whichever
 * chain the opening falls in, including chains owned by other regions.
 */
export namespace AutoMovieHumanBodyApertures {
  /** An aperture with its dense margin and height range evaluated once. */
  export interface IPrepared {
    /** Aperture data. */
    aperture: IAutoMovieHumanLoftAperture;

    /** Dense margin polyline, mm. */
    margin: AutoMovieHumanLoftAperture.Point[];

    /** Lowest and highest margin height, mm. */
    range: [number, number];
  }

  /** Station spacing inside an aperture's height range, mm. */
  const SPACING: number = 0.5;

  /** Largest distance from a margin crossing to a ring for the ring to own it, mm. */
  const REACH: number = 4;

  /** Evaluate each aperture's margin once. */
  export function prepare(
    apertures: readonly IAutoMovieHumanLoftAperture[],
  ): IPrepared[] {
    return apertures.map(
      (aperture: IAutoMovieHumanLoftAperture): IPrepared => {
        const margin: AutoMovieHumanLoftAperture.Point[] =
          AutoMovieHumanLoftAperture.polyline(aperture);
        return {
          aperture,
          margin,
          range: AutoMovieHumanLoftAperture.range(margin),
        };
      },
    );
  }

  /**
   * Apertures whose margin lies on a chain's skin.
   *
   * Only horizontal chains take margin stations; a margin belongs to a chain
   * when, at its middle height inside the chain, its crossings lie within
   * reach of the chain's ring there.
   */
  export function on(
    prepared: readonly IPrepared[],
    target: IAutoMovieHumanLoftChain,
  ): IPrepared[] {
    if (target.layers.some((l): boolean => l.frame !== undefined)) return [];
    const bottom: number = target.layers[0]!.y;
    const top: number = target.layers[target.layers.length - 1]!.y;

    return prepared.filter((p: IPrepared): boolean => {
      const y: number = (Math.max(p.range[0], bottom) + Math.min(p.range[1], top)) / 2;
      if (y <= bottom || y >= top) return false;
      return AutoMovieHumanLoftAperture.crossings(p.margin, y).every(
        (c: AutoMovieHumanLoftAperture.Point): boolean =>
          nearest(target, y, c).distance < REACH,
      );
    });
  }

  /**
   * Stations refined inside every aperture height range of the chain.
   *
   * The margin's extreme heights and every SPACING mm between them become
   * stations, strictly inside the chain, so the opening is traced finely
   * whatever the bisection chose.
   */
  export function refine(
    apertures: readonly IPrepared[],
    heights: readonly number[],
  ): number[] {
    const bottom: number = heights[0]!;
    const top: number = heights[heights.length - 1]!;
    const extra: number[] = [];

    for (const p of apertures) {
      const lo: number = p.range[0];
      const hi: number = p.range[1];
      for (let y: number = lo; y < hi; y += SPACING) extra.push(y);
      extra.push(hi);
    }

    // Keep stations strictly inside the chain and drop near-duplicates.
    const all: number[] = [...heights, ...extra.filter((y: number): boolean => y > bottom + 1e-6 && y < top - 1e-6)]
      .sort((a: number, b: number): number => a - b);
    const out: number[] = [];
    for (const y of all)
      if (!out.length || y - out[out.length - 1]! > 1e-6) out.push(y);
    return out;
  }

  /**
   * Ring phases at a station with the margin crossings inserted.
   *
   * @returns The base phases when no margin crosses this height; otherwise a
   *   new ascending array including the crossing phases, and those phases.
   */
  export function phases(
    apertures: readonly IPrepared[],
    target: IAutoMovieHumanLoftChain,
    y: number,
    base: readonly number[],
  ): { phases: readonly number[]; margin: number[] } {
    const inserted: number[] = [];
    for (const p of apertures) {
      if (y < p.range[0] - 1e-9 || y > p.range[1] + 1e-9) continue;
      for (const c of AutoMovieHumanLoftAperture.crossings(p.margin, y)) {
        const found: { phase: number; distance: number } = nearest(target, y, c);
        if (found.distance < REACH) inserted.push(found.phase);
      }
    }
    if (!inserted.length) return { phases: base, margin: [] };

    // Drop base phases that nearly coincide with a crossing.
    const spacing: number = (2 * Math.PI) / Math.max(1, base.length);
    const kept: number[] = base.filter((t: number): boolean =>
      inserted.every((m: number): boolean => circular(t, m) > 0.25 * spacing),
    );
    return {
      phases: [...kept, ...inserted].sort((a: number, b: number): number => a - b),
      margin: inserted,
    };
  }

  /**
   * Drop the skin over every opening.
   *
   * A vertex is outside unless it is an inserted margin vertex or lies over
   * an opening by {@link AutoMovieHumanLoftAperture.inside}. A triangle is kept
   * when at least one of its vertices is outside. Groups are rebuilt so every
   * group keeps its remaining triangles.
   *
   * @param mesh Skin buffers with groups.
   * @param apertures Prepared apertures.
   * @param margin Indices of inserted margin vertices.
   */
  export function cut(
    mesh: AutoMovieHumanLoftMesh.IContext,
    apertures: readonly IPrepared[],
    margin: ReadonlySet<number>,
  ): void {
    if (!apertures.length) return;

    // Vertex classification, limited to each aperture's height band.
    const count: number = mesh.positions.length / 3;
    const outside: Uint8Array = new Uint8Array(count).fill(1);
    for (let v: number = 0; v < count; v++) {
      if (margin.has(v)) {
        outside[v] = 0;
        continue;
      }
      const p: AutoMovieHumanLoftAperture.Point = [
        mesh.positions[3 * v]!,
        mesh.positions[3 * v + 1]!,
        mesh.positions[3 * v + 2]!,
      ];
      for (const a of apertures)
        if (
          p[1] >= a.range[0] - 1 &&
          p[1] <= a.range[1] + 1 &&
          AutoMovieHumanLoftAperture.inside(a.aperture, a.margin, p)
        )
          outside[v] = 0;
    }

    // Filter triangles group by group, recording new group starts.
    const indices: number[] = [];
    const groups: { name: string; start: number }[] = [];
    mesh.groups.forEach((g: { name: string; start: number }, k: number): void => {
      const end: number = mesh.groups[k + 1]?.start ?? mesh.indices.length;
      groups.push({ name: g.name, start: indices.length });
      for (let t: number = g.start; t < end; t += 3) {
        const a: number = mesh.indices[t]!;
        const b: number = mesh.indices[t + 1]!;
        const c: number = mesh.indices[t + 2]!;
        if (outside[a] || outside[b] || outside[c]) indices.push(a, b, c);
      }
    });
    mesh.indices = indices;
    mesh.groups = groups;
  }

  /**
   * Phase on a chain's ring at height y nearest to a point, and the distance.
   *
   * A dense scan over 720 phases is refined by golden-section search on the
   * best bracket; the ring is smooth, so the bracket holds a single minimum.
   */
  function nearest(
    target: IAutoMovieHumanLoftChain,
    y: number,
    p: Readonly<AutoMovieHumanLoftAperture.Point>,
  ): { phase: number; distance: number } {
    const n: number = 720;
    const distance = (t: number): number => {
      const q: [number, number, number] = AutoMovieHumanLoftChain.ring(target, y, [t])[0]!;
      return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    };

    let best: number = 0;
    let value: number = Infinity;
    for (let i: number = 0; i < n; i++) {
      const d: number = distance((2 * Math.PI * i) / n);
      if (d < value) {
        value = d;
        best = i;
      }
    }

    // Golden-section refinement inside the neighbouring samples.
    let lo: number = (2 * Math.PI * (best - 1)) / n;
    let hi: number = (2 * Math.PI * (best + 1)) / n;
    const g: number = (Math.sqrt(5) - 1) / 2;
    for (let k: number = 0; k < 30; k++) {
      const a: number = hi - g * (hi - lo);
      const b: number = lo + g * (hi - lo);
      if (distance(a) < distance(b)) hi = b;
      else lo = a;
    }
    const phase: number = (lo + hi) / 2;
    return {
      phase: ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
      distance: distance(phase),
    };
  }

  /** Shortest circular distance between two phases. */
  function circular(a: number, b: number): number {
    return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  }
}
