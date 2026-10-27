import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanApertureConstruction } from "./AutoMovieHumanApertureConstruction";
import type { AutoMovieHumanBodyApertures } from "./AutoMovieHumanBodyApertures";
import { AutoMovieHumanEyelid } from "./AutoMovieHumanEyelid";
import { AutoMovieHumanEyelidProfile } from "./AutoMovieHumanEyelidProfile";
import { AutoMovieHumanSkinProjection } from "./AutoMovieHumanSkinProjection";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/** Lid bands whose outer vertices and transverse jets belong to the actual skin cut. */
export namespace AutoMovieHumanEyelidSurface {
  /**
   * Continue every directed cut edge into the seated margin. One column
   * belongs to each actual cut vertex, so no uniform projected column can
   * escape the observed surface or require an independent boundary fit.
   */
  export function generate(
    mesh: AutoMovieHumanLoftMesh.IContext,
    prepared: AutoMovieHumanBodyApertures.IPrepared,
    lid: AutoMovieHumanEyelid.ILid,
    open: readonly IAutoMovieHumanApertureEdge[],
    emit: (name: string, ...corners: number[]) => void,
  ): IAutoMovieHumanConstructionPath[] {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const rows: Map<number, number[]> = new Map();
    const jets: Map<number, AutoMovieHumanSkinProjection.IJet> =
      AutoMovieHumanSkinProjection.rim(mesh, open, prepared.outline);
    for (const edge of open) {
      const p: AutoMovieHumanEyelid.Point = mesh.positions.slice(
        3 * edge.u,
        3 * edge.u + 3,
      ) as AutoMovieHumanEyelid.Point;
      const plane: [number, number] = [
        E.dot(p, prepared.outline.lateral),
        E.dot(p, prepared.outline.up),
      ];
      let phase: number = 0;
      let distance: number = Infinity;
      const outer: [number, number][] = prepared.outline.points;
      for (let i: number = 0; i < outer.length; i++) {
        const a: [number, number] = outer[i]!,
          b: [number, number] = outer[(i + 1) % outer.length]!;
        const du: number = b[0] - a[0],
          dv: number = b[1] - a[1];
        const span: number = du * du + dv * dv;
        const t: number =
          span === 0
            ? 0
            : Math.min(
                1,
                Math.max(
                  0,
                  ((plane[0] - a[0]) * du + (plane[1] - a[1]) * dv) / span,
                ),
              );
        const d: number =
          (a[0] + t * du - plane[0]) ** 2 + (a[1] + t * dv - plane[1]) ** 2;
        if (d < distance) {
          distance = d;
          phase = i + t;
        }
      }
      const sample: AutoMovieHumanEyelid.ISample = margin(lid, phase);
      const delta: AutoMovieHumanEyelid.Point = E.sub(p, sample.contact);
      const across: AutoMovieHumanEyelid.Point = E.sub(
        delta,
        E.scale(lid.globe.forward, E.dot(delta, lid.globe.forward)),
      );
      const band: number = Math.hypot(...across);
      sample.outward = E.normalize(across);
      const hit: AutoMovieHumanSkinProjection.IJet = jets.get(edge.u)!;
      const profile: AutoMovieHumanEyelid.Point[] =
        AutoMovieHumanEyelidProfile.generate(sample, lid.globe, band, {
          x: hit.x - E.dot(lid.globe.centre, lid.globe.forward),
          k:
            hit.gradient[0] * E.dot(sample.outward, prepared.outline.lateral) +
            hit.gradient[1] * E.dot(sample.outward, prepared.outline.up),
        });
      const column: number[] = [edge.u];
      for (const point of profile) {
        if (!point.every(Number.isFinite))
          throw new Error(`Non-finite lid profile ${lid.name}`);
        column.push(mesh.positions.length / 3);
        mesh.positions.push(...point);
      }
      rows.set(edge.u, column);
    }
    for (const edge of open) {
      const u: number[] = rows.get(edge.u)!;
      const v: number[] | undefined = rows.get(edge.v);
      if (v === undefined)
        throw new Error(`Open skin boundary is not a circuit: ${lid.name}`);
      for (let r: number = 0; r + 1 < u.length; r++)
        emit(edge.name, v[r]!, u[r]!, u[r + 1]!, v[r]!, u[r + 1]!, v[r + 1]!);
    }
    return AutoMovieHumanApertureConstruction.generate(
      mesh,
      lid.name,
      open,
      rows,
    );
  }

