/**
 * The object roles in the temple inventory, placed in room-local world metres.
 * Each role has a stable identity; repeated prototypes remain separate elements.
 * The local model origin and its support height determine the Y coordinate.
 */
import type { IAutoMovieBuiltElement, IAutoMovieModel } from "@automovie/interface";
import { TempleFixtureModels } from "../models/fixtures";
import { TemplePortableModels } from "../models/portable";
import { TempleRitualModels } from "../models/ritual";
import { TempleWareModels } from "../models/wares";
import { templeLevels as y } from "../spaces/storey";
import { templeSiteGrade } from "../spaces/site/extent";

export interface TempleObjectPlacement {
  role: string;
  space: string;
  prototype: string;
  x: number;
  y: number;
  z: number;
  yaw?: number;
  scale?: number;
}

/** Derive an object's Y from its host's emitted upward face and its own lowest vertex. */
export const templeSupportedPlacement = (
  byPrototype: ReadonlyMap<string, IAutoMovieModel>, placed: readonly TempleObjectPlacement[],
  space: string, role: string, prototype: string, x: number, z: number,
  hostRole: string, hostPart: string, level: number | "highest" = "highest", yaw = 0, scale = 1,
): TempleObjectPlacement => {
  const model = (id: string): IAutoMovieModel => {
    const found = byPrototype.get(`object.${id}`);
    if (!found) throw new Error(`사물 prototype ${id} 없음`);
    return found;
  };
  const bottom = (id: string): number => {
    const values = model(id).parts.flatMap((part) =>
      part.geometry.type === "mesh" ? part.geometry.mesh.positions.filter((_, i) => i % 3 === 1) : []);
    if (values.length === 0) throw new Error(`${id}: 위치를 계산할 mesh 없음`);
    return Math.min(...values);
  };
  const topLevels = (id: string, partId: string): number[] => {
    const part = model(id).parts.find((item) => item.id === partId);
    if (!part || part.geometry.type !== "mesh") throw new Error(`${id}/${partId}: 받침 부재 없음`);
    const p = part.geometry.mesh.positions;
    const ix = part.geometry.mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
    const heights: number[] = [];
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i]! * 3, b = ix[i + 1]! * 3, c = ix[i + 2]! * 3;
      const ay = p[a + 1]!, by = p[b + 1]!, cy = p[c + 1]!;
      const upward = (p[b + 2]! - p[a + 2]!) * (p[c]! - p[a]!)
        - (p[b]! - p[a]!) * (p[c + 2]! - p[a + 2]!);
      if (Math.abs(ay - by) < 1e-8 && Math.abs(by - cy) < 1e-8 && upward > 1e-10
        && !heights.some((height) => Math.abs(height - ay) < 1e-8)) heights.push(ay);
    }
    if (heights.length === 0) throw new Error(`${id}/${partId}: 위를 향한 받침면 없음`);
    return heights.sort((a, b) => a - b);
  };
  const host = placed.find((item) => item.space === space && item.role === hostRole);
  if (!host) throw new Error(`${space}.${role}: 받침 ${hostRole} 없음`);
  const heights = topLevels(host.prototype, hostPart);
  const index = level === "highest" ? heights.length - 1 : level;
  const top = heights[index];
  if (top === undefined) throw new Error(`${space}.${role}: ${hostPart} 판 ${index} 없음`);
  return { space, role, prototype, x, y: host.y + top * (host.scale ?? 1) - bottom(prototype) * scale,
    z, yaw, scale };
};

