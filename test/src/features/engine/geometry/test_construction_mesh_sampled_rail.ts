import { AutoMovieSolidCycle, AutoMovieSolidMesh } from "@automovie/engine";
import type {
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/**
 * An indexed cylindrical strip retains the same domain on the chords shared by
 * its two rails, including the segment that wraps the chart. Their analytic
 * curves leave and rejoin those chords between the four original samples.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The public face emitter is read on the same original points with and without analytic rails. Its retained mesh and original edge incidences must agree across both covers.
 * @evidence contracts/development/testing.md#independent-expectations The constraints are flat at stations 1 and 3, so all indexed faces must stay within that interval and every original rail segment must bound exactly one triangle. The analytic reader separately excludes points at stations 1.25 and 2.75 halfway along a rail segment.
 * @evidence contracts/development/testing.md#distinguishing-cases The same face uses each rail with its closing segment on either side of the grid seam and checks both analytic inward sides. Checking incidence and the exterior interval distinguishes a consistent partition from merely suppressing an admission diagnostic.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU case on an analytic unit cylinder, using the ordinary indexed face path with no Human body or alternate mesher.
 */
export function test_construction_mesh_sampled_rail(): void {
  for (const offset of [0, -Math.PI / 4]) {
    const sampled = strip(offset, false);
    const curved = strip(offset, true);
    if (
      JSON.stringify(sampled.positions) !== JSON.stringify(curved.positions) ||
      JSON.stringify(sampled.indices) !== JSON.stringify(curved.indices)
    )
      throw new Error("an analytic rail changed its indexed chord partition");
  }
}

/** Read the public strip and verify its exact boundary and retained side. */
function strip(offset: number, analytic: boolean): IAutoMovieSolidMesh.IMesh {
  const period: number = 2 * Math.PI;
  const surface: IAutoMovieSolidSurface = {
    name: "sampled cylindrical rail",
    domain: [0, 4],
    period,
    orientation: 1,
    jet(u, v): IAutoMovieSolidSurface.IJet {
      const c: number = Math.cos(v);
      const s: number = Math.sin(v);
      return {
        p: [c, u, s],
        u: [0, 1, 0],
        v: [-s, 0, c],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [-c, 0, -s],
      };
    },
  };
  const mesh: IAutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
  const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
  const phases: number[] = Array.from(
    { length: 16 },
    (_, k) => (k * period) / 16,
  );
  const loops: IAutoMovieSolidMesh.ILoop[] = (["start", "end"] as const).map(
    (kind, i): IAutoMovieSolidMesh.ILoop => {
      const station: number = 1 + 2 * i;
      const sign: number = i === 0 ? 1 : -1;
      const chart: [number, number][] = Array.from({ length: 4 }, (_, k) => [
        station,
        offset + (k * period) / 4,
      ]);
      const along = (v: number): number =>
        station + (sign * (1 - Math.cos(4 * (v - offset)))) / 4;
      const cycle: IAutoMovieSolidMesh.ILoop = {
        kind,
        vertices: chart.map(([u, v]) =>
          AutoMovieSolidMesh.vertex(mesh, surface.jet(u, v).p, owner, u, v),
        ),
        chart,
      };
      const middle: number = offset + period / 8 - period;
      const insideChord: number = station + sign / 4;
      if (
        chart.some(([u, v]) => along(v) !== u) ||
        !AutoMovieSolidCycle.kept(cycle, insideChord, middle, period) ||
        AutoMovieSolidCycle.kept(
          { ...cycle, along },
          insideChord,
          middle,
          period,
        )
      )
        throw new Error(
          "the analytic and indexed boundaries must have distinct interiors",
        );
      return analytic ? { ...cycle, along } : cycle;
    },
  );
  AutoMovieSolidMesh.face(mesh, {
    surface,
    stations: [0, 1.25, 1.75, 2, 2.25, 2.75, 4],
    phases,
    loops,
  });
  if (mesh.indices.length === 0)
    throw new Error("the retained indexed strip is empty");
  const edges = new Map<string, number>();
  const key = (a: number, b: number): string =>
    `${Math.min(a, b)}/${Math.max(a, b)}`;
  for (let i = 0; i < mesh.indices.length; i += 3)
    for (let k = 0; k < 3; k++) {
      const a: number = mesh.indices[i + k]!;
      const b: number = mesh.indices[i + ((k + 1) % 3)]!;
      const u: number = mesh.positions[3 * a + 1]!;
      if (u < 1 || u > 3)
        throw new Error(
          "an indexed face used a vertex outside the original chords",
        );
      const edge: string = key(a, b);
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  const boundary = new Set<string>();
  for (const { vertices } of loops)
    for (let k = 0; k < vertices.length; k++)
      boundary.add(key(vertices[k]!, vertices[(k + 1) % vertices.length]!));
  if (
    [...boundary].some((edge) => edges.get(edge) !== 1) ||
    [...edges].some(([edge, count]) => count !== (boundary.has(edge) ? 1 : 2))
  )
    throw new Error(
      "the indexed strip lost a source rim segment or opened an interior edge",
    );
  return mesh;
}
