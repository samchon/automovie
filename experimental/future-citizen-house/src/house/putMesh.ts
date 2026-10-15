import type { IAutoMovieMesh } from "@automovie/interface";
import { Assembly } from "./Assembly";
import { v } from "./v";


export function putMesh(a: Assembly, id: string, space: string, material: string, mesh: IAutoMovieMesh, kind = "fabricated-member"): string {
  return a.place(id, kind, space, a.model(id + "-model", material, { type: "mesh", mesh }), v(0, 0, 0));
}
