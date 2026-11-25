import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidMeshLoop } from "./AutoMovieSolidMeshLoop";
import { AutoMovieSolidMeshWrite } from "./AutoMovieSolidMeshWrite";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSolidZip } from "./AutoMovieSolidZip";

/** Preserve original jet failures and reject nonfinite source positions before appending them. */
function point(
  surface: IAutoMovieSolidSurface,
  u: number,
  v: number,
): AutoMovieVector3Tuple {
  const value: AutoMovieVector3Tuple = surface.jet(u, v).p;
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    !value.every(Number.isFinite)
  )
    throw new Error(
      "A seam source must supply a complete finite original position.",
    );
  return value;
}

/** Existing orientation arithmetic. */
const { dot, norm }: typeof AutoMovieSolidVector = AutoMovieSolidVector;

/**
 * Published seam strips, pole fans and explicit external-ring bridges.
 */
export namespace AutoMovieSolidMeshTessellate {
  /**
   * Evaluate both source rails and the published blend's interior rows.
   */
  export function seam(
    mesh: IAutoMovieSolidMesh.IMesh,
    seam: IAutoMovieSolidMesh.ISeam,
  ): IAutoMovieSolidMesh.IJoined {
    const count: number = seam.hostLoop.chart.length;
    const period: number | undefined = seam.blend.period;
    if (
      (seam.blend.orientation !== 1 && seam.blend.orientation !== -1) ||
      period === undefined ||
      !(Number.isFinite(period) && period > 0)
    )
      throw new Error(
        "A closed seam requires an actual periodic blend with an explicit outward orientation.",
      );
    const phases: readonly number[] =
      seam.phases ??
      Array.from(
        { length: count },
        (_: unknown, k: number): number => (2 * Math.PI * k) / count,
      );
    if (
      !Number.isInteger(seam.rows) ||
      seam.rows < 1 ||
      !(Number.isFinite(seam.length) && seam.length > 0) ||
      count < 3 ||
      seam.partLoop.chart.length !== count ||
      phases.length !== count ||
      phases.some(
        (value: number, k: number): boolean =>
          !Number.isFinite(value) ||
          (k > 0 &&
            !(value > phases[k - 1]! && value - phases[k - 1]! < period / 2)),
      ) ||
      !(phases[count - 1]! - phases[0]! < period) ||
      !(phases[0]! + period - phases[count - 1]! < period / 2)
    )
      throw new Error(
        "A closed seam needs matching columns and finite increasing clock gaps below half its actual period.",
      );
    const before: [number, number, number, number] = [
      mesh.positions.length,
      mesh.indices.length,
      mesh.coordinates.length,
      mesh.owners.length,
    ];
    try {
      const hostOwner: number = AutoMovieSolidMeshWrite.owner(mesh, seam.host);
      const partOwner: number = AutoMovieSolidMeshWrite.owner(mesh, seam.part);
      const blendOwner: number = AutoMovieSolidMeshWrite.owner(
        mesh,
        seam.blend,
      );
      const grid: number[][] = seam.hostLoop.chart.map(
        (host: [number, number], k: number): number[] => {
          const phase: number = phases[k]!;
          const part: [number, number] = seam.partLoop.chart[k]!;
          const ids: number[] = [
            AutoMovieSolidMeshWrite.vertex(
              mesh,
              point(seam.host, host[0], host[1]),
              hostOwner,
              host[0],
              host[1],
            ),
          ];
          for (let i: number = 1; i < seam.rows; i++) {
            const station: number = (seam.length * i) / seam.rows;
            ids.push(
              AutoMovieSolidMeshWrite.vertex(
                mesh,
                point(seam.blend, station, phase),
                blendOwner,
                station,
                phase,
              ),
            );
          }
          ids.push(
            AutoMovieSolidMeshWrite.vertex(
              mesh,
              point(seam.part, part[0], part[1]),
              partOwner,
              part[0],
              part[1],
            ),
          );
          return ids;
        },
      );
      const triangles: [number, number, number][] = [];
      for (let k: number = 0; k < count; k++)
        for (let i: number = 0; i < seam.rows; i++) {
          const a: number = grid[k]![i]!;
          const b: number = grid[(k + 1) % count]![i]!;
          const c: number = grid[(k + 1) % count]![i + 1]!;
          const d: number = grid[k]![i + 1]!;
          triangles.push([a, b, c], [a, c, d]);
        }

      // Columns advance clock before transverse, opposite the blend's kernel chart order.
      AutoMovieSolidMeshWrite.emit(
        mesh,
        triangles,
        -seam.blend.orientation,
        true,
      );
      return {
        host: {
          kind: seam.hostLoop.kind,
          vertices: grid.map((column: number[]): number => column[0]!),
          chart: seam.hostLoop.chart,
        },
        part: {
          kind: seam.partLoop.kind,
          vertices: grid.map((column: number[]): number => column[seam.rows]!),
          chart: seam.partLoop.chart,
        },
      };
    } catch (error: unknown) {
      mesh.positions.length = before[0];
      if (mesh.normals !== undefined) mesh.normals.length = before[0];
      mesh.indices.length = before[1];
      mesh.coordinates.length = before[2];
      mesh.owners.length = before[3];
      throw error;
    }
  }

  /**
   * Emit an endpoint fan opposite its positive native boundary traversal.
   */
  export function close(
    mesh: IAutoMovieSolidMesh.IMesh,
    triangles: readonly [number, number, number][],
    surface: IAutoMovieSolidSurface,
    inverted: boolean,
  ): void {
    if (triangles.length === 0) return;
    AutoMovieSolidMeshWrite.emit(
      mesh,
      triangles,
      -surface.orientation * (inverted ? -1 : 1),
      true,
    );
  }

  /**
   * Join an explicit event ring to its admitted open endpoint cycle.
   */
  export function bridge(
    mesh: IAutoMovieSolidMesh.IMesh,
    ring: readonly number[],
    cycle: readonly number[],
    out: Readonly<AutoMovieVector3Tuple>,
  ): [number, number, number][] {
    const turned: number[] = AutoMovieSolidMeshLoop.aligned(mesh, ring, cycle);
    const band: [number, number, number][] = AutoMovieSolidZip.band(
      { vertices: [...ring], angles: AutoMovieSolidMeshLoop.arc(mesh, ring) },
      { vertices: turned, angles: AutoMovieSolidMeshLoop.arc(mesh, turned) },
    );
    let best: AutoMovieVector3Tuple = [0, 0, 0];
    for (const triangle of band) {
      const normal: AutoMovieVector3Tuple = AutoMovieSolidMeshWrite.normal(
        mesh,
        triangle,
      );
      if (norm(normal) > norm(best)) best = normal;
    }
    return dot(best, out) < 0
      ? band.map(
          ([a, b, c]: [number, number, number]): [number, number, number] => [
            a,
            c,
            b,
          ],
        )
      : band;
  }
}
