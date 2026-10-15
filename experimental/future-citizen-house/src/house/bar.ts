import { Assembly } from "./Assembly";
import { Frame } from "./Frame";
import { position } from "./position";
import { v } from "./v";
import { rotation } from "./rotation";

export function bar(a: Assembly, f: Frame, id: string, space: string, material: string, u: number, y: number, width: number, height: number, depth: number, offset = 0, faces?: import("../materials/FaceFinishes").FaceFinishes): string {
  const point = position(f, u, y, offset);
  return faces ? a.box(id, space, material, point.x, point.y, point.z, width, height, depth, rotation(f), faces)
    : a.place(id, "frame-member", space, a.primitive(material), point, v(width, height, depth), rotation(f));
}