export class TempleObjectInstances {
  static placements(models: readonly IAutoMovieModel[] = [
    ...TempleFixtureModels.build(), ...TemplePortableModels.build(),
    ...TempleRitualModels.build(), ...TempleWareModels.build(),
  ]): TempleObjectPlacement[] {
    const list: TempleObjectPlacement[] = [];
    const byPrototype = new Map(models.map((model) => [model.id, model]));
    const put = (space: string, role: string, prototype: string, x: number, yy: number, z: number,
      yaw = 0, scale = 1): void => { list.push({ space, role, prototype, x, y: yy, z, yaw, scale }); };
    const putOn = (space: string, role: string, prototype: string, x: number, z: number,
      hostRole: string, hostPart: string, level: number | "highest" = "highest", yaw = 0, scale = 1): void => {
      list.push(templeSupportedPlacement(byPrototype, list, space, role, prototype, x, z,
        hostRole, hostPart, level, yaw, scale));
    };
    const e = "entrance", c = "courtyard", co = "colonnade", s = "sanctuary";
    const o = "offering", a = "administration", r = "records", st = "storage";
    const yard = "service-yard", site = "temple-site";
    // Porch: the bench runs along the narrow west support, clear of the central stair.
    put(e,"waiting-bench","bench",-1.39,0,9.10,Math.PI/2);
    putOn(e,"portable-lamp","portable-lamp",-1.36,8.80,"waiting-bench","seat");
    putOn(e,"water-vessel","small-vessel",-1.35,9.18,"waiting-bench","seat");
    putOn(e,"washing-bowl","offering-bowl",-1.35,9.53,"waiting-bench","seat");
    put(e,"carrying-basket","basket",1.38,0,9.35);
    // Open court: the central basin keeps its own clear ring.
    put(c,"fountain","fountain",0,y.courtyard,2.175);
    put(c,"waterside-bench","bench",-2.55,y.courtyard,2.15,Math.PI/2);
    put(c,"planter","planter",2.65,y.courtyard,0.05);
    put(c,"portable-lamp","portable-lamp",2.75,y.courtyard,5.20);
    put(c,"bucket","bucket",-2.65,y.courtyard,5.15);
    // Colonnade: objects hug the wall and leave the court perimeter walk open.
    put(co,"wall-bench","bench",-4.65,0,3.15,Math.PI/2);
    put(co,"lampstand","lampstand",-4.75,0,7.25);
    put(co,"basket","basket",-4.55,0,4.60);
    putOn(co,"small-vessel","small-vessel",-4.65,3.15,"wall-bench","seat");
    put(co,"stool","stool",4.65,0,3.40);
    put(co,"votive-plaque","votive-plaque",-5.35,0,0.15);
    // Sanctuary: the aisle from the south door to the altar stays legible.
    put(s,"altar","altar",0,0,-7.15);
    put(s,"niche","niche",0,0,-9.65);
    put(s,"left-lampstand","lampstand",-1.90,0,-7.35);
    put(s,"right-lampstand","lampstand",1.90,0,-7.35);
    putOn(s,"offering-bowl","offering-bowl",-0.55,-7.35,"altar","top");
    putOn(s,"niche-vessel","small-vessel",0,-9.38,"niche","recess-frame",0);
    putOn(s,"censer","censer",0.50,-7.30,"altar","top");
    putOn(s,"altar-cloth","textile",0,-7.05,"altar","top","highest",0,0.65);
    put(s,"floor-cushion","floor-cushion",-1.65,0,-5.30);
    put(s,"votive-plaque","votive-plaque",4.65,0,-8.80);
    // The long shared offering room has a central stone table and wall shelving.
    put(o,"offering-table","offering-table",-7.85,0,-1.20);
    put(o,"display-shelf","display-shelf",-7.90,0,-7.20);
    putOn(o,"offering-bowl","offering-bowl",-7.70,-1.65,"offering-table","top");
    putOn(o,"small-vessel","small-vessel",-8.05,-0.85,"offering-table","top");
    put(o,"carry-jar","carry-jar",-7.25,0,-3.70);
    putOn(o,"offering-tray","offering-tray",-7.83,-1.10,"offering-table","top");
    put(o,"votive-plaque","votive-plaque",-9.25,0,1.65);
    putOn(o,"textile","textile",-8.90,-7.00,"display-shelf","board",1,0,0.72);
    put(o,"basket","basket",-7.10,0,-5.50);
    put(o,"portable-lamp","portable-lamp",-8.90,0,3.50);
    // Office writing objects are supported by the desk; the low chest is separate.
    put(a,"desk","desk",7.55,0,7.00);
    put(a,"stool","stool",7.55,0,8.15);
    putOn(a,"working-scroll","open-scroll",7.45,7.00,"desk","top");
    putOn(a,"tool-vessel","small-vessel",7.92,6.90,"desk","top");
    put(a,"wall-shelf","display-shelf-office",8.85,0,6.25);
    putOn(a,"stylus","stylus",7.50,7.28,"desk","top");
    putOn(a,"writing-tablet","writing-tablet",7.12,6.75,"desk","top");
    put(a,"document-chest","chest",8.75,0,8.60,0,0.55);
    putOn(a,"portable-lamp","portable-lamp",7.95,7.28,"desk","top","highest",0,0.8);
    putOn(a,"textile","textile",8.65,6.42,"wall-shelf","board",1,0,0.55);
    // Records: reused scrolls occupy the shelf bays, with an independent reading station.
    put(r,"scroll-shelf","scroll-shelf",7.80,0,2.05);
    put(r,"reading-desk","reading-desk",7.55,0,4.25);
    put(r,"stool","stool",7.55,0,5.08);
    const shelf = list.find((item) => item.space === r && item.role === "scroll-shelf")!;
    const shelfModel = byPrototype.get(`object.${shelf.prototype}`)!;
    const board = shelfModel.parts.find((part) => part.id === "board")!;
    const divider = shelfModel.parts.find((part) => part.id === "divider")!;
    if (board.geometry.type !== "mesh" || divider.geometry.type !== "mesh")
      throw new Error("기록실 선반의 칸 mesh 없음");
    const boardX = board.geometry.mesh.positions.filter((_, i) => i % 3 === 0);
    const boardZ = board.geometry.mesh.positions.filter((_, i) => i % 3 === 2);
    const dividerFaces = [...new Set(divider.geometry.mesh.positions.filter((_, i) => i % 3 === 0))]
      .sort((a, b) => a - b);
    const bayEdges = [Math.min(...boardX), ...dividerFaces, Math.max(...boardX)];
    const shelfDepth = (Math.min(...boardZ) + Math.max(...boardZ)) / 2;
    for (let level = 0; level < 5; level++) for (let bay = 0; bay < bayEdges.length / 2; bay++) {
      if ((level + bay) % 4 === 0) continue;
      const x = shelf.x + (bayEdges[2 * bay]! + bayEdges[2 * bay + 1]!) / 2;
      const role = level === 0 && bay === 1 ? "stored-scroll" : `stored-scroll-${level}-${bay}`;
      const prototype = (level + bay) % 3 === 0 ? "scroll-bundle" : "scroll";
      putOn(r,role,prototype,x,shelf.z + shelfDepth,
        "scroll-shelf","board",level);
    }
    put(r,"chest","chest",9.05,0,4.30);
    put(r,"document-chest","chest",8.90,0,3.30,0,0.55);
    put(r,"rope-coil","rope-coil",6.80,0,3.25);
    putOn(r,"portable-lamp","portable-lamp",7.90,4.25,"reading-desk","top","highest",0,0.8);
    putOn(r,"dust-cover","textile",8.65,4.30,"chest","lid","highest",0,0.55);
    // Storage: the single jar stand is distinct from the two-bay jar rack.
    put(st,"jar-rack","jar-rack",7.125,0,-1.30);
    putOn(st,"storage-jar","storage-jar",6.835,-1.30,"jar-rack","well");
    putOn(st,"carry-jar","carry-jar",7.415,-1.30,"jar-rack","well");
    put(st,"basket","basket",8.25,0,-1.30);
    put(st,"chest","chest",9.05,0,0.50);
    put(st,"jar-stand","jar-stand",6.65,0,0.55);
    putOn(st,"stand-vessel","small-vessel",6.65,0.55,"jar-stand","ring");
    putOn(st,"cover-cloth","textile",9.05,0.50,"chest","lid","highest",0,0.55);
    put(st,"rope-coil","rope-coil",8.15,0,0.55);
    put(st,"bucket","bucket",7.35,0,0.60);
    // Service yard: larger tools are distributed along its long outside edge.
    put(yard,"storage-jar","storage-jar",9.05,0,-8.40);
    put(yard,"carry-jar","carry-jar",8.20,0,-8.40);
    put(yard,"basket","basket",7.40,0,-8.35);
    put(yard,"work-bench","bench",8.05,0,-6.60,Math.PI/2);
    put(yard,"bucket","bucket",6.75,0,-5.80);
    put(yard,"carrying-yoke","carrying-yoke",8.05,0.485,-6.60);
    put(yard,"rope-coil","rope-coil",9.12,0,-4.90);
    put(yard,"handcart","handcart",7.70,0,-3.75);
    // South site ground is graded from the building to the public road.
    put(site,"path-lamp","portable-lamp",-4.0,templeSiteGrade(12.5),12.5);
    put(site,"porch-planter","planter",3.10,templeSiteGrade(11.5),11.5);
    put(site,"path-bucket","bucket",2.10,templeSiteGrade(13),13);
    put(site,"path-handcart","handcart",-7.00,templeSiteGrade(15),15);
    put(site,"path-basket","basket",-5.20,templeSiteGrade(13.5),13.5);
    if (list.length !== 92) throw new Error(`사물 역할 ${list.length}/92`);
    return list;
  }

  static elements(models?: readonly IAutoMovieModel[]): IAutoMovieBuiltElement[] {
    return this.placements(models).map((item) => ({
      id: `temple.object.${item.space}.${item.role}`,
      kind: "object", parent: item.space === "temple-site" ? "site.root" : "temple.root",
      space: item.space, model: `object.${item.prototype}`,
      transform: {
        translation: { x: item.x, y: item.y, z: item.z },
        rotation: { x: 0, y: Math.sin((item.yaw ?? 0)/2), z: 0, w: Math.cos((item.yaw ?? 0)/2) },
        scale: { x: item.scale ?? 1, y: item.scale ?? 1, z: item.scale ?? 1 },
      },
    }));
  }
}
