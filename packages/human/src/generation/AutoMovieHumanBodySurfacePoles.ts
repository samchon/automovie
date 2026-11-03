import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyRoots } from "./AutoMovieHumanBodyRoots";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanSurfaceBoundary as IBoundary } from "./IAutoMovieHumanSurfaceBoundary";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

const { endHeight } = AutoMovieHumanBodySurfaceRead;

/** A chain's closed ends: the pole caps and domes, their base rings, and the cells and boundaries a chain's grid closes on. */
export namespace AutoMovieHumanBodySurfacePoles {
  /**
   * Close a chain end with a fan to its pole.
   *
   * A calibrated pole is the recovered critical point (crown, fingertip) or
   * a provisional closure point; without one the end closes at its axis.
   * The fan belongs to the chain's end interval.
   */
  export function pole(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "top" | "bottom",
    ring: number[],
  ): void {
    const y: number = endHeight(target, end);
    const calibrated: IAutoMovieHumanBodyCalibration.IPole | undefined =
      context.poles.get(target.name + ":" + end);
    const point: [number, number, number] =
      (target.pole?.end === end ? target.pole.point : undefined) ??
      calibrated?.point ??
      AutoMovieHumanLoftChain.axis(target, y);

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
    if (calibrated?.critical === true) {
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
      const own: Map<number, [number, number, number]> =
        DOMES.get(context.mesh) ?? new Map();
      DOMES.set(context.mesh, own);
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
              -(q[j]! - c[j]!) * Math.sin(a) + (point[j]! - c[j]!) * Math.cos(a),
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
            own.set(v, [
              normal[0] / length,
              normal[1] / length,
              normal[2] / length,
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
   * The fitter ends a digit chain with a layer of a few tenths of a
   * millimetre round its recovered tip, the next layer 3 to 6 mm inward
   * holding the digit's full section (f1: index finger 0.1 then 5.0 mm
   * radius over 5.4 mm, ring finger 0.7, 1.2 then 5.0 mm). The Hermite
   * interval between them narrows linearly, so the tip lofts as a cone that
   * no dome on its point-sized end ring can round. The dome therefore starts
   * at the first layer from the end whose mean radius reaches
   * {@link FLOOR} of the chain's median layer radius, skipping the point
   * rings. A base whose apex lies closer than {@link ASPECT} of its radius
   * would flatten the end (the crown's last layers are wide and shallow),
   * so such an end keeps its fitted layers.
   */
  export function domeBase(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "top" | "bottom",
  ): number | null {
    const calibrated: IAutoMovieHumanBodyCalibration.IPole | undefined =
      context.poles.get(target.name + ":" + end);
    if (calibrated?.critical !== true) return null;
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = target.layers;
    const probes: number[] = Array.from(
      { length: 32 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 32,
    );
    const measure = (y: number): [number, [number, number, number]] => {
      const ring: [number, number, number][] = AutoMovieHumanLoftChain.ring(
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
    const radii: number[] = layers.map(
      (l: IAutoMovieHumanLoftChain.ILayer): number => measure(l.y)[0],
    );
    const sorted: number[] = [...radii].sort(
      (a: number, b: number): number => a - b,
    );
    const floor: number = FLOOR * sorted[sorted.length >> 1]!;
    const order: number[] = layers.map((_: unknown, k: number): number =>
      end === "bottom" ? k : layers.length - 1 - k,
    );
    if (radii[order[0]!]! >= floor) return null;
    const k: number | undefined = order.find(
      (i: number): boolean => radii[i]! >= floor,
    );
    if (k === undefined || k === order[order.length - 1]) return null;
    const [radius, centre] = measure(layers[k]!.y);
    const apex: number = Math.hypot(
      calibrated.point[0] - centre[0],
      calibrated.point[1] - centre[1],
      calibrated.point[2] - centre[2],
    );
    return apex >= ASPECT * radius ? layers[k]!.y : null;
  }

  /** Fewest rings of the rounded dome closing a chain at a critical point, plus one. */
  export const DOME: number = 4;

  /** Most rings of such a dome, plus one. */
  export const DOME_MOST: number = 48;

  /** Largest turn of a dome's profile between two of its rings, radians. */
  export const DOME_TURN: number = (6 * Math.PI) / 180;

  /** Each mesh's dome normals, by vertex, oriented when the mesh's are known. */
  export const DOMES: WeakMap<
    AutoMovieHumanLoftMesh.IContext,
    Map<number, [number, number, number]>
  > = new WeakMap();

  /** Normals with the domes' own in place of the faceted mesh's, facing the same way. */
  export function domed(
    mesh: AutoMovieHumanLoftMesh.IContext,
    normals: number[],
  ): number[] {
    const own: Map<number, [number, number, number]> | undefined =
      DOMES.get(mesh);
    if (own === undefined) return normals;
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

  /** Share of a chain's median layer radius below which an end layer is a point ring. */
  export const FLOOR: number = 0.35;

  /** Least apex height of a dome as a share of its base radius. */
  export const ASPECT: number = 0.5;

  /**
   * Band between two rings of one phase set, leaving out every cell with a
   * corner inside one of the chain's root loops; the cells left out are
   * recorded for the join.
   */
  export function cells(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    lower: readonly number[],
    upper: readonly number[],
    s0: number,
    s1: number,
    phases: readonly number[],
  ): void {
    const roots = context.roots.get(target.name);
    if (roots === undefined) {
      AutoMovieHumanLoftMesh.band(context.mesh, lower, upper);
      return;
    }
    let hole = context.holes.get(target.name);
    if (hole === undefined) {
      hole = { cells: [], charts: new Map() };
      context.holes.set(target.name, hole);
    }
    // A loop winding round the cap pole leaves out the chart beyond it.
    const toward: number = target.pole?.end === "bottom" ? -1 : 1;
    const inside = (s: number, t: number): boolean =>
      roots.some((r): boolean =>
        r.appendage?.winding !== undefined
          ? AutoMovieHumanBodyRoots.beyond(r.loop, s, t, toward)
          : AutoMovieHumanBodyRoots.inside(r.loop, s, t),
      );
    const n: number = lower.length;
    for (let i: number = 0; i < n; i++) {
      const j: number = (i + 1) % n;
      const corners: [number, number][] = [
        [s0, phases[i]!],
        [s0, phases[j]!],
        [s1, phases[j]!],
        [s1, phases[i]!],
      ];
      if (corners.some(([s, t]): boolean => inside(s, t))) {
        const v: [number, number, number, number] = [
          lower[i]!,
          lower[j]!,
          upper[j]!,
          upper[i]!,
        ];
        hole.cells.push(v);
        v.forEach((x: number, c: number): void => {
          hole!.charts.set(x, corners[c]!);
        });
        continue;
      }
      context.mesh.indices.push(lower[i]!, upper[i]!, lower[j]!);
      context.mesh.indices.push(lower[j]!, upper[i]!, upper[j]!);
    }
  }

  /** Resolved boundary of a chain end; ends without an event are poles. */
  export function boundary(
    context: IContext,
    target: IAutoMovieHumanLoftChain,
    end: "bottom" | "top",
  ): IBoundary {
    const resolved: IBoundary | undefined = context.boundaries.get(
      target.name + ":" + end,
    );
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
