import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { ISolid } from "./ISolid";
import { point } from "./point";
import { ITriangle } from "./ITriangle";


/**
 * A reproducible 1 cm probe of the roof solids emitted by `buildHouse`.
 *
 * This is an inspection producer, not a second roof model. It intersects
 * vertical lines with the actual triangles passed to the viewer, then compares
 * their occupied height intervals. A clear scan means no sampled cell had
 * positive overlap; it cannot rule out a feature narrower than the grid.
 */
export const solid = (id: string, mesh: IAutoMovieMesh): ISolid => {
  if (mesh.indices === null) throw new Error(
    `${id}: mesh has no triangle indices`,
  );
  const topology = inspectAutoMovieMeshTopology(mesh);
  if (topology.nonManifoldEdges > 0 || topology.degenerate > 0 || topology.nonFinite > 0)
    throw new Error(
      `${id}: vertical occupancy needs a nondegenerate roof mesh`,
    );
  const triangles: ITriangle[] = [];
  const x: [number, number] = [Infinity, -Infinity];
  const y: [number, number] = [Infinity, -Infinity];
  const z: [number, number] = [Infinity, -Infinity];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const axes: [number, [number, number]][] = [
      [mesh.positions[i]!, x],
      [mesh.positions[i + 1]!, y],
      [mesh.positions[i + 2]!, z],
    ];
    for (const [value, range] of axes) {
      range[0] = Math.min(range[0], value);
      range[1] = Math.max(range[1], value);
    }
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = point(mesh, mesh.indices[i]!);
    const b = point(mesh, mesh.indices[i + 1]!);
    const c = point(mesh, mesh.indices[i + 2]!);
    triangles.push({
      a,
      b,
      c,
      x: [Math.min(a.x, b.x, c.x), Math.max(a.x, b.x, c.x)],
      z: [Math.min(a.z, b.z, c.z), Math.max(a.z, b.z, c.z)],
    });
  }
  return { id, triangles, x, y, z };
};

