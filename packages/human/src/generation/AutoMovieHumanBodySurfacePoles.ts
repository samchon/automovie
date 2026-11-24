import { AutoMovieLoftChain } from "@automovie/engine";
import type {
  IAutoMovieHumanSurfaceBoundary,
  IAutoMovieHumanSurfaceContext,
  IAutoMovieHumanSurfacePole,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";

const { endHeight, capHeight }: typeof AutoMovieHumanBodySurfaceRead =
  AutoMovieHumanBodySurfaceRead;

/** A chain's closed ends: the pole caps and domes, their base rings, and the cells and boundaries a chain's grid closes on. */
export namespace AutoMovieHumanBodySurfacePoles {
  /**
   * Close a chain end with a fan to its pole.
   *
   * A calibrated pole is the recovered critical point (crown, fingertip) or
   * a provisional closure point; without one the end closes at its axis.
   * Both declared endpoint points take precedence over a calibrated fallback
   * or the regular-end axis. A retained cap has already been sampled by the
   * loft owner; its final tiny ring closes at this true tip station. A
   * legacy straight fan alone does not replay an original cap interval.
   *
   * @evidence contracts/common.md#principled-implementation Both pole and opposite are consumed as explicit endpoint point data before calibrated or axis fallbacks.
   * @evidence contracts/common.md#clear-and-simple-design One endpoint owner selects the point and keeps the existing fan/dome emission path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not replace an original cap profile or promote a finite endpoint point to physical2 or G2 support.
   * @evidence contracts/common.md#meaningful-documentation States point precedence and the fan's distinct source-fidelity limit.
   * @evidence contracts/performance.md#efficient-algorithms Point selection adds one constant check to the existing bounded cap construction.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the producer's endpoint record without another source or recovered point.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The existing call-owned mesh owns emitted vertices; point selection introduces no retained resource.
   */
  export function pole(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
    end: "top" | "bottom",
    ring: number[],
  ): void {
    const tip: number | null = capHeight(target, end);
    const y: number = tip ?? endHeight(target, end);
    const calibrated: IAutoMovieHumanSurfacePole | undefined =
      context.poles.get(target.name + ":" + end);
    const point: [number, number, number] =
      (target.pole?.end === end ? target.pole.point : undefined) ??
      (target.opposite?.end === end ? target.opposite.point : undefined) ??
      calibrated?.point ??
      AutoMovieLoftChain.axis(target, y);

    AutoMovieHumanLoftMesh.group(
      context.mesh,
      target.name +
        "/" +
        (end === "top" ? target.layers.length - 2 : 0).toString(),
    );

    // A recovered critical point closes the chain with a rounded dome: each
    // ring vertex v runs to the apex p along the quarter ellipse
    // c + (v - c) cos(a) + (p - c) sin(a), a from 0 to pi/2, c the ring's
    // centroid. Its tangent at the ring points along c -> p, the chain's
    // own direction there, and at the apex it lies across it, so the tip is
    // round instead of the cone a direct fan draws (pointed fingertips and
    // toe tips). The ring is the dome base's (see domeBase), so the dome
    // replaces the fitted point rings. A provisional closure keeps the flat
    // fan.
    //
    // The profile x = r cos(a), y = h sin(a) turns its tangent by
    // r h / (r^2 sin^2 a + h^2 cos^2 a) per unit of a, at most max(r/h, h/r),
    // so the dome takes as many rings as keep each step's turn within
    // {@link DOME_TURN}, but no step shorter than the surface's chord
    // tolerance. Its points are not on the chain, so they carry the
    // dome's own normal, d/da x d/du of the quarter ellipse, rather than the
    // faceted mesh's.
    let last: number[] = ring;
    if (tip === null && calibrated?.critical === true) {
      const corners: [number, number, number][] = ring.map(
        (v: number): [number, number, number] =>
          AutoMovieHumanLoftMesh.position(context.mesh, v),
      );
      const c: [number, number, number] = [0, 1, 2].map(
        (k: number): number =>
          corners.reduce(
            (sum: number, q: [number, number, number]): number => sum + q[k]!,
            0,
          ) / corners.length,
      ) as [number, number, number];
      const radius: number =
        corners.reduce(
          (sum: number, q: [number, number, number]): number =>
            sum + Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]),
          0,
        ) / corners.length;
      const height: number = Math.hypot(
        point[0] - c[0],
        point[1] - c[1],
        point[2] - c[2],
      );
      const steep: number =
        radius > 0 && height > 0
          ? Math.max(radius / height, height / radius)
          : 1;
      // A step shorter than the surface's own tolerance needs no splitting,
      // which keeps a flat crown or a sub-millimetre tip from taking dozens.
      const arc: number =
        (Math.PI / 2) * Math.sqrt((radius * radius + height * height) / 2);
      const count: number = Math.min(
        DOME_MOST,
        Math.max(
          DOME,
          Math.min(
            Math.ceil(((Math.PI / 2) * steep) / DOME_TURN),
            Math.ceil(arc / context.tolerance),
          ),
        ),
      );
      const n: number = corners.length;
      for (let i: number = 1; i < count; i++) {
        const a: number = (Math.PI / 2) * (i / count);
        for (let k: number = 0; k < ring.length; k++)
          context.coordinates.push(context.indices.get(target.name)!, y, NaN);
        const next: number[] = AutoMovieHumanLoftMesh.vertices(
          context.mesh,
          corners.map(
            (q: [number, number, number]): [number, number, number] =>
              [0, 1, 2].map(
                (k: number): number =>
                  c[k]! +
                  (q[k]! - c[k]!) * Math.cos(a) +
                  (point[k]! - c[k]!) * Math.sin(a),
              ) as [number, number, number],
          ),
        );
        next.forEach((v: number, k: number): void => {
          const q: [number, number, number] = corners[k]!;
          const before: [number, number, number] = corners[(k + n - 1) % n]!;
          const after: [number, number, number] = corners[(k + 1) % n]!;
          const da: number[] = [0, 1, 2].map(
            (j: number): number =>
              -(q[j]! - c[j]!) * Math.sin(a) +
              (point[j]! - c[j]!) * Math.cos(a),
          );
          const du: number[] = [0, 1, 2].map(
            (j: number): number => (after[j]! - before[j]!) * Math.cos(a),
          );
          const normal: [number, number, number] = [
            du[1]! * da[2]! - du[2]! * da[1]!,
            du[2]! * da[0]! - du[0]! * da[2]!,
            du[0]! * da[1]! - du[1]! * da[0]!,
          ];
          const length: number = Math.hypot(...normal);
          if (length > 1e-12)
            context.domeNormals.push([
              v,
              [normal[0] / length, normal[1] / length, normal[2] / length],
            ]);
        });
        if (end === "top")
          AutoMovieHumanLoftMesh.band(context.mesh, last, next);
        else AutoMovieHumanLoftMesh.band(context.mesh, next, last);
        last = next;
      }
    }

    context.coordinates.push(context.indices.get(target.name)!, y, NaN);
    const apex: number = AutoMovieHumanLoftMesh.vertices(context.mesh, [
      point,
    ])[0]!;
    AutoMovieHumanLoftMesh.cap(context.mesh, last, apex, end === "top");
  }

  /**
   * Station where a rounded pole's dome starts, or null to close at the end.
   *
   * An authored cap keeps its domain. When a recovered point has no authored
   * cap and its end ring is smaller than the loft's chord tolerance, try
   * successive inward rings. ESTIMATE: use their mean radius as an ellipse
   * semiaxis and the distance to the recovered point as the other semiaxis.
   * Both endpoint curvature radii must resolve at the current chord tolerance
   * before replacing any existing rings.
   *
   * @see https://occt3d.com/dev/doc/overview/html/occt_user_guides__mesh.html
   */
  export function domeBase(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
    end: "top" | "bottom",
  ): number | null {
    if (capHeight(target, end) !== null) return null;
    const calibrated: IAutoMovieHumanSurfacePole | undefined =
      context.poles.get(target.name + ":" + end);
    if (calibrated?.critical !== true) return null;
    const layers: readonly IAutoMovieLoftChain.ILayer[] = target.layers;
    if (layers.length < 3) return null;
    const step: number = end === "bottom" ? 1 : -1;
    const first: number = end === "bottom" ? 0 : layers.length - 1;
    const opposite: number = end === "bottom" ? layers.length - 1 : 0;
    // Estimate the mean reach with eight evenly spaced readings per quadrant.
    const probes: number[] = Array.from(
      { length: 32 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 32,
    );
    const measure: (y: number) => [number, [number, number, number]] = (
      y: number,
    ): [number, [number, number, number]] => {
      const ring: [number, number, number][] = AutoMovieLoftChain.ring(
        target,
        y,
        probes,
      );
      const c: [number, number, number] = [0, 1, 2].map(
        (k: number): number =>
          ring.reduce(
            (sum: number, p: [number, number, number]): number => sum + p[k]!,
            0,
          ) / ring.length,
      ) as [number, number, number];
      const radius: number =
        ring.reduce(
          (sum: number, p: [number, number, number]): number =>
            sum + Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]),
          0,
        ) / ring.length;
      return [radius, c];
    };
    const tolerance: number = context.tolerance;
    if (measure(layers[first]!.y)[0] >= tolerance) return null;
    for (
      let i: number = first + step;
      step * (opposite - i) > 0;
      i += step
    ) {
      const station: number = layers[i]!.y;
      const [radius, centre] = measure(station);
      if (radius < tolerance) continue;
      const height: number = Math.hypot(
        calibrated.point[0] - centre[0],
        calibrated.point[1] - centre[1],
        calibrated.point[2] - centre[2],
      );

      // For (r cos t, h sin t), the endpoint radii are h²/r and r²/h.
      if (
        Math.min((height * height) / radius, (radius * radius) / height) >=
        tolerance
      )
        return station;
    }
    return null;
  }

  /** Fewest rings of the rounded dome closing a chain at a critical point, plus one. */
  export const DOME: number = 4;

  /** Most rings of such a dome, plus one. */
  export const DOME_MOST: number = 48;

  /** Largest turn of a dome's profile between two of its rings, radians. */
  export const DOME_TURN: number = (6 * Math.PI) / 180;

  /** Normals with the domes' own in place of the faceted mesh's, facing the same way. */
  export function domed(
    own: Readonly<IAutoMovieHumanSurfaceContext["domeNormals"]>,
    normals: number[],
  ): number[] {
    if (own.length === 0) return normals;
    const out: number[] = [...normals];
    for (const [v, n] of own) {
      const sign: number =
        n[0] * normals[3 * v]! +
          n[1] * normals[3 * v + 1]! +
          n[2] * normals[3 * v + 2]! <
        0
          ? -1
          : 1;
      for (let k: number = 0; k < 3; k++) out[3 * v + k] = sign * n[k]!;
    }
    return out;
  }

  /**
   * Band between two rings of one phase set, leaving out every cell with a
   * corner inside one of the chain's root loops; the cells left out are
   * recorded for the join.
   */
  export function cells(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
    lower: readonly number[],
    upper: readonly number[],
    s0: number,
    s1: number,
    phases: readonly number[],
    holed: ReturnType<typeof prepareHoles> = prepareHoles(context, target),
  ): void {
    if (holed === null) {
      AutoMovieHumanLoftMesh.band(context.mesh, lower, upper);
      return;
    }
    const n: number = lower.length;
    for (let i: number = 0; i < n; i++) {
      const j: number = (i + 1) % n;
      const corners: [number, number][] = [
        [s0, phases[i]!],
        [s0, phases[j]!],
        [s1, phases[j]!],
        [s1, phases[i]!],
      ];
      const key: string | null = holed(corners);
      if (key !== null) {
        leave(
          context,
          target,
          key,
          [lower[i]!, lower[j]!, upper[j]!, upper[i]!],
          corners,
        );
        continue;
      }
      context.mesh.indices.push(lower[i]!, upper[i]!, lower[j]!);
      context.mesh.indices.push(lower[j]!, upper[i]!, upper[j]!);
    }
  }

  /**
   * Zipper between two rings of different phase sets (a child's band next to
   * the ring it inherits), leaving out every triangle with a corner inside
   * one of the chain's root loops, as {@link cells} does for a band. A trim
   * that spans the ring two chains share reaches into this band, so the
   * opening's hole runs on across the ring without a strip of skin left in
   * it.
   */
  export function zipped(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
    lower: readonly number[],
    lowerPhases: readonly number[],
    upper: readonly number[],
    upperPhases: readonly number[],
    s0: number,
    s1: number,
    holed: ReturnType<typeof prepareHoles> = prepareHoles(context, target),
  ): void {
    if (holed === null) {
      AutoMovieHumanLoftMesh.zipper(
        context.mesh,
        lower,
        lowerPhases,
        upper,
        upperPhases,
      );
      return;
    }

    // Every ring vertex's chart point, then the zipper's triangles sorted
    // into the skin and the holes.
    const charts: Map<number, [number, number]> = new Map();
    lower.forEach((v: number, i: number): void => {
      charts.set(v, [s0, lowerPhases[i]!]);
    });
    upper.forEach((v: number, i: number): void => {
      charts.set(v, [s1, upperPhases[i]!]);
    });
    const start: number = context.mesh.indices.length;
    AutoMovieHumanLoftMesh.zipper(
      context.mesh,
      lower,
      lowerPhases,
      upper,
      upperPhases,
    );
    const made: number[] = context.mesh.indices.splice(start);
    for (let k: number = 0; k < made.length; k += 3) {
      const triangle: number[] = [made[k]!, made[k + 1]!, made[k + 2]!];
      const corners: [number, number][] = triangle.map(
        (v: number): [number, number] => charts.get(v)!,
      );
      const key: string | null = holed(corners);
      if (key !== null) leave(context, target, key, triangle, corners);
      else context.mesh.indices.push(...triangle);
    }
  }

  /**
   * The test that sorts a chain's cells: the key of the hole a cell with a
   * corner inside one of the chain's root loops belongs to (the chain's name,
   * or the span key of an opening spanning two chains), null for skin; null
   * itself when the chain has no loops.
   */
  export function prepareHoles(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
  ): ((corners: readonly [number, number][]) => string | null) | null {
    const roots = context.roots.get(target.name);
    if (roots === undefined) return null;

    // A loop winding round the cap pole leaves out the chart beyond it.
    const toward: number = target.pole?.end === "bottom" ? -1 : 1;
    const loops = roots.map((root) => ({
      key: root.span ?? target.name,
      contains:
        root.appendage?.winding === undefined
          ? AutoMovieHumanBodyRoots.prepareInside(root.loop)
          : beyond(AutoMovieHumanBodyRoots.prepareStation(root.loop), toward),
    }));
    return (corners: readonly [number, number][]): string | null => {
      for (const { key, contains } of loops)
        if (corners.some(([s, t]: [number, number]): boolean => contains(s, t)))
          return key;
      return null;
    };
  }

  /** Leave out cells on the pole's side of the prepared winding loop. */
  function beyond(
    station: (phase: number) => number,
    toward: number,
  ): (s: number, t: number) => boolean {
    return (s: number, t: number): boolean => toward * (s - station(t)) > 0;
  }

  /** Record a left-out cell in its hole, with its corners' chart points and chain. */
  function leave(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
    key: string,
    vertices: readonly number[],
    corners: readonly [number, number][],
  ): void {
    let hole = context.holes.get(key);
    if (hole === undefined) {
      hole = { cells: [], charts: new Map(), owners: new Map() };
      context.holes.set(key, hole);
    }
    hole.cells.push([...vertices]);
    vertices.forEach((x: number, c: number): void => {
      hole!.charts.set(x, corners[c]!);
      hole!.owners.set(x, target.name);
    });
  }

  /** Resolved boundary of a chain end; ends without an event are poles. */
  export function boundary(
    context: IAutoMovieHumanSurfaceContext,
    target: IAutoMovieLoftChain,
    end: "bottom" | "top",
  ): IAutoMovieHumanSurfaceBoundary {
    const resolved: IAutoMovieHumanSurfaceBoundary | undefined =
      context.boundaries.get(target.name + ":" + end);
    if (resolved !== undefined) return resolved;
    for (const roots of context.roots.values())
      if (
        roots.some(
          (r): boolean =>
            r.appendage?.chain === target.name && r.appendage.end === end,
        )
      )
        return { kind: "root" };
    return { kind: "pole" };
  }
}
