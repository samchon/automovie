import { type IAutoMovieMeshTransform, transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieModelPart, IAutoMovieModel } from "@automovie/interface";
import { Model } from "./Model";

/** Assemble one course without welding touching prototype surfaces. */

export const collect = (
  id: string,
  members: readonly { built: Model; transform: IAutoMovieMeshTransform; }[]
): Model => {
  const parts: IAutoMovieModelPart[] = [];
  const faceByPart: Record<string, string> = {};
  const memberByPart: Record<string, string> = {};
  for (const [memberIndex, { built, transform }] of members.entries())
    for (const part of built.model.parts) {
      if (part.geometry.type !== "mesh")
        throw new Error(`non-mesh exterior member: ${part.id}`);
      const face = built.faceByPart[part.id];
      if (face === undefined)
        throw new Error(`unbound exterior member: ${part.id}`);
      const partId = `${memberIndex}-${part.id}`;
      parts.push({
        id: partId,
        name: partId,
        geometry: {
          type: "mesh",
          mesh: transformAutoMovieMesh(part.geometry.mesh, transform),
        },
        material: null,
        attachedBone: null,
        transform: null,
      });
      faceByPart[partId] = face;
      memberByPart[partId] =
        `${memberIndex}/${built.memberByPart?.[part.id] ?? ""}`;
    }
  const model: IAutoMovieModel = {
    id,
    name: id,
    origin: "generated",
    parts,
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  return {
    model,
    faceByPart,
    memberByPart,
  };
};
