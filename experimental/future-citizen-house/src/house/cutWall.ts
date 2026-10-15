import { type IAutoMovieWallOpening, buildAutoMovieWall } from "@automovie/engine";
import type { SurfaceRegion } from "../materials/SurfaceRegion";
import { Assembly } from "./Assembly";
import { Frame } from "./Frame";
import { position } from "./position";
import { rectangle } from "./rectangle";
import { v } from "./v";
import { rotation } from "./rotation";

export function cutWall(a: Assembly, f: Frame, cuts: IAutoMovieWallOpening[], material: string, id = f.id, offset = 0, depth = f.depth, register = true, regions?: readonly SurfaceRegion[]): void {
  const mesh = buildAutoMovieWall({ width: f.b - f.a, height: f.top - f.floor, depth, openings: cuts });
  const element = a.place(id + "-body", "wall", f.spaces[0], a.model(id + "-mesh", material, { type: "mesh", mesh }, regions), position(f, (f.a + f.b) / 2, (f.floor + f.top) / 2, offset), v(1, 1, 1), rotation(f));
  if (register) a.wallRecords.push({ frame: f, cuts });
  if (register) a.environment.boundaries.push({ id: f.id, kind: f.spaces.length === 1 ? "exterior" : "partition", spaces: f.spaces, elements: [element], face: { origin: position(f, (f.a + f.b) / 2, (f.floor + f.top) / 2), rotation: rotation(f), thickness: f.depth, outline: rectangle(-(f.b - f.a) / 2, (f.b - f.a) / 2, -(f.top - f.floor) / 2, (f.top - f.floor) / 2) } });
}
