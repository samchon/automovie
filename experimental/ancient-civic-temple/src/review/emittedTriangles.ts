import { tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { Point } from "./Point";
import { Triangle } from "./Triangle";


export const emittedTriangles = (environment: IAutoMovieBuiltEnvironment): Triangle[] => {
  const models = new Map(environment.models.map((model) => [model.id, model]));
  const result: Triangle[] = [];
  for (const element of environment.elements) {
    const model = element.model === null ? undefined : models.get(element.model);
    if (model === undefined) continue;
    for (const part of model.parts) {
      const mesh = part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape);
      if (mesh.positions.length % 9 !== 0 && mesh.indices === null) throw new Error(`address coverage: non-indexed triangle count for ${part.id}`);
      const indices = mesh.indices ?? Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
      if (indices.length % 3 !== 0) throw new Error(`address coverage: incomplete triangle for ${part.id}`);
      const vertex = (index: number): Point => ({ x: mesh.positions[3 * index]!, y: mesh.positions[3 * index + 1]!, z: mesh.positions[3 * index + 2]! });
      for (let index = 0; index < indices.length; index += 3) {
        const a = vertex(indices[index]!), b = vertex(indices[index + 1]!), c = vertex(indices[index + 2]!);
        result.push({
          a, b, c, element: element.id, part: part.id,
          minY: Math.min(a.y, b.y, c.y), maxY: Math.max(a.y, b.y, c.y),
          minX: Math.min(a.x, b.x, c.x), maxX: Math.max(a.x, b.x, c.x),
          minZ: Math.min(a.z, b.z, c.z), maxZ: Math.max(a.z, b.z, c.z),
        });
      }
    }
  }
  return result;
};
