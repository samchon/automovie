import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";
import type { IHumanSourceSurfaceMesh } from "./structures/IHumanSourceSurfaceMesh.ts";

/**
 * The body partition view's surface at neutral: each P1 body vertex at its
 * generation skin sample's position, with the P1 body triangles. It is the
 * surface the body field producers run on, the same one the body view ships.
 */
export function buildHumanSourceP1BodyMesh(generation: IHumanSourceGeneration, cut: IHumanSourceCut): IHumanSourceSurfaceMesh {
  const positions = new Float64Array(3 * cut.p1BodyToG1.length);
  cut.p1BodyToG1.forEach((g, j) => {
    for (let c = 0; c < 3; c++) positions[3 * j + c] = generation.skin.positions[3 * g + c];
  });
  return { positions, indices: Int32Array.from(cut.p1BodyIndices) };
}