  /**
   * Lid band from an eye's trim loop on its base chain: one column per lid
   * sample, starting at the loop vertex the sample's outline point
   * projects to, its skin depth and slope taken from the base surface's own
   * derivative across the loop rather than from a cut triangle, so
   * neighbouring columns start from one smooth surface.
   *
   * @param mesh Mesh buffers to grow.
   * @param lid The eye's lid.
   * @param ring Loop vertex of every lid sample, in sample order.
   * @param slopes Unit tangent of the base across the loop, away from the
   *   opening, at every loop vertex.
   * @param emit Triangle sink.
   * @returns Construction paths of the lid margins.
   */
  export function loop(
    mesh: AutoMovieHumanLoftMesh.IContext,
    lid: AutoMovieHumanEyelid.ILid,
    ring: readonly number[],
    slopes: readonly AutoMovieHumanEyelid.Point[],
    emit: (name: string, ...corners: number[]) => void,
  ): IAutoMovieHumanConstructionPath[] {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const rows: Map<number, number[]> = new Map();
    const forward: AutoMovieHumanEyelid.Point = lid.globe.forward;
    ring.forEach((u: number, i: number): void => {
      const p: AutoMovieHumanEyelid.Point = mesh.positions.slice(3 * u, 3 * u + 3) as AutoMovieHumanEyelid.Point;
      const sample: AutoMovieHumanEyelid.ISample = { ...lid.samples[i]! };
      const delta: AutoMovieHumanEyelid.Point = E.sub(p, sample.contact);
      const across: AutoMovieHumanEyelid.Point = E.sub(delta, E.scale(forward, E.dot(delta, forward)));
      const band: number = Math.hypot(...across);
      sample.outward = E.normalize(across);
      const slope: AutoMovieHumanEyelid.Point = slopes[i]!;
      const planar: number = E.dot(slope, sample.outward);
      const profile: AutoMovieHumanEyelid.Point[] = AutoMovieHumanEyelidProfile.generate(sample, lid.globe, band, {
        x: E.dot(p, forward) - E.dot(lid.globe.centre, forward),
        k: Math.abs(planar) > 1e-6 ? E.dot(slope, forward) / planar : 0,
      });
      const column: number[] = [u];
      for (const point of profile) {
        if (!point.every(Number.isFinite)) throw new Error(`Non-finite lid profile ${lid.name}`);
        column.push(mesh.positions.length / 3);
        mesh.positions.push(...point);
      }
      rows.set(u, column);
    });
    const open: IAutoMovieHumanApertureEdge[] = ring.map(
      (u: number, i: number): IAutoMovieHumanApertureEdge => ({
        u,
        v: ring[(i + 1) % ring.length]!,
        inside: -1,
        name: lid.name,
      }),
    );
    for (const edge of open) {
      const u: number[] = rows.get(edge.u)!;
      const v: number[] = rows.get(edge.v)!;
      for (let r: number = 0; r + 1 < u.length; r++)
        emit(edge.name, v[r]!, u[r]!, u[r + 1]!, v[r]!, u[r + 1]!, v[r + 1]!);
    }
    return AutoMovieHumanApertureConstruction.generate(mesh, lid.name, open, rows);
  }

  /** Interpolate the stored margin field at a fractional sample address. */
  function margin(
    lid: AutoMovieHumanEyelid.ILid,
    phase: number,
  ): AutoMovieHumanEyelid.ISample {
    const E: typeof AutoMovieHumanEyelid = AutoMovieHumanEyelid;
    const n: number = lid.samples.length;
    const i: number = Math.floor(phase) % n;
    const t: number = phase - Math.floor(phase);
    const a: AutoMovieHumanEyelid.ISample = lid.samples[i]!;
    const b: AutoMovieHumanEyelid.ISample = lid.samples[(i + 1) % n]!;
    /** Interpolate a field in physical coordinates; direction fields are normalized below. */
    const point: (
      key: "contact" | "anterior" | "outward" | "tangent",
    ) => AutoMovieHumanEyelid.Point = (
      key: "contact" | "anterior" | "outward" | "tangent",
    ): AutoMovieHumanEyelid.Point =>
      E.add(E.scale(a[key], 1 - t), E.scale(b[key], t));
    const nextPhase: number =
      b.phase < a.phase ? b.phase + 2 * Math.PI : b.phase;
    return {
      ...a,
      phase: ((1 - t) * a.phase + t * nextPhase) % (2 * Math.PI),
      contact: point("contact"),
      anterior: point("anterior"),
      outward: E.normalize(point("outward")),
      tangent: E.normalize(point("tangent")),
      rho: (1 - t) * a.rho + t * b.rho,
      corner: (1 - t) * a.corner + t * b.corner,
      position: (1 - t) * a.position + t * b.position,
      thickness: (1 - t) * a.thickness + t * b.thickness,
    };
  }
}
