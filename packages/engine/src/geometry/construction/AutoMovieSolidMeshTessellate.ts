import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidMeshLoop } from "./AutoMovieSolidMeshLoop";
import { AutoMovieSolidMeshWrite } from "./AutoMovieSolidMeshWrite";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSolidZip } from "./AutoMovieSolidZip";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World-space millimetre vector. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** Preserve original jet failures and reject nonfinite source positions before appending them. */
function point(surface: IAutoMovieSolidSurface, u: number, v: number): Vec3 {
  const value: Vec3 = surface.jet(u, v).p;
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
 *
 * @evidence contracts/common.md#principled-implementation Preserves the analytic seam grid and existing consistently oriented fan/zip populations; final writes and orientation readings belong to MeshWrite.
 * @evidence contracts/common.md#clear-and-simple-design Three topology operations remain separate from native trimmed-face region preparation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer construction from triangles, weld seams by position or use these explicit ring operations as a fallback for failed trim-region triangulation.
 * @evidence contracts/common.md#meaningful-documentation States each population's source/chart premise and the difference from native face arrangement.
 * @evidence contracts/performance.md#efficient-algorithms Seam work scales with columns times rows; closure scans its triangles, while bridge adds existing alignment, polyline-arc and zipper costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared rail indices join the seam and its owning faces; no additional boundary copy or global geometry cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Emitted buffers/owners live with the caller's mesh; all strip, fan and bridge scratch ends with each synchronous call.
 */
export namespace AutoMovieSolidMeshTessellate {
  /**
   * Evaluate both source rails and the published blend's interior rows.
   *
   * @evidence contracts/common.md#principled-implementation Builds one indexed strip per adjacent analytic column, shares the exact source rail indices later used by both trims and applies the blend's authoritative chart orientation to the entire triangle population.
   * @evidence contracts/common.md#clear-and-simple-design One returned host/part pair records the new boundary indices and their original source charts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Admits actual period, orientation and finite ordered clock columns before writes; open bands refuse. Outward sign comes from the actual blend chart, never a chord triangle or another face's normal. Original exceptions restore this call's append-only mesh changes and retain identity.
   * @evidence contracts/common.md#meaningful-documentation Names actual clock columns, legacy default2pi, kernel transverse/clock order, shared identity and append-only rollback. Sources/callbacks must not mutate or reenter this mesh.
   * @evidence contracts/performance.md#efficient-algorithms O(CR) jet/vertex/triangle work for C columns and R rows plus three owner-name scans; the chart sign needs no triangle-normal scan or host rereading.
   * @evidence contracts/performance.md#reuse-equivalent-work Rail vertices are each evaluated once and the same indices serve the strip and both returned trims.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The mesh retains appended geometry and owner closures; returned loops own their index arrays but borrow the supplied charts, while grid/triangle scratch is local.
   */
  export function seam(
    mesh: AutoMovieSolidMesh.IMesh,
    seam: AutoMovieSolidMesh.ISeam,
  ): AutoMovieSolidMesh.IJoined {
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
      mesh.indices.length = before[1];
      mesh.coordinates.length = before[2];
      mesh.owners.length = before[3];
      throw error;
    }
  }

  /**
   * Emit an endpoint fan opposite its positive native boundary traversal.
   *
   * @evidence contracts/common.md#principled-implementation The supplied edge-next-apex fan reverses the positive native face boundary, then applies the source orientation sign and cutter inversion to the whole population.
   * @evidence contracts/common.md#clear-and-simple-design Closure owns no pole selection or new point; the caller supplies both fan topology and source surface.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires the caller's fan to follow an admitted complete IOpen boundary. It neither queries foreign-owner chart coordinates nor closes arbitrary residual trim arcs.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes fan emission from endpoint/pole admission and states cutter inversion.
   * @evidence contracts/performance.md#efficient-algorithms Linear triangle emission with no source reevaluation or largest-reference search.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's indexed fan, performing no source point evaluation or tessellation again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only appended indices persist in mesh; no fan or surface reference is newly retained by the operation.
   */
  export function close(
    mesh: AutoMovieSolidMesh.IMesh,
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
   *
   * @evidence contracts/common.md#principled-implementation Preserves the existing world-polyline alignment/arclength zipper and turns its whole population against the caller's outward reference.
   * @evidence contracts/common.md#clear-and-simple-design Returns triangles only; the Human caller adds them to buffers where its event ring already lives.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires compatible ring/endpoint cycles rather than applying a zipper to arbitrary trimmed regions. It reads positions only, preserving the Human positions-only view.
   * @evidence contracts/common.md#meaningful-documentation States ring provenance, reference ownership and absence of vertex/mesh mutation.
   * @evidence contracts/performance.md#efficient-algorithms Includes existing alignment and arc scans, a linear zipper and a scan over its resulting triangle normals.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses original ring/cycle indices and the provided reference; does not reevaluate a surface or create a duplicate boundary.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh triangle array; temporary alignment/angle/normal data expires and no mesh/surface callback is retained.
   */
  export function bridge(
    mesh: AutoMovieSolidMesh.IMesh,
    ring: readonly number[],
    cycle: readonly number[],
    out: Readonly<Vec3>,
  ): [number, number, number][] {
    const turned: number[] = AutoMovieSolidMeshLoop.aligned(mesh, ring, cycle);
    const band: [number, number, number][] = AutoMovieSolidZip.band(
      { vertices: [...ring], angles: AutoMovieSolidMeshLoop.arc(mesh, ring) },
      { vertices: turned, angles: AutoMovieSolidMeshLoop.arc(mesh, turned) },
    );
    let best: Vec3 = [0, 0, 0];
    for (const triangle of band) {
      const normal: Vec3 = AutoMovieSolidMeshWrite.normal(mesh, triangle);
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
