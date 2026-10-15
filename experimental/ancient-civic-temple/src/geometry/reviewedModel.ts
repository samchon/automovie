import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/** Keep model part ordering and finish unbound until the materials branch opens. */

export const reviewedModel = (id: string, name: string,
  entries: readonly (readonly [string, IAutoMovieMesh])[]): IAutoMovieModel => ({
    id,
    name,
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    materials: [],
    parts: entries.map(([part, mesh]) => ({
      id: part,
      name: null,
      material: null,
      attachedBone: null,
      transform: null,
      geometry: { type: "mesh", mesh },
    })),
  });
