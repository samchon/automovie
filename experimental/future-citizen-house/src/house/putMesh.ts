import type { IAutoMovieMesh } from "@automovie/interface";
import { Assembly } from "./Assembly";
import { v } from "./v";


/**
 * Add a world-space mesh as one element of `kind` in `space`, registering its model as
 * `<id>-model`.
 */
export function putMesh(a: Assembly, id: string, space: string, material: string, mesh: IAutoMovieMesh, kind = "fabricated-member"): string {
  return a.place(id, kind, space, a.model(id + "-model", material, { type: "mesh", mesh }), v(0, 0, 0));
}
