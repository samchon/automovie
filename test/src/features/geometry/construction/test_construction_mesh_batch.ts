import { AutoMovieSolidMesh, faceAutoMovieSolidMesh } from "@automovie/engine";
import type {
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/**
 * A face batch observes triangles appended by another publication operator.
 *
 * Scenarios:
 *
 * 1. After a first regular face, a cap uses an edge of the next face in the
 *    opposite direction. The two faces share the exact IDs and oriented edge.
 * 2. With the cap reversed, the next face refuses the same-directed incidence and
 *    leaves the committed mesh unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Publishes a face, cap and another face on the same actual mesh and reads their emitted index order, endpoint identities and refusal atomicity.
 * @evidence contracts/development/testing.md#independent-expectations The positive planar island has precisely one triangle with edge from chart (0, 0) to (2, 0). The cap order independently determines the opposite or repeated direction.
 * @evidence contracts/development/testing.md#distinguishing-cases Reverses only the external cap. An append-only incidence that misses the interleaved output admits the repeated directed edge.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory engine unit discovered as construction_mesh_batch, independent of viewers, rendered subjects and reference data.
 * @evidence contracts/development/common.md#meaningful-documentation Names the two cap directions, their shared index receipt and the refusal that must preserve committed output.
 */
export function test_construction_mesh_batch(): void {
  const failures: string[] = [];
  for (const inverted of [false, true]) {
    const surface: IAutoMovieSolidSurface = {
      name: "planar-batch",
      orientation: 1,
      jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
        return {
          p: [u, v, 0],
          u: [1, 0, 0],
          v: [0, 1, 0],
          uu: [0, 0, 0],
          uv: [0, 0, 0],
          vv: [0, 0, 0],
        };
      },
    };
    const mesh: IAutoMovieSolidMesh.IMesh = AutoMovieSolidMesh.create();
    const append: ReturnType<typeof faceAutoMovieSolidMesh.prepare> =
      faceAutoMovieSolidMesh.prepare(mesh);
    append({ surface, stations: [-4, -3], phases: [0, 1], loops: [] });
    if (mesh.indices.length !== 6) failures.push("first planar face was lost");

    const owner: number = AutoMovieSolidMesh.owner(mesh, surface);
    const chart: [number, number][] = [
      [0, 0],
      [2, 0],
      [0, 2],
    ];
    const vertices: number[] = chart.map(([u, v]): number =>
      AutoMovieSolidMesh.vertex(mesh, [u, v, 0], owner, u, v),
    );
    const apex: number = AutoMovieSolidMesh.vertex(
      mesh,
      [0, -1, 0],
      owner,
      0,
      -1,
    );
    const [a, b, c]: number[] = vertices;
    AutoMovieSolidMesh.close(mesh, [[a!, b!, apex]], surface, inverted);
    const before: string = JSON.stringify(mesh);
    const start: number = mesh.indices.length;
    const diagnostics: string[] = [];
    append({
      surface,
      stations: [0, 2],
      phases: [0, 2],
      loops: [{ kind: "island", vertices, chart }],
      onFailure: (detail: string): void => {
        diagnostics.push(detail);
      },
    });

    if (inverted) {
      if (
        diagnostics.length !== 1 ||
        !diagnostics[0]!.includes("directed incidence") ||
        JSON.stringify(mesh) !== before
      )
        failures.push(
          `repeated edge changed the mesh or was not refused: ${diagnostics.join(", ")}`,
        );
    } else if (
      diagnostics.length !== 0 ||
      mesh.indices.slice(start - 3).join(",") !==
        [a, apex, b, a, b, c].join(",") ||
      mesh.positions.length !== mesh.coordinates.length
    )
      failures.push(
        `opposite edges lost ownership or drawing order: ${diagnostics.join(", ")}`,
      );
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
