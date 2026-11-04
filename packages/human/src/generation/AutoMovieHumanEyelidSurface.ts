import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanApertureConstruction } from "./AutoMovieHumanApertureConstruction";
import { AutoMovieHumanEyelid } from "./AutoMovieHumanEyelid";
import { AutoMovieHumanEyelidProfile } from "./AutoMovieHumanEyelidProfile";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/** Lid bands from an eye's trim loop, their columns starting on the base surface's own derivative across the loop. */
export namespace AutoMovieHumanEyelidSurface {
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
}
