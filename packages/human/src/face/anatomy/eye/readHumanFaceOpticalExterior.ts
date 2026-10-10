import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Supply the closed optical exterior that the neighbours of one eye are read
 * against.
 *
 * With independent optics it is the generated hull of that eye in the
 * requested state. Without them it is the registered source globe surface
 * closed by its source collider fan, at the supplied positions. Three owners
 * restated this choice; periocular shells, visible ocular surfaces and the
 * assembly census now ask one function, so they always read the same surface.
 */
export function readHumanFaceOpticalExterior(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  optics: readonly IHumanFaceOpticalAssembly[] | undefined,
  side: "left" | "right",
  state: "rest" | "performed",
): IAutoMovieMesh | undefined {
  const eye = optics?.find((candidate) => candidate.side === side);
  if (eye !== undefined)
    return eye.collider[state === "rest" ? "rest" : "posed"];
  const id = basis.periocular?.[side].globe.surface;
  const surface = basis.surfaces.find((candidate) => candidate.id === id);
  const collider = basis.contact?.colliders.find(
    (candidate) => candidate.surface === id,
  );
  const points = id === undefined ? undefined : positions.get(id);
  if (surface === undefined || collider === undefined || points === undefined)
    return undefined;
  return {
    positions: [...points],
    indices: [...surface.indices, ...collider.closure],
    normals: null,
    uvs: null,
    skin: null,
  };
}
