import type { IAutoMovieMesh } from "@automovie/interface";
import { ObjectMesh } from "./ObjectMesh";

/** A single part mesh from the authored face operations above. */

export const modelMesh = (builder: ObjectMesh, part: string): IAutoMovieMesh => {
  const geometry = builder.model(part, part).parts.find(
    (entry) => entry.id === part
  )?.geometry;
  if (geometry?.type !== "mesh") throw new Error(`${part}: mesh missing`);
  return geometry.mesh;
};
